import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/v1/questions/:id
 * Fetch a single question by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const question = await prisma.question.findUnique({
      where: { id: params.id },
      include: {
        gradeLevel: true,
        options: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/questions/:id
 * Update an existing question
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      stem,
      stemFA,
      explanation,
      explanationFA,
      difficulty,
      bloomLevel,
      type,
      metadata,
      options
    } = body;

    // Update question
    const updatedQuestion = await prisma.question.update({
      where: { id: params.id },
      data: {
        stem,
        stemFA,
        explanation,
        explanationFA,
        difficulty,
        bloomLevel,
        type,
        metadata: metadata || {}
      },
      include: {
        gradeLevel: true,
        options: {
          orderBy: { order: 'asc' }
        }
      }
    });

    // Update options if provided
    if (options && Array.isArray(options)) {
      // Delete existing options
      await prisma.questionOption.deleteMany({
        where: { questionId: params.id }
      });

      // Create new options
      if (options.length > 0) {
        await prisma.questionOption.createMany({
          data: options.map((opt: any, index: number) => ({
            questionId: params.id,
            text: opt.text,
            textFA: opt.textFA,
            optionText: opt.text,
            optionTextFA: opt.textFA,
            isCorrect: opt.isCorrect || false,
            feedback: opt.feedback || '',
            feedbackFA: opt.feedbackFA || '',
            order: index
          }))
        });
      }
    }

    // Fetch updated question with new options
    const finalQuestion = await prisma.question.findUnique({
      where: { id: params.id },
      include: {
        gradeLevel: true,
        options: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return NextResponse.json({
      message: 'Question updated successfully',
      question: finalQuestion
    });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/questions/:id
 * Delete a question
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if question is used in assessments
    const assessmentQuestions = await prisma.assessmentQuestion.findMany({
      where: { questionId: params.id }
    });

    if (assessmentQuestions.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete question that is used in assessments',
          assessmentCount: assessmentQuestions.length
        },
        { status: 400 }
      );
    }

    // Delete options first
    await prisma.questionOption.deleteMany({
      where: { questionId: params.id }
    });

    // Delete question
    await prisma.question.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
