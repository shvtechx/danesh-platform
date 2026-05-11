import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestUserId } from '@/lib/auth/request-user';
import {
  createForumReply,
  deleteForumThread,
  getForumThreadDetail,
  incrementForumThreadViews,
} from '@/lib/forum/service';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const thread = await getForumThreadDetail(params.id);

    if (!thread) {
      return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 });
    }

    await incrementForumThreadViews(params.id);

    return NextResponse.json({
      success: true,
      data: {
        ...thread,
        views: thread.views + 1,
      },
    });
  } catch (error) {
    console.error('Error loading forum thread:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load thread',
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = resolveRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      content?: string;
      parentId?: string | null;
      locale?: string;
    };

    if (!body.content?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reply content is required',
        },
        { status: 400 },
      );
    }

    const reply = await createForumReply({
      threadId: params.id,
      userId,
      content: body.content.trim(),
      parentId: body.parentId,
      locale: body.locale,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: reply.id,
      },
    });
  } catch (error) {
    console.error('Error creating forum reply:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create reply',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = resolveRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await deleteForumThread(params.id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting forum thread:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete thread',
      },
      { status: 500 },
    );
  }
}
