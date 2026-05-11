import { prisma } from '@/lib/db';

/**
 * XP Calculation System
 * Based on GAMIFICATION_DESIGN.md formulas
 */

// Base XP values
export const BASE_XP = {
  COMPLETE_LESSON: 50,
  COMPLETE_ASSESSMENT: 100,
  PERFECT_SCORE: 150,
  COMPLETE_CONTENT_ITEM: 10,
  LOGIN_STREAK: 10, // per day
  HELP_PEER: 25,
  COMPLETE_QUEST: 200,
};

// Difficulty multipliers
export const DIFFICULTY_MULTIPLIER = {
  EASY: 1.0,
  MEDIUM: 1.3,
  HARD: 1.6,
  EXPERT: 2.0,
};

// Bloom's Level multipliers
export const BLOOM_MULTIPLIER = {
  REMEMBER: 1.0,
  UNDERSTAND: 1.2,
  APPLY: 1.4,
  ANALYZE: 1.6,
  EVALUATE: 1.8,
  CREATE: 2.0,
};

// 5E Phase multipliers
export const PHASE_MULTIPLIER = {
  '5E_ENGAGE': 1.0,
  '5E_EXPLORE': 1.2,
  '5E_EXPLAIN': 1.0,
  '5E_ELABORATE': 1.5,
  '5E_EVALUATE': 1.3,
};

interface XPCalculationParams {
  baseActivity: keyof typeof BASE_XP;
  difficulty?: keyof typeof DIFFICULTY_MULTIPLIER;
  bloomLevel?: keyof typeof BLOOM_MULTIPLIER;
  phase5E?: keyof typeof PHASE_MULTIPLIER;
  score?: number; // For assessments (0-100)
  streak?: number; // For login streaks
  isPerfect?: boolean; // Bonus for 100% scores
}

/**
 * Calculate XP for an activity
 */
export function calculateXP(params: XPCalculationParams): number {
  let xp = BASE_XP[params.baseActivity];

  // For streak bonuses
  if (params.streak) {
    xp = xp * params.streak;
  }

  // For assessment scores
  if (params.score !== undefined) {
    xp = params.score * 2; // 2 XP per point scored
  }

  // Apply difficulty multiplier
  if (params.difficulty) {
    xp = xp * DIFFICULTY_MULTIPLIER[params.difficulty];
  }

  // Apply Bloom's level multiplier
  if (params.bloomLevel) {
    xp = xp * BLOOM_MULTIPLIER[params.bloomLevel];
  }

  // Apply 5E phase multiplier
  if (params.phase5E) {
    xp = xp * PHASE_MULTIPLIER[params.phase5E];
  }

  // Perfect score bonus
  if (params.isPerfect) {
    xp = xp * 1.5;
  }

  return Math.round(xp);
}

/**
 * Calculate level from total XP
 * Level formula: level = floor(sqrt(totalXP / 100))
 */
export function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100));
}

/**
 * Calculate XP needed for next level
 */
export function xpForNextLevel(currentLevel: number): number {
  const nextLevel = currentLevel + 1;
  return Math.pow(nextLevel, 2) * 100;
}

/**
 * Calculate XP progress to next level
 */
export function xpProgressToNextLevel(totalXP: number): {
  currentLevel: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercentage: number;
} {
  const currentLevel = calculateLevel(totalXP);
  const xpAtCurrentLevel = Math.pow(currentLevel, 2) * 100;
  const xpAtNextLevel = xpForNextLevel(currentLevel);

  const xpInCurrentLevel = totalXP - xpAtCurrentLevel;
  const xpNeededForNextLevel = xpAtNextLevel - xpAtCurrentLevel;
  const progressPercentage = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

  return {
    currentLevel,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progressPercentage: Math.min(progressPercentage, 100),
  };
}

/**
 * Award XP to a student
 */
export async function awardXP(userId: string, xp: number, reason: string) {
  try {
    // Log XP transaction
    await prisma.xPLedger.create({
      data: {
        userId,
        points: xp,
        eventType: 'LESSON_COMPLETE', // Fixed to match enum
        sourceType: reason,
      },
    });

    // Calculate total XP
    const ledger = await prisma.xPLedger.groupBy({
      by: ['userId'],
      where: { userId },
      _sum: { points: true },
    });

    const totalXP = ledger[0]?._sum?.points || xp;
    const newLevel = calculateLevel(totalXP);

    return {
      success: true,
      totalXP,
      level: newLevel,
      xpAwarded: xp,
    };
  } catch (error) {
    console.error('Error awarding XP:', error);
    return {
      success: false,
      error: 'Failed to award XP',
    };
  }
}

/**
 * Update login streak
 */
export async function updateLoginStreak(userId: string) {
  try {
    // For now, just award streak bonus XP
    // TODO: Implement proper streak tracking in future iteration
    const xpAwarded = calculateXP({
      baseActivity: 'LOGIN_STREAK',
      streak: 1,
    });

    await awardXP(userId, xpAwarded, 'login_streak');

    return { currentStreak: 1, xpAwarded };
  } catch (error) {
    console.error('Error updating login streak:', error);
    return { currentStreak: 0, xpAwarded: 0 };
  }
}

/**
 * Get total XP for a user
 */
export async function getUserTotalXP(userId: string): Promise<number> {
  const ledger = await prisma.xPLedger.groupBy({
    by: ['userId'],
    where: { userId },
    _sum: { points: true },
  });

  return ledger[0]?._sum?.points || 0;
}
