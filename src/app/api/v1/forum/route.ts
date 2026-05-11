import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestUserId } from '@/lib/auth/request-user';
import { createForumThread, getForumOverview } from '@/lib/forum/service';

export async function GET(request: NextRequest) {
  try {
    const userId = resolveRequestUserId(request);
    const overview = await getForumOverview(userId);

    return NextResponse.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    console.error('Error loading forum overview:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load forum overview',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = resolveRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      categoryId?: string;
      title?: string;
      content?: string;
      locale?: string;
    };

    if (!body.categoryId || !body.title?.trim() || !body.content?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category, title, and content are required',
        },
        { status: 400 },
      );
    }

    const thread = await createForumThread({
      userId,
      categoryId: body.categoryId,
      title: body.title.trim(),
      content: body.content.trim(),
      locale: body.locale,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: thread.id,
      },
    });
  } catch (error) {
    console.error('Error creating forum thread:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create thread',
      },
      { status: 500 },
    );
  }
}
