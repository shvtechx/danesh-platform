/**
 * Bulk Import API
 * POST /api/v1/admin/bulk-import — process CSV rows
 * GET  /api/v1/admin/bulk-import — download a CSV template
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

const TEMPLATES = {
  users: `email,firstName,lastName,role,password
student1@example.com,Ali,Mohammadi,STUDENT,Pass@123
teacher1@example.com,Sara,Ahmadi,TEACHER,Pass@123`,

  enrollments: `userEmail,courseCode,role
student1@example.com,MATH-7A,STUDENT
teacher1@example.com,MATH-7A,TEACHER`,

  courses: `title,titleFA,subjectCode,gradeCode,code,description
Math Grade 7,ریاضی پایه هفتم,MATH,GRADE_7,MATH-7A,Core mathematics curriculum for grade 7`,
};

export async function GET(request: NextRequest) {
  const type = new URL(request.url).searchParams.get('type') || 'users';
  const template = TEMPLATES[type as keyof typeof TEMPLATES] || TEMPLATES.users;

  return new NextResponse(template, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${type}-template.csv"`,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      type: 'users' | 'enrollments' | 'courses';
      rows: Record<string, string>[];
    };

    const { type, rows } = body;
    if (!rows?.length) return NextResponse.json({ error: 'No rows provided' }, { status: 400 });

    const results: { row: number; status: 'ok' | 'error'; detail: string }[] = [];

    if (type === 'users') {
      for (let i = 0; i < rows.length; i++) {
        const { email, firstName, lastName, role } = rows[i];
        try {
          if (!email || !role) throw new Error('email and role required');

          // Get or create role record
          const validRoles = ['STUDENT', 'SUPPORT_TEACHER', 'TUTOR', 'COUNSELOR', 'PARENT', 'ADMIN'];
          const roleMap: Record<string, string> = {
            STUDENT: 'STUDENT',
            TEACHER: 'SUPPORT_TEACHER',
            TUTOR: 'TUTOR',
          };
          const roleName = roleMap[role.toUpperCase()] || role.toUpperCase();
          if (!validRoles.includes(roleName)) throw new Error(`Invalid role: ${role}`);

          const roleRecord = await prisma.role.findFirst({ where: { name: roleName as any } });
          if (!roleRecord) throw new Error(`Role ${roleName} not found in DB`);

          // Upsert user
          const user = await prisma.user.upsert({
            where: { email },
            create: {
              email,
              userRoles: { create: { roleId: roleRecord.id } },
              profile: firstName || lastName
                ? { create: { firstName: String(firstName || 'User'), lastName: String(lastName || '') } }
                : undefined,
            },
            update: {},
          });

          results.push({ row: i + 1, status: 'ok', detail: `User ${email} (${user.id})` });
        } catch (err: any) {
          results.push({ row: i + 1, status: 'error', detail: err.message });
        }
      }
    } else if (type === 'enrollments') {
      for (let i = 0; i < rows.length; i++) {
        const { userEmail, courseCode, role } = rows[i];
        try {
          if (!userEmail || !courseCode) throw new Error('userEmail and courseCode required');

          const user = await prisma.user.findFirst({ where: { email: userEmail } });
          if (!user) throw new Error(`User not found: ${userEmail}`);

          const course = await prisma.course.findFirst({ where: { code: courseCode } });
          if (!course) throw new Error(`Course not found: ${courseCode}`);

          await prisma.courseEnrollment.upsert({
            where: { userId_courseId: { userId: user.id, courseId: course.id } },
            create: { userId: user.id, courseId: course.id },
            update: {},
          });

          results.push({ row: i + 1, status: 'ok', detail: `${userEmail} → ${courseCode} (${role || 'STUDENT'})` });
        } catch (err: any) {
          results.push({ row: i + 1, status: 'error', detail: err.message });
        }
      }
    } else if (type === 'courses') {
      for (let i = 0; i < rows.length; i++) {
        const { title, titleFA, subjectCode, gradeCode, code, description } = rows[i];
        try {
          if (!title || !subjectCode || !gradeCode) throw new Error('title, subjectCode, gradeCode required');

          const subject = await prisma.subject.findFirst({ where: { code: { equals: subjectCode, mode: 'insensitive' } } });
          if (!subject) throw new Error(`Subject not found: ${subjectCode}`);

          const gradeLevel = await prisma.gradeLevel.findFirst({ where: { code: { equals: gradeCode, mode: 'insensitive' } } });
          if (!gradeLevel) throw new Error(`Grade level not found: ${gradeCode}`);

          const framework = await prisma.curriculumFramework.findFirst();
          if (!framework) throw new Error('No curriculum framework in DB');

          const courseCode = code || `${subjectCode}-${gradeCode}-${Date.now()}`;

          await prisma.course.upsert({
            where: { code: courseCode },
            create: {
              title,
              titleFA: titleFA || null,
              code: courseCode,
              subjectId: subject.id,
              gradeLevelId: gradeLevel.id,
              frameworkId: framework.id,
              description: description || null,
            },
            update: { title, titleFA: titleFA || null, description: description || null },
          });

          results.push({ row: i + 1, status: 'ok', detail: `Course "${title}" (${courseCode})` });
        } catch (err: any) {
          results.push({ row: i + 1, status: 'error', detail: err.message });
        }
      }
    }

    const ok = results.filter((r) => r.status === 'ok').length;
    const errors = results.filter((r) => r.status === 'error').length;

    return NextResponse.json({ ok, errors, results });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
