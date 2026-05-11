import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

const checkinSchema = z.object({
  userId: z.string(),
  moodScore: z.number().min(1).max(5),
  energyLevel: z.number().min(1).max(5).optional(),
  stressLevel: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  selectedEmotions: z.array(z.string()).optional(),
  locale: z.enum(['en', 'fa']).optional(),
});

type FallbackCheckin = {
  id: string;
  userId: string;
  moodScore: number;
  energyLevel?: number;
  stressLevel?: number;
  notes?: string;
  createdAt: string;
};

const fallbackFilePath = path.join(process.cwd(), 'data', 'wellbeing_checkins.json');

async function readFallbackCheckins(): Promise<FallbackCheckin[]> {
  try {
    const raw = await fs.readFile(fallbackFilePath, 'utf-8');
    return JSON.parse(raw) as FallbackCheckin[];
  } catch {
    return [];
  }
}

async function writeFallbackCheckins(checkins: FallbackCheckin[]): Promise<void> {
  await fs.mkdir(path.dirname(fallbackFilePath), { recursive: true });
  await fs.writeFile(fallbackFilePath, JSON.stringify(checkins, null, 2), 'utf-8');
}

function calculateStats(checkins: Array<{ moodScore: number; energyLevel?: number; createdAt: Date | string }>) {
  const averageMood = checkins.length > 0
    ? checkins.reduce((sum, c) => sum + c.moodScore, 0) / checkins.length
    : 0;

  const withEnergy = checkins.filter((c) => typeof c.energyLevel === 'number');
  const averageEnergy = withEnergy.length > 0
    ? withEnergy.reduce((sum, c) => sum + (c.energyLevel || 0), 0) / withEnergy.length
    : 0;

  return {
    averageMood,
    averageEnergy,
    totalCheckins: checkins.length,
    streakDays: calculateCheckinStreak(checkins.map((c) => new Date(c.createdAt))),
  };
}

// GET /api/v1/wellbeing/checkins - Get user check-ins
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '30');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const where: any = { userId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    try {
      const checkins = await prisma.wellbeingCheckin.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return NextResponse.json({
        checkins,
        stats: calculateStats(checkins as Array<{ moodScore: number; energyLevel?: number; createdAt: Date | string }>),
        storage: 'database',
      });
    } catch {
      const fallback = await readFallbackCheckins();
      const filtered = fallback
        .filter((c) => c.userId === userId)
        .filter((c) => {
          const d = new Date(c.createdAt);
          if (startDate && d < new Date(startDate)) return false;
          if (endDate && d > new Date(endDate)) return false;
          return true;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);

      return NextResponse.json({
        checkins: filtered,
        stats: calculateStats(filtered),
        storage: 'fallback-file',
      });
    }
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 }
    );
  }
}

// POST /api/v1/wellbeing/checkins - Create new check-in
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = checkinSchema.parse(body);

    try {
      // Ensure user exists (helpful in demo/dev flows where auth is mocked)
      const existingUser = await prisma.user.findUnique({ where: { id: data.userId } });
      if (!existingUser) {
        await prisma.user.create({
          data: {
            id: data.userId,
            preferredLanguage: data.locale === 'fa' ? 'FA' : 'EN',
          },
        });
      }

    // Check if user already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

      const existingCheckin = await prisma.wellbeingCheckin.findFirst({
        where: {
          userId: data.userId,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      if (existingCheckin) {
        // Update existing check-in
        const updated = await prisma.wellbeingCheckin.update({
          where: { id: existingCheckin.id },
          data: {
            moodScore: data.moodScore,
            energyLevel: data.energyLevel,
            stressLevel: data.stressLevel,
            notes: data.notes,
          },
        });

        return NextResponse.json({
          message: 'Check-in updated',
          checkin: updated,
          storage: 'database',
        });
      }

    // Create new check-in
      const checkin = await prisma.wellbeingCheckin.create({
        data: {
          userId: data.userId,
          moodScore: data.moodScore,
          energyLevel: data.energyLevel,
          stressLevel: data.stressLevel,
          notes: data.notes,
        },
      });

    // Award XP for daily check-in
      await prisma.xPLedger.create({
        data: {
          userId: data.userId,
          points: 10,
          eventType: 'DAILY_CHECKIN',
          sourceId: checkin.id,
          sourceType: 'wellbeing_checkin',
          multiplier: 1.0,
        },
      });

      return NextResponse.json({
        message: 'Check-in created',
        checkin,
        xpAwarded: 10,
        storage: 'database',
      });
    } catch {
      // Fallback persistence when DB is unavailable
      const checkins = await readFallbackCheckins();
      const todayKey = new Date().toDateString();
      const existingIdx = checkins.findIndex(
        (c) => c.userId === data.userId && new Date(c.createdAt).toDateString() === todayKey
      );

      const fallbackCheckin: FallbackCheckin = {
        id: existingIdx >= 0 ? checkins[existingIdx].id : `local-${Date.now()}`,
        userId: data.userId,
        moodScore: data.moodScore,
        energyLevel: data.energyLevel,
        stressLevel: data.stressLevel,
        notes: data.notes,
        createdAt: existingIdx >= 0 ? checkins[existingIdx].createdAt : new Date().toISOString(),
      };

      if (existingIdx >= 0) checkins[existingIdx] = fallbackCheckin;
      else checkins.push(fallbackCheckin);

      await writeFallbackCheckins(checkins);

      return NextResponse.json({
        message: existingIdx >= 0 ? 'Check-in updated (fallback storage)' : 'Check-in created (fallback storage)',
        checkin: fallbackCheckin,
        xpAwarded: 10,
        storage: 'fallback-file',
      });
    }
  } catch (error) {
    console.error('Error creating check-in:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create check-in' },
      { status: 500 }
    );
  }
}

// Helper function to calculate check-in streak
function calculateCheckinStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  // Sort dates in descending order (most recent first)
  const sortedDates = dates
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedDates.length; i++) {
    const checkDate = new Date(sortedDates[i]);
    checkDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (checkDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else if (i === 0) {
      // First day doesn't match today - check if it was yesterday
      expectedDate.setDate(expectedDate.getDate() - 1);
      if (checkDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return streak;
}
