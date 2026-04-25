import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/v1/gamification/xp - Get user XP and level
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get XP ledger entries
    const xpEntries = await prisma.xPLedger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Calculate total XP
    const totalXP = xpEntries.reduce((sum: number, entry: any) => sum + entry.points, 0);

    // Calculate level using formula: XP = 100 * level^1.35
    const calculateLevel = (xp: number): number => {
      let level = 1;
      let requiredXP = 100;
      
      while (xp >= requiredXP) {
        level++;
        requiredXP = Math.floor(100 * Math.pow(level, 1.35));
      }
      
      return level - 1;
    };

    const level = calculateLevel(totalXP);
    const currentLevelXP = Math.floor(100 * Math.pow(level, 1.35));
    const nextLevelXP = Math.floor(100 * Math.pow(level + 1, 1.35));
    const progressToNextLevel = totalXP - currentLevelXP;
    const xpNeededForNextLevel = nextLevelXP - currentLevelXP;

    return NextResponse.json({
      totalXP,
      level,
      progressToNextLevel,
      xpNeededForNextLevel,
      percentToNextLevel: Math.round((progressToNextLevel / xpNeededForNextLevel) * 100),
      recentActivity: xpEntries.slice(0, 10),
    });
  } catch (error) {
    console.error('Error fetching XP:', error);
    return NextResponse.json(
      { error: 'Failed to fetch XP data' },
      { status: 500 }
    );
  }
}

// POST /api/v1/gamification/xp - Award XP to user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, points, eventType, sourceId, sourceType, multiplier } = body;

    if (!userId || typeof points !== 'number' || !eventType) {
      return NextResponse.json(
        { error: 'userId, points, and eventType are required' },
        { status: 400 }
      );
    }

    // Create XP entry
    const xpEntry = await prisma.xPLedger.create({
      data: {
        userId,
        points,
        eventType,
        sourceId,
        sourceType,
        multiplier: typeof multiplier === 'number' ? multiplier : 1.0,
      },
    });

    // Calculate new total and level
    const allEntries = await prisma.xPLedger.findMany({
      where: { userId },
    });
    
    const newTotal = allEntries.reduce((sum: number, entry: any) => sum + entry.points, 0);
    
    const calculateLevel = (xp: number): number => {
      let level = 1;
      let requiredXP = 100;
      while (xp >= requiredXP) {
        level++;
        requiredXP = Math.floor(100 * Math.pow(level, 1.35));
      }
      return level - 1;
    };

    const newLevel = calculateLevel(newTotal);

    // Check for level up and award badge if needed
    // TODO: Implement badge awarding logic

    return NextResponse.json({
      message: 'XP awarded successfully',
      xpEntry,
      newTotal,
      newLevel,
    });
  } catch (error) {
    console.error('Error awarding XP:', error);
    return NextResponse.json(
      { error: 'Failed to award XP' },
      { status: 500 }
    );
  }
}
