import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserTotalXP, calculateLevel, xpProgressToNextLevel } from '@/lib/gamification/xp-system';
import { resolveRequestUserId } from '@/lib/auth/request-user';

/**
 * GET /api/v1/parent/[childId]/progress
 * Get detailed progress for a specific child
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { childId: string } }
) {
  try {
    const studentId = params.childId;
    const parentId = resolveRequestUserId(request);

    if (!parentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const link = await prisma.parentStudentLink.findFirst({
      where: {
        parentId,
        studentId,
        status: 'CONFIRMED',
      },
    });

    if (!link) {
      return NextResponse.json({ error: 'Child not linked to parent account' }, { status: 403 });
    }

    // Get total XP and level
    const totalXP = await getUserTotalXP(studentId);
    const levelProgress = xpProgressToNextLevel(totalXP);

    // Get lesson completions with time spent by subject
    const completions = await prisma.lessonCompletion.findMany({
      where: {
        userId: studentId,
        completedAt: { not: null }
      },
      include: {
        lesson: {
          include: {
            unit: {
              include: {
                course: {
                  include: {
                    subject: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Group by subject
    const subjectStats: Record<string, any> = {};
    completions.forEach(completion => {
      const subject = completion.lesson.unit.course.subject;
      if (!subjectStats[subject.code]) {
        subjectStats[subject.code] = {
          code: subject.code,
          name: subject.name,
          nameFA: subject.nameFA,
          icon: subject.icon,
          color: subject.color,
          lessonsCompleted: 0,
          totalTimeSpent: 0,
          avgMasteryScore: 0,
          masteryScores: []
        };
      }
      subjectStats[subject.code].lessonsCompleted++;
      subjectStats[subject.code].totalTimeSpent += completion.timeSpent || 0;
      if (completion.masteryScore !== null) {
        subjectStats[subject.code].masteryScores.push(completion.masteryScore);
      }
    });

    // Calculate averages
    Object.values(subjectStats).forEach((stat: any) => {
      if (stat.masteryScores.length > 0) {
        stat.avgMasteryScore = Math.round(
          stat.masteryScores.reduce((a: number, b: number) => a + b, 0) / stat.masteryScores.length
        );
      }
      delete stat.masteryScores; // Remove array from response
    });

    // Get wellbeing check-ins (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const wellbeingCheckins = await prisma.wellbeingCheckin.findMany({
      where: {
        userId: studentId,
        createdAt: { gte: thirtyDaysAgo }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get recent assessment attempts
    const assessmentAttempts = await prisma.studentAttempt.findMany({
      where: { userId: studentId },
      include: {
        assessment: {
          select: {
            title: true,
            titleFA: true
          }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: 10
    });

    // Get badges
    const badges = await prisma.userBadge.findMany({
      where: { userId: studentId },
      include: {
        badge: true
      },
      orderBy: { earnedAt: 'desc' }
    });

    // Calculate weekly activity (lessons completed per day, last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyCompletions = await prisma.lessonCompletion.groupBy({
      by: ['completedAt'],
      where: {
        userId: studentId,
        completedAt: { gte: sevenDaysAgo, not: null }
      },
      _count: true
    });

    return NextResponse.json({
      student: {
        id: studentId,
        totalXP,
        currentLevel: levelProgress.currentLevel,
        xpProgress: levelProgress.progressPercentage
      },
      subjects: Object.values(subjectStats),
      wellbeing: {
        recentCheckins: wellbeingCheckins.map(c => ({
          date: c.createdAt,
          mood: c.moodScore,
          notes: c.notes,
          energyLevel: c.energyLevel,
          stressLevel: c.stressLevel
        })),
        avgMood: wellbeingCheckins.length > 0
          ? wellbeingCheckins.reduce((sum, c) => sum + (c.moodScore || 0), 0) / wellbeingCheckins.length
          : null
      },
      assessments: {
        recent: assessmentAttempts.map(a => ({
          id: a.id,
          title: a.assessment.title,
          titleFA: a.assessment.titleFA,
          score: a.score || 0,
          maxScore: a.maxScore || 0,
          percentage: a.maxScore && a.score ? Math.round((a.score / a.maxScore) * 100) : null,
          completedAt: a.submittedAt,
          timeSpent: a.timeSpent
        }))
      },
      badges: {
        total: badges.length,
        recent: badges.slice(0, 5).map(ub => ({
          name: ub.badge.name,
          nameFA: ub.badge.nameFA,
          icon: ub.badge.icon,
          category: ub.badge.category,
          earnedAt: ub.earnedAt
        }))
      },
      weeklyActivity: weeklyCompletions.map(wc => ({
        date: wc.completedAt,
        count: wc._count
      }))
    });
  } catch (error) {
    console.error('Error fetching child progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch child progress' },
      { status: 500 }
    );
  }
}
