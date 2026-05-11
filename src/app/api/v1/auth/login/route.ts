import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authenticateDemoUser } from '@/lib/auth/demo-users';
import { getLocalizedSubjectName } from '@/lib/admin/teacher-metadata';
import { prisma } from '@/lib/db';

function mapRoleNamesToAppRoles(roleNames: string[] = []) {
  if (roleNames.includes('SUPER_ADMIN')) return ['SUPER_ADMIN'];
  if (roleNames.includes('ADMIN') || roleNames.includes('CURRICULUM_DESIGNER') || roleNames.includes('REVIEWER')) return ['SUBJECT_ADMIN'];
  if (roleNames.includes('SUPPORT_TEACHER') || roleNames.includes('TUTOR') || roleNames.includes('COUNSELOR')) return ['TEACHER'];
  if (roleNames.includes('PARENT')) return ['PARENT'];
  return ['STUDENT'];
}

function getAssignedSubjectCodes(userRoles: Array<{ scope?: string | null }> = []) {
  return Array.from(
    new Set(
      userRoles
        .map((userRole) => userRole.scope)
        .filter((scope): scope is string => Boolean(scope && scope.startsWith('subject:')))
        .map((scope) => scope.replace('subject:', '').trim().toLowerCase()),
    ),
  );
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const matchedUser = authenticateDemoUser(data.email, data.password);

    if (matchedUser) {
      return NextResponse.json({
        message: 'Login successful',
        user: matchedUser,
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: {
        profile: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (dbUser?.passwordHash) {
      const isPasswordValid = await bcrypt.compare(data.password, dbUser.passwordHash);

      if (isPasswordValid) {
        const mappedRoles = mapRoleNamesToAppRoles(dbUser.userRoles.map((userRole) => userRole.role.name));
        const assignedSubjectCodes = getAssignedSubjectCodes(dbUser.userRoles);

        return NextResponse.json({
          message: 'Login successful',
          user: {
            id: dbUser.id,
            email: dbUser.email,
            status: dbUser.status,
            profile: {
              firstName: dbUser.profile?.firstName || '',
              lastName: dbUser.profile?.lastName || '',
              displayName: dbUser.profile?.displayName || dbUser.email,
            },
            roles: mappedRoles,
            assignedSubjectCodes,
            assignedSubjects: assignedSubjectCodes.map((subjectCode) => getLocalizedSubjectName(subjectCode, 'en')),
            permissions: [],
            dashboardPath: mappedRoles.includes('SUPER_ADMIN') || mappedRoles.includes('SUBJECT_ADMIN')
              ? 'admin'
              : mappedRoles.includes('TEACHER')
                ? 'teacher'
                : 'dashboard',
          },
        });
      }
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);

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
