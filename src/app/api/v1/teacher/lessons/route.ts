/**
 * Teacher Lesson Management API
 *
 * POST /api/v1/teacher/lessons — create a new lesson inside a unit
 * GET  /api/v1/teacher/lessons?courseId= — list all lessons for a course (flat)
 */
import { NextRequest, NextResponse } from 'next/server';
import { RoleName } from '@prisma/client';
import prisma from '@/lib/db';
import { getDemoUserById } from '@/lib/auth/demo-users';

const teacherRoleNames = [RoleName.SUPPORT_TEACHER, RoleName.TUTOR, RoleName.COUNSELOR];

async function resolveTeacher(requestUserId: string | null) {
  if (!requestUserId) return null;
  const dbTeacher = await prisma.user.findFirst({
    where: {
      id: requestUserId,
      userRoles: { some: { role: { name: { in: teacherRoleNames } } } },
    },
    select: { id: true },
  });
  if (dbTeacher) return dbTeacher;
  const demo = getDemoUserById(requestUserId);
  if (demo?.roles?.includes('TEACHER')) return { id: requestUserId };
  return null;
}

// GET — list all lessons for a course
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    if (!courseId) {
      return NextResponse.json({ error: 'courseId required' }, { status: 400 });
    }

    const units = await prisma.unit.findMany({
      where: { courseId },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            titleFA: true,
            sequence: true,
            isPublished: true,
            phase: true,
            estimatedTime: true,
          },
          orderBy: { sequence: 'asc' },
        },
      },
      orderBy: { sequence: 'asc' },
    });

    return NextResponse.json({ units });
  } catch (error) {
    console.error('GET /teacher/lessons error:', error);
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
  }
}

// POST — create a new lesson
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || request.headers.get('x-demo-user-id');
    const teacher = await resolveTeacher(userId);
    if (!teacher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { unitId, courseId, title, titleFA, phase, estimatedTime } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Lesson title is required' }, { status: 400 });
    }

    // Resolve unitId — if no unitId supplied but courseId given, use or create the first unit
    let resolvedUnitId = unitId;
    if (!resolvedUnitId && courseId) {
      let firstUnit = await prisma.unit.findFirst({
        where: { courseId },
        orderBy: { sequence: 'asc' },
      });
      if (!firstUnit) {
        // Create a default unit
        firstUnit = await prisma.unit.create({
          data: {
            courseId,
            sequence: 1,
            title: 'Unit 1',
            titleFA: 'فصل ۱',
            isPublished: false,
          },
        });
      }
      resolvedUnitId = firstUnit.id;
    }

    if (!resolvedUnitId) {
      return NextResponse.json({ error: 'unitId or courseId required' }, { status: 400 });
    }

    // Determine next sequence number
    const lastLesson = await prisma.lesson.findFirst({
      where: { unitId: resolvedUnitId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });
    const nextSequence = (lastLesson?.sequence ?? 0) + 1;

    const lesson = await prisma.lesson.create({
      data: {
        unitId: resolvedUnitId,
        sequence: nextSequence,
        title: title.trim(),
        titleFA: titleFA?.trim() || null,
        phase: phase || 'ENGAGE',
        estimatedTime: estimatedTime ? Number(estimatedTime) : null,
        isPublished: false,
      },
    });

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    console.error('POST /teacher/lessons error:', error);
    return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 });
  }
}
