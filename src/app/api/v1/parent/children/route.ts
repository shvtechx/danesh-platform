import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserTotalXP, calculateLevel } from '@/lib/gamification/xp-system';
import { resolveRequestUserId } from '@/lib/auth/request-user';

/**
 * GET /api/v1/parent/children
 * Get all children linked to parent account with their progress summary
 */
export async function GET(request: NextRequest) {
  try {
    const parentId = resolveRequestUserId(request);

    if (!parentId) {
      return NextResponse.json({ children: [] });
    }

    // Get all linked children
    const links = await prisma.parentStudentLink.findMany({
      where: {
        parentId,
        status: 'CONFIRMED' // Using LinkStatus enum
      }
    });

    // For each child, get their data separately
    const childrenData = await Promise.all(
      links.map(async (link) => {
        const studentId = link.studentId;

        // Get student user and profile
        const student = await prisma.user.findUnique({
          where: { id: studentId },
          include: { profile: true }
        });

        if (!student) return null;

        // Get total XP and level
        const totalXP = await getUserTotalXP(studentId);
        const currentLevel = calculateLevel(totalXP);

        // Get lesson completions
        const completions = await prisma.lessonCompletion.findMany({
          where: {
            userId: studentId,
            completedAt: { not: null }
          }
        });

        // Get recent wellbeing check-ins
        const recentCheckins = await prisma.wellbeingCheckin.findMany({
          where: { userId: studentId },
          orderBy: { createdAt: 'desc' },
          take: 7
        });

        // Get badges earned
        const badgeCount = await prisma.userBadge.count({
          where: { userId: studentId }
        });

        // Calculate average time spent per day (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentCompletions = await prisma.lessonCompletion.findMany({
          where: {
            userId: studentId,
            completedAt: { gte: sevenDaysAgo, not: null }
          },
          select: {
            timeSpent: true
          }
        });

        const totalTimeSpent = recentCompletions.reduce(
          (sum, c) => sum + (c.timeSpent || 0),
          0
        );
        const avgTimePerDay = Math.round(totalTimeSpent / 7);

        return {
          id: student.id,
          firstName: student.profile?.firstName || 'Student',
          lastName: student.profile?.lastName || '',
          avatarUrl: student.profile?.avatarUrl,
          gradeBand: student.profile?.gradeBand,
          relationship: link.relationship,
          stats: {
            totalXP,
            currentLevel,
            lessonsCompleted: completions.length,
            badgesEarned: badgeCount,
            avgTimePerDay, // in seconds
            recentMood: recentCheckins[0]?.moodScore || null,
            moodTrend: recentCheckins.slice(0, 7).map(c => ({
              date: c.createdAt,
              mood: c.moodScore
            }))
          }
        };
      })
    );

    return NextResponse.json({
      children: childrenData.filter(c => c !== null)
    });
  } catch (error) {
    console.error('Error fetching children data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch children data' },
      { status: 500 }
    );
  }
}
