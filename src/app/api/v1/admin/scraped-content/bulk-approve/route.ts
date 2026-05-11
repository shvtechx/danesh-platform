import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { mapIrtToDifficultyBand } from '@/lib/scraper/difficulty';
import { resolveRequestUserId } from '@/lib/auth/request-user';

const prismaClient = prisma as any;

/**
 * POST /api/v1/admin/scraped-content/bulk-approve
 * Bulk approve multiple content items
 */
export async function POST(request: NextRequest) {
  try {
    const requestUserId = resolveRequestUserId(request);

    const body = await request.json();
    const { contentIds, defaultSkillId } = body;

    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      return NextResponse.json(
        { error: 'contentIds array required' },
        { status: 400 }
      );
    }

    const results = {
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const contentId of contentIds) {
      try {
        // Fetch content
        const content = await prismaClient.scrapedContent.findUnique({
          where: { id: contentId },
        });

        if (!content) {
          results.errors.push(`Content ${contentId} not found`);
          results.failed++;
          continue;
        }

        if (content.reviewStatus === 'APPROVED') {
          results.errors.push(`Content ${contentId} already approved`);
          results.failed++;
          continue;
        }

        // Use provided skillId or content's skillCode
        const skillId = defaultSkillId || content.skillCode;
        
        if (!skillId) {
          results.errors.push(`Content ${contentId} missing skillId`);
          results.failed++;
          continue;
        }

        // Create question
        const estimatedDifficulty = content.difficultyEstimate || 0;
        const question = await prismaClient.question.create({
          data: {
            skillId,
            stem: content.questionText!,
            stemFA: content.questionTextFA,
            type: content.questionType || 'MULTIPLE_CHOICE',
            explanation: content.explanation,
            explanationFA: content.explanationFA,
            hints: content.hints,
            difficulty: mapIrtToDifficultyBand(estimatedDifficulty),
            irtDifficulty: estimatedDifficulty,
            irtDiscrimination: 1.0,
            irtGuessing: 0.25,
            timeEstimate: 60,
            points: 10,
          },
        });

        // Create options
        if (content.options && Array.isArray(content.options)) {
          for (let i = 0; i < content.options.length; i++) {
            const option = content.options[i];
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

        // Mark as approved
        await prismaClient.scrapedContent.update({
          where: { id: contentId },
          data: {
            reviewStatus: 'APPROVED',
            reviewedBy: requestUserId || undefined,
            reviewedAt: new Date(),
            importedAt: new Date(),
          },
        });

        results.succeeded++;
      } catch (error: any) {
        results.errors.push(`Content ${contentId}: ${error.message}`);
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Bulk approval complete: ${results.succeeded} succeeded, ${results.failed} failed`,
    });
  } catch (error: any) {
    console.error('Error in bulk approval:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to bulk approve' },
      { status: 500 }
    );
  }
}
