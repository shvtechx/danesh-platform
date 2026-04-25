import { PrismaClient, RoleName } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding super admin user...');

  // Create or update the SUPER_ADMIN role with all permissions
  const superAdminRole = await prisma.role.upsert({
    where: { name: RoleName.SUPER_ADMIN },
    update: {
      permissions: [
        'users:read', 'users:write', 'users:delete',
        'students:read', 'students:write', 'students:delete',
        'parents:read', 'parents:write', 'parents:delete',
        'staff:read', 'staff:write', 'staff:delete',
        'courses:read', 'courses:write', 'courses:delete',
        'lessons:read', 'lessons:write', 'lessons:delete',
        'assessments:read', 'assessments:write', 'assessments:delete',
        'analytics:read', 'analytics:export',
        'wellbeing:read', 'wellbeing:write',
        'forum:read', 'forum:write', 'forum:moderate',
        'gamification:read', 'gamification:write',
        'billing:read', 'billing:write',
        'settings:read', 'settings:write',
        'admin:full_access',
      ],
    },
    create: {
      name: RoleName.SUPER_ADMIN,
      description: 'Super Administrator with full access to all features',
      permissions: [
        'users:read', 'users:write', 'users:delete',
        'students:read', 'students:write', 'students:delete',
        'parents:read', 'parents:write', 'parents:delete',
        'staff:read', 'staff:write', 'staff:delete',
        'courses:read', 'courses:write', 'courses:delete',
        'lessons:read', 'lessons:write', 'lessons:delete',
        'assessments:read', 'assessments:write', 'assessments:delete',
        'analytics:read', 'analytics:export',
        'wellbeing:read', 'wellbeing:write',
        'forum:read', 'forum:write', 'forum:moderate',
        'gamification:read', 'gamification:write',
        'billing:read', 'billing:write',
        'settings:read', 'settings:write',
        'admin:full_access',
      ],
    },
  });

  console.log('Super Admin role created/updated:', superAdminRole);

  // Hash the password
  const passwordHash = await bcrypt.hash('SuperAdmin@123', 12);

  // Create or update the super admin user
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@danesh.app' },
    update: {
      passwordHash,
    },
    create: {
      email: 'superadmin@danesh.app',
      passwordHash,
      profile: {
        create: {
          firstName: 'Super',
          lastName: 'Admin',
          displayName: 'Super Administrator',
        },
      },
    },
  });

  console.log('Super Admin user created/updated:', superAdmin);

  // Assign the SUPER_ADMIN role to the user
  await prisma.userRole.upsert({
    where: {
      userId_roleId_scope: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
        scope: 'global',
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      roleId: superAdminRole.id,
      scope: 'global',
    },
  });

  console.log('Super Admin role assigned successfully!');
  console.log('');
  console.log('===================================');
  console.log('SUPER ADMIN CREDENTIALS');
  console.log('===================================');
  console.log('Email: superadmin@danesh.app');
  console.log('Password: SuperAdmin@123');
  console.log('===================================');
  console.log('');
  console.log('IMPORTANT: Change this password after first login!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
