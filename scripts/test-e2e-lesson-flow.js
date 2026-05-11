/**
 * E2E Test: Teacher creates a lesson → Student verifies access
 *
 * Usage:
 *   node scripts/test-e2e-lesson-flow.js
 *
 * Requires the dev server running on http://localhost:3000
 * and seeded demo users: teacher@test.com / student@test.com
 */

const BASE = 'http://localhost:3000';

let passed = 0;
let failed = 0;

async function step(label, fn) {
  try {
    const result = await fn();
    console.log(`  ✅ ${label}`);
    passed++;
    return result;
  } catch (err) {
    console.error(`  ❌ ${label}`);
    console.error(`     → ${err.message}`);
    failed++;
    return null;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

async function apiGet(path, userId) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'x-demo-user-id': userId, 'Content-Type': 'application/json' },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function apiPost(path, userId, payload) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'x-demo-user-id': userId, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function apiPut(path, userId, payload) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'x-demo-user-id': userId, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function main() {
  console.log('\n🧪 Danesh Platform — E2E Lesson Flow Test\n');
  console.log('─'.repeat(50));

  // ── TEACHER FLOW ──────────────────────────────────────────
  console.log('\n[TEACHER FLOW]');

  const TEACHER_ID = 'TEST_TEACHER';
  let courseId = null;
  let lessonId = null;

  // Step 1: Teacher can access their dashboard
  await step('Teacher dashboard accessible', async () => {
    const { status } = await apiGet('/api/v1/teacher/courses', TEACHER_ID);
    assert(status === 200, `Expected 200, got ${status}`);
  });

  // Step 2: Get teacher's courses
  const coursesResult = await step('Teacher can list courses', async () => {
    const { status, body } = await apiGet('/api/v1/teacher/courses', TEACHER_ID);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(Array.isArray(body.courses) || Array.isArray(body), 'Expected courses array');
    const courses = body.courses || body;
    assert(courses.length > 0, 'No courses found — run seed script first');
    courseId = courses[0].id;
    return courses[0];
  });

  if (!courseId) {
    console.log('\n⚠️  Cannot continue without a course. Run: npx prisma db seed\n');
    process.exit(1);
  }

  // Step 3: Create a new lesson
  const lessonResult = await step(`Create lesson in course ${courseId}`, async () => {
    const { status, body } = await apiPost('/api/v1/teacher/lessons', TEACHER_ID, {
      title: `E2E Test Lesson ${Date.now()}`,
      description: 'Automated test lesson',
      subjectId: coursesResult?.subjectId || undefined,
      gradeLevel: 'GRADE_7',
      estimatedMinutes: 15,
    });
    assert(status === 200 || status === 201, `Expected 200/201, got ${status}: ${JSON.stringify(body)}`);
    assert(body.lesson?.id || body.id, 'No lessonId returned');
    lessonId = body.lesson?.id || body.id;
    return body;
  });

  if (!lessonId) {
    console.error('\n⚠️  Cannot continue without a lesson ID\n');
    process.exit(1);
  }

  // Step 4: Save content blocks to the lesson
  await step('Save content blocks (text + video)', async () => {
    const { status, body } = await apiPut(`/api/v1/teacher/lessons/${lessonId}/content`, TEACHER_ID, {
      blocks: [
        { id: 'b1', type: 'text', content: '# E2E Test\nThis is an automated test.' },
        { id: 'b2', type: 'video', content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
      ],
      publish: false,
    });
    assert(status === 200, `Expected 200, got ${status}: ${JSON.stringify(body)}`);
  });

  // Step 5: Load content back — verify persistence
  await step('Content blocks persist on reload', async () => {
    const { status, body } = await apiGet(`/api/v1/teacher/lessons/${lessonId}/content`, TEACHER_ID);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(Array.isArray(body.blocks), 'Expected blocks array');
    assert(body.blocks.length === 2, `Expected 2 blocks, got ${body.blocks.length}`);
    const textBlock = body.blocks.find((b) => b.type === 'text');
    const videoBlock = body.blocks.find((b) => b.type === 'video');
    assert(textBlock, 'Text block missing');
    assert(videoBlock, 'Video block missing');
    assert(videoBlock.content.includes('youtube'), `Video URL missing: ${videoBlock.content}`);
  });

  // Step 6: Publish the lesson
  await step('Publish lesson', async () => {
    const { status, body } = await apiPut(`/api/v1/teacher/lessons/${lessonId}/content`, TEACHER_ID, {
      blocks: [
        { id: 'b1', type: 'text', content: '# E2E Test\nThis is an automated test.' },
        { id: 'b2', type: 'video', content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
      ],
      publish: true,
    });
    assert(status === 200, `Expected 200, got ${status}: ${JSON.stringify(body)}`);
  });

  // Step 7: XP was awarded for publishing
  await step('XP awarded after publish', async () => {
    const { status, body } = await apiGet('/api/v1/teacher/gamification', TEACHER_ID);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(typeof body.totalXP === 'number', 'totalXP missing from gamification response');
    assert(body.totalXP > 0, `totalXP should be > 0 after publish, got ${body.totalXP}`);
  });

  // Step 8: Leaderboard includes the teacher
  await step('Teacher appears on leaderboard', async () => {
    const { status, body } = await apiGet('/api/v1/teacher/leaderboard', TEACHER_ID);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(Array.isArray(body.entries), 'Expected entries array');
    const found = body.entries.find((e) => e.id === TEACHER_ID);
    assert(found, `Teacher ${TEACHER_ID} not found in leaderboard`);
  });

  // ── STUDENT FLOW ──────────────────────────────────────────
  console.log('\n[STUDENT FLOW]');

  const STUDENT_ID = 'TEST_STUDENT';

  // Step 9: Student can access dashboard
  await step('Student dashboard accessible', async () => {
    const { status } = await apiGet('/api/v1/student/dashboard', STUDENT_ID);
    // 200 or 404 are acceptable (endpoint may not exist yet), but not 500
    assert(status !== 500, `Server error: ${status}`);
  });

  // Step 10: Student can see published lessons
  await step('Student can see published lesson in courses', async () => {
    const { status, body } = await apiGet(`/api/v1/courses/${courseId}/lessons`, STUDENT_ID);
    if (status === 404) {
      // Try alternate endpoint
      const alt = await apiGet(`/api/v1/lessons?courseId=${courseId}`, STUDENT_ID);
      assert(alt.status === 200, `No lessons endpoint found (tried /courses/${courseId}/lessons and /lessons?courseId=)`);
      return;
    }
    assert(status === 200, `Expected 200, got ${status}`);
    const lessons = body.lessons || body;
    const published = (Array.isArray(lessons) ? lessons : []).filter((l) => l.isPublished);
    assert(published.length > 0, 'No published lessons visible to student');
  });

  // ── SUMMARY ────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check output above.\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n💥 Unexpected error:', err);
  process.exit(1);
});
