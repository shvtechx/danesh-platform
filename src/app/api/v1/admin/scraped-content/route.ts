import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { resolveRequestUserId } from '@/lib/auth/request-user';

const prismaClient = prisma as any;

/**
 * GET /api/v1/admin/scraped-content
 * List scraped content with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const requestUserId = resolveRequestUserId(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') as any;
    const contentType = searchParams.get('contentType') as any;
    const sourceId = searchParams.get('sourceId') || undefined;
    const subjectCode = searchParams.get('subjectCode') || undefined;
    const gradeLevel = searchParams.get('gradeLevel')
      ? parseInt(searchParams.get('gradeLevel')!)
      : undefined;

    // Build where clause
    const where: any = {};
    if (status) where.reviewStatus = status;
    if (contentType) where.contentType = contentType;
    if (sourceId) where.sourceId = sourceId;
    if (subjectCode) where.subjectCode = subjectCode;
    if (gradeLevel) where.gradeLevel = gradeLevel;

    // Fetch paginated content
    const [items, total] = await Promise.all([
      prismaClient.scrapedContent.findMany({
        where,
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
        orderBy: { scrapedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prismaClient.scrapedContent.count({ where }),
    ]);

    // Get statistics
    const stats = await prismaClient.scrapedContent.groupBy({
      by: ['reviewStatus'],
      _count: true,
    });

    return NextResponse.json({
      items,
      requestUserId,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: stats.reduce((acc: Record<string, number>, stat: { reviewStatus: string; _count: number }) => {
        acc[stat.reviewStatus] = stat._count;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error: any) {
    console.error('Error fetching scraped content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/scraped-content
 * Manually add content for review
 */
export async function POST(request: NextRequest) {
  try {
    const requestUserId = resolveRequestUserId(request);

    const body = await request.json();
    const {
      sourceId,
      sourceUrl,
      url,
      contentType,
      title,
      content: contentBody,
      questionText,
      questionTextFA,
      questionType,
      options,
      explanation,
      hints,
      gradeLevel,
      subjectCode,
      skillCode,
      license,
    } = body;

    const resolvedSourceUrl = sourceUrl || url;
    if (!resolvedSourceUrl) {
      return NextResponse.json({ error: 'sourceUrl is required' }, { status: 400 });
    }

    const normalizedContentType =
      contentType === 'PRACTICE_PROBLEM' || !contentType ? 'QUESTION' : contentType;

    let resolvedSourceId = sourceId;
    if (!resolvedSourceId) {
      const existingSource = await prismaClient.contentSource.findFirst({
        where: {
          url: resolvedSourceUrl,
        },
      });

      if (existingSource) {
        resolvedSourceId = existingSource.id;
      } else {
        const createdSource = await prismaClient.contentSource.create({
          data: {
            name: title || new URL(resolvedSourceUrl).hostname,
            url: resolvedSourceUrl,
            description: 'Manually added source',
          },
        });
        resolvedSourceId = createdSource.id;
      }
    }

    const normalizedQuestionText = questionText || contentBody || title || null;

    const createdContent = await prismaClient.scrapedContent.create({
      data: {
        sourceId: resolvedSourceId,
        sourceUrl: resolvedSourceUrl,
        contentType: normalizedContentType,
        questionText: normalizedQuestionText,
        questionTextFA,
        questionType: questionType || 'MULTIPLE_CHOICE',
        options,
        explanation,
        hints,
        gradeLevel,
        subjectCode,
        skillCode,
        license,
        reviewStatus: 'PENDING',
      },
      include: {
        source: true,
      },
    });

    return NextResponse.json({ item: createdContent }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create content' },
      { status: 500 }
    );
  }
}
