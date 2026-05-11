/**
 * Seed script: creates TEST_TEACHER, TEST_STUDENT, and TEST_ADMIN users.
 * Run with: npx ts-node prisma/seed-test-users.ts
 *
 * Credentials printed to console at the end.
 */

import { PrismaClient, RoleName, UserStatus, Language } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TEST_PASSWORD = 'TestDanesh2026!';

const TEST_USERS = [
  {
    key: 'TEST_TEACHER',
    firstName: 'Test',
    lastName: 'Teacher',
    email: 'test.teacher@danesh.test',
    roleName: RoleName.SUPPORT_TEACHER,
    rolePermissions: [
      'courses:read', 'courses:write',
      'lessons:read', 'lessons:write',
      'students:read', 'analytics:read',
    ],
    roleDescription: 'Support teacher role for instructional staff',
  },
  {
    key: 'TEST_STUDENT',
    firstName: 'Test',
    lastName: 'Student',
    email: 'test.student@danesh.test',
    roleName: RoleName.STUDENT,
    rolePermissions: ['courses:read', 'lessons:read', 'assessments:read'],
    roleDescription: 'Student learner role',
  },
  {
    key: 'TEST_ADMIN',
    firstName: 'Test',
    lastName: 'Admin',
    email: 'test.admin@danesh.test',
    roleName: RoleName.ADMIN,
    rolePermissions: [
      'users:create', 'users:read', 'users:update', 'users:delete',
      'roles:manage',
      'subjects:create', 'subjects:read', 'subjects:update', 'subjects:delete',
      'courses:create', 'courses:read', 'courses:update', 'courses:delete',
      'analytics:read', 'analytics:export',
      'profile:read', 'profile:update',
    ],
    roleDescription: 'Platform administrator',
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);

  console.log('\n🔧 Seeding test users...\n');

  for (const config of TEST_USERS) {
    // Upsert the role
    const role = await prisma.role.upsert({
      where: { name: config.roleName },
      update: {
        permissions: config.rolePermissions,
        description: config.roleDescription,
      },
      create: {
        name: config.roleName,
        permissions: config.rolePermissions,
        description: config.roleDescription,
      },
    });

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: config.email },
      include: { profile: true, userRoles: true },
    });

    if (existing) {
      // Update password and status
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          status: UserStatus.ACTIVE,
        },
      });

      // Ensure role exists
      const hasRole = existing.userRoles.some(ur => ur.roleId === role.id && !ur.scope);
      if (!hasRole) {
        await prisma.userRole.create({
          data: { userId: existing.id, roleId: role.id },
        });
      }

      console.log(`✅ ${config.key} already exists — password reset.`);
      console.log(`   Email: ${config.email}`);
    } else {
      // Create fresh user
      const user = await prisma.user.create({
        data: {
          email: config.email,
          passwordHash,
          status: UserStatus.ACTIVE,
          preferredLanguage: Language.EN,
          profile: {
            create: {
              firstName: config.firstName,
              lastName: config.lastName,
              displayName: `${config.firstName} ${config.lastName}`,
            },
          },
          userRoles: {
            create: { roleId: role.id },
          },
        },
      });

      console.log(`✅ Created ${config.key} (id: ${user.id})`);
      console.log(`   Email: ${config.email}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Login credentials for all test users:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const u of TEST_USERS) {
    console.log(`  ${u.key.padEnd(14)} ${u.email}  /  ${TEST_PASSWORD}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
