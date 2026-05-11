import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveRequestUserId } from '@/lib/auth/request-user';

/**
 * GET /api/v1/lessons/:id/completion
 * Get student's completion record for this lesson
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = resolveRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const completion = await prisma.lessonCompletion.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId: params.id
        }
      }
    });

    if (!completion) {
      return NextResponse.json(
        { error: 'Completion not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ completion });
  } catch (error) {
    console.error('Error fetching completion:', error);
    return NextResponse.json(
      { error: 'Failed to fetch completion' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/lessons/:id/completion
 * Create a new completion record (start lesson)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = resolveRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.id }
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Create or get existing completion
    const completion = await prisma.lessonCompletion.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId: params.id
        }
      },
      update: {},
      create: {
        userId,
        lessonId: params.id
      }
    });

    return NextResponse.json({ completion }, { status: 201 });
  } catch (error) {
    console.error('Error creating completion:', error);
    return NextResponse.json(
      { error: 'Failed to create completion' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/lessons/:id/completion
 * Update completion progress
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = resolveRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { timeSpent, completedAt, masteryScore } = body;

    const lesson = await prisma.lesson.findUnique({
      where: { id: params.id }
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    const completion = await prisma.lessonCompletion.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId: params.id
        }
      },
      update: {
        ...(timeSpent !== undefined && { timeSpent }),
        ...(completedAt && { completedAt: new Date(completedAt) }),
        ...(masteryScore !== undefined && { masteryScore })
      },
      create: {
        userId,
        lessonId: params.id,
        ...(timeSpent !== undefined && { timeSpent }),
        ...(completedAt && { completedAt: new Date(completedAt) }),
        ...(masteryScore !== undefined && { masteryScore })
      }
    });

    return NextResponse.json({ completion });
  } catch (error) {
    console.error('Error updating completion:', error);
    return NextResponse.json(
      { error: 'Failed to update completion' },
      { status: 500 }
    );
  }
}
