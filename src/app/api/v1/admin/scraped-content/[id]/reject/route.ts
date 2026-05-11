import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/db';

/**
 * POST /api/v1/admin/scraped-content/[id]/reject
 * Reject scraped content with reason
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as any)?.id || request.headers.get('x-demo-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reason } = body;

    const content = await prisma.scrapedContent.update({
      where: { id: params.id },
      data: {
        reviewStatus: 'REJECTED',
        reviewedBy: userId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    return NextResponse.json({
      success: true,
      content,
      message: 'Content rejected',
    });
  } catch (error: any) {
    console.error('Error rejecting content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reject content' },
      { status: 500 }
    );
  }
}
