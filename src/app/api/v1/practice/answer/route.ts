import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { submitAnswer } from '@/lib/assessment/adaptive-engine';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as any)?.id || request.headers.get('x-demo-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, questionId, answer, timeSpentSeconds, hintsUsed } = body;

    if (!sessionId || !questionId || answer === undefined) {
      return NextResponse.json(
        { error: 'sessionId, questionId, and answer are required' },
        { status: 400 }
      );
    }

    const result = await submitAnswer(
      sessionId,
      questionId,
      answer,
      timeSpentSeconds || 0,
      hintsUsed || 0
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit answer' },
      { status: 500 }
    );
  }
}
