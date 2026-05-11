#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

const BASE_URL_CANDIDATES = Array.from(new Set([
  process.env.PLATFORM_AUDIT_BASE_URL,
  process.env.PLATFORM_BASE_URL,
  'http://127.0.0.1:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3001',
  'http://localhost:3001',
].filter(Boolean)));

let BASE_URL = BASE_URL_CANDIDATES[0];
let API_BASE = `${BASE_URL}/api/v1`;
const REPORTS_DIR = path.resolve('reports');
const DEFAULT_TIMEOUT = 15000;

const cleanupState = {
  userIds: new Set(),
  courseIds: new Set(),
};

const results = {
  startedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  summary: {
    passedChecks: 0,
    failedChecks: 0,
    warnings: 0,
  },
  createdUsers: [],
  createdCourses: [],
  routes: [],
  apiChecks: [],
  workflows: [],
  warnings: [],
  failures: [],
  browserAvailable: false,
};

function record(status, bucket, payload) {
  results.summary[status] += 1;
  results[bucket].push(payload);
}

function pass(bucket, payload) {
  record('passedChecks', bucket, { status: 'PASS', ...payload });
}

function fail(bucket, payload) {
  record('failedChecks', bucket, { status: 'FAIL', ...payload });
}

function warn(payload) {
  record('warnings', 'warnings', payload);
}

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function summarizeMessages(messages = []) {
  return messages
    .slice(0, 2)
    .map((message) => String(message).replace(/\s+/g, ' ').trim())
    .join(' | ');
}

function trackUser(user, source) {
  if (!user?.id || cleanupState.userIds.has(user.id)) {
    return;
  }

  cleanupState.userIds.add(user.id);
  results.createdUsers.push({
    id: user.id,
    email: user.email,
    source,
  });
}

function trackCourse(course, source) {
  if (!course?.id || cleanupState.courseIds.has(course.id)) {
    return;
  }

  cleanupState.courseIds.add(course.id);
  results.createdCourses.push({
    id: course.id,
    title: course.title,
    source,
  });
}

async function ensureReportsDir() {
  await fs.mkdir(REPORTS_DIR, { recursive: true });
}

async function resolveBaseUrl() {
  for (const candidate of BASE_URL_CANDIDATES) {
    try {
      const response = await fetch(`${candidate}/en/login`, { redirect: 'manual' });
      if (response.ok || response.status === 307 || response.status === 308) {
        BASE_URL = candidate;
        API_BASE = `${BASE_URL}/api/v1`;
        results.baseUrl = BASE_URL;
        return BASE_URL;
      }
    } catch {
      // try next candidate
    }
  }

  throw new Error(`No running platform detected. Checked: ${BASE_URL_CANDIDATES.join(', ')}`);
}

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  return { response, data };
}

async function getSubjectCoursePairForAudit() {
  const [{ response: subjectsResponse, data: subjectsData }, { response: coursesResponse, data: coursesData }] = await Promise.all([
    apiRequest('/admin/subjects'),
    apiRequest('/courses?locale=en&publishedOnly=false&limit=100'),
  ]);

  if (!subjectsResponse.ok) {
    throw new Error(subjectsData?.error || 'Failed to load subjects for assignment audit');
  }
  if (!coursesResponse.ok) {
    throw new Error(coursesData?.error || 'Failed to load courses for assignment audit');
  }

  const subjects = subjectsData?.subjects || [];
  const courses = coursesData?.courses || [];
  const course = courses.find((candidate) => {
    const courseSubjectCode = String(candidate.subject?.code || '').toLowerCase();
    return subjects.some((subject) => String(subject.code || '').toLowerCase() === courseSubjectCode);
  }) || null;

  const subject = course
    ? subjects.find((candidate) => String(candidate.code || '').toLowerCase() === String(course.subject?.code || '').toLowerCase())
    : subjects[0];

  invariant(subject?.code, 'No subject available for admin assignment workflow');
  return { subject, course };
}

async function createAuditTeacher(source = 'admin-assignment-audit') {
  const timestamp = Date.now();
  const requestBody = {
    firstName: 'Audit',
    lastName: 'Teacher',
    email: `audit.teacher.${timestamp}@danesh.app`,
    phone: `+98912${String(timestamp).slice(-7)}`,
    department: null,
    subjects: [],
    bio: 'Automated teacher assignment workflow verification.',
    status: 'active',
    locale: 'en',
  };

  const { response, data } = await apiRequest('/admin/teachers', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(data?.error || `Failed to create audit teacher (${response.status})`);
  }

  trackUser({ id: data?.teacher?.id, email: requestBody.email }, source);
  pass('apiChecks', {
    name: 'Create disposable teacher',
    details: requestBody.email,
  });

  return data?.teacher;
}

async function createDisposableStudent() {
  const timestamp = Date.now();
  const requestBody = {
    id: `audit-student-${timestamp}`,
    email: `audit.student.${timestamp}@danesh.app`,
    password: 'AuditStudent@123',
    profile: {
      firstName: 'Audit',
      lastName: 'Student',
      displayName: 'Audit Student',
    },
    roles: ['STUDENT'],
    dashboardPath: 'dashboard',
  };

  const { response, data } = await apiRequest('/admin/users', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(data?.error || `Failed to create audit user (${response.status})`);
  }

  const createdUser = {
    id: data?.user?.id || requestBody.id,
    email: requestBody.email,
    password: requestBody.password,
  };

  trackUser(createdUser, 'api-seed');
  pass('apiChecks', {
    name: 'Create disposable student',
    details: createdUser.email,
  });

  return createdUser;
}

async function deleteDisposableUser(id) {
  const { response, data } = await apiRequest(`/admin/users?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    warn({ name: 'Cleanup disposable user', details: data?.error || `Failed to delete ${id}` });
    return;
  }

  pass('apiChecks', {
    name: 'Cleanup disposable user',
    details: id,
  });
}

async function deleteDisposableCourse(id) {
  const { response, data } = await apiRequest(`/courses/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    warn({ name: 'Cleanup disposable course', details: data?.error || `Failed to delete course ${id}` });
    return;
  }

  pass('apiChecks', {
    name: 'Cleanup disposable course',
    details: id,
  });
}

async function cleanupResources() {
  for (const courseId of cleanupState.courseIds) {
    await deleteDisposableCourse(courseId);
  }

  for (const userId of cleanupState.userIds) {
    await deleteDisposableUser(userId);
  }
}

async function lookupUserByEmail(email) {
  const { response, data } = await apiRequest('/admin/users');
  if (!response.ok) {
    throw new Error('Failed to load users for verification');
  }

  const matchedUser = (data?.users || []).find(
    (user) => String(user.email || '').toLowerCase() === email.toLowerCase(),
  );

  return matchedUser || null;
}

async function getLocalStorageJson(page, key) {
  return page.evaluate((storageKey) => {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  }, key);
}

async function getLocalStorageValue(page, key) {
  return page.evaluate((storageKey) => window.localStorage.getItem(storageKey), key);
}

async function withPageMonitoring(page, contextName, callback) {
  const consoleErrors = [];
  const pageErrors = [];

  const consoleHandler = (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  };
  const pageErrorHandler = (error) => pageErrors.push(error.message);

  page.on('console', consoleHandler);
  page.on('pageerror', pageErrorHandler);

  try {
    return await callback();
  } finally {
    page.off('console', consoleHandler);
    page.off('pageerror', pageErrorHandler);

    if (consoleErrors.length || pageErrors.length) {
      warn({
        name: `${contextName} browser issues`,
        details: `Console errors: ${consoleErrors.length}, page errors: ${pageErrors.length}${summarizeMessages([...consoleErrors, ...pageErrors]) ? ` | Sample: ${summarizeMessages([...consoleErrors, ...pageErrors])}` : ''}`,
      });
    }
  }
}

async function runWorkflow(name, callback) {
  try {
    const details = await callback();
    pass('workflows', { name, details });
  } catch (error) {
    fail('workflows', {
      name,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

async function login(page, { email, password, expectedPath }) {
  await page.goto(`${BASE_URL}/en/login`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => url.pathname.includes(expectedPath), { timeout: DEFAULT_TIMEOUT });
}

async function selectFirstNonEmptyOption(page, selector) {
  const options = await page.locator(`${selector} option`).evaluateAll((items) =>
    items.map((item) => ({
      value: item.getAttribute('value') || '',
      label: item.textContent?.trim() || '',
    })),
  );

  const candidate = options.find((option) => option.value);
  invariant(candidate?.value, `No selectable option found for ${selector}`);
  await page.locator(selector).selectOption(candidate.value);
  return candidate;
}

async function auditRoute(page, route, role) {
  await withPageMonitoring(page, `${role} route ${route}`, async () => {
    const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
    const visibleButtons = await page.locator('button:visible').count();
    const visibleLinks = await page.locator('a:visible').count();

    if (!response || !response.ok()) {
      fail('routes', {
        role,
        route,
        details: `Navigation failed with status ${response?.status?.() ?? 'unknown'}`,
      });
      return;
    }

    pass('routes', {
      role,
      route,
      details: `buttons=${visibleButtons}, links=${visibleLinks}`,
    });
  });
}

async function runPublicRegistrationWorkflow(browser) {
  const timestamp = Date.now();
  const email = `audit.register.${timestamp}@danesh.app`;
  const password = 'AuditRegister@123';
  const phone = `+98912${String(timestamp).slice(-7)}`;
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    return await withPageMonitoring(page, 'public registration workflow', async () => {
      await page.goto(`${BASE_URL}/en/register`, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: /I want to learn/i }).click();
      await page.getByRole('button', { name: /Iranian National Curriculum|Iranian/i }).click();
      await page.getByRole('button', { name: /^8$/ }).click();

      await page.locator('input[placeholder="First"]').fill('Audit');
      await page.locator('input[placeholder="Last"]').fill('Register');
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="tel"]').fill(phone);
      const passwordFields = page.locator('input[type="password"]');
      await passwordFields.nth(0).fill(password);
      await passwordFields.nth(1).fill(password);

      await page.getByRole('button', { name: /Sign Up/i }).click();
      await page.waitForTimeout(1500);
      await page.waitForLoadState('networkidle');

      const storedUser = await getLocalStorageJson(page, 'danesh.auth.user');
      invariant(storedUser?.id, 'Registration did not persist the authenticated user in local storage');
      trackUser({ id: storedUser.id, email }, 'public-register');

      const currentPath = new URL(page.url()).pathname;
      const bodyText = await page.locator('body').innerText();
      invariant(currentPath.includes('/onboarding'), `Registration redirected to ${currentPath} instead of /onboarding`);
      invariant(!/not found|page could not be found/i.test(bodyText), 'Registration reached an onboarding route that renders a not found state');

      return `${email} redirected to ${currentPath}`;
    });
  } finally {
    await context.close();
  }
}

async function runAdminUserManagementWorkflow(page) {
  const timestamp = Date.now();
  const email = `audit.admin.ui.${timestamp}@danesh.app`;

  return withPageMonitoring(page, 'admin user management workflow', async () => {
    await page.goto(`${BASE_URL}/en/admin/users`, { waitUntil: 'networkidle' });

    await page.locator('input[placeholder="First name"]').fill('Audit');
    await page.locator('input[placeholder="Last name"]').fill('Managed');
    await page.locator('input[placeholder="Email"]').fill(email);
    await page.locator('input[placeholder^="Password"]').fill('AuditUser@123');
    await page.locator('select').selectOption('STUDENT');
    await page.getByRole('button', { name: /Create User/i }).click();

    await page.locator(`text=${email}`).waitFor({ timeout: DEFAULT_TIMEOUT });
    const createdUser = await lookupUserByEmail(email);
    invariant(createdUser?.id, 'Admin-created user was not returned by the user listing API');
    trackUser({ id: createdUser.id, email }, 'admin-ui');

    return `created and verified ${email}`;
  });
}

async function runAdminTeacherAssignmentWorkflow(page) {
  const { subject, course } = await getSubjectCoursePairForAudit();
  const teacher = await createAuditTeacher();
  const teacherName = teacher?.name || `${teacher?.firstName || ''} ${teacher?.lastName || ''}`.trim();
  const subjectLabel = subject.name || subject.nameFA || subject.code;

  invariant(teacher?.id && teacherName, 'Failed to create an audit teacher for the assignment workflow');

  return withPageMonitoring(page, 'admin teacher assignment workflow', async () => {
    await page.goto(`${BASE_URL}/en/admin/courses`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: new RegExp(teacherName, 'i') }).click();

    const subjectRow = page
      .locator('div')
      .filter({ hasText: subjectLabel })
      .filter({ has: page.locator('button[title="Assign subject"]') })
      .first();
    await subjectRow.locator('button[title="Assign subject"]').click();

    if (course?.title) {
      const courseRow = page
        .locator('div')
        .filter({ hasText: course.title })
        .filter({ has: page.locator('button[title="Assign course"]') })
        .first();
      await courseRow.locator('button[title="Assign course"]').click();
    }

    await page.getByRole('button', { name: /Save Changes/i }).click();
    await page.getByText(/Subject and course assignments were saved\./i).waitFor({ timeout: DEFAULT_TIMEOUT });

    const { response, data } = await apiRequest(`/admin/teachers/${encodeURIComponent(teacher.id)}/assignments`);
    invariant(response.ok, `Assignment verification API failed with status ${response.status}`);
    invariant(
      (data?.assignedSubjectCodes || []).some((code) => String(code).toLowerCase() === String(subject.code).toLowerCase()),
      `Subject ${subject.code} was not persisted for ${teacherName}`,
    );

    if (course?.id) {
      invariant(
        (data?.assignedCourseIds || []).includes(course.id),
        `Course ${course.title} was not persisted for ${teacherName}`,
      );
    }

    return `assigned ${subject.code}${course?.id ? ` and course ${course.title}` : ''} to ${teacherName}`;
  });
}

async function runTeacherCourseCreationWorkflow(page) {
  const timestamp = Date.now();
  const title = `Audit Algebra ${timestamp}`;
  const code = `AUDIT-${timestamp}`;

  return withPageMonitoring(page, 'teacher course creation workflow', async () => {
    await page.goto(`${BASE_URL}/en/teacher/courses/new`, { waitUntil: 'networkidle' });

    await page.locator('input[name="title"]').fill(title);
    await page.locator('input[name="titleFA"]').fill('دوره ممیزی');
    await page.locator('input[name="code"]').fill(code);
    await selectFirstNonEmptyOption(page, 'select[name="subjectId"]');
    await selectFirstNonEmptyOption(page, 'select[name="frameworkId"]');
    await selectFirstNonEmptyOption(page, 'select[name="gradeLevelId"]');
    await page.locator('textarea[name="description"]').fill('Automated audit course creation workflow verification.');

    await page.locator('button[form="course-form"]').click();
    await page.waitForURL(
      (url) => url.pathname.includes('/en/teacher/courses/') && !url.pathname.endsWith('/new'),
      { timeout: DEFAULT_TIMEOUT },
    );

    const courseId = page.url().split('/').pop();
    invariant(courseId, 'Course creation did not navigate to a course detail page');

    const { response: verificationResponse, data } = await apiRequest(`/courses/${encodeURIComponent(courseId)}?locale=en`);
    invariant(verificationResponse.ok, `Course verification API failed with status ${verificationResponse.status}`);
    invariant(data?.id === courseId, 'Created course detail API did not return the expected course id');
    invariant(data?.title === title, 'Created course title did not match the expected value');
    trackCourse({ id: courseId, title }, 'teacher-ui');

    return `created course ${title}`;
  });
}

async function runParentRegistrationWorkflow(browser) {
  const timestamp = Date.now();
  const email = `audit.parent.${timestamp}@danesh.app`;
  const password = 'AuditParent@123';
  const phone = `+98935${String(timestamp).slice(-7)}`;
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    return await withPageMonitoring(page, 'parent registration workflow', async () => {
      await page.goto(`${BASE_URL}/en/register`, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: /track my child/i }).click();
      await page.getByRole('button', { name: /Iranian National Curriculum|Iranian/i }).click();

      await page.locator('input[placeholder="First"]').fill('Audit');
      await page.locator('input[placeholder="Last"]').fill('Parent');
      await page.locator('input[type="email"]').fill(email);
      await page.locator('input[type="tel"]').fill(phone);
      const passwordFields = page.locator('input[type="password"]');
      await passwordFields.nth(0).fill(password);
      await passwordFields.nth(1).fill(password);

      await page.getByRole('button', { name: /Sign Up/i }).click();
      await page.waitForURL((url) => url.pathname.includes('/onboarding'), { timeout: DEFAULT_TIMEOUT });

      const storedUser = await getLocalStorageJson(page, 'danesh.auth.user');
      invariant(Array.isArray(storedUser?.roles) && storedUser.roles.includes('PARENT'), 'Parent registration did not store a parent role in local storage');
      trackUser({ id: storedUser.id, email }, 'parent-register');

      await page.getByRole('button', { name: /Go to dashboard/i }).click();
      await page.waitForURL((url) => url.pathname.includes('/parent'), { timeout: DEFAULT_TIMEOUT });

      return `${email} registered and reached the parent dashboard`;
    });
  } finally {
    await context.close();
  }
}

async function runForumQuestionWorkflow(page) {
  const timestamp = Date.now();
  const title = `Audit forum question ${timestamp}`;

  return withPageMonitoring(page, 'forum workflow', async () => {
    await page.goto(`${BASE_URL}/en/forum/new`, { waitUntil: 'networkidle' });
    await page.locator('input[type="text"]').first().fill(title);

    const categoryButtons = page.locator('button[type="button"]');
    const categoryCount = await categoryButtons.count();
    invariant(categoryCount > 0, 'Forum category buttons were not loaded');
    await categoryButtons.nth(0).click();

    await page.locator('textarea').first().fill('Automated audit verification for the forum posting workflow.');
    await page.getByRole('button', { name: /Submit Question/i }).click();
    await page.waitForURL((url) => /\/en\/forum\/.+/.test(url.pathname) && !url.pathname.endsWith('/new'), { timeout: DEFAULT_TIMEOUT });
    await page.getByRole('heading', { name: title }).waitFor({ timeout: DEFAULT_TIMEOUT });

    const threadPath = new URL(page.url()).pathname;
    const threadId = threadPath.split('/').pop();
    invariant(threadId, 'Created forum thread URL did not contain a thread id');

    const currentUserId = await getLocalStorageValue(page, 'danesh.userId');
    invariant(currentUserId, 'Forum workflow could not resolve the logged-in user id');

    const { response: deleteResponse, data: deleteData } = await apiRequest(`/forum/${encodeURIComponent(threadId)}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': currentUserId,
        'x-demo-user-id': currentUserId,
      },
    });
    invariant(deleteResponse.ok, deleteData?.error || `Failed to clean up forum thread ${threadId}`);

    return `created forum thread ${title}`;
  });
}

async function runTeacherContentDraftWorkflow(page) {
  const marker = `Audit content draft ${Date.now()}`;

  return withPageMonitoring(page, 'teacher content workflow', async () => {
    await page.goto(`${BASE_URL}/en/teacher/content`, { waitUntil: 'networkidle' });

    const courseSelect = page.locator('select').nth(0);
    const lessonSelect = page.locator('select').nth(1);
    const courseOptions = await courseSelect.locator('option').evaluateAll((items) =>
      items.map((item) => item.getAttribute('value') || '').filter(Boolean),
    );
    invariant(courseOptions.length > 0, 'Teacher content page has no available course options');

    if (!(await courseSelect.inputValue())) {
      await courseSelect.selectOption(courseOptions[0]);
      await page.waitForTimeout(300);
    }

    const lessonOptions = await lessonSelect.locator('option').evaluateAll((items) =>
      items.map((item) => item.getAttribute('value') || '').filter(Boolean),
    );
    invariant(lessonOptions.length > 0, 'Teacher content page has no available lesson options');

    if (!(await lessonSelect.inputValue())) {
      await lessonSelect.selectOption(lessonOptions[0]);
      await page.waitForTimeout(300);
    }

    const editorTextarea = page.locator('textarea').first();
    await editorTextarea.fill(marker);
    await page.getByRole('button', { name: /^Save$/i }).click();
    await page.locator('text=Content saved successfully.').waitFor({ timeout: DEFAULT_TIMEOUT });

    const storedDraft = await getLocalStorageJson(page, 'danesh.teacher.content-creator.en');
    const hasMarker = Array.isArray(storedDraft?.contentBlocks)
      && storedDraft.contentBlocks.some((block) => String(block.content || '').includes(marker));

    invariant(hasMarker, 'Teacher content draft was not persisted to local storage');

    return 'saved a teacher content draft and verified local persistence';
  });
}

async function runStudentWellbeingWorkflow(page) {
  return withPageMonitoring(page, 'student wellbeing workflow', async () => {
    await page.goto(`${BASE_URL}/en/wellbeing`, { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: /^😊 Great!$/i }).click();
    await page.getByRole('button', { name: /^High$/i }).click();
    await page.getByRole('button', { name: /^Balanced$/i }).click();
    await page.getByRole('button', { name: /Submit Today's Wellbeing/i }).click();
    await page.locator('text=Daily wellbeing check-in submitted successfully').waitFor({ timeout: DEFAULT_TIMEOUT });

    const userId = await getLocalStorageValue(page, 'danesh.userId');
    invariant(userId, 'Student wellbeing workflow could not resolve the logged-in user id');

    const { response, data } = await apiRequest(`/wellbeing/checkins?userId=${encodeURIComponent(userId)}&limit=1`);
    invariant(response.ok, `Wellbeing verification API failed with status ${response.status}`);
    invariant(Array.isArray(data?.checkins) && data.checkins.length > 0, 'Wellbeing submission was not persisted');

    return `submitted a wellbeing check-in for ${userId}`;
  });
}

async function runStudentSettingsWorkflow(page) {
  return withPageMonitoring(page, 'student settings workflow', async () => {
    await page.goto(`${BASE_URL}/en/settings`, { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: /^Large$/i }).click();
    await page.getByRole('button', { name: /^Save$/i }).click();
    await page.locator('text=Settings saved successfully.').waitFor({ timeout: DEFAULT_TIMEOUT });

    const storedSettings = await getLocalStorageJson(page, 'danesh.settings.v1');
    invariant(storedSettings?.accessibility?.fontSize === 'large', 'Settings page did not persist the updated accessibility preference');

    const appliedFontSize = await page.evaluate(() => document.documentElement.getAttribute('data-font-size'));
    invariant(appliedFontSize === 'large', 'Accessibility preference was not applied to the document root');

    return 'saved settings and verified local persistence';
  });
}

function buildMarkdownReport() {
  const routeRows = results.routes.map((item) => `- ${item.status} | ${item.role} | ${item.route} | ${item.details || ''}`).join('\n');
  const apiRows = results.apiChecks.map((item) => `- ${item.status} | ${item.name} | ${item.details || ''}`).join('\n');
  const workflowRows = results.workflows.map((item) => `- ${item.status} | ${item.name} | ${item.details || ''}`).join('\n');
  const warningRows = results.warnings.map((item) => `- ${item.name || item.route || 'warning'}: ${item.details || ''}`).join('\n') || '- none';
  const failureRows = results.failures.map((item) => `- ${item.name || item.route || 'failure'}: ${item.details || ''}`).join('\n') || '- none';
  const createdUsersRows = results.createdUsers.map((item) => `- ${item.email} (${item.id}) via ${item.source}`).join('\n') || '- none';
  const createdCoursesRows = results.createdCourses.map((item) => `- ${item.title} (${item.id}) via ${item.source}`).join('\n') || '- none';

  return [
    '# Platform Audit Report',
    '',
    `- Started: ${results.startedAt}`,
    `- Base URL: ${results.baseUrl}`,
    `- Browser audit available: ${results.browserAvailable ? 'yes' : 'no'}`,
    `- Passed checks: ${results.summary.passedChecks}`,
    `- Failed checks: ${results.summary.failedChecks}`,
    `- Warnings: ${results.summary.warnings}`,
    '',
    '## API checks',
    apiRows || '- none',
    '',
    '## Route checks',
    routeRows || '- none',
    '',
    '## Workflow checks',
    workflowRows || '- none',
    '',
    '## Created audit artifacts',
    '### Users',
    createdUsersRows,
    '',
    '### Courses',
    createdCoursesRows,
    '',
    '## Warnings',
    warningRows,
    '',
    '## Failures',
    failureRows,
    '',
    '## Suggested improvements',
    '- Expand route coverage to parent, forum, and assessment submission flows.',
    '- Add stable `data-testid` attributes for critical actions to improve UI audit reliability.',
    '- Add seeded audit fixtures for teacher/student assignments so role-specific checks can assert exact data states.',
    '- Add cleanup support for forum test content so browser-created collaboration artifacts do not accumulate.',
    '- Add console-error budgets in CI so regressions fail automatically.',
  ].join('\n');
}

async function main() {
  await ensureReportsDir();

  let disposableStudent = null;

  try {
    await resolveBaseUrl();
    const health = await fetch(`${BASE_URL}/en/login`, { redirect: 'manual' });
    if (!health.ok && health.status >= 500) {
      throw new Error(`Platform is not responding correctly at ${BASE_URL}`);
    }
  } catch (error) {
    fail('failures', { name: 'Platform availability', details: error instanceof Error ? error.message : String(error) });
    await fs.writeFile(path.join(REPORTS_DIR, 'platform-audit-report.json'), JSON.stringify(results, null, 2));
    await fs.writeFile(path.join(REPORTS_DIR, 'platform-audit-report.md'), buildMarkdownReport());
    process.exit(1);
  }

  try {
    disposableStudent = await createDisposableStudent();
  } catch (error) {
    fail('failures', { name: 'Create disposable student', details: error instanceof Error ? error.message : String(error) });
  }

  let chromium;
  try {
    ({ chromium } = await import('playwright'));
    const browser = await chromium.launch({ headless: true });
    results.browserAvailable = true;

    await runWorkflow('Public registration flow', async () => runPublicRegistrationWorkflow(browser));
    await runWorkflow('Parent registration flow', async () => runParentRegistrationWorkflow(browser));

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await login(adminPage, {
      email: 'superadmin@danesh.app',
      password: 'SuperAdmin@123',
      expectedPath: '/admin',
    });

    for (const route of ['/en/admin', '/en/admin/users', '/en/admin/teachers', '/en/admin/assignments', '/en/admin/courses', '/en/admin/reports']) {
      await auditRoute(adminPage, route, 'admin');
    }
    await runWorkflow('Admin user management flow', async () => runAdminUserManagementWorkflow(adminPage));
    await runWorkflow('Admin teacher subject/course assignment flow', async () => runAdminTeacherAssignmentWorkflow(adminPage));
    await adminContext.close();

    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    await login(teacherPage, {
      email: 'teacher.math@danesh.app',
      password: 'Teacher@123',
      expectedPath: '/teacher',
    });

    for (const route of ['/en/teacher', '/en/teacher/courses', '/en/teacher/content', '/en/teacher/students', '/en/teacher/reports']) {
      await auditRoute(teacherPage, route, 'teacher');
    }
    await runWorkflow('Teacher course creation flow', async () => runTeacherCourseCreationWorkflow(teacherPage));
    await runWorkflow('Teacher content draft flow', async () => runTeacherContentDraftWorkflow(teacherPage));
    await teacherContext.close();

    if (disposableStudent) {
      const studentContext = await browser.newContext();
      const studentPage = await studentContext.newPage();
      await login(studentPage, {
        email: disposableStudent.email,
        password: disposableStudent.password,
        expectedPath: '/dashboard',
      });

      for (const route of ['/en/dashboard', '/en/courses', '/en/profile', '/en/settings']) {
        await auditRoute(studentPage, route, 'student');
      }
      await runWorkflow('Student wellbeing flow', async () => runStudentWellbeingWorkflow(studentPage));
      await runWorkflow('Student settings persistence flow', async () => runStudentSettingsWorkflow(studentPage));
      await runWorkflow('Student forum flow', async () => runForumQuestionWorkflow(studentPage));
      await studentContext.close();
    }

    await browser.close();
  } catch (error) {
    warn({
      name: 'Browser audit unavailable',
      details: error instanceof Error ? error.message : String(error),
    });
  }

  await cleanupResources();

  results.finishedAt = new Date().toISOString();
  const jsonPath = path.join(REPORTS_DIR, 'platform-audit-report.json');
  const markdownPath = path.join(REPORTS_DIR, 'platform-audit-report.md');

  await fs.writeFile(jsonPath, JSON.stringify(results, null, 2));
  await fs.writeFile(markdownPath, buildMarkdownReport());

  console.log(`Platform audit report written to ${jsonPath}`);
  console.log(`Platform audit summary written to ${markdownPath}`);

  if (results.summary.failedChecks > 0) {
    process.exit(1);
  }
}

main().catch(async (error) => {
  fail('failures', { name: 'Unhandled audit failure', details: error instanceof Error ? error.message : String(error) });
  await ensureReportsDir();
  await fs.writeFile(path.join(REPORTS_DIR, 'platform-audit-report.json'), JSON.stringify(results, null, 2));
  await fs.writeFile(path.join(REPORTS_DIR, 'platform-audit-report.md'), buildMarkdownReport());
  process.exit(1);
});