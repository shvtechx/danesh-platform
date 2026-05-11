import { NextRequest, NextResponse } from 'next/server';
import { RoleName } from '@prisma/client';
import prisma from '@/lib/db';
import {
  TEACHER_DEPARTMENTS,
  getDepartmentForSubject,
  getLocalizedDepartmentName,
  getLocalizedSubjectName,
} from '@/lib/admin/teacher-metadata';

const prismaClient = prisma as any;
const teacherRoles = [RoleName.SUPPORT_TEACHER, RoleName.TUTOR, RoleName.COUNSELOR];

type SubjectAggregate = {
  courses: number;
  students: number;
  averageProgressSum: number;
  progressCount: number;
};

type TopTeacherSummary = {
  id: string;
  name: string;
  subject: string;
  students: number;
  courses: number;
  completionRate: number;
  status: string;
};

function normalizeSubjectKey(value?: string | null) {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  const subjectAliases: Record<string, string> = {
    math: 'math',
    mathematics: 'math',
    geometry: 'geometry',
    physics: 'physics',
    chemistry: 'chemistry',
    biology: 'biology',
    science: 'science',
    english: 'english',
    persian: 'persian',
    literature: 'persian',
    arabic: 'arabic',
    history: 'history',
    geography: 'geography',
    art: 'arts',
    arts: 'arts',
  };

  return subjectAliases[normalized] || normalized;
}

function formatRelativeTime(date: Date, locale: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  const rtf = new Intl.RelativeTimeFormat(locale === 'fa' ? 'fa-IR' : 'en', { numeric: 'auto' });

  if (seconds < 60) return rtf.format(-seconds, 'second');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  const days = Math.floor(hours / 24);
  return rtf.format(-days, 'day');
}

export async function GET(request: NextRequest) {
  try {
    const locale = new URL(request.url).searchParams.get('locale') || 'en';

    const [teachers, studentRoleLinks, courses, recentEnrollments] = await Promise.all([
      prismaClient.user.findMany({
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
      }),
      prismaClient.userRole.findMany({
        where: {
          role: {
            name: RoleName.STUDENT,
          },
        },
        select: {
          userId: true,
        },
      }),
      prismaClient.course.findMany({
        include: {
          subject: true,
          units: {
            include: {
              lessons: {
                select: {
                  estimatedTime: true,
                },
              },
            },
          },
          enrollments: {
            select: {
              progress: true,
              enrolledAt: true,
            },
          },
        },
      }),
      prismaClient.courseEnrollment.findMany({
        orderBy: {
          enrolledAt: 'desc',
        },
        take: 10,
        include: {
          course: {
            include: {
              subject: true,
            },
          },
        },
      }),
    ]);

    const courseStatsBySubject = new Map<string, SubjectAggregate>();
    let teachingMinutes = 0;

    for (const course of courses) {
      const subjectKey = normalizeSubjectKey(course.subject?.code || course.subject?.name) || 'unassigned';
      const current = courseStatsBySubject.get(subjectKey) || { courses: 0, students: 0, averageProgressSum: 0, progressCount: 0 };
      const courseStudents = course.enrollments.length;
      const courseAverageProgress = courseStudents > 0
        ? course.enrollments.reduce((sum: number, enrollment: { progress: number }) => sum + (enrollment.progress || 0), 0) / courseStudents
        : 0;

      courseStatsBySubject.set(subjectKey, {
        courses: current.courses + 1,
        students: current.students + courseStudents,
        averageProgressSum: current.averageProgressSum + courseAverageProgress,
        progressCount: current.progressCount + (courseStudents > 0 ? 1 : 0),
      });

      teachingMinutes += course.units.reduce(
        (courseMinutes: number, unit: { lessons: Array<{ estimatedTime?: number | null }> }) =>
          courseMinutes + unit.lessons.reduce((lessonMinutes, lesson) => lessonMinutes + (lesson.estimatedTime || 0), 0),
        0,
      );
    }

    const topTeachers = teachers
      .map((teacher: any): TopTeacherSummary => {
        const subjectScopes = Array.from(
          new Set(
            (teacher.userRoles || [])
              .map((userRole: any) => userRole.scope)
              .filter((scope: string | null | undefined) => scope?.startsWith('subject:'))
              .map((scope: string) => normalizeSubjectKey(scope.replace('subject:', '')))
              .filter(Boolean),
          ),
        ) as string[];

        const aggregated = subjectScopes.reduce(
          (acc, subjectKey) => {
            const subjectStats = courseStatsBySubject.get(subjectKey);
            if (!subjectStats) return acc;
            return {
              courses: acc.courses + subjectStats.courses,
              students: acc.students + subjectStats.students,
              completionSum: acc.completionSum + (subjectStats.progressCount > 0 ? subjectStats.averageProgressSum / subjectStats.progressCount : 0),
              completionCount: acc.completionCount + 1,
            };
          },
          { courses: 0, students: 0, completionSum: 0, completionCount: 0 },
        );

        const displayName = teacher.profile?.displayName || [teacher.profile?.firstName, teacher.profile?.lastName].filter(Boolean).join(' ') || teacher.email || 'Teacher';
        const primarySubject = subjectScopes[0] || null;

        return {
          id: teacher.id,
          name: displayName,
          subject: getLocalizedSubjectName(primarySubject, locale),
          students: aggregated.students,
          courses: aggregated.courses,
          completionRate: aggregated.completionCount > 0 ? Math.round(aggregated.completionSum / aggregated.completionCount) : 0,
          status: teacher.status,
        };
      })
      .sort((a: TopTeacherSummary, b: TopTeacherSummary) => (b.students + b.courses * 10 + b.completionRate) - (a.students + a.courses * 10 + a.completionRate))
      .slice(0, 5);

    const departmentStats = TEACHER_DEPARTMENTS.map((department) => {
      const subjectKeys = new Set(
        Array.from(courseStatsBySubject.keys()).filter((subjectKey) => getDepartmentForSubject(subjectKey) === department.id),
      );

      let teachersCount = 0;
      for (const teacher of teachers) {
        const teacherDepartmentIds = new Set(
          (teacher.userRoles || [])
            .map((userRole: any) => userRole.scope)
            .filter((scope: string | null | undefined) => scope?.startsWith('subject:'))
            .map((scope: string) => getDepartmentForSubject(normalizeSubjectKey(scope.replace('subject:', ''))))
            .filter(Boolean),
        );

        if (teacherDepartmentIds.has(department.id)) {
          teachersCount += 1;
        }
      }

      let students = 0;
      let coursesCount = 0;
      let completionSum = 0;
      let completionCount = 0;

      for (const [subjectKey, stats] of Array.from(courseStatsBySubject.entries())) {
        if (!subjectKeys.has(subjectKey) && getDepartmentForSubject(subjectKey) !== department.id) {
          continue;
        }
        students += stats.students;
        coursesCount += stats.courses;
        if (stats.progressCount > 0) {
          completionSum += stats.averageProgressSum / stats.progressCount;
          completionCount += 1;
        }
      }

      return {
        id: department.id,
        name: getLocalizedDepartmentName(department.id, locale),
        teachers: teachersCount,
        students,
        courses: coursesCount,
        completion: completionCount > 0 ? Math.round(completionSum / completionCount) : 0,
      };
    }).filter((department) => department.teachers > 0 || department.students > 0 || department.courses > 0);

    const recentTeacherActivities = teachers
      .slice()
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4)
      .map((teacher: any) => ({
        type: 'teacher',
        action: locale === 'fa' ? 'معلم جدید اضافه شد' : 'New teacher added',
        detail: teacher.profile?.displayName || teacher.email || (locale === 'fa' ? 'معلم' : 'Teacher'),
        time: formatRelativeTime(teacher.createdAt, locale),
        timestamp: new Date(teacher.createdAt).getTime(),
      }));

    const recentCourseActivities = courses
      .slice()
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4)
      .map((course: any) => ({
        type: 'course',
        action: locale === 'fa' ? 'دوره جدید اضافه شد' : 'New course added',
        detail: locale === 'fa' ? (course.titleFA || course.title) : course.title,
        time: formatRelativeTime(course.createdAt, locale),
        timestamp: new Date(course.createdAt).getTime(),
      }));

    const recentEnrollmentActivities = recentEnrollments.slice(0, 4).map((enrollment: any) => ({
      type: 'student',
      action: locale === 'fa' ? 'ثبت‌نام جدید انجام شد' : 'New student enrollment',
      detail: locale === 'fa' ? (enrollment.course.titleFA || enrollment.course.title) : enrollment.course.title,
      time: formatRelativeTime(enrollment.enrolledAt, locale),
      timestamp: new Date(enrollment.enrolledAt).getTime(),
    }));

    const recentActivities = [...recentTeacherActivities, ...recentCourseActivities, ...recentEnrollmentActivities]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8)
      .map(({ timestamp, ...activity }) => activity);

    const enrollmentsBySubject = Array.from(courseStatsBySubject.entries())
      .map(([subjectKey, stats]) => ({
        id: subjectKey,
        name: getLocalizedSubjectName(subjectKey, locale),
        enrollments: stats.students,
        courses: stats.courses,
      }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 6);

    const enrollmentTrend = departmentStats.map((department) => ({
      id: department.id,
      name: department.name,
      students: department.students,
      completion: department.completion,
    }));

    return NextResponse.json({
      stats: {
        totalTeachers: teachers.length,
        totalStudents: new Set(studentRoleLinks.map((entry: { userId: string }) => entry.userId)).size,
        totalCourses: courses.length,
        teachingHours: Math.round(teachingMinutes / 60),
      },
      topTeachers,
      departmentStats,
      recentActivities,
      enrollmentsBySubject,
      enrollmentTrend,
    });
  } catch (error) {
    console.error('Error fetching admin reports summary:', error);
    return NextResponse.json({ error: 'Failed to fetch admin reports summary' }, { status: 500 });
  }
}
