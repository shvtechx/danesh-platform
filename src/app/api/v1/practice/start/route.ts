import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { startPracticeSession } from '@/lib/assessment/adaptive-engine';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as any)?.id || request.headers.get('x-demo-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { skillId, sessionType } = body;

    if (!skillId) {
      return NextResponse.json({ error: 'skillId is required' }, { status: 400 });
    }

    const practiceSession = await startPracticeSession(
      userId,
      skillId,
      sessionType || 'PRACTICE'
    );

    return NextResponse.json(practiceSession);
  } catch (error: any) {
    console.error('Error starting practice session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start practice session' },
      { status: 500 }
    );
  }
}
