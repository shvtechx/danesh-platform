import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { estimateQuestionDifficulty, mapIrtToDifficultyBand } from '@/lib/scraper/difficulty';
import { resolveRequestUserId } from '@/lib/auth/request-user';

const prismaClient = prisma as any;

/**
 * POST /api/v1/admin/scraped-content/[id]/approve
 * Approve scraped content and import into main Question table
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestUserId = resolveRequestUserId(request);

    const body = await request.json();
    const { skillId, irtDifficulty } = body;

    // Get the scraped content
    const scrapedContent = await prismaClient.scrapedContent.findUnique({
      where: { id: params.id },
    });

    if (!scrapedContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    if (scrapedContent.reviewStatus === 'APPROVED') {
      return NextResponse.json({ error: 'Content already approved' }, { status: 400 });
    }

    // Validate required fields for question import
    if (scrapedContent.contentType === 'QUESTION') {
      if (!scrapedContent.questionText || !skillId) {
        return NextResponse.json(
          { error: 'Question text and skillId required' },
          { status: 400 }
        );
      }

      // Estimate difficulty if not provided
      const difficulty = irtDifficulty ?? 
        scrapedContent.difficultyEstimate ?? 
        estimateQuestionDifficulty(
          scrapedContent.questionText,
          scrapedContent.gradeLevel || undefined
        );

      // Create Question in main database
      const question = await prismaClient.question.create({
        data: {
          skillId,
          stem: scrapedContent.questionText,
          stemFA: scrapedContent.questionTextFA,
          type: scrapedContent.questionType || 'MULTIPLE_CHOICE',
          explanation: scrapedContent.explanation,
          explanationFA: scrapedContent.explanationFA,
          hints: scrapedContent.hints,
          difficulty: mapIrtToDifficultyBand(difficulty),
          irtDifficulty: difficulty,
          irtDiscrimination: 1.0, // Default, will be calibrated
          irtGuessing: 0.25, // Default for 4-option MC
          timeEstimate: 60, // Default 1 minute
          points: 10,
        },
      });

      // Create question options if present
      if (scrapedContent.options && Array.isArray(scrapedContent.options)) {
        for (let i = 0; i < scrapedContent.options.length; i++) {
          const option = scrapedContent.options[i];
          await prismaClient.questionOption.create({
            data: {
              questionId: question.id,
              text: option.text,
              textFA: option.textFA,
              isCorrect: option.isCorrect,
              order: i + 1,
            },
          });
        }
      }

      // Mark as approved and imported
      await prismaClient.scrapedContent.update({
        where: { id: params.id },
        data: {
          reviewStatus: 'APPROVED',
          reviewedBy: requestUserId || undefined,
          reviewedAt: new Date(),
          importedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        question,
        message: 'Question imported successfully',
      });
    }

    if (scrapedContent.contentType === 'SKILL' || scrapedContent.contentType === 'TOPIC') {
      await prismaClient.scrapedContent.update({
        where: { id: params.id },
        data: {
          reviewStatus: 'APPROVED',
          reviewedBy: requestUserId || undefined,
          reviewedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `${scrapedContent.contentType.toLowerCase()} content approved for manual follow-up`,
      });
    }

    return NextResponse.json({ error: `Unsupported content type: ${scrapedContent.contentType}` }, { status: 400 });
  } catch (error: any) {
    console.error('Error approving content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve content' },
      { status: 500 }
    );
  }
}
