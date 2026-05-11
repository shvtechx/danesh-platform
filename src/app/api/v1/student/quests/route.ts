import { NextRequest, NextResponse } from 'next/server';
import { getUserQuests, startQuest } from '@/lib/gamification/quest-system';
import { resolveRequestUserId } from '@/lib/auth/request-user';

/**
 * GET /api/v1/student/quests
 * Get all quests for the current student
 */
export async function GET(request: NextRequest) {
  try {
    const userId = resolveRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const quests = await getUserQuests(userId);

    return NextResponse.json({
      success: true,
      data: quests,
    });
  } catch (error) {
    console.error('Error fetching quests:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch quests',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/student/quests
 * Start a new quest
 */
export async function POST(request: NextRequest) {
  try {
    const userId = resolveRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { questId } = body;

    if (!questId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quest ID is required',
        },
        { status: 400 }
      );
    }

    const result = await startQuest(userId, questId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Quest started successfully',
    });
  } catch (error) {
    console.error('Error starting quest:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start quest',
      },
      { status: 500 }
    );
  }
}
