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
    const courseId = searchParams.get('courseId');
    const subject = searchParams.get('subject');
    const grade = searchParams.get('grade');
    const phase = searchParams.get('phase');
    const difficulty = searchParams.get('difficulty') as Difficulty | null;
    const bloomLevel = searchParams.get('bloomLevel') as BloomLevel | null;
    const type = searchParams.get('type') as QuestionType | null;
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    let resolvedSubject = subject;
    let resolvedGrade = grade;
    let courseContext: {
      id: string;
      title: string;
      titleFA: string | null;
      subjectCode: string;
      gradeCode: string;
    } | null = null;

    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
          titleFA: true,
          subject: {
            select: {
              code: true,
            },
          },
          gradeLevel: {
            select: {
              code: true,
            },
          },
        },
      });

      if (course) {
        resolvedSubject = resolvedSubject || course.subject.code;
        resolvedGrade = resolvedGrade || course.gradeLevel.code;
        courseContext = {
          id: course.id,
          title: course.title,
          titleFA: course.titleFA,
          subjectCode: course.subject.code,
          gradeCode: course.gradeLevel.code,
        };
      }
    }
    
    // Build where clause
    const andConditions: any[] = [];
    
    // Filter by grade level
    if (resolvedGrade) {
      andConditions.push({
        gradeLevel: {
          code: resolvedGrade
        },
      });
    }
    
    if (resolvedSubject) {
      andConditions.push({
        OR: [
          {
            skill: {
              subject: {
                code: resolvedSubject,
              },
            },
          },
          {
            metadata: {
              path: ['subjectCode'],
              equals: resolvedSubject,
            },
          },
        ],
      });
    }

    if (phase) {
      andConditions.push({
        metadata: {
          path: ['phase5E'],
          equals: phase,
        },
      });
    }
    
    // Filter by question properties
    if (difficulty) {
      andConditions.push({ difficulty });
    }
    
    if (bloomLevel) {
      andConditions.push({ bloomLevel });
    }
    
    if (type) {
      andConditions.push({ type });
    }
    
    // Full-text search
    if (search) {
      andConditions.push({
        OR: [
          { stem: { contains: search, mode: 'insensitive' } },
          { stemFA: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    const where: any = andConditions.length > 0 ? { AND: andConditions } : {};
    
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
          },
          skill: {
            select: {
              code: true,
              name: true,
              nameFA: true,
              subject: {
                select: {
                  code: true,
                  name: true,
                  nameFA: true,
                },
              },
            },
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
    
    const normalizedQuestions = questions.map((question) => {
      const metadata = question.metadata && typeof question.metadata === 'object' && !Array.isArray(question.metadata)
        ? question.metadata as Record<string, unknown>
        : {};

      return {
        ...question,
        metadata: {
          ...metadata,
          subjectCode: typeof metadata.subjectCode === 'string'
            ? metadata.subjectCode
            : question.skill?.subject?.code || null,
          skillCode: typeof metadata.skillCode === 'string'
            ? metadata.skillCode
            : question.skill?.code || null,
        },
      };
    });

    return NextResponse.json({
      questions: normalizedQuestions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      },
      filters: {
        courseId,
        subject,
        grade,
        phase,
        difficulty,
        bloomLevel,
        type,
        search
      },
      resolvedFilters: {
        subject: resolvedSubject,
        grade: resolvedGrade,
      },
      courseContext,
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
