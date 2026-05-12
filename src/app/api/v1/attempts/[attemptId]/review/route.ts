import { RoleName } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { resolveRequestUserId } from '@/lib/auth/request-user';
import { extractTeacherAssignmentState } from '@/lib/admin/teacher-assignments';
import { percentageFromScores } from '@/lib/assessment/critical-thinking';
import { getDemoUserById } from '@/lib/auth/demo-users';

const teacherRoleNames = [RoleName.SUPPORT_TEACHER, RoleName.TUTOR, RoleName.COUNSELOR];

type QuestionReviewPayload = {
  questionId: string;
  score?: number;
  feedback?: string;
  approvedAi?: boolean;
};

async function resolveTeacherScope(userId: string) {
  const teacher = await prisma.user.findFirst({
    where: {
      id: userId,
      userRoles: {
        some: {
          role: {
            name: {
              in: teacherRoleNames,
            },
          },
        },
      },
    },
    select: {
      id: true,
      userRoles: {
        select: {
          scope: true,
        },
      },
    },
  });

  if (!teacher) {
    const demoTeacher = getDemoUserById(userId);
    if (!(demoTeacher?.roles || []).includes('TEACHER')) {
      return null;
    }

    return {
      teacherId: demoTeacher!.id,
      assignedStudentIds: demoTeacher!.assignedStudents || [],
      assignedCourseIds: [],
      subjectCodes: demoTeacher!.assignedSubjects || [],
    };
  }

  return {
    teacherId: teacher.id,
    ...extractTeacherAssignmentState(teacher.userRoles || []),
  };
}

async function loadAttempt(attemptId: string) {
  return prisma.studentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              displayName: true,
            },
          },
        },
      },
      assessment: {
        include: {
          lessonAssessments: {
            include: {
              lesson: {
                include: {
                  unit: {
                    include: {
                      course: {
                        select: {
                          id: true,
                          title: true,
                          titleFA: true,
                        },
                      },
                    },
                  },
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
      },
      answers: true,
      feedback: true,
    },
  });
}

function canTeacherAccessAttempt(scope: NonNullable<Awaited<ReturnType<typeof resolveTeacherScope>>>, attempt: Awaited<ReturnType<typeof loadAttempt>>) {
  if (!attempt) return false;

  const assignedStudentIds = scope.assignedStudentIds || [];
  const studentDisplayName =
    attempt.user.profile?.displayName ||
    [attempt.user.profile?.firstName, attempt.user.profile?.lastName].filter(Boolean).join(' ');

  if (
    assignedStudentIds.length > 0 &&
    !assignedStudentIds.includes(attempt.userId) &&
    !(studentDisplayName && assignedStudentIds.includes(studentDisplayName))
  ) {
    return false;
  }

  const assignedCourseIds = scope.assignedCourseIds || [];
  if (assignedCourseIds.length > 0) {
    const attemptCourseIds = attempt.assessment.lessonAssessments
      .map((item) => item.lesson.unit.course.id)
      .filter(Boolean);

    if (attemptCourseIds.length > 0 && !attemptCourseIds.some((courseId) => assignedCourseIds.includes(courseId))) {
      return false;
    }
  }

  return true;
}

function serializeReviewAttempt(attempt: Awaited<ReturnType<typeof loadAttempt>>) {
  if (!attempt) return null;

  const answerMap = new Map(attempt.answers.map((answer) => [answer.questionId, answer]));
  const studentName =
    attempt.user.profile?.displayName ||
    [attempt.user.profile?.firstName, attempt.user.profile?.lastName].filter(Boolean).join(' ') ||
    attempt.user.email;

  return {
    attemptId: attempt.id,
    status: attempt.status,
    submittedAt: attempt.submittedAt,
    student: {
      id: attempt.user.id,
      displayName: studentName,
      email: attempt.user.email,
    },
    assessment: {
      id: attempt.assessment.id,
      title: attempt.assessment.title,
      titleFA: attempt.assessment.titleFA,
      courseTitle: attempt.assessment.lessonAssessments[0]?.lesson.unit.course.title || null,
      courseTitleFA: attempt.assessment.lessonAssessments[0]?.lesson.unit.course.titleFA || null,
    },
    feedback: attempt.feedback,
    questions: attempt.assessment.questions.map((item) => {
      const answer = answerMap.get(item.question.id);
      const responseRecord = answer?.response && typeof answer.response === 'object'
        ? (answer.response as Record<string, any>)
        : {};
      const aiSuggestion = responseRecord.aiSuggestion || null;
      const teacherReview = responseRecord.teacherReview || null;

      return {
        id: item.question.id,
        sequence: item.sequence,
        type: item.question.type,
        stem: item.question.stem,
        stemFA: item.question.stemFA,
        points: item.question.points,
        metadata: item.question.metadata,
        answerId: answer?.id || null,
        response: responseRecord.value ?? answer?.response ?? null,
        score: answer?.score ?? null,
        aiSuggestion,
        teacherReview,
        options: item.question.options.map((option) => ({
          id: option.id,
          text: option.text,
          textFA: option.textFA,
        })),
      };
    }),
  };
}

export async function GET(request: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    const userId = resolveRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'User is required' }, { status: 401 });
    }

    const teacherScope = await resolveTeacherScope(userId);
    if (!teacherScope) {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 });
    }

    const attempt = await loadAttempt(params.attemptId);
    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (!canTeacherAccessAttempt(teacherScope, attempt)) {
      return NextResponse.json({ error: 'Attempt is outside your assigned scope' }, { status: 403 });
    }

    return NextResponse.json({ attempt: serializeReviewAttempt(attempt) });
  } catch (error) {
    console.error('Error loading review attempt:', error);
    return NextResponse.json({ error: 'Failed to load attempt review' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    const userId = resolveRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'User is required' }, { status: 401 });
    }

    const teacherScope = await resolveTeacherScope(userId);
    if (!teacherScope) {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 });
    }

    const attempt = await loadAttempt(params.attemptId);
    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (!canTeacherAccessAttempt(teacherScope, attempt)) {
      return NextResponse.json({ error: 'Attempt is outside your assigned scope' }, { status: 403 });
    }

    const body = await request.json();
    const questionReviews = Array.isArray(body.questionReviews) ? (body.questionReviews as QuestionReviewPayload[]) : [];
    const teacherComment = typeof body.teacherComment === 'string' ? body.teacherComment : '';

    const reviewMap = new Map(questionReviews.map((review) => [review.questionId, review]));
    let totalScore = 0;
    let maxScore = 0;

    for (const assessmentQuestion of attempt.assessment.questions) {
      const question = assessmentQuestion.question;
      const answer = attempt.answers.find((item) => item.questionId === question.id);
      maxScore += Number(question.points || 1);

      if (!answer) {
        continue;
      }

      const responseRecord: Record<string, any> = answer.response && typeof answer.response === 'object'
        ? { ...(answer.response as Record<string, any>) }
        : { value: answer.response };
      const aiSuggestion = responseRecord.aiSuggestion || null;
      const review = reviewMap.get(question.id);

      if (question.type === 'SHORT_ANSWER' || question.type === 'LONG_ANSWER') {
        const approvedScore = typeof review?.score === 'number'
          ? review.score
          : Number(aiSuggestion?.suggestedScore || 0);

        responseRecord.teacherReview = {
          score: approvedScore,
          feedback: review?.feedback || null,
          approvedAi: review?.approvedAi ?? typeof review?.score !== 'number',
          reviewerId: userId,
          reviewedAt: new Date().toISOString(),
        };

        await prisma.attemptAnswer.update({
          where: { id: answer.id },
          data: {
            score: approvedScore,
            response: responseRecord as any,
          },
        });

        totalScore += approvedScore;
      } else {
        totalScore += Number(answer.score || 0);
      }
    }

    const percentage = percentageFromScores(totalScore, maxScore);

    await prisma.studentAttempt.update({
      where: { id: params.attemptId },
      data: {
        status: 'REVIEWED',
        score: totalScore,
        maxScore,
        percentage,
      },
    });

    await prisma.feedbackRecord.upsert({
      where: { attemptId: params.attemptId },
      create: {
        attemptId: params.attemptId,
        strengths: percentage >= 80
          ? 'Teacher-approved review shows strong mastery and thoughtful written reasoning.'
          : 'Teacher review identified meaningful evidence that can guide the next learning step.',
        weaknesses: percentage >= 80
          ? 'Continue strengthening evidence and transfer to harder contexts.'
          : 'Some answers still need more precise reasoning, evidence, or completeness.',
        nextSteps: teacherComment || (percentage >= 80
          ? 'Move to a richer extension or design challenge next.'
          : 'Revisit support skills, improve the written explanation, and retry a similar task.'),
        aiGenerated: false,
      },
      update: {
        nextSteps: teacherComment || undefined,
        aiGenerated: false,
      },
    });

    const refreshed = await loadAttempt(params.attemptId);
    return NextResponse.json({ success: true, attempt: serializeReviewAttempt(refreshed) });
  } catch (error) {
    console.error('Error finalizing review attempt:', error);
    return NextResponse.json({ error: 'Failed to finalize review' }, { status: 500 });
  }
}
