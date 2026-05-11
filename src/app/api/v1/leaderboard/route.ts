import { NextRequest, NextResponse } from 'next/server';
import { RoleName } from '@prisma/client';
import prisma from '@/lib/db';
import { calculateLevel } from '@/lib/gamification/xp-system';

const prismaClient = prisma as any;

type RankingRow = {
  id: string;
  name: string;
  xp: number;
  totalXP: number;
  level: number;
  streak: number;
  change: number;
  mastery: number;
  avatar: string;
};

function getRangeDates(range: string) {
  const end = new Date();
  const start = new Date();

  if (range === 'week') {
    start.setDate(end.getDate() - 7);
  } else if (range === 'month') {
    start.setDate(end.getDate() - 30);
  } else {
    start.setFullYear(2020, 0, 1);
  }

  const previousEnd = new Date(start);
  const previousStart = new Date(start);

  if (range === 'week') {
    previousStart.setDate(previousEnd.getDate() - 7);
  } else if (range === 'month') {
    previousStart.setDate(previousEnd.getDate() - 30);
  } else {
    previousStart.setFullYear(2019, 0, 1);
  }

  return { start, end, previousStart, previousEnd };
}

function getDateKey(date: Date) {
  return new Date(date).toISOString().slice(0, 10);
}

function calculateStreak(activityDates: string[]) {
  if (activityDates.length === 0) return 0;

  const uniqueDates = Array.from(new Set(activityDates)).sort((a, b) => b.localeCompare(a));
  let streak = 0;
  const cursor = new Date();

  for (let index = 0; index < uniqueDates.length; index += 1) {
    const expectedDate = getDateKey(cursor);
    if (uniqueDates[index] !== expectedDate) {
      if (index === 0) {
        cursor.setDate(cursor.getDate() - 1);
        if (uniqueDates[index] !== getDateKey(cursor)) {
          break;
        }
      } else {
        break;
      }
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';
    const range = searchParams.get('range') || 'week';
    const { start, end, previousStart, previousEnd } = getRangeDates(range);

    const studentLinks = await prismaClient.userRole.findMany({
      where: {
        role: {
          name: RoleName.STUDENT,
        },
      },
      select: {
        userId: true,
      },
    });

    const studentIds = Array.from(new Set(studentLinks.map((entry: { userId: string }) => entry.userId)));

    const [students, currentXP, previousXP, totalXP, recentActivity, masteryRecords] = await Promise.all([
      prismaClient.user.findMany({
        where: {
          id: { in: studentIds },
        },
        include: {
          profile: true,
        },
      }),
      prismaClient.xPLedger.groupBy({
        by: ['userId'],
        where: {
          userId: { in: studentIds },
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        _sum: { points: true },
      }),
      prismaClient.xPLedger.groupBy({
        by: ['userId'],
        where: {
          userId: { in: studentIds },
          createdAt: {
            gte: previousStart,
            lt: previousEnd,
          },
        },
        _sum: { points: true },
      }),
      prismaClient.xPLedger.groupBy({
        by: ['userId'],
        where: {
          userId: { in: studentIds },
        },
        _sum: { points: true },
      }),
      prismaClient.xPLedger.findMany({
        where: {
          userId: { in: studentIds },
          createdAt: {
            gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          userId: true,
          createdAt: true,
        },
      }),
      prismaClient.skillMastery.findMany({
        where: {
          userId: { in: studentIds },
        },
        select: {
          userId: true,
          masteryScore: true,
        },
      }),
    ]);

    const currentXPMap = new Map<string, number>(currentXP.map((entry: any) => [entry.userId, Number(entry._sum.points || 0)]));
    const previousXPMap = new Map<string, number>(previousXP.map((entry: any) => [entry.userId, Number(entry._sum.points || 0)]));
    const totalXPMap = new Map<string, number>(totalXP.map((entry: any) => [entry.userId, Number(entry._sum.points || 0)]));
    const activityMap = new Map<string, string[]>();
    const masteryMap = new Map<string, number[]>();

    for (const item of recentActivity) {
      const activityDates = activityMap.get(item.userId) || [];
      activityDates.push(getDateKey(item.createdAt));
      activityMap.set(item.userId, activityDates);
    }

    for (const record of masteryRecords) {
      const scores = masteryMap.get(record.userId) || [];
      scores.push(record.masteryScore || 0);
      masteryMap.set(record.userId, scores);
    }

    const rankings = students
      .map((student: any): RankingRow => {
        const displayName = student.profile?.displayName || [student.profile?.firstName, student.profile?.lastName].filter(Boolean).join(' ') || student.email || 'Student';
        const xp = currentXPMap.get(student.id) || 0;
        const previous = previousXPMap.get(student.id) || 0;
        const total = totalXPMap.get(student.id) || 0;
        const scores = masteryMap.get(student.id) || [];
        const averageMastery = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;

        return {
          id: student.id,
          name: displayName,
          xp,
          totalXP: total,
          level: calculateLevel(total),
          streak: calculateStreak(activityMap.get(student.id) || []),
          change: xp - previous,
          mastery: averageMastery,
          avatar: (displayName.charAt(0) || 'S').toUpperCase(),
        };
      })
      .filter((student: RankingRow) => student.xp > 0 || student.totalXP > 0 || student.mastery > 0)
      .sort((a: RankingRow, b: RankingRow) => b.xp - a.xp || b.totalXP - a.totalXP || b.mastery - a.mastery)
      .map((student: RankingRow, index: number) => ({
        ...student,
        rank: index + 1,
        rankLabel: locale === 'fa' ? `رتبه ${index + 1}` : `Rank ${index + 1}`,
      }));

    return NextResponse.json({
      range,
      rankings,
      summary: {
        totalParticipants: rankings.length,
        maxXP: rankings[0]?.xp || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
