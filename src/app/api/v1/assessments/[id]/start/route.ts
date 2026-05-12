import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { resolveRequestUserId } from '@/lib/auth/request-user';
import { ensureShadowUser } from '@/lib/auth/demo-user-provisioning';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = resolveRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'User is required' }, { status: 401 });
    }

    await ensureShadowUser(userId);

    const assessment = await prisma.assessment.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        isPublished: true,
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const existingAttempt = await prisma.studentAttempt.findFirst({
      where: {
        userId,
        assessmentId: params.id,
        status: 'IN_PROGRESS',
      },
      include: {
        answers: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (existingAttempt) {
      return NextResponse.json({
        attemptId: existingAttempt.id,
        status: existingAttempt.status,
        savedAnswers: existingAttempt.answers,
      });
    }

    const attempt = await prisma.studentAttempt.create({
      data: {
        userId,
        assessmentId: params.id,
        status: 'IN_PROGRESS',
      },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      status: attempt.status,
      savedAnswers: [],
    }, { status: 201 });
  } catch (error) {
    console.error('Error starting assessment attempt:', error);
    return NextResponse.json({ error: 'Failed to start assessment attempt' }, { status: 500 });
  }
}
