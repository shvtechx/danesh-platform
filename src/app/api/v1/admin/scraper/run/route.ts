import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/db';
import { EducationalScraper } from '@/lib/scraper/educational-scraper';

/**
 * POST /api/v1/admin/scraper/run
 * Run a scraping job (starts async job)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      sourceId,
      jobType = 'FULL_SCRAPE',
      targetUrl,
      gradeRange,
      subjects,
      maxItems = 100,
    } = body;

    if (!sourceId) {
      return NextResponse.json({ error: 'sourceId required' }, { status: 400 });
    }

    // Create import job
    const job = await prisma.contentImportJob.create({
      data: {
        sourceId,
        jobType,
        targetUrl,
        gradeRange,
        subjects,
        maxItems,
        status: 'PENDING',
      },
    });

    // Start scraping in background (in production, use queue like Bull or Inngest)
    // For now, we'll run it synchronously with a timeout
    setImmediate(async () => {
      try {
        // Update job status
        await prisma.contentImportJob.update({
          where: { id: job.id },
          data: {
            status: 'RUNNING',
            startedAt: new Date(),
          },
        });

        // Get source details
        const source = await prisma.contentSource.findUnique({
          where: { id: sourceId },
        });

        if (!source) {
          throw new Error('Source not found');
        }

        // Initialize scraper
        const scraper = new EducationalScraper({
          sourceId: source.id,
          rateLimit: source.rateLimit,
          respectRobotsTxt: source.respectsRobotsTxt,
        });

        let questions: any[] = [];

        // Run appropriate scraper based on source
        if (source.name.includes('Khan Academy')) {
          questions = await scraper.scrapeKhanAcademy();
        } else if (source.name.includes('OpenStax')) {
          questions = await scraper.scrapeOpenStax();
        } else if (source.name.includes('OER')) {
          questions = await scraper.scrapeOERCommons();
        } else if (targetUrl) {
          // Generic HTML scraper
          const html = await fetch(targetUrl).then(r => r.text());
          questions = scraper.parseQuestionFromHTML(html, targetUrl);
        }

        // Save scraped content
        const savedCount = await scraper.saveScrapedContent(
          questions.slice(0, maxItems)
        );

        // Update job as completed
        await prisma.contentImportJob.update({
          where: { id: job.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            itemsProcessed: questions.length,
            itemsSucceeded: savedCount,
            itemsFailed: questions.length - savedCount,
          },
        });

        console.log(`✅ Scraping job ${job.id} completed: ${savedCount} items saved`);
      } catch (error: any) {
        console.error('Error running scraper:', error);
        
        // Update job as failed
        await prisma.contentImportJob.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            errorMessage: error.message,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      job,
      message: 'Scraping job started',
    });
  } catch (error: any) {
    console.error('Error starting scraper:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start scraper' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/admin/scraper/jobs
 * List scraping jobs with status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;

    const where: any = {};
    if (status) where.status = status;

    const jobs = await prisma.contentImportJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
