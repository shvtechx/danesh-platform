import { RoleName } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { resolveRequestUserId } from '@/lib/auth/request-user';
import { extractTeacherAssignmentState } from '@/lib/admin/teacher-assignments';
import { scoreToBand } from '@/lib/assessment/critical-thinking';
import { getDemoUserById } from '@/lib/auth/demo-users';

const teacherRoleNames = [RoleName.SUPPORT_TEACHER, RoleName.TUTOR, RoleName.COUNSELOR];

function normalizeSubjectCode(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;

  const aliases: Record<string, string> = {
    math: 'math',
    mathematics: 'math',
    science: 'science',
    english: 'english',
    persian: 'persian',
    physics: 'physics',
    chemistry: 'chemistry',
    biology: 'biology',
    history: 'history',
    geography: 'geography',
    art: 'arts',
    arts: 'arts',
  };

  return aliases[normalized] || normalized;
}

export async function GET(request: NextRequest) {
  try {
    const locale = new URL(request.url).searchParams.get('locale') || 'en';
    const requestUserId = resolveRequestUserId(request);

    if (!requestUserId) {
      return NextResponse.json({ error: 'User is required' }, { status: 401 });
    }

    const teacher = await prisma.user.findFirst({
      where: {
        id: requestUserId,
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
        userRoles: {
          select: {
            scope: true,
          },
        },
      },
    });

    const demoTeacher = !teacher ? getDemoUserById(requestUserId) : null;

    if (!teacher && !(demoTeacher?.roles || []).includes('TEACHER')) {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 });
    }

    const assignmentState = teacher
      ? extractTeacherAssignmentState(teacher.userRoles || [])
      : {
          assignedStudentIds: demoTeacher?.assignedStudents || [],
          assignedCourseIds: [],
          subjectCodes: demoTeacher?.assignedSubjects || [],
        };

    const assignedStudentIds = assignmentState.assignedStudentIds || [];
    const assignedCourseIds = assignmentState.assignedCourseIds || [];
    const assignedSubjectCodes = (assignmentState.subjectCodes || [])
      .map((code) => normalizeSubjectCode(code))
      .filter((value): value is string => Boolean(value));

    let scopedStudentIds = new Set<string>(assignedStudentIds);

    if (!teacher && assignedStudentIds.length > 0) {
      const namedStudents = await prisma.user.findMany({
        where: {
          userRoles: {
            some: { role: { name: RoleName.STUDENT } },
          },
        },
        select: {
          id: true,
          profile: {
            select: {
              displayName: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      for (const student of namedStudents) {
        const fullName = student.profile?.displayName || [student.profile?.firstName, student.profile?.lastName].filter(Boolean).join(' ');
        if (fullName && assignedStudentIds.includes(fullName)) {
          scopedStudentIds.add(student.id);
        }
      }
    }

    if (assignedCourseIds.length > 0 || assignedSubjectCodes.length > 0) {
      const enrollments = await prisma.courseEnrollment.findMany({
        where: {
          course: {
            ...(assignedCourseIds.length > 0 ? { id: { in: assignedCourseIds } } : {}),
          },
        },
        select: {
          userId: true,
          course: {
            select: {
              subject: {
                select: {
                  code: true,
                  name: true,
                  nameFA: true,
                },
              },
            },
          },
        },
      });

      for (const enrollment of enrollments) {
        const courseSubjectKeys = [
          normalizeSubjectCode(enrollment.course.subject.code),
          normalizeSubjectCode(enrollment.course.subject.name),
          normalizeSubjectCode(enrollment.course.subject.nameFA),
        ].filter((value): value is string => Boolean(value));

        if (assignedSubjectCodes.length === 0 || courseSubjectKeys.some((key) => assignedSubjectCodes.includes(key))) {
          scopedStudentIds.add(enrollment.userId);
        }
      }
    }

    const studentIdList = Array.from(scopedStudentIds);
    if (studentIdList.length === 0) {
      return NextResponse.json({
        summary: { totalStudents: 0, pendingReviews: 0, averageMastery: 0, averageCriticalThinking: 0 },
        students: [],
        pendingReviews: [],
      });
    }

    const [students, masteries, attempts] = await Promise.all([
      prisma.user.findMany({
        where: {
          id: { in: studentIdList },
          userRoles: {
            some: { role: { name: RoleName.STUDENT } },
          },
        },
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              displayName: true,
              firstName: true,
              lastName: true,
              gradeBand: true,
            },
          },
        },
      }),
      prisma.skillMastery.findMany({
        where: {
          userId: { in: studentIdList },
        },
        include: {
          skill: {
            include: {
              subject: {
                select: {
                  code: true,
                  name: true,
                  nameFA: true,
                },
              },
            },
          },
        },
      }),
      prisma.studentAttempt.findMany({
        where: {
          userId: { in: studentIdList },
          submittedAt: { not: null },
        },
        include: {
          assessment: {
            select: {
              id: true,
              title: true,
              titleFA: true,
            },
          },
          answers: {
            include: {
              question: {
                select: {
                  id: true,
                  type: true,
                  metadata: true,
                },
              },
            },
          },
          feedback: true,
        },
        orderBy: { submittedAt: 'desc' },
      }),
    ]);

    const pendingReviews = attempts
      .filter((attempt) => attempt.status === 'SUBMITTED')
      .map((attempt) => {
        const openAnswers = attempt.answers.filter((answer) => {
          const response = answer.response && typeof answer.response === 'object' ? (answer.response as Record<string, any>) : null;
          return ['SHORT_ANSWER', 'LONG_ANSWER'].includes(answer.question.type) && response?.aiSuggestion;
        });

        const suggestedScore = openAnswers.reduce((sum, answer) => {
          const response = answer.response as Record<string, any>;
          return sum + Number(response?.aiSuggestion?.suggestedScore || 0);
        }, 0);

        return {
          attemptId: attempt.id,
          studentId: attempt.userId,
          assessmentTitle: locale === 'fa' ? (attempt.assessment.titleFA || attempt.assessment.title) : attempt.assessment.title,
          submittedAt: attempt.submittedAt,
          openResponseCount: openAnswers.length,
          suggestedScore,
        };
      })
      .filter((item) => item.openResponseCount > 0);

    const studentsPayload = students.map((student) => {
      const studentMasteries = masteries.filter((mastery) => mastery.userId === student.id);
      const studentAttempts = attempts.filter((attempt) => attempt.userId === student.id);
      const reviewedOpenAnswers = studentAttempts.flatMap((attempt) =>
        attempt.answers.filter((answer) => ['SHORT_ANSWER', 'LONG_ANSWER'].includes(answer.question.type)),
      );

      const criticalThinkingPercentages = reviewedOpenAnswers
        .map((answer) => {
          const response = answer.response && typeof answer.response === 'object' ? (answer.response as Record<string, any>) : null;
          const teacherReviewScore = Number(response?.teacherReview?.score);
          const aiPercentage = Number(response?.aiSuggestion?.percentage);

          if (Number.isFinite(teacherReviewScore)) {
            const maxPoints = Math.max(1, Number(answer.question.metadata && typeof answer.question.metadata === 'object'
              ? (answer.question.metadata as Record<string, any>).maxPoints || 0
              : 0) || Number(answer.score || 1));
            return Math.round((teacherReviewScore / maxPoints) * 100);
          }

          if (Number.isFinite(aiPercentage)) {
            return aiPercentage;
          }

          return null;
        })
        .filter((value): value is number => value !== null);

      const averageMastery = studentMasteries.length > 0
        ? Math.round(studentMasteries.reduce((sum, mastery) => sum + mastery.masteryScore, 0) / studentMasteries.length)
        : 0;
      const averageCriticalThinking = criticalThinkingPercentages.length > 0
        ? Math.round(criticalThinkingPercentages.reduce((sum, value) => sum + value, 0) / criticalThinkingPercentages.length)
        : 0;
      const pendingCount = pendingReviews.filter((attempt) => attempt.studentId === student.id).length;
      const recentAssessment = studentAttempts[0];

      return {
        studentId: student.id,
        displayName:
          student.profile?.displayName ||
          [student.profile?.firstName, student.profile?.lastName].filter(Boolean).join(' ') ||
          student.email,
        email: student.email,
        gradeBand: student.profile?.gradeBand || null,
        averageMastery,
        masteryBand: scoreToBand(averageMastery),
        averageCriticalThinking,
        criticalThinkingBand: scoreToBand(averageCriticalThinking),
        pendingReviews: pendingCount,
        recentAssessment: recentAssessment
          ? {
              title: locale === 'fa' ? (recentAssessment.assessment.titleFA || recentAssessment.assessment.title) : recentAssessment.assessment.title,
              percentage: recentAssessment.percentage,
              status: recentAssessment.status,
              submittedAt: recentAssessment.submittedAt,
            }
          : null,
      };
    });

    const summary = {
      totalStudents: studentsPayload.length,
      pendingReviews: pendingReviews.length,
      averageMastery: studentsPayload.length > 0
        ? Math.round(studentsPayload.reduce((sum, student) => sum + student.averageMastery, 0) / studentsPayload.length)
        : 0,
      averageCriticalThinking: studentsPayload.length > 0
        ? Math.round(studentsPayload.reduce((sum, student) => sum + student.averageCriticalThinking, 0) / studentsPayload.length)
        : 0,
    };

    return NextResponse.json({
      summary,
      students: studentsPayload.sort((left, right) => right.averageMastery - left.averageMastery),
      pendingReviews,
    });
  } catch (error) {
    console.error('Error fetching teacher gradebook:', error);
    return NextResponse.json({ error: 'Failed to fetch gradebook' }, { status: 500 });
  }
}
