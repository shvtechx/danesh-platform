import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { resolveRequestUserId } from '@/lib/auth/request-user';

export async function POST(request: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    const userId = resolveRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'User is required' }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, response } = body as { questionId?: string; response?: unknown };

    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 });
    }

    const attempt = await prisma.studentAttempt.findUnique({
      where: { id: params.attemptId },
      select: { id: true, userId: true, status: true },
    });

    if (!attempt || attempt.userId !== userId) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Attempt can no longer be updated' }, { status: 400 });
    }

    const answer = await prisma.attemptAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: params.attemptId,
          questionId,
        },
      },
      create: {
        attemptId: params.attemptId,
        questionId,
        response: (response ?? null) as any,
      },
      update: {
        response: (response ?? null) as any,
        answeredAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, answer });
  } catch (error) {
    console.error('Error saving attempt answer:', error);
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
  }
}
