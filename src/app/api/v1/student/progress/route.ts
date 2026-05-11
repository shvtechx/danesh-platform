import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserTotalXP, xpProgressToNextLevel } from '@/lib/gamification/xp-system';
import { resolveRequestUserId } from '@/lib/auth/request-user';

/**
 * GET /api/v1/student/progress
 * Get student's progress data (XP, badges, quests, subject mastery)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = resolveRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total XP and level
    const totalXP = await getUserTotalXP(userId);
    const levelProgress = xpProgressToNextLevel(totalXP);

    // Get badges earned
    const badges = await prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true
      },
      orderBy: { earnedAt: 'desc' }
    });

    // Get recent XP transactions
    const recentXP = await prisma.xPLedger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get active quests
    const questProgress = await prisma.userQuestProgress.findMany({
      where: {
        userId,
        status: 'IN_PROGRESS'
      },
      include: {
        quest: {
          include: {
            steps: true
          }
        }
      }
    });

    // Get lesson completions by 5E phase
    const lessonCompletions = await prisma.lessonCompletion.groupBy({
      by: ['lessonId'],
      where: {
        userId,
        completedAt: { not: null }
      },
      _count: true
    });

    // Get all completed lessons with phase data
    const completedLessonIds = lessonCompletions.map(lc => lc.lessonId);
    const lessons = await prisma.lesson.findMany({
      where: {
        id: { in: completedLessonIds }
      },
      select: {
        id: true,
        phase: true
      }
    });

    // Group by phase
    const phaseBreakdown = lessons.reduce((acc, lesson) => {
      acc[lesson.phase] = (acc[lesson.phase] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const subjectMastery: any[] = [];

    return NextResponse.json({
      xp: {
        total: totalXP,
        currentLevel: levelProgress.currentLevel,
        xpInCurrentLevel: levelProgress.xpInCurrentLevel,
        xpNeededForNextLevel: levelProgress.xpNeededForNextLevel,
        progressPercentage: levelProgress.progressPercentage
      },
      badges: {
        total: badges.length,
        recent: badges.slice(0, 5).map(ub => ({
          id: ub.badge.id,
          code: ub.badge.code,
          name: ub.badge.name,
          nameFA: ub.badge.nameFA,
          icon: ub.badge.icon,
          category: ub.badge.category,
          earnedAt: ub.earnedAt
        }))
      },
      quests: {
        active: questProgress.map(qp => ({
          id: qp.quest.id,
          title: qp.quest.title,
          titleFA: qp.quest.titleFA,
          completedSteps: Math.min(qp.currentStep, qp.quest.steps.length),
          totalSteps: qp.quest.steps.length,
          progress: qp.quest.steps.length > 0
            ? Math.round((Math.min(qp.currentStep, qp.quest.steps.length) / qp.quest.steps.length) * 100)
            : 0,
          xpReward: qp.quest.xpReward
        }))
      },
      phaseBreakdown: {
        '5E_ENGAGE': phaseBreakdown['5E_ENGAGE'] || 0,
        '5E_EXPLORE': phaseBreakdown['5E_EXPLORE'] || 0,
        '5E_EXPLAIN': phaseBreakdown['5E_EXPLAIN'] || 0,
        '5E_ELABORATE': phaseBreakdown['5E_ELABORATE'] || 0,
        '5E_EVALUATE': phaseBreakdown['5E_EVALUATE'] || 0,
        total: completedLessonIds.length
      },
      subjectMastery,
      recentActivity: recentXP.map(xp => ({
        points: xp.points,
        eventType: xp.eventType,
        sourceType: xp.sourceType,
        createdAt: xp.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching student progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress data' },
      { status: 500 }
    );
  }
}
