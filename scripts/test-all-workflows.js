#!/usr/bin/env node

/**
 * Comprehensive Platform Workflow Tester
 * Tests all critical workflows, buttons, handlers, links, and APIs
 * Usage: node scripts/test-all-workflows.js
 */

const fs = require('fs');
const path = require('path');

const BASE_URL_CANDIDATES = Array.from(new Set([
  process.env.PLATFORM_BASE_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
].filter(Boolean)));

let BASE_URL = BASE_URL_CANDIDATES[0];
let API_BASE = `${BASE_URL}/api/v1`;

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(name, status, details = '') {
  const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
  const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
  log(`${icon} ${name}${details ? ': ' + details : ''}`, color);
  
  results.tests.push({ name, status, details });
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else results.warnings++;
}

async function resolveBaseUrl() {
  // Try multiple endpoints — page routes may 404 if still compiling, but API routes are reliable
  const probeEndpoints = ['/api/v1/subjects', '/en/login', '/fa/login', '/api/health'];
  for (const candidate of BASE_URL_CANDIDATES) {
    for (const probe of probeEndpoints) {
      try {
        const response = await fetch(`${candidate}${probe}`, { redirect: 'manual' });
        if (response.ok || response.status === 307 || response.status === 308 || response.status === 302) {
          BASE_URL = candidate;
          API_BASE = `${BASE_URL}/api/v1`;
          return candidate;
        }
      } catch {
        // try next probe / candidate
      }
    }
  }

  throw new Error(`No running platform detected. Checked: ${BASE_URL_CANDIDATES.join(', ')}`);
}

async function testAPI(endpoint, method = 'GET', body = null, expectedStatus = 200) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const status = response.status;
    
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();

    if (status === expectedStatus) {
      return { success: true, status, data };
    }

    return {
      success: false,
      status,
      data,
      error: `Expected ${expectedStatus}, got ${status}`,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function findFiles(dir, pattern) {
  const files = [];
  
  function traverse(currentPath) {
    if (!fs.existsSync(currentPath)) return;
    
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!item.startsWith('.') && item !== 'node_modules') {
          traverse(fullPath);
        }
      } else if (pattern.test(item)) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function extractButtons(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const buttons = [];
  
  // Find <button> and <Button> tags
  const buttonRegex = /<(button|Button)[^>]*>/g;
  let match;
  
  while ((match = buttonRegex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    const buttonTag = match[0];
    
    // Check if it has onClick handler
    const hasOnClick = /onClick\s*=\s*[{(]/.test(buttonTag);
    const hasType = /type\s*=\s*["']submit["']/.test(buttonTag);
    
    buttons.push({
      line: lineNum,
      tag: buttonTag.substring(0, 50) + '...',
      hasHandler: hasOnClick || hasType,
    });
  }
  
  return buttons;
}

function extractLinks(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const links = [];
  
  // Find Link and <a> tags with href
  const linkRegex = /<(Link|a)\s+[^>]*href\s*=\s*["'`{]([^"'`}]+)["'`}]/g;
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    const href = match[2];
    
    links.push({
      line: lineNum,
      href,
      isExternal: href.startsWith('http'),
    });
  }
  
  return links;
}

function validateRoute(routePath, srcDir) {
  if (!routePath || routePath.startsWith('mailto:') || routePath.startsWith('tel:')) {
    return true;
  }

  if (
    routePath === '#' ||
    routePath.includes('${') ||
    routePath.includes('{') ||
    routePath.includes('[') ||
    routePath.includes('===') ||
    routePath.includes('?:') ||
    routePath.includes(' ?') ||
    /\s/.test(routePath) ||
    /^[A-Za-z_$][\w$.]*$/.test(routePath)
  ) {
    return true;
  }

  // Check if route exists in filesystem
  const appDir = path.join(srcDir, 'app');
  const normalizedPath = routePath.split('?')[0].split('#')[0].replace(/^\/(en|fa)/, '').replace(/^\//, '');
  const cleanPath = normalizedPath;

  if (!cleanPath) {
    return true;
  }
  
  // Possible file locations
  const possibilities = [
    path.join(appDir, '[locale]', cleanPath, 'page.tsx'),
    path.join(appDir, '[locale]', cleanPath, 'page.ts'),
    path.join(appDir, '[locale]', cleanPath, 'layout.tsx'),
    path.join(appDir, '[locale]', `${cleanPath}.tsx`),
    path.join(appDir, '[locale]', cleanPath),
  ];
  
  return possibilities.some(p => fs.existsSync(p));
}

function extractImplementationGaps(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const matches = [];
  const gapRegex = /(TODO:|coming soon|alert\()/gi;
  let match;

  while ((match = gapRegex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    matches.push({ line: lineNum, token: match[0] });
  }

  return matches;
}

// ============================================================================
// TEST SUITES
// ============================================================================

async function testAuthenticationAPIs() {
  log('\n📋 Testing Authentication APIs...', colors.cyan);
  
  // Test user creation
  const newUser = {
    id: `test-student-${Date.now()}`,
    email: `test${Date.now()}@test.com`,
    password: 'TestPass@123',
    profile: {
      firstName: 'Test',
      lastName: 'User',
      displayName: 'Test User',
    },
    roles: ['STUDENT'],
    dashboardPath: 'dashboard',
  };
  
  const createResult = await testAPI('/admin/users', 'POST', newUser, 201);
  logTest('Create User API', createResult.success ? 'PASS' : 'FAIL', 
    createResult.success ? `Created ${newUser.email}` : createResult.error);
  
  // Test list users
  const listResult = await testAPI('/admin/users', 'GET', null, 200);
  logTest('List Users API', listResult.success ? 'PASS' : 'FAIL',
    listResult.success ? `Found ${listResult.data.users?.length || 0} users` : listResult.error);
  
  // Test delete user
  if (createResult.success) {
    const deleteResult = await testAPI(`/admin/users?id=${newUser.id}`, 'DELETE', null, 200);
    logTest('Delete User API', deleteResult.success ? 'PASS' : 'FAIL',
      deleteResult.success ? `Deleted ${newUser.id}` : deleteResult.error);
  }
}

async function testContentLibraryAPIs() {
  log('\n📚 Testing Content Library APIs...', colors.cyan);
  
  // Test scraped content listing
  const listResult = await testAPI('/admin/scraped-content', 'GET', null, 200);
  logTest('List Scraped Content API', listResult.success ? 'PASS' : 'FAIL',
    listResult.success ? `Found ${listResult.data.items?.length || 0} items` : listResult.error);
  
  // Test create scraped content
  const newContent = {
    url: 'https://test.com/math-problem',
    title: 'Test Math Problem',
    content: 'What is 2 + 2?',
    contentType: 'PRACTICE_PROBLEM',
    subjectCode: 'MATH',
    gradeLevel: 1,
  };
  
  const createResult = await testAPI('/admin/scraped-content', 'POST', newContent, 201);
  logTest('Create Scraped Content API', createResult.success ? 'PASS' : 'FAIL',
    createResult.success ? 'Created test content' : createResult.error);
  
  // If created, test approval
  if (createResult.success && createResult.data.item?.id) {
    const skillsResult = await testAPI('/skills', 'GET', null, 200);
    const firstSkillId = skillsResult.success ? skillsResult.data.skills?.[0]?.id : null;

    if (!firstSkillId) {
      logTest('Approve Content API', 'WARN', 'No skill available for approval test');
      return;
    }

    const approveResult = await testAPI(
      `/admin/scraped-content/${createResult.data.item.id}/approve`,
      'POST',
      { skillId: firstSkillId },
      200
    );
    logTest('Approve Content API', approveResult.success ? 'PASS' : 'FAIL',
      approveResult.success ? 'Approved content' : approveResult.error);
  }
}

async function testSkillsAPIs() {
  log('\n🎯 Testing Skills APIs...', colors.cyan);
  
  // Test list skills
  const listResult = await testAPI('/skills', 'GET', null, 200);
  logTest('List Skills API', listResult.success ? 'PASS' : 'FAIL',
    listResult.success ? `Found ${listResult.data.skills?.length || 0} skills` : listResult.error);
  
  // Test filter skills by subject
  const filterResult = await testAPI('/skills?subject=MATH', 'GET', null, 200);
  logTest('Filter Skills by Subject API', filterResult.success ? 'PASS' : 'FAIL',
    filterResult.success ? `Found ${filterResult.data.skills?.length || 0} math skills` : filterResult.error);
  
  // Test create skill
  const subjectsResult = await testAPI('/subjects', 'GET', null, 200);
  const testSubjectId = subjectsResult.success ? subjectsResult.data.subjects?.[0]?.id : null;

  const newSkill = {
    code: `TEST_SKILL_${Date.now()}`,
    name: 'Test Skill',
    nameFA: 'مهارت آزمایشی',
    subjectId: testSubjectId,
    gradeBandMin: 'PRIMARY',
    gradeBandMax: 'PRIMARY',
  };
  
  if (!testSubjectId) {
    logTest('Create Skill API', 'WARN', 'No subject available for skill creation test');
    return;
  }

  const createResult = await testAPI('/admin/skills', 'POST', newSkill, 201);
  logTest('Create Skill API', createResult.success ? 'PASS' : 'FAIL',
    createResult.success ? `Created ${newSkill.code}` : `${createResult.error}${createResult.data?.error ? ` (${createResult.data.error})` : ''}`);
}

async function testSubjectsAPIs() {
  log('\n📖 Testing Subjects APIs...', colors.cyan);
  
  // Test list subjects
  const listResult = await testAPI('/subjects', 'GET', null, 200);
  logTest('List Subjects API', listResult.success ? 'PASS' : 'FAIL',
    listResult.success ? `Found ${listResult.data.subjects?.length || 0} subjects` : listResult.error);
}

async function testTeacherAssignmentSync() {
  log('\n🧑‍🏫 Testing Teacher Subject/Course Assignment Sync...', colors.cyan);

  const subjectsResult = await testAPI('/admin/subjects', 'GET', null, 200);
  if (!subjectsResult.success) {
    logTest('Load Admin Subjects for Teacher Assignment', 'FAIL', subjectsResult.error);
    return;
  }

  const coursesResult = await testAPI('/courses?publishedOnly=false&limit=100&locale=en', 'GET', null, 200);
  if (!coursesResult.success) {
    logTest('Load Courses for Teacher Assignment', 'FAIL', coursesResult.error);
    return;
  }

  const subjects = subjectsResult.data.subjects || [];
  const courses = coursesResult.data.courses || [];
  const matchingCourse = courses.find((course) => {
    const courseSubjectCode = String(course.subject?.code || '').toLowerCase();
    return subjects.some((subject) => String(subject.code || '').toLowerCase() === courseSubjectCode);
  });

  const selectedSubject = matchingCourse
    ? subjects.find((subject) => String(subject.code || '').toLowerCase() === String(matchingCourse.subject?.code || '').toLowerCase())
    : subjects[0];

  if (!selectedSubject) {
    logTest('Teacher Assignment Seed Data', 'WARN', 'No subjects available for assignment testing');
    return;
  }

  const timestamp = Date.now();
  const teacherPayload = {
    firstName: 'Audit',
    lastName: 'Teacher',
    email: `audit.teacher.${timestamp}@danesh.app`,
    phone: `+98912${String(timestamp).slice(-7)}`,
    department: null,
    subjects: [],
    bio: 'Automated assignment sync validation teacher.',
    status: 'active',
    locale: 'en',
  };

  const createTeacherResult = await testAPI('/admin/teachers', 'POST', teacherPayload, 201);
  logTest(
    'Create Teacher For Assignment Workflow',
    createTeacherResult.success ? 'PASS' : 'FAIL',
    createTeacherResult.success ? teacherPayload.email : createTeacherResult.error,
  );

  if (!createTeacherResult.success || !createTeacherResult.data.teacher?.id) {
    return;
  }

  const teacherId = createTeacherResult.data.teacher.id;
  const assignedCourseIds = matchingCourse?.id ? [matchingCourse.id] : [];
  const assignmentResult = await testAPI(`/admin/teachers/${teacherId}/assignments`, 'PATCH', {
    assignedSubjectCodes: [selectedSubject.code],
    assignedCourseIds,
  }, 200);

  logTest(
    'Assign Subject And Course To Teacher',
    assignmentResult.success ? 'PASS' : 'FAIL',
    assignmentResult.success
      ? `${selectedSubject.code}${assignedCourseIds.length ? ` + ${assignedCourseIds.length} course` : ''}`
      : assignmentResult.error,
  );

  if (assignmentResult.success) {
    const verificationResult = await testAPI(`/admin/teachers/${teacherId}/assignments`, 'GET', null, 200);
    const assignedSubjects = verificationResult.data?.assignedSubjectCodes || [];
    const verifiedCourseIds = verificationResult.data?.assignedCourseIds || [];
    const subjectSynced = verificationResult.success && assignedSubjects.some((code) => String(code).toLowerCase() === String(selectedSubject.code).toLowerCase());
    const coursesSynced = verificationResult.success && assignedCourseIds.every((courseId) => verifiedCourseIds.includes(courseId));

    logTest(
      'Teacher Assignment Sync Verification',
      subjectSynced && coursesSynced ? 'PASS' : 'FAIL',
      subjectSynced && coursesSynced
        ? `subjects=${assignedSubjects.length}, courses=${verifiedCourseIds.length}`
        : `Expected subject ${selectedSubject.code} and ${assignedCourseIds.length} course assignments`,
    );
  }

  const deleteResult = await testAPI(`/admin/teachers/${teacherId}`, 'DELETE', null, 200);
  logTest('Cleanup Assignment Test Teacher', deleteResult.success ? 'PASS' : 'WARN', deleteResult.success ? teacherId : deleteResult.error);
}

function testButtonHandlers(srcDir) {
  log('\n🔘 Testing Button Handlers...', colors.cyan);
  
  const pageFiles = findFiles(path.join(srcDir, 'app'), /page\.tsx?$/);
  let totalButtons = 0;
  let buttonsWithHandlers = 0;
  let buttonsWithoutHandlers = [];
  
  for (const file of pageFiles) {
    const buttons = extractButtons(file);
    totalButtons += buttons.length;
    
    for (const button of buttons) {
      if (button.hasHandler) {
        buttonsWithHandlers++;
      } else {
        const relativePath = path.relative(srcDir, file);
        buttonsWithoutHandlers.push(`${relativePath}:${button.line}`);
      }
    }
  }
  
  logTest('Buttons Have Handlers', 
    buttonsWithoutHandlers.length === 0 ? 'PASS' : 'WARN',
    `${buttonsWithHandlers}/${totalButtons} buttons have handlers`);
  
  if (buttonsWithoutHandlers.length > 0 && buttonsWithoutHandlers.length <= 5) {
    log(`  Missing handlers in:`, colors.dim);
    buttonsWithoutHandlers.slice(0, 5).forEach(location => {
      log(`    - ${location}`, colors.dim);
    });
  }
}

function testInternalLinks(srcDir) {
  log('\n🔗 Testing Internal Links...', colors.cyan);
  
  const pageFiles = findFiles(path.join(srcDir, 'app'), /page\.tsx?$/);
  let totalLinks = 0;
  let validLinks = 0;
  let brokenLinks = [];
  
  for (const file of pageFiles) {
    const links = extractLinks(file);
    
    for (const link of links) {
      if (link.isExternal) continue;
      
      totalLinks++;
      
      // Check if route exists
      if (validateRoute(link.href, srcDir)) {
        validLinks++;
      } else {
        const relativePath = path.relative(srcDir, file);
        brokenLinks.push(`${relativePath}:${link.line} → ${link.href}`);
      }
    }
  }
  
  logTest('Internal Links Valid',
    brokenLinks.length === 0 ? 'PASS' : 'WARN',
    `${validLinks}/${totalLinks} links point to existing routes`);
  
  if (brokenLinks.length > 0 && brokenLinks.length <= 5) {
    log(`  Potentially broken links:`, colors.dim);
    brokenLinks.slice(0, 5).forEach(link => {
      log(`    - ${link}`, colors.dim);
    });
  }
}

function testAPIEndpoints(srcDir) {
  log('\n🔌 Testing API Endpoints...', colors.cyan);
  
  const apiFiles = findFiles(path.join(srcDir, 'app', 'api'), /route\.ts$/);
  
  logTest('API Endpoints Found', 'PASS', `${apiFiles.length} endpoints discovered`);
  
  // List all endpoints
  log('  Discovered endpoints:', colors.dim);
  apiFiles.slice(0, 10).forEach(file => {
    const relativePath = path.relative(path.join(srcDir, 'app', 'api'), file);
    const endpoint = '/' + relativePath.replace(/route\.ts$/, '').replace(/\\/g, '/');
    log(`    - ${endpoint}`, colors.dim);
  });
  
  if (apiFiles.length > 10) {
    log(`    ... and ${apiFiles.length - 10} more`, colors.dim);
  }
}

function testImplementationGaps(srcDir) {
  log('\n🧭 Auditing Implementation Gaps...', colors.cyan);

  const appFiles = findFiles(path.join(srcDir, 'app'), /\.(ts|tsx)$/);
  let todoCount = 0;
  let alertCount = 0;
  let comingSoonCount = 0;
  const examples = [];

  for (const file of appFiles) {
    const gaps = extractImplementationGaps(file);
    if (!gaps.length) continue;

    const relativePath = path.relative(srcDir, file);
    for (const gap of gaps) {
      const token = gap.token.toLowerCase();
      if (token.includes('todo')) todoCount++;
      if (token.includes('alert(')) alertCount++;
      if (token.includes('coming soon')) comingSoonCount++;
      if (examples.length < 8) {
        examples.push(`${relativePath}:${gap.line} (${gap.token})`);
      }
    }
  }

  const totalGaps = todoCount + alertCount + comingSoonCount;
  logTest(
    'Implementation gap scan',
    totalGaps === 0 ? 'PASS' : 'WARN',
    `${todoCount} TODOs, ${alertCount} alert calls, ${comingSoonCount} coming-soon placeholders`
  );

  if (examples.length) {
    log('  Sample gaps:', colors.dim);
    examples.forEach(example => log(`    - ${example}`, colors.dim));
  }
}

function testRequiredFiles(projectRoot) {
  log('\n📁 Testing Required Project Files...', colors.cyan);
  
  const requiredFiles = [
    'package.json',
    'next.config.js',
    'tsconfig.json',
    'tailwind.config.ts',
    'prisma/schema.prisma',
    'src/app/[locale]/layout.tsx',
    'src/lib/auth/demo-users.ts',
    'docs/PLATFORM_DESIGN_SPECIFICATION.md',
  ];
  
  for (const file of requiredFiles) {
    const exists = fs.existsSync(path.join(projectRoot, file));
    logTest(`File exists: ${file}`, exists ? 'PASS' : 'FAIL');
  }
}

function generateReport() {
  log('\n' + '='.repeat(60), colors.blue);
  log('📊 TEST SUMMARY', colors.blue);
  log('='.repeat(60), colors.blue);
  
  const total = results.passed + results.failed + results.warnings;
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  
  log(`Total Tests: ${total}`, colors.cyan);
  log(`✓ Passed: ${results.passed}`, colors.green);
  log(`✗ Failed: ${results.failed}`, colors.red);
  log(`⚠ Warnings: ${results.warnings}`, colors.yellow);
  log(`Pass Rate: ${passRate}%`, passRate >= 90 ? colors.green : passRate >= 70 ? colors.yellow : colors.red);
  
  // Save detailed report
  const reportPath = path.join(__dirname, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  log(`\nDetailed report saved to: ${reportPath}`, colors.dim);
  
  log('='.repeat(60) + '\n', colors.blue);
  
  return results.failed === 0 ? 0 : 1;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  log('\n🚀 Starting Comprehensive Platform Tests...\n', colors.blue);
  
  const projectRoot = path.resolve(__dirname, '..');
  const srcDir = path.join(projectRoot, 'src');
  
  // Check if server is running
  try {
    const resolvedBaseUrl = await resolveBaseUrl();
    log(`✓ Dev server is running at ${resolvedBaseUrl}\n`, colors.green);
  } catch (error) {
    log('✗ Dev server is not running!', colors.red);
    log('Please start the server with: npm run dev', colors.yellow);
    process.exit(1);
  }
  
  // Run all test suites
  testRequiredFiles(projectRoot);
  await testAuthenticationAPIs();
  await testContentLibraryAPIs();
  await testSkillsAPIs();
  await testSubjectsAPIs();
  await testTeacherAssignmentSync();
  testButtonHandlers(srcDir);
  testInternalLinks(srcDir);
  testAPIEndpoints(srcDir);
  testImplementationGaps(srcDir);
  
  // Generate report
  const exitCode = generateReport();
  process.exit(exitCode);
}

main().catch(error => {
  log(`\n✗ Fatal error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
