import { Language, RoleName, UserStatus } from '@prisma/client';
import prisma from '@/lib/db';
import { getDemoUserById } from '@/lib/auth/demo-users';

function mapDemoRoleToRoleName(role?: string) {
  switch (role) {
    case 'SUPER_ADMIN':
      return RoleName.SUPER_ADMIN;
    case 'SUBJECT_ADMIN':
      return RoleName.ADMIN;
    case 'TEACHER':
      return RoleName.SUPPORT_TEACHER;
    case 'PARENT':
      return RoleName.PARENT;
    default:
      return RoleName.STUDENT;
  }
}

export async function ensureShadowUser(userId: string) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          displayName: true,
        },
      },
    },
  });

  const demoUser = getDemoUserById(userId);

  if (existing) {
    if (demoUser) {
      const roleName = mapDemoRoleToRoleName(demoUser.roles?.[0]);
      const role = await prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: {
          name: roleName,
          permissions: [],
          description: 'Auto-provisioned role for demo shadow users',
        },
      });

      const existingUserRole = await prisma.userRole.findFirst({
        where: {
          userId,
          roleId: role.id,
          scope: null,
        },
        select: { id: true },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          email: demoUser.email,
          ...(existingUserRole
            ? {}
            : {
                userRoles: {
                  create: {
                    roleId: role.id,
                  },
                },
              }),
        },
      });
    }

    if (demoUser && (!existing.profile?.firstName || !existing.profile?.lastName || !existing.profile?.displayName)) {
      await prisma.userProfile.upsert({
        where: { userId },
        update: {
          firstName: demoUser.profile.firstName,
          lastName: demoUser.profile.lastName,
          displayName: demoUser.profile.displayName,
        },
        create: {
          userId,
          firstName: demoUser.profile.firstName,
          lastName: demoUser.profile.lastName,
          displayName: demoUser.profile.displayName,
        },
      });
    }

    return { id: existing.id };
  }

  if (!demoUser) {
    return null;
  }

  const roleName = mapDemoRoleToRoleName(demoUser.roles?.[0]);
  const role = await prisma.role.upsert({
    where: { name: roleName },
    update: {},
    create: {
      name: roleName,
      permissions: [],
      description: 'Auto-provisioned role for demo shadow users',
    },
  });

  return prisma.user.create({
    data: {
      id: demoUser.id,
      email: demoUser.email,
      status: UserStatus.ACTIVE,
      preferredLanguage: Language.EN,
      profile: {
        create: {
          firstName: demoUser.profile.firstName,
          lastName: demoUser.profile.lastName,
          displayName: demoUser.profile.displayName,
        },
      },
      userRoles: {
        create: {
          roleId: role.id,
        },
      },
    },
    select: { id: true },
  });
}
