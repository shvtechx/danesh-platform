import { NextRequest, NextResponse } from 'next/server';
import { RoleName } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  buildScopedValues,
  COURSE_SCOPE_PREFIX,
  extractTeacherAssignmentState,
  STUDENT_SCOPE_PREFIX,
  SUBJECT_SCOPE_PREFIX,
} from '@/lib/admin/teacher-assignments';
import { normalizeSubjectKey } from '@/lib/admin/teacher-metadata';

const teacherRoleNames = [RoleName.SUPPORT_TEACHER, RoleName.TUTOR, RoleName.COUNSELOR];

const teacherAssignmentSchema = z.object({
  assignedStudentIds: z.array(z.string()).optional(),
  assignedCourseIds: z.array(z.string()).optional(),
  assignedSubjectCodes: z.array(z.string()).optional(),
});

async function ensureTeacherRole() {
  return prisma.role.upsert({
    where: { name: RoleName.SUPPORT_TEACHER },
    update: {
      permissions: ['courses:read', 'courses:write', 'lessons:read', 'lessons:write', 'students:read', 'analytics:read'],
      description: 'Support teacher role for instructional staff',
    },
    create: {
      name: RoleName.SUPPORT_TEACHER,
      permissions: ['courses:read', 'courses:write', 'lessons:read', 'lessons:write', 'students:read', 'analytics:read'],
      description: 'Support teacher role for instructional staff',
    },
  });
}

async function findTeacher(id: string) {
  return prisma.user.findFirst({
    where: {
      id,
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
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const teacher = await findTeacher(params.id);

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const { subjectCodes, assignedStudentIds, assignedCourseIds } = extractTeacherAssignmentState(teacher.userRoles || []);

    return NextResponse.json({
      teacherId: params.id,
      assignedSubjectCodes: subjectCodes,
      assignedStudentIds,
      assignedCourseIds,
    });
  } catch (error) {
    console.error('Error fetching teacher assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch teacher assignments' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = teacherAssignmentSchema.parse(await request.json());
    const teacher = await findTeacher(params.id);

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const existingAssignments = extractTeacherAssignmentState(teacher.userRoles || []);
    const nextRequestedSubjectCodes = body.assignedSubjectCodes ?? existingAssignments.subjectCodes;
    const nextAssignedStudentIds = body.assignedStudentIds ?? existingAssignments.assignedStudentIds;
    const nextAssignedCourseIds = body.assignedCourseIds ?? existingAssignments.assignedCourseIds;

    const [students, courses, subjects, teacherRole] = await Promise.all([
      prisma.user.findMany({
        where: {
          id: {
            in: nextAssignedStudentIds,
          },
          userRoles: {
            some: {
              role: {
                name: RoleName.STUDENT,
              },
            },
          },
        },
        select: {
          id: true,
        },
      }),
      prisma.course.findMany({
        where: {
          id: {
            in: nextAssignedCourseIds,
          },
        },
        select: {
          id: true,
          subject: {
            select: {
              code: true,
            },
          },
        },
      }),
      nextRequestedSubjectCodes.length > 0
        ? prisma.subject.findMany({
            where: {
              OR: nextRequestedSubjectCodes.map((subjectCode) => ({
                code: {
                  equals: subjectCode,
                  mode: 'insensitive',
                },
              })),
            },
            select: {
              code: true,
            },
          })
        : Promise.resolve([]),
      ensureTeacherRole(),
    ]);

    if (students.length !== nextAssignedStudentIds.length) {
      return NextResponse.json({ error: 'One or more assigned students are invalid' }, { status: 400 });
    }

    if (courses.length !== nextAssignedCourseIds.length) {
      return NextResponse.json({ error: 'One or more assigned courses are invalid' }, { status: 400 });
    }

    if (subjects.length !== nextRequestedSubjectCodes.length) {
      return NextResponse.json({ error: 'One or more assigned subjects are invalid' }, { status: 400 });
    }

    const subjectCodeMap = new Map(subjects.map((subject) => [normalizeSubjectKey(subject.code), subject.code]));
    const nextAssignedSubjectCodes = Array.from(
      new Set(
        nextRequestedSubjectCodes
          .map((subjectCode) => subjectCodeMap.get(normalizeSubjectKey(subjectCode)) || null)
          .filter((subjectCode): subjectCode is string => Boolean(subjectCode)),
      ),
    );

    for (const course of courses) {
      const courseSubjectCode = course.subject?.code;
      if (!courseSubjectCode) {
        continue;
      }

      if (!nextAssignedSubjectCodes.some((subjectCode) => normalizeSubjectKey(subjectCode) === normalizeSubjectKey(courseSubjectCode))) {
        nextAssignedSubjectCodes.push(courseSubjectCode);
      }
    }

    await prisma.userRole.deleteMany({
      where: {
        userId: params.id,
        roleId: teacherRole.id,
        OR: [
          {
            scope: {
              startsWith: STUDENT_SCOPE_PREFIX,
            },
          },
          {
            scope: {
              startsWith: COURSE_SCOPE_PREFIX,
            },
          },
          {
            scope: {
              startsWith: SUBJECT_SCOPE_PREFIX,
            },
          },
        ],
      },
    });

    const assignmentScopes = [
      ...buildScopedValues(nextAssignedSubjectCodes, SUBJECT_SCOPE_PREFIX),
      ...buildScopedValues(nextAssignedStudentIds, STUDENT_SCOPE_PREFIX),
      ...buildScopedValues(nextAssignedCourseIds, COURSE_SCOPE_PREFIX),
    ];

    if (assignmentScopes.length > 0) {
      await prisma.userRole.createMany({
        data: assignmentScopes.map((scope) => ({
          userId: params.id,
          roleId: teacherRole.id,
          scope,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      teacherId: params.id,
      assignedSubjectCodes: Array.from(new Set(nextAssignedSubjectCodes)),
      assignedStudentIds: Array.from(new Set(nextAssignedStudentIds)),
      assignedCourseIds: Array.from(new Set(nextAssignedCourseIds)),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    console.error('Error updating teacher assignments:', error);
    return NextResponse.json({ error: 'Failed to update teacher assignments' }, { status: 500 });
  }
}