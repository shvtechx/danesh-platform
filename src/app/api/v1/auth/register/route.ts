import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { RoleName } from '@prisma/client';
import { prisma } from '@/lib/db';

const nullableOptionalString = () =>
  z.preprocess((value) => (value === null || value === '' ? undefined : value), z.string().optional());

const nullableOptionalEnum = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess((value) => (value === null || value === '' ? undefined : value), z.enum(values).optional());

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: nullableOptionalString(),
  userType: z.enum(['student', 'parent', 'teacher']),
  stream: nullableOptionalEnum(['iranian', 'international']),
  gradeBand: nullableOptionalEnum(['early-years', 'primary', 'middle', 'secondary']),
  grade: nullableOptionalString(),
  locale: nullableOptionalEnum(['en', 'fa']),
});

function mapUserTypeToRole(userType: 'student' | 'parent' | 'teacher') {
  if (userType === 'parent') return RoleName.PARENT;
  if (userType === 'teacher') return RoleName.SUPPORT_TEACHER;
  return RoleName.STUDENT;
}

function mapRoleNameToAppRoles(roleName: RoleName) {
  if (roleName === RoleName.PARENT) return ['PARENT'];
  if (roleName === RoleName.SUPPORT_TEACHER) return ['TEACHER'];
  return ['STUDENT'];
}

function getDashboardPath(roleName: RoleName) {
  if (roleName === RoleName.PARENT) return 'parent';
  if (roleName === RoleName.SUPPORT_TEACHER) return 'teacher';
  return 'dashboard';
}

async function ensureRole(roleName: RoleName) {
  return prisma.role.upsert({
    where: { name: roleName },
    update: {},
    create: {
      name: roleName,
      description: `${roleName} role`,
      permissions: roleName === RoleName.PARENT ? ['profile:read'] : ['courses:read', 'profile:read'],
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const languageMap: Record<string, 'EN' | 'FA'> = {
      en: 'EN',
      fa: 'FA',
    };

    const gradeBandMap: Record<string, 'EARLY_YEARS' | 'PRIMARY' | 'MIDDLE' | 'SECONDARY'> = {
      'early-years': 'EARLY_YEARS',
      primary: 'PRIMARY',
      middle: 'MIDDLE',
      secondary: 'SECONDARY',
    };

    const primaryRole = mapUserTypeToRole(data.userType);
    const ensuredRole = await ensureRole(primaryRole);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash: hashedPassword,
        preferredLanguage: languageMap[data.locale || 'en'],
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            displayName: `${data.firstName} ${data.lastName}`,
            gradeBand: data.gradeBand ? gradeBandMap[data.gradeBand] : undefined,
          },
        },
        userRoles: {
          create: {
            roleId: ensuredRole.id,
            scope: 'global',
          },
        },
      },
      select: {
        id: true,
        email: true,
        phone: true,
        preferredLanguage: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true,
            gradeBand: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    const roles = mapRoleNameToAppRoles(primaryRole);

    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user: {
          ...user,
          roles,
          dashboardPath: getDashboardPath(primaryRole),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
