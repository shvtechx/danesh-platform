#!/usr/bin/env node

const BASE_URL_CANDIDATES = [
  process.env.PLATFORM_BASE_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
].filter(Boolean);

async function resolveBaseUrl() {
  for (const candidate of BASE_URL_CANDIDATES) {
    try {
      const response = await fetch(`${candidate}/en/login`, { redirect: 'manual' });
      if (response.ok || [301, 302, 307, 308].includes(response.status)) {
        return candidate;
      }
    } catch {
      // continue
    }
  }

  throw new Error(`No running platform found. Checked: ${BASE_URL_CANDIDATES.join(', ')}`);
}

async function api(baseUrl, endpoint, options = {}) {
  const response = await fetch(`${baseUrl}/api/v1${endpoint}`, {
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

async function main() {
  const baseUrl = await resolveBaseUrl();
  console.log(`Using base URL: ${baseUrl}`);

  const [{ response: subjectsResponse, data: subjectsData }, { response: coursesResponse, data: coursesData }] = await Promise.all([
    api(baseUrl, '/admin/subjects'),
    api(baseUrl, '/courses?locale=en&publishedOnly=false&limit=100'),
  ]);

  if (!subjectsResponse.ok) {
    throw new Error(`Failed to load subjects: ${subjectsResponse.status} ${JSON.stringify(subjectsData)}`);
  }
  if (!coursesResponse.ok) {
    throw new Error(`Failed to load courses: ${coursesResponse.status} ${JSON.stringify(coursesData)}`);
  }

  const subjects = subjectsData.subjects || [];
  const courses = coursesData.courses || [];
  console.log(`Subjects available: ${subjects.length}`);
  console.log(`Courses available: ${courses.length}`);

  const selectedCourse = courses.find((course) => {
    const courseSubjectCode = String(course.subject?.code || '').toLowerCase();
    return subjects.some((subject) => String(subject.code || '').toLowerCase() === courseSubjectCode);
  }) || null;

  const selectedSubject = selectedCourse
    ? subjects.find((subject) => String(subject.code || '').toLowerCase() === String(selectedCourse.subject?.code || '').toLowerCase())
    : subjects[0];

  if (!selectedSubject) {
    throw new Error('No subject found for validation.');
  }

  const timestamp = Date.now();
  const teacherPayload = {
    firstName: 'Audit',
    lastName: 'Teacher',
    email: `audit.teacher.${timestamp}@danesh.app`,
    phone: '+989121234567',
    department: null,
    subjects: [],
    bio: 'Automated teacher assignment validation',
    status: 'active',
    locale: 'en',
  };

  const { response: createResponse, data: createData } = await api(baseUrl, '/admin/teachers', {
    method: 'POST',
    body: JSON.stringify(teacherPayload),
  });

  if (!createResponse.ok) {
    throw new Error(`Failed to create teacher: ${createResponse.status} ${JSON.stringify(createData)}`);
  }

  const teacherId = createData.teacher?.id;
  if (!teacherId) {
    throw new Error('Teacher creation succeeded but no teacher id was returned.');
  }

  console.log(`Created teacher: ${teacherId}`);

  try {
    const assignmentPayload = {
      assignedSubjectCodes: [selectedSubject.code],
      assignedCourseIds: selectedCourse?.id ? [selectedCourse.id] : [],
    };

    const { response: assignResponse, data: assignData } = await api(baseUrl, `/admin/teachers/${teacherId}/assignments`, {
      method: 'PATCH',
      body: JSON.stringify(assignmentPayload),
    });

    if (!assignResponse.ok) {
      throw new Error(`Failed to assign teacher data: ${assignResponse.status} ${JSON.stringify(assignData)}`);
    }

    const { response: verifyResponse, data: verifyData } = await api(baseUrl, `/admin/teachers/${teacherId}/assignments`);
    if (!verifyResponse.ok) {
      throw new Error(`Failed to verify assignments: ${verifyResponse.status} ${JSON.stringify(verifyData)}`);
    }

    const assignedSubjects = verifyData.assignedSubjectCodes || [];
    const assignedCourses = verifyData.assignedCourseIds || [];
    const subjectOk = assignedSubjects.some((code) => String(code).toLowerCase() === String(selectedSubject.code).toLowerCase());
    const courseOk = selectedCourse ? assignedCourses.includes(selectedCourse.id) : true;

    console.log(`Selected subject: ${selectedSubject.code}`);
    console.log(`Selected course: ${selectedCourse?.title || 'none'}`);
    console.log(`Verified subjects: ${assignedSubjects.join(', ') || 'none'}`);
    console.log(`Verified courses: ${assignedCourses.join(', ') || 'none'}`);

    if (!subjectOk || !courseOk) {
      throw new Error('Assignment sync verification failed.');
    }

    console.log('Assignment sync validation: PASS');
  } finally {
    const { response: deleteResponse, data: deleteData } = await api(baseUrl, `/admin/teachers/${teacherId}`, {
      method: 'DELETE',
    });

    if (!deleteResponse.ok) {
      console.error(`Cleanup warning: failed to delete ${teacherId}: ${deleteResponse.status} ${JSON.stringify(deleteData)}`);
    } else {
      console.log(`Deleted teacher: ${teacherId}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
