import { RoleName } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { extractTeacherAssignmentState } from '../../../../../lib/admin/teacher-assignments';
import { getDemoUserById } from '@/lib/auth/demo-users';

const teacherRoleNames = [RoleName.SUPPORT_TEACHER, RoleName.TUTOR, RoleName.COUNSELOR];

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

export async function GET(request: NextRequest) {
  try {
    const locale = new URL(request.url).searchParams.get('locale') || 'en';
    const requestUserId = request.headers.get('x-user-id') || request.headers.get('x-demo-user-id');

    if (!requestUserId) {
      return NextResponse.json({ courses: [] });
    }

    const teacher = await prisma.user.findFirst({
      where: {
        id: requestUserId,
        userRoles: {
          some: {
            role: {
              name: {
                in: teacherRoleNames,
              },
            },
          },
        },
      },
      select: {
        userRoles: {
          select: {
            scope: true,
          },
        },
      },
    });

    const demoTeacher = !teacher ? getDemoUserById(requestUserId) : null;

    if (!teacher && !(demoTeacher?.roles || []).includes('TEACHER')) {
      return NextResponse.json({ courses: [] });
    }

    const assignmentState = teacher
      ? extractTeacherAssignmentState(teacher.userRoles || [])
      : {
          subjectCodes: demoTeacher?.assignedSubjects || [],
          assignedStudentIds: demoTeacher?.assignedStudents || [],
          assignedCourseIds: [],
        };

    const assignedCourseIds = assignmentState.assignedCourseIds;
    const assignedSubjectCodes = assignmentState.subjectCodes
      .map((subjectCode) => normalizeSubjectKey(subjectCode))
      .filter((value): value is string => Boolean(value));

    if (assignedCourseIds.length === 0 && assignedSubjectCodes.length === 0) {
      return NextResponse.json({ courses: [] });
    }

    const courses = await prisma.course.findMany({
      where: assignedCourseIds.length > 0
        ? {
            id: {
              in: assignedCourseIds,
            },
          }
        : {
            isPublished: true,
          },
      include: {
        gradeLevel: {
          select: {
            name: true,
            nameFA: true,
            code: true,
          },
        },
        subject: {
          select: {
            code: true,
            name: true,
            nameFA: true,
          },
        },
        units: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                titleFA: true,
                estimatedTime: true,
                isPublished: true,
                sequence: true,
              },
              orderBy: {
                sequence: 'asc',
              },
            },
          },
          orderBy: {
            sequence: 'asc',
          },
        },
        enrollments: {
          select: {
            userId: true,
            progress: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const filteredCourses = courses.filter((course) => {
      const normalizedSubject = normalizeSubjectKey(course.subject.code);
      const matchesAssignedCourse = assignedCourseIds.length === 0 || assignedCourseIds.includes(course.id);
      const matchesAssignedSubject = !normalizedSubject || assignedSubjectCodes.length === 0 || assignedSubjectCodes.includes(normalizedSubject);
      return matchesAssignedCourse && matchesAssignedSubject;
    });

    return NextResponse.json({
      courses: filteredCourses.map((course) => {
        const totalLessons = course.units.reduce((sum, unit) => sum + unit.lessons.length, 0);
        const averageProgress = course.enrollments.length > 0
          ? Math.round(course.enrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0) / course.enrollments.length)
          : 0;

        return {
          id: course.id,
          title: locale === 'fa' ? (course.titleFA || course.title) : course.title,
          description: locale === 'fa' ? (course.descriptionFA || course.description || '') : (course.description || course.descriptionFA || ''),
          grade: locale === 'fa' ? (course.gradeLevel.nameFA || course.gradeLevel.name) : course.gradeLevel.name,
          gradeCode: course.gradeLevel.code,
          subject: locale === 'fa' ? (course.subject.nameFA || course.subject.name) : course.subject.name,
          subjectCode: course.subject.code,
          students: course.enrollments.length,
          lessons: totalLessons,
          status: course.isPublished ? 'published' : 'draft',
          progress: averageProgress,
          createdAt: course.createdAt,
          lastUpdated: course.updatedAt,
          units: course.units.map((unit) => ({
            id: unit.id,
            title: locale === 'fa' ? (unit.titleFA || unit.title) : unit.title,
            lessons: unit.lessons.map((lesson) => ({
              id: lesson.id,
              title: locale === 'fa' ? (lesson.titleFA || lesson.title) : lesson.title,
              estimatedTime: lesson.estimatedTime,
              isPublished: lesson.isPublished,
            })),
          })),
        };
      }),
    });
  } catch (error) {
    console.error('Error fetching teacher courses:', error);
    return NextResponse.json({ error: 'Failed to fetch teacher courses' }, { status: 500 });
  }
}