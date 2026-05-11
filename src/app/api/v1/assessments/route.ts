import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/v1/assessments
 * Retrieve all assessments (with optional filters)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const lessonId = searchParams.get('lessonId');

    const where: any = {};
    if (courseId) where.courseId = courseId;
    if (lessonId) where.lessonId = lessonId;

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        lessonAssessments: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                titleFA: true
              }
            }
          }
        },
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ assessments });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/assessments
 * Create a new assessment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      title,
      titleFA,
      description,
      type,
      timeLimit,
      passingScore,
      lessonId,
      questions // Array of { questionId, sequence }
    } = body;

    if (!title || !type) {
      return NextResponse.json(
        { error: 'Title and type are required' },
        { status: 400 }
      );
    }

    // Create assessment
    const assessment = await prisma.assessment.create({
      data: {
        title,
        titleFA,
        description,
        type,
        timeLimit,
        passingScore: passingScore || 70
      }
    });

    // Link to lesson if provided
    if (lessonId) {
      await prisma.lessonAssessment.create({
        data: {
          lessonId,
          assessmentId: assessment.id,
          sequence: 0
        }
      });
    }

    // Add questions to assessment
    if (questions && Array.isArray(questions)) {
      for (const q of questions) {
        await prisma.assessmentQuestion.create({
          data: {
            assessmentId: assessment.id,
            questionId: q.questionId,
            sequence: q.sequence
          }
        });
      }
    }

    // Fetch complete assessment
    const completeAssessment = await prisma.assessment.findUnique({
      where: { id: assessment.id },
      include: {
        questions: {
          include: {
            question: {
              include: {
                options: true
              }
            }
          },
          orderBy: { sequence: 'asc' }
        }
      }
    });

    return NextResponse.json({ assessment: completeAssessment }, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/assessments?id=<assessmentId>
 * Update an existing assessment
 */
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Assessment id is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const assessment = await prisma.assessment.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.titleFA !== undefined && { titleFA: body.titleFA }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.type && { type: body.type }),
        ...(body.timeLimit !== undefined && { timeLimit: body.timeLimit }),
        ...(body.passingScore !== undefined && { passingScore: body.passingScore })
      },
      include: {
        questions: {
          include: {
            question: true
          },
          orderBy: { sequence: 'asc' }
        }
      }
    });

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error('Error updating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to update assessment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/assessments?id=<assessmentId>
 * Delete an assessment
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Assessment id is required' },
        { status: 400 }
      );
    }

    // Check if assessment has student attempts
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attempts: true
          }
        }
      }
    });

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    if (assessment._count.attempts > 0) {
      return NextResponse.json(
        { error: 'Cannot delete assessment with student attempts' },
        { status: 400 }
      );
    }

    await prisma.assessment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assessment' },
      { status: 500 }
    );
  }
}
