import { NextRequest, NextResponse } from 'next/server';
import { Language, RoleName, UserStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { buildScopedValues, extractTeacherAssignmentState, SUBJECT_SCOPE_PREFIX } from '../../../../../../lib/admin/teacher-assignments';
import { getDepartmentForSubject, getLocalizedDepartmentName, getLocalizedSubjectName, normalizeSubjectKey } from '@/lib/admin/teacher-metadata';

const teacherRoleNames = [RoleName.SUPPORT_TEACHER, RoleName.TUTOR, RoleName.COUNSELOR];

const teacherUpdateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  subjects: z.array(z.string()).default([]),
  bio: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'pending']).default('active'),
  locale: z.enum(['en', 'fa']).optional(),
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

function mapStatus(status: string) {
  if (status === 'inactive') {
    return UserStatus.INACTIVE;
  }
  if (status === 'pending') {
    return UserStatus.PENDING_VERIFICATION;
  }
  return UserStatus.ACTIVE;
}

function localizeSubjectLabel(subject: { name: string; nameFA: string | null } | null | undefined, locale: string, fallbackCode?: string | null) {
  if (subject) {
    return locale === 'fa' ? (subject.nameFA || subject.name) : subject.name;
  }

  return getLocalizedSubjectName(fallbackCode, locale);
}

function buildSubjectDirectory(subjects: Array<{ code: string; name: string; nameFA: string | null }>) {
  return new Map(
    subjects.map((subject) => [normalizeSubjectKey(subject.code), subject]),
  );
}

function serializeTeacher(user: any, locale: string, subjectDirectory: Map<string, { code?: string; name: string; nameFA: string | null }>) {
  const { subjectCodes, assignedStudentIds, assignedCourseIds } = extractTeacherAssignmentState(user.userRoles || []);

  const primarySubjectCode = subjectCodes[0] || null;
  const primarySubject = primarySubjectCode ? (subjectDirectory.get(normalizeSubjectKey(primarySubjectCode)) || null) : null;
  const departmentId = getDepartmentForSubject(primarySubject?.code || primarySubject?.name || primarySubjectCode);
  const displayName = user.profile?.displayName || [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ') || user.email || 'Teacher';
  const subjectLabels = subjectCodes.map((subjectCode: string) => {
    const subject = subjectDirectory.get(normalizeSubjectKey(subjectCode));
    return localizeSubjectLabel(subject, locale, subjectCode);
  });

  return {
    id: user.id,
    firstName: user.profile?.firstName || '',
    lastName: user.profile?.lastName || '',
    name: displayName,
    email: user.email || '',
    phone: user.phone || '',
    subject: localizeSubjectLabel(primarySubject, locale, primarySubjectCode),
    department: departmentId || null,
    departmentLabel: getLocalizedDepartmentName(departmentId, locale),
    subjects: subjectCodes,
    subjectLabels,
    assignedStudentIds,
    assignedCourseIds,
    students: assignedStudentIds.length,
    courses: assignedCourseIds.length,
    status: user.status === UserStatus.INACTIVE ? 'inactive' : user.status === UserStatus.PENDING_VERIFICATION ? 'pending' : 'active',
    joinDate: user.createdAt,
    avatar: displayName.charAt(0).toUpperCase(),
    bio: user.profile?.bio || '',
  };
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
      profile: true,
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const locale = new URL(request.url).searchParams.get('locale') || 'en';
    const [teacher, subjectDirectory] = await Promise.all([
      findTeacher(params.id),
      prisma.subject.findMany({
        select: {
          code: true,
          name: true,
          nameFA: true,
        },
      }).then(buildSubjectDirectory),
    ]);

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    return NextResponse.json({ teacher: serializeTeacher(teacher, locale, subjectDirectory) });
  } catch (error) {
    console.error('Error fetching teacher:', error);
    return NextResponse.json({ error: 'Failed to fetch teacher' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = teacherUpdateSchema.parse(await request.json());
    const locale = body.locale || 'en';
    const existingTeacher = await findTeacher(params.id);

    if (!existingTeacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const emailOwner = await prisma.user.findFirst({
      where: {
        email: body.email.toLowerCase(),
        NOT: {
          id: params.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (emailOwner) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    const [teacherRole, resolvedSubjects] = await Promise.all([
      ensureTeacherRole(),
      body.subjects.length > 0
        ? prisma.subject.findMany({
            where: {
              OR: body.subjects.map((subjectCode) => ({
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
    ]);

    if (resolvedSubjects.length !== body.subjects.length) {
      return NextResponse.json({ error: 'One or more selected subjects are invalid' }, { status: 400 });
    }

    const canonicalSubjectCodes = Array.from(new Set(resolvedSubjects.map((subject) => subject.code)));
    const subjectScopes = buildScopedValues(canonicalSubjectCodes, SUBJECT_SCOPE_PREFIX);

    await prisma.userRole.deleteMany({
      where: {
        userId: params.id,
        roleId: teacherRole.id,
        scope: {
          startsWith: SUBJECT_SCOPE_PREFIX,
        },
      },
    });

    if (subjectScopes.length > 0) {
      await prisma.userRole.createMany({
        data: subjectScopes.map((scope: string) => ({
          userId: params.id,
          roleId: teacherRole.id,
          scope,
        })),
        skipDuplicates: true,
      });
    }

    const updatedTeacher = await prisma.user.update({
      where: { id: params.id },
      data: {
        email: body.email.toLowerCase(),
        phone: body.phone?.trim() || null,
        preferredLanguage: locale === 'fa' ? Language.FA : Language.EN,
        status: mapStatus(body.status),
        profile: {
          upsert: {
            create: {
              firstName: body.firstName.trim(),
              lastName: body.lastName.trim(),
              displayName: `${body.firstName} ${body.lastName}`.trim(),
              bio: body.bio?.trim() || null,
            },
            update: {
              firstName: body.firstName.trim(),
              lastName: body.lastName.trim(),
              displayName: `${body.firstName} ${body.lastName}`.trim(),
              bio: body.bio?.trim() || null,
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
    });

    const subjectDirectory = buildSubjectDirectory(
      await prisma.subject.findMany({
        select: {
          code: true,
          name: true,
          nameFA: true,
        },
      }),
    );

    return NextResponse.json({ teacher: serializeTeacher(updatedTeacher, locale, subjectDirectory) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    console.error('Error updating teacher:', error);
    return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const teacher = await findTeacher(params.id);

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    await prisma.user.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json({ error: 'Failed to delete teacher' }, { status: 500 });
  }
}
