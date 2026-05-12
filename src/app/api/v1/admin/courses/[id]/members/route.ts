/**
 * Admin Course Members API
 * GET    /api/v1/admin/courses/[id]/members  — get all enrolled users for a course
 * POST   /api/v1/admin/courses/[id]/members  — enroll a user (student or teacher)
 * DELETE /api/v1/admin/courses/[id]/members  — unenroll a user
 */
import { NextRequest, NextResponse } from 'next/server';
import { RoleName } from '@prisma/client';
import prisma from '@/lib/db';
import { canStudentEnrollInCourse } from '@/lib/learning/content-eligibility';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId: params.id },
      include: {
        // CourseEnrollment doesn't have a direct User relation in schema — fetch separately
      },
    });

    // Fetch users for each enrollment
    const userIds = enrollments.map((e) => e.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: {
        profile: { select: { firstName: true, lastName: true, displayName: true, avatarUrl: true } },
        userRoles: { include: { role: { select: { name: true } } } },
      },
    });

    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const members = enrollments.map((e) => {
      const u = userMap[e.userId];
      const roles = u?.userRoles.map((r) => r.role.name) ?? [];
      const teacherRoles: string[] = [RoleName.SUPPORT_TEACHER, RoleName.TUTOR, RoleName.COUNSELOR];
      const isTeacher = roles.some((r) => teacherRoles.includes(r));
      const displayName =
        u?.profile?.displayName ||
        [u?.profile?.firstName, u?.profile?.lastName].filter(Boolean).join(' ') ||
        u?.email?.split('@')[0] ||
        'User';

      return {
        userId: e.userId,
        email: u?.email || '',
        displayName,
        avatarUrl: u?.profile?.avatarUrl || null,
        role: isTeacher ? 'TEACHER' : 'STUDENT',
        enrolledAt: e.enrolledAt,
        progress: e.progress,
      };
    });

    return NextResponse.json({
      members,
      teachers: members.filter((m) => m.role === 'TEACHER'),
      students: members.filter((m) => m.role === 'STUDENT'),
    });
  } catch (error) {
    console.error('GET course members error:', error);
    return NextResponse.json({ error: 'Failed to load members' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userIds } = await request.json() as { userIds: string[] };

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds array required' }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        gradeLevel: {
          select: {
            gradeBand: true,
            code: true,
            name: true,
          },
        },
      },
    });
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: {
        profile: {
          select: {
            gradeBand: true,
            firstName: true,
            lastName: true,
            displayName: true,
          },
        },
        userRoles: {
          include: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (users.length !== userIds.length) {
      return NextResponse.json({ error: 'One or more users are invalid' }, { status: 400 });
    }

    const invalidStudents = users
      .filter((user) => user.userRoles.some((userRole) => userRole.role.name === RoleName.STUDENT))
      .filter((user) => !canStudentEnrollInCourse(user.profile?.gradeBand || null, course.gradeLevel?.gradeBand || null))
      .map((user) => ({
        userId: user.id,
        displayName:
          user.profile?.displayName ||
          [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ') ||
          user.email ||
          'Student',
        studentGradeBand: user.profile?.gradeBand || null,
        courseGradeBand: course.gradeLevel?.gradeBand || null,
      }));

    if (invalidStudents.length > 0) {
      return NextResponse.json(
        {
          error: 'One or more students are outside the course grade band',
          invalidStudents,
        },
        { status: 400 },
      );
    }

    // Upsert enrollments
    const results = await Promise.allSettled(
      userIds.map((userId) =>
        prisma.courseEnrollment.upsert({
          where: { userId_courseId: { userId, courseId: params.id } },
          create: { userId, courseId: params.id },
          update: {},
        })
      )
    );

    const enrolled = results.filter((r) => r.status === 'fulfilled').length;
    return NextResponse.json({ enrolled, total: userIds.length }, { status: 201 });
  } catch (error) {
    console.error('POST course members error:', error);
    return NextResponse.json({ error: 'Failed to enroll members' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await request.json() as { userId: string };

    await prisma.courseEnrollment.deleteMany({
      where: { courseId: params.id, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE course member error:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
