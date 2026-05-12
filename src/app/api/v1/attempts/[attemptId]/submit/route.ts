import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { resolveRequestUserId } from '@/lib/auth/request-user';
import {
  evaluateOpenResponse,
  extractResponseText,
  isOpenResponseQuestion,
  percentageFromScores,
} from '@/lib/assessment/critical-thinking';

type SubmittedAnswer = {
  questionId: string;
  response: unknown;
};

function normalizeSelectedOptionIds(response: unknown): string[] {
  if (response && typeof response === 'object') {
    const record = response as Record<string, unknown>;
    if (typeof record.optionId === 'string') {
      return [record.optionId];
    }
    if (Array.isArray(record.optionIds)) {
      return record.optionIds.filter((item): item is string => typeof item === 'string');
    }
    if (typeof record.value === 'string') {
      return [record.value];
    }
  }

  if (typeof response === 'string') {
    return [response];
  }

  return [];
}

function normalizeNumericResponse(response: unknown) {
  const text = extractResponseText(response);
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function buildAutoGrade(question: any, response: unknown) {
  const maxScore = Number(question.points || 1);

  if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
    const selected = normalizeSelectedOptionIds(response)[0];
    const correct = (question.options || []).find((option: any) => option.isCorrect);
    const isCorrect = Boolean(selected && correct && (selected === correct.id || selected === correct.text));
    return { isCorrect, score: isCorrect ? maxScore : 0, pendingReview: false, storedResponse: response };
  }

  if (question.type === 'MULTIPLE_SELECT') {
    const selected = new Set(normalizeSelectedOptionIds(response));
    const correct = new Set((question.options || []).filter((option: any) => option.isCorrect).map((option: any) => option.id));
    const isCorrect = selected.size === correct.size && Array.from(selected).every((id) => correct.has(id));
    return { isCorrect, score: isCorrect ? maxScore : 0, pendingReview: false, storedResponse: response };
  }

  if (question.type === 'NUMERIC') {
    const metadata = (question.metadata || {}) as Record<string, unknown>;
    const accepted = metadata.correctValue ?? metadata.answer;
    const numericResponse = normalizeNumericResponse(response);
    const isCorrect = numericResponse !== null && accepted !== undefined && Number(accepted) === numericResponse;
    return { isCorrect, score: isCorrect ? maxScore : 0, pendingReview: false, storedResponse: response };
  }

  if (isOpenResponseQuestion(question.type)) {
    const aiSuggestion = evaluateOpenResponse(question, response);
    return {
      isCorrect: null,
      score: null,
      pendingReview: true,
      storedResponse: {
        value: extractResponseText(response),
        aiSuggestion,
      },
    };
  }

  return {
    isCorrect: null,
    score: 0,
    pendingReview: false,
    storedResponse: response,
  };
}

function buildFeedbackSummary(args: {
  hasPendingReview: boolean;
  score: number;
  maxScore: number;
}) {
  const { hasPendingReview, score, maxScore } = args;
  const percentage = percentageFromScores(score, maxScore);

  if (hasPendingReview) {
    return {
      strengths: 'Auto-graded items have been processed and written responses are queued for teacher review.',
      weaknesses: 'Open-response items still need final teacher approval before the result becomes official.',
      nextSteps: 'Review your written answers, then wait for teacher-approved feedback and next-step recommendations.',
      aiGenerated: true,
    };
  }

  if (percentage >= 85) {
    return {
      strengths: 'Strong command of the assessed skills and clear progress toward mastery.',
      weaknesses: 'Keep stretching your explanations with deeper evidence and comparison.',
      nextSteps: 'Move into extension tasks and more complex transfer problems.',
      aiGenerated: true,
    };
  }

  if (percentage >= 60) {
    return {
      strengths: 'Several core ideas are in place and the learner is building toward secure mastery.',
      weaknesses: 'Some answers still need stronger accuracy, evidence, or explanation.',
      nextSteps: 'Review misconceptions, practise support skills, and retry similar questions with clearer reasoning.',
      aiGenerated: true,
    };
  }

  return {
    strengths: 'The attempt provides useful evidence about where support is needed next.',
    weaknesses: 'Multiple skills need reinforcement before the learner is ready to advance.',
    nextSteps: 'Assign prerequisite support practice, model strong explanations, and revisit the lesson after guided feedback.',
    aiGenerated: true,
  };
}

export async function POST(request: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    const userId = resolveRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'User is required' }, { status: 401 });
    }

    const body = await request.json();
    const submittedAnswers = Array.isArray(body.answers) ? (body.answers as SubmittedAnswer[]) : [];

    const attempt = await prisma.studentAttempt.findUnique({
      where: { id: params.attemptId },
      include: {
        assessment: {
          include: {
            questions: {
              include: {
                question: {
                  include: {
                    options: true,
                  },
                },
              },
              orderBy: { sequence: 'asc' },
            },
          },
        },
      },
    });

    if (!attempt || attempt.userId !== userId) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Attempt already submitted' }, { status: 400 });
    }

    const submittedMap = new Map(submittedAnswers.map((answer) => [answer.questionId, answer.response]));
    let autoGradedScore = 0;
    let maxScore = 0;
    let hasPendingReview = false;

    for (const assessmentQuestion of attempt.assessment.questions) {
      const question = assessmentQuestion.question;
      const response = submittedMap.get(question.id) ?? null;
      const grade = buildAutoGrade(question, response);
      maxScore += Number(question.points || 1);
      if (typeof grade.score === 'number') {
        autoGradedScore += grade.score;
      }
      if (grade.pendingReview) {
        hasPendingReview = true;
      }

      await prisma.attemptAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId: params.attemptId,
            questionId: question.id,
          },
        },
        create: {
          attemptId: params.attemptId,
          questionId: question.id,
          response: (grade.storedResponse ?? null) as any,
          isCorrect: grade.isCorrect,
          score: grade.score,
        },
        update: {
          response: (grade.storedResponse ?? null) as any,
          isCorrect: grade.isCorrect,
          score: grade.score,
          answeredAt: new Date(),
        },
      });
    }

    const feedback = buildFeedbackSummary({ hasPendingReview, score: autoGradedScore, maxScore });

    await prisma.studentAttempt.update({
      where: { id: params.attemptId },
      data: {
        submittedAt: new Date(),
        status: hasPendingReview ? 'SUBMITTED' : 'GRADED',
        score: hasPendingReview ? null : autoGradedScore,
        maxScore,
        percentage: hasPendingReview ? null : percentageFromScores(autoGradedScore, maxScore),
      },
    });

    await prisma.feedbackRecord.upsert({
      where: { attemptId: params.attemptId },
      create: {
        attemptId: params.attemptId,
        strengths: feedback.strengths,
        weaknesses: feedback.weaknesses,
        nextSteps: feedback.nextSteps,
        aiGenerated: feedback.aiGenerated,
      },
      update: {
        strengths: feedback.strengths,
        weaknesses: feedback.weaknesses,
        nextSteps: feedback.nextSteps,
        aiGenerated: feedback.aiGenerated,
      },
    });

    return NextResponse.json({
      success: true,
      attemptId: params.attemptId,
      status: hasPendingReview ? 'SUBMITTED' : 'GRADED',
      hasPendingReview,
      autoGradedScore,
      maxScore,
      percentage: hasPendingReview ? null : percentageFromScores(autoGradedScore, maxScore),
      feedback,
    });
  } catch (error) {
    console.error('Error submitting assessment attempt:', error);
    return NextResponse.json({ error: 'Failed to submit assessment attempt' }, { status: 500 });
  }
}
