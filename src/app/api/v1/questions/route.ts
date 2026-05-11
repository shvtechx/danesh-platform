import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { QuestionType, Difficulty, BloomLevel } from '@prisma/client';

/**
 * GET /api/v1/questions
 * Browse question bank with comprehensive filtering
 * 
 * Query Parameters:
 * - subject: Subject code (e.g., "MATH", "ROBOT")
 * - grade: Grade code (e.g., "G1", "G10")
 * - phase: 5E phase (e.g., "5E_ENGAGE", "5E_EXPLORE", "5E_EXPLAIN", "5E_ELABORATE", "5E_EVALUATE")
 * - difficulty: EASY | MEDIUM | HARD | EXPERT
 * - bloomLevel: REMEMBER | UNDERSTAND | APPLY | ANALYZE | EVALUATE | CREATE
 * - type: MULTIPLE_CHOICE | TRUE_FALSE | SHORT_ANSWER | ESSAY | MATCHING
 * - search: Full-text search in question stem
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const subject = searchParams.get('subject');
    const grade = searchParams.get('grade');
    const phase = searchParams.get('phase');
    const difficulty = searchParams.get('difficulty') as Difficulty | null;
    const bloomLevel = searchParams.get('bloomLevel') as BloomLevel | null;
    const type = searchParams.get('type') as QuestionType | null;
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    
    // Build where clause
    const where: any = {};
    
    // Filter by grade level
    if (grade) {
      where.gradeLevel = {
        code: grade
      };
    }
    
    // Filter by metadata (subject and phase stored in JSON)
    if (subject || phase) {
      where.metadata = {
        path: [],
        ...(subject && { string_contains: `"subjectCode":"${subject}"` }),
        ...(phase && { string_contains: `"phase5E":"${phase}"` })
      };
    }
    
    // Filter by question properties
    if (difficulty) {
      where.difficulty = difficulty;
    }
    
    if (bloomLevel) {
      where.bloomLevel = bloomLevel;
    }
    
    if (type) {
      where.type = type;
    }
    
    // Full-text search
    if (search) {
      where.OR = [
        { stem: { contains: search, mode: 'insensitive' } },
        { stemFA: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Fetch questions with options
    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          options: {
            orderBy: { order: 'asc' }
          },
          gradeLevel: {
            select: {
              code: true,
              name: true,
              nameFA: true,
              gradeBand: true
            }
          }
        },
        orderBy: [
          { difficulty: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.question.count({ where })
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      },
      filters: {
        subject,
        grade,
        phase,
        difficulty,
        bloomLevel,
        type,
        search
      }
    });
    
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/questions
 * Create a new question (for teachers/admins)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const {
      type,
      stem,
      stemFA,
      explanation,
      explanationFA,
      difficulty = Difficulty.MEDIUM,
      bloomLevel = BloomLevel.UNDERSTAND,
      gradeLevelId,
      standardId,
      metadata,
      options
    } = body;
    
    if (!type || !stem) {
      return NextResponse.json(
        { error: 'Question type and stem are required' },
        { status: 400 }
      );
    }
    
    // Create question
    const question = await prisma.question.create({
      data: {
        type,
        stem,
        stemFA,
        explanation,
        explanationFA,
        difficulty,
        bloomLevel,
        ...(gradeLevelId && {
          gradeLevel: {
            connect: { id: gradeLevelId }
          }
        }),
        ...(standardId && {
          standard: {
            connect: { id: standardId }
          }
        }),
        metadata: metadata || {}
      }
    });
    
    // Create options for multiple choice questions
    if (options && Array.isArray(options) && type === QuestionType.MULTIPLE_CHOICE) {
      await Promise.all(
        options.map((opt: any, index: number) =>
          prisma.questionOption.create({
            data: {
              questionId: question.id,
              text: opt.text,
              textFA: opt.textFA,
              isCorrect: opt.isCorrect || false,
              feedback: opt.feedback,
              feedbackFA: opt.feedbackFA,
              order: index
            }
          })
        )
      );
    }
    
    // Fetch complete question with options
    const completeQuestion = await prisma.question.findUnique({
      where: { id: question.id },
      include: {
        options: {
          orderBy: { order: 'asc' }
        },
        gradeLevel: true
      }
    });
    
    return NextResponse.json({ question: completeQuestion }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/questions?id=<questionId>
 * Update an existing question
 */
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Question id is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Update question
    const question = await prisma.question.update({
      where: { id },
      data: {
        ...(body.stem && { stem: body.stem }),
        ...(body.stemFA !== undefined && { stemFA: body.stemFA }),
        ...(body.explanation !== undefined && { explanation: body.explanation }),
        ...(body.explanationFA !== undefined && { explanationFA: body.explanationFA }),
        ...(body.difficulty && { difficulty: body.difficulty }),
        ...(body.bloomLevel && { bloomLevel: body.bloomLevel }),
        ...(body.metadata && { metadata: body.metadata })
      },
      include: {
        options: {
          orderBy: { order: 'asc' }
        },
        gradeLevel: true
      }
    });
    
    return NextResponse.json({ question });
    
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/questions?id=<questionId>
 * Delete a question
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Question id is required' },
        { status: 400 }
      );
    }
    
    // Check if question is used in any assessments
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assessmentQuestions: true
          }
        }
      }
    });
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    if (question._count.assessmentQuestions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete question used in assessments' },
        { status: 400 }
      );
    }
    
    // Delete question (options will cascade delete)
    await prisma.question.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
