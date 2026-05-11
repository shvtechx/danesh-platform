import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Language, RoleName, UserStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { extractTeacherAssignmentState, buildScopedValues, SUBJECT_SCOPE_PREFIX } from '../../../../../lib/admin/teacher-assignments';
import { getDepartmentForSubject, getLocalizedDepartmentName, getLocalizedSubjectName, normalizeSubjectKey } from '@/lib/admin/teacher-metadata';

const teacherRoleNames = [RoleName.SUPPORT_TEACHER, RoleName.TUTOR, RoleName.COUNSELOR];

const teacherPayloadSchema = z.object({
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

function generateTemporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  return Array.from({ length: 12 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

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

export async function GET(request: NextRequest) {
  try {
    const locale = new URL(request.url).searchParams.get('locale') || 'en';

    const [teachers, subjectDirectory] = await Promise.all([
      prisma.user.findMany({
        where: {
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
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.subject.findMany({
        select: {
          code: true,
          name: true,
          nameFA: true,
        },
      }).then(buildSubjectDirectory),
    ]);

    return NextResponse.json({
      teachers: teachers.map((teacher) => serializeTeacher(teacher, locale, subjectDirectory)),
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = teacherPayloadSchema.parse(await request.json());
    const locale = body.locale || 'en';

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (existingUser) {
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

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    const canonicalSubjectCodes = Array.from(new Set(resolvedSubjects.map((subject) => subject.code)));
    const subjectScopes = buildScopedValues(canonicalSubjectCodes, SUBJECT_SCOPE_PREFIX).map((scope: string) => ({
      roleId: teacherRole.id,
      scope,
    }));

    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        phone: body.phone?.trim() || null,
        passwordHash,
        preferredLanguage: locale === 'fa' ? Language.FA : Language.EN,
        status: mapStatus(body.status),
        profile: {
          create: {
            firstName: body.firstName.trim(),
            lastName: body.lastName.trim(),
            displayName: `${body.firstName} ${body.lastName}`.trim(),
            bio: body.bio?.trim() || null,
          },
        },
        userRoles: {
          create: [
            {
              roleId: teacherRole.id,
              scope: 'global',
            },
            ...subjectScopes,
          ],
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

    return NextResponse.json({ teacher: serializeTeacher(user, locale, subjectDirectory), temporaryPassword }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    console.error('Error creating teacher:', error);
    return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 });
  }
}
