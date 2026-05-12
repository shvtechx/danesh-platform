import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

function serializeAssessment(assessment: any) {
  const totalPoints = assessment.questions.reduce((sum: number, item: any) => sum + Number(item.question?.points || 0), 0);

  return {
    id: assessment.id,
    type: assessment.type,
    title: assessment.title,
    titleFA: assessment.titleFA,
    description: assessment.description,
    timeLimit: assessment.timeLimit,
    passingScore: assessment.passingScore,
    maxAttempts: assessment.maxAttempts,
    shuffleQuestions: assessment.shuffleQuestions,
    showFeedback: assessment.showFeedback,
    totalPoints,
    rubric: assessment.rubric,
    lessonAssessments: assessment.lessonAssessments,
    questions: assessment.questions.map((item: any) => ({
      id: item.question.id,
      sequence: item.sequence,
      type: item.question.type,
      stem: item.question.stem,
      stemFA: item.question.stemFA,
      explanation: item.question.explanation,
      explanationFA: item.question.explanationFA,
      difficulty: item.question.difficulty,
      bloomLevel: item.question.bloomLevel,
      points: item.question.points,
      metadata: item.question.metadata,
      skillId: item.question.skillId,
      options: (item.question.options || []).map((option: any) => ({
        id: option.id,
        text: option.text,
        textFA: option.textFA,
        order: option.order,
      })),
    })),
  };
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: params.id },
      include: {
        rubric: true,
        lessonAssessments: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                titleFA: true,
              },
            },
          },
        },
        questions: {
          include: {
            question: {
              include: {
                options: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    return NextResponse.json(serializeAssessment(assessment));
  } catch (error) {
    console.error('Error fetching assessment detail:', error);
    return NextResponse.json({ error: 'Failed to fetch assessment' }, { status: 500 });
  }
}
