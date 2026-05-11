import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/db';
import { EducationalScraper, initializeContentSources } from '@/lib/scraper/educational-scraper';

/**
 * GET /api/v1/admin/scraper/sources
 * List all content sources
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sources = await prisma.contentSource.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { scrapedContent: true },
        },
      },
    });

    return NextResponse.json(sources);
  } catch (error: any) {
    console.error('Error fetching sources:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sources' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/scraper/sources
 * Initialize default content sources
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initializeContentSources();

    const sources = await prisma.contentSource.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      sources,
      message: 'Content sources initialized',
    });
  } catch (error: any) {
    console.error('Error initializing sources:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize sources' },
      { status: 500 }
    );
  }
}
