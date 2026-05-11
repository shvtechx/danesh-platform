import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getRecommendedSkills } from '@/lib/assessment/adaptive-engine';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as any)?.id || request.headers.get('x-demo-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId') || undefined;

    const recommendations = await getRecommendedSkills(
      userId,
      subjectId
    );

    return NextResponse.json(recommendations);
  } catch (error: any) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}
