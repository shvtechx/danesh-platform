import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { endPracticeSession } from '@/lib/assessment/adaptive-engine';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as any)?.id || request.headers.get('x-demo-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, exitReason } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const summary = await endPracticeSession(
      sessionId,
      exitReason || 'COMPLETED'
    );

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('Error ending practice session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to end practice session' },
      { status: 500 }
    );
  }
}
