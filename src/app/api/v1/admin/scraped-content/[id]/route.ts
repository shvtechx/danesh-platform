import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/db';

/**
 * GET /api/v1/admin/scraped-content/[id]
 * Get single scraped content item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const content = await prisma.scrapedContent.findUnique({
      where: { id: params.id },
      include: {
        source: true,
        reviewer: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json(content);
  } catch (error: any) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/admin/scraped-content/[id]
 * Update scraped content (for editing before approval)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      questionText,
      questionTextFA,
      questionType,
      options,
      explanation,
      explanationFA,
      hints,
      gradeLevel,
      subjectCode,
      skillCode,
      difficultyEstimate,
    } = body;

    const content = await prisma.scrapedContent.update({
      where: { id: params.id },
      data: {
        questionText,
        questionTextFA,
        questionType,
        options,
        explanation,
        explanationFA,
        hints,
        gradeLevel,
        subjectCode,
        skillCode,
        difficultyEstimate,
        reviewStatus: 'NEEDS_EDIT', // Mark as edited
      },
      include: {
        source: true,
      },
    });

    return NextResponse.json(content);
  } catch (error: any) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update content' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/admin/scraped-content/[id]
 * Delete scraped content item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.scrapedContent.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete content' },
      { status: 500 }
    );
  }
}
