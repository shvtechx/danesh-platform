import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { resolveRequestUserId } from '@/lib/auth/request-user';
import { scoreToBand } from '@/lib/assessment/critical-thinking';
import { ensureShadowUser } from '@/lib/auth/demo-user-provisioning';

const DIMENSION_LABELS: Record<string, { en: string; fa: string }> = {
  INTERPRETATION: { en: 'Interpretation', fa: 'تفسیر' },
  ANALYSIS: { en: 'Analysis', fa: 'تحلیل' },
  EVIDENCE_USE: { en: 'Evidence use', fa: 'استفاده از شواهد' },
  REASONING: { en: 'Reasoning', fa: 'استدلال' },
  EVALUATION: { en: 'Evaluation', fa: 'ارزیابی' },
  PROBLEM_SOLVING: { en: 'Problem solving', fa: 'حل مسئله' },
  COMMUNICATION: { en: 'Communication', fa: 'بیان و ارتباط' },
  REFLECTION: { en: 'Reflection', fa: 'بازاندیشی' },
};

export async function GET(request: NextRequest) {
  try {
    const locale = new URL(request.url).searchParams.get('locale') || 'en';
    const userId = resolveRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'User is required' }, { status: 401 });
    }

    await ensureShadowUser(userId);

    const [student, masteries, attempts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
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
        where: { userId },
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
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.studentAttempt.findMany({
        where: { userId, submittedAt: { not: null } },
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
                  points: true,
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

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const displayName =
      student.profile?.displayName ||
      [student.profile?.firstName, student.profile?.lastName].filter(Boolean).join(' ') ||
      student.email;

    const masterySkills = masteries.map((mastery) => ({
      skillId: mastery.skillId,
      skillName: locale === 'fa' ? (mastery.skill.nameFA || mastery.skill.name) : mastery.skill.name,
      subject: locale === 'fa' ? (mastery.skill.subject.nameFA || mastery.skill.subject.name) : mastery.skill.subject.name,
      subjectCode: mastery.skill.subject.code,
      masteryScore: mastery.masteryScore,
      status: mastery.status,
      questionsAttempted: mastery.questionsAttempted,
      lastPracticedAt: mastery.lastPracticedAt,
      band: scoreToBand(mastery.masteryScore),
    }));

    const dimensionMap = new Map<string, number[]>();
    const recentAssessments = attempts.map((attempt) => {
      for (const answer of attempt.answers) {
        const response = answer.response && typeof answer.response === 'object' ? (answer.response as Record<string, any>) : null;
        const dimensions = Array.isArray(response?.aiSuggestion?.dimensions)
          ? response.aiSuggestion.dimensions
          : Array.isArray((answer.question.metadata as Record<string, any> | null)?.criticalThinkingDimensions)
            ? (answer.question.metadata as Record<string, any>).criticalThinkingDimensions
            : [];
        const percentage = Number(response?.teacherReview?.score) && answer.question.points
          ? Math.round((Number(response?.teacherReview?.score) / Math.max(1, Number(answer.question.points))) * 100)
          : Number(response?.aiSuggestion?.percentage);

        if (!Number.isFinite(percentage)) {
          continue;
        }

        for (const dimension of dimensions) {
          const current = dimensionMap.get(dimension) || [];
          current.push(percentage);
          dimensionMap.set(dimension, current);
        }
      }

      return {
        id: attempt.id,
        title: locale === 'fa' ? (attempt.assessment.titleFA || attempt.assessment.title) : attempt.assessment.title,
        submittedAt: attempt.submittedAt,
        percentage: attempt.percentage,
        status: attempt.status,
        nextSteps: attempt.feedback?.nextSteps || null,
      };
    });

    const criticalThinkingProfile = Array.from(dimensionMap.entries()).map(([dimension, values]) => {
      const average = Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));
      return {
        dimension,
        label: locale === 'fa' ? (DIMENSION_LABELS[dimension]?.fa || dimension) : (DIMENSION_LABELS[dimension]?.en || dimension),
        average,
        band: scoreToBand(average),
        trend: average >= 75 ? 'IMPROVING' : average >= 50 ? 'STABLE' : 'NEEDS_SUPPORT',
        evidenceCount: values.length,
      };
    }).sort((left, right) => right.average - left.average);

    const summary = {
      studentName: displayName,
      gradeBand: student.profile?.gradeBand || null,
      averageMastery: masterySkills.length > 0
        ? Math.round(masterySkills.reduce((sum, skill) => sum + skill.masteryScore, 0) / masterySkills.length)
        : 0,
      masteryBand: scoreToBand(
        masterySkills.length > 0
          ? Math.round(masterySkills.reduce((sum, skill) => sum + skill.masteryScore, 0) / masterySkills.length)
          : 0,
      ),
      criticalThinkingAverage: criticalThinkingProfile.length > 0
        ? Math.round(criticalThinkingProfile.reduce((sum, item) => sum + item.average, 0) / criticalThinkingProfile.length)
        : 0,
      pendingReviews: attempts.filter((attempt) => attempt.status === 'SUBMITTED').length,
      completedAssessments: attempts.filter((attempt) => ['GRADED', 'REVIEWED'].includes(attempt.status)).length,
    };

    return NextResponse.json({
      summary,
      skills: masterySkills,
      criticalThinkingProfile,
      recentAssessments,
      nextSteps: recentAssessments.map((assessment) => assessment.nextSteps).filter(Boolean).slice(0, 3),
    });
  } catch (error) {
    console.error('Error fetching student marksheet:', error);
    return NextResponse.json({ error: 'Failed to fetch marksheet' }, { status: 500 });
  }
}
