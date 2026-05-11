import { NextRequest, NextResponse } from 'next/server';
import { RoleName } from '@prisma/client';
import { prisma } from '@/lib/db';

const teacherRoles = [RoleName.SUPPORT_TEACHER, RoleName.TUTOR, RoleName.COUNSELOR];

export async function GET(request: NextRequest) {
  try {
    const locale = new URL(request.url).searchParams.get('locale') || 'en';
    const isRTL = locale === 'fa';

    const [teacherRoleLinks, studentRoleLinks, totalCourses, activeClasses, newRegistrations, recentTeachers] = await Promise.all([
      prisma.userRole.findMany({
        where: {
          role: {
            name: {
              in: teacherRoles,
            },
          },
        },
        select: {
          userId: true,
        },
      }),
      prisma.userRole.findMany({
        where: {
          role: {
            name: RoleName.STUDENT,
          },
        },
        select: {
          userId: true,
        },
      }),
      prisma.course.count(),
      prisma.course.count({
        where: {
          isPublished: true,
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.user.findMany({
        where: {
          userRoles: {
            some: {
              role: {
                name: {
                  in: teacherRoles,
                },
              },
            },
          },
        },
        include: {
          profile: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 6,
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalTeachers: new Set(teacherRoleLinks.map((entry) => entry.userId)).size,
        totalStudents: new Set(studentRoleLinks.map((entry) => entry.userId)).size,
        totalCourses,
        activeClasses,
        pendingApprovals: 0,
        newRegistrations,
      },
      recentTeachers: recentTeachers.map((teacher) => {
        const displayName = teacher.profile?.displayName || [teacher.profile?.firstName, teacher.profile?.lastName].filter(Boolean).join(' ') || teacher.email || 'Teacher';
        const roleNames = teacher.userRoles.map((userRole) => userRole.role.name);
        const primaryRole = roleNames.find((roleName) => teacherRoles.includes(roleName as any)) || null;
        const subject = (primaryRole as string) === RoleName.TUTOR
          ? (isRTL ? 'مربی' : 'Tutor')
          : (primaryRole as string) === RoleName.COUNSELOR
            ? (isRTL ? 'مشاور' : 'Counselor')
            : (isRTL ? 'معلم پشتیبان' : 'Support Teacher');

        return {
          id: teacher.id,
          name: displayName,
          subject,
          students: 0,
          courses: 0,
          status: teacher.status,
          avatar: displayName.charAt(0).toUpperCase(),
        };
      }),
    });
  } catch (error) {
    console.error('Error fetching admin dashboard summary:', error);
    return NextResponse.json({ error: 'Failed to fetch admin dashboard summary' }, { status: 500 });
  }
}