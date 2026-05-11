import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Database Health Check API
 * Tests database connectivity and basic CRUD operations
 * GET /api/v1/health/db-test
 */
export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    database: {
      connected: false,
      operations: {} as Record<string, boolean>,
      errors: [] as string[],
    },
  };

  try {
    // Test 1: Database connection
    await prisma.$connect();
    results.database.connected = true;

    // Test 2: Read operation (count users)
    try {
      const userCount = await prisma.user.count();
      results.database.operations.readUsers = true;
      (results.database as any).userCount = userCount;
    } catch (error: any) {
      results.database.operations.readUsers = false;
      results.database.errors.push(`Read users failed: ${error.message}`);
    }

    // Test 3: Read subjects
    try {
      const subjectCount = await prisma.subject.count();
      results.database.operations.readSubjects = true;
      (results.database as any).subjectCount = subjectCount;
    } catch (error: any) {
      results.database.operations.readSubjects = false;
      results.database.errors.push(`Read subjects failed: ${error.message}`);
    }

    // Test 4: Read wellbeing check-ins
    try {
      const checkinCount = await prisma.wellbeingCheckin.count();
      results.database.operations.readCheckins = true;
      (results.database as any).checkinCount = checkinCount;
    } catch (error: any) {
      results.database.operations.readCheckins = false;
      results.database.errors.push(`Read check-ins failed: ${error.message}`);
    }

    // Test 5: Read roles
    try {
      const roleCount = await prisma.role.count();
      results.database.operations.readRoles = true;
      (results.database as any).roleCount = roleCount;
    } catch (error: any) {
      results.database.operations.readRoles = false;
      results.database.errors.push(`Read roles failed: ${error.message}`);
    }

    // Test 6: Read courses
    try {
      const courseCount = await prisma.course.count();
      results.database.operations.readCourses = true;
      (results.database as any).courseCount = courseCount;
    } catch (error: any) {
      results.database.operations.readCourses = false;
      results.database.errors.push(`Read courses failed: ${error.message}`);
    }

    const allPassed = Object.values(results.database.operations).every((v) => v === true);
    
    return NextResponse.json({
      status: allPassed ? 'healthy' : 'partial',
      message: allPassed 
        ? 'All database operations successful' 
        : 'Some database operations failed',
      ...results,
    });

  } catch (error: any) {
    results.database.errors.push(`Connection failed: ${error.message}`);
    
    return NextResponse.json({
      status: 'unhealthy',
      message: 'Database connection failed',
      ...results,
    }, { status: 503 });
  } finally {
    await prisma.$disconnect();
  }
}
