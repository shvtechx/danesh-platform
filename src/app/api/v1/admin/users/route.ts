import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { RoleName } from '@prisma/client';
import { z } from 'zod';
import { listDemoUsers, removeDemoUser } from '@/lib/auth/demo-users';
import { prisma } from '@/lib/db';

function mapRoleNamesToAppRoles(roleNames: string[] = []) {
  if (roleNames.includes('SUPER_ADMIN')) return ['SUPER_ADMIN'];
  if (roleNames.includes('ADMIN') || roleNames.includes('CURRICULUM_DESIGNER') || roleNames.includes('REVIEWER')) return ['SUBJECT_ADMIN'];
  if (roleNames.includes('SUPPORT_TEACHER') || roleNames.includes('TUTOR') || roleNames.includes('COUNSELOR')) return ['TEACHER'];
  if (roleNames.includes('PARENT')) return ['PARENT'];
  return ['STUDENT'];
}

function getPrimaryDbRoleForAppRole(role: string) {
  if (role === 'SUPER_ADMIN') return RoleName.SUPER_ADMIN;
  if (role === 'SUBJECT_ADMIN') return RoleName.ADMIN;
  if (role === 'TEACHER') return RoleName.SUPPORT_TEACHER;
  if (role === 'PARENT') return RoleName.PARENT;
  return RoleName.STUDENT;
}

function getRoleSeedData(role: RoleName) {
  switch (role) {
    case RoleName.SUPER_ADMIN:
      return {
        description: 'Super Administrator with full access',
        permissions: ['admin:full_access', 'users:read', 'users:write', 'users:delete'],
      };
    case RoleName.ADMIN:
      return {
        description: 'Subject administrator role',
        permissions: ['courses:read', 'courses:write', 'subjects:read', 'subjects:write', 'users:read'],
      };
    case RoleName.SUPPORT_TEACHER:
      return {
        description: 'Support teacher role for instructional staff',
        permissions: ['courses:read', 'courses:write', 'lessons:read', 'lessons:write', 'students:read', 'analytics:read'],
      };
    case RoleName.PARENT:
      return {
        description: 'Parent role',
        permissions: ['profile:read'],
      };
    default:
      return {
        description: 'Student role',
        permissions: ['courses:read', 'profile:read'],
      };
  }
}

async function ensureRole(roleName: RoleName) {
  const seed = getRoleSeedData(roleName);
  return prisma.role.upsert({
    where: { name: roleName },
    update: seed,
    create: {
      name: roleName,
      ...seed,
    },
  });
}

function generateTemporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  return Array.from({ length: 12 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

const createUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).optional().or(z.literal('')),
  profile: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    displayName: z.string().min(1),
  }),
  roles: z.array(z.enum(['SUPER_ADMIN', 'SUBJECT_ADMIN', 'TEACHER', 'STUDENT'])).min(1),
  managedSubjects: z.array(z.string()).optional(),
  assignedSubjects: z.array(z.string()).optional(),
  assignedStudents: z.array(z.string()).optional(),
  dashboardPath: z.enum(['admin', 'teacher', 'dashboard']),
});

export async function GET() {
  try {
    const dbUsers = await prisma.user.findMany({
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
    });

    const mappedDbUsers = dbUsers.map((user) => {
      const roles = mapRoleNamesToAppRoles(user.userRoles.map((userRole) => userRole.role.name));

      return {
        id: user.id,
        email: user.email,
        status: user.status,
        profile: {
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          displayName: user.profile?.displayName || user.email || 'User',
        },
        roles,
        permissions: [],
        dashboardPath: roles.includes('SUPER_ADMIN') || roles.includes('SUBJECT_ADMIN')
          ? 'admin'
          : roles.includes('TEACHER')
            ? 'teacher'
            : 'dashboard',
      };
    });

    const users = [...mappedDbUsers, ...listDemoUsers()].filter(
      (user, index, allUsers) => allUsers.findIndex((candidate) => candidate.id === user.id || candidate.email === user.email) === index,
    );

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Failed to load users:', error);
    return NextResponse.json({ users: listDemoUsers() });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createUserSchema.parse(body);

    const existingUser = listDemoUsers().find(
      (user) => user.email.toLowerCase() === data.email.toLowerCase()
    );

    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    const primaryAppRole = data.roles[0];
    const dbRole = await ensureRole(getPrimaryDbRoleForAppRole(primaryAppRole));
    const temporaryPassword = data.password?.trim() ? data.password.trim() : generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        profile: {
          create: {
            firstName: data.profile.firstName,
            lastName: data.profile.lastName,
            displayName: data.profile.displayName,
          },
        },
        userRoles: {
          create: {
            roleId: dbRole.id,
            scope: 'global',
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

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        profile: {
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          displayName: user.profile?.displayName || user.email || 'User',
        },
        roles: mapRoleNamesToAppRoles(user.userRoles.map((userRole) => userRole.role.name)),
        permissions: [],
        dashboardPath: data.dashboardPath,
      },
      temporaryPassword,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'User id is required' }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (dbUser) {
    if (dbUser.userRoles.some((userRole) => userRole.role.name === RoleName.SUPER_ADMIN)) {
      return NextResponse.json({ error: 'Super admin accounts cannot be deleted here' }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.postVote.deleteMany({ where: { userId: id } }),
      prisma.forumPost.deleteMany({ where: { authorId: id } }),
      prisma.forumThread.deleteMany({ where: { authorId: id } }),
      prisma.wellbeingCheckin.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);
    return NextResponse.json({ success: true });
  }

  removeDemoUser(id);
  return NextResponse.json({ success: true });
}
