import { prisma } from '@/lib/db';
import { awardXP } from './xp-system';

/**
 * Badge Award Engine
 * Checks criteria and awards badges to students
 */

export interface BadgeCriteria {
  type: 'lesson_count' | 'streak' | 'assessment_score' | 'subject_mastery' | 'time_spent' | 'forum_posts' | 'quiz_perfect';
  value: number;
  subjectCode?: string;
  phase?: string;
}

/**
 * Check if user is eligible for a badge
 */
export async function checkBadgeEligibility(
  userId: string,
  badgeCode: string
): Promise<{ eligible: boolean; progress?: number; target?: number }> {
  try {
    // Get badge
    const badge = await prisma.badge.findUnique({
      where: { code: badgeCode }
    });

    if (!badge || !badge.isActive) {
      return { eligible: false };
    }

    // Check if already earned
    const existing = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId: badge.id
        }
      }
    });

    if (existing) {
      return { eligible: false }; // Already earned
    }

    // Parse criteria
    const criteria = badge.criteria as unknown as BadgeCriteria;

    switch (criteria.type) {
      case 'lesson_count': {
        const count = await prisma.lessonCompletion.count({
          where: {
            userId,
            completedAt: { not: null }
          }
        });
        return {
          eligible: count >= criteria.value,
          progress: count,
          target: criteria.value
        };
      }

      case 'streak': {
        // TODO: Implement proper streak tracking
        // For now, just check login count
        return { eligible: false, progress: 0, target: criteria.value };
      }

      case 'assessment_score': {
        const perfectScores = await prisma.studentAttempt.count({
          where: {
            userId,
            percentage: 100
          }
        });
        return {
          eligible: perfectScores >= criteria.value,
          progress: perfectScores,
          target: criteria.value
        };
      }

      case 'subject_mastery': {
        if (!criteria.subjectCode) return { eligible: false };

        const completions = await prisma.lessonCompletion.findMany({
          where: {
            userId,
            completedAt: { not: null },
            lesson: {
              unit: {
                course: {
                  subject: {
                    code: criteria.subjectCode
                  }
                }
              }
            }
          }
        });

        return {
          eligible: completions.length >= criteria.value,
          progress: completions.length,
          target: criteria.value
        };
      }

      case 'quiz_perfect': {
        const perfect = await prisma.studentAttempt.count({
          where: {
            userId,
            percentage: 100,
            assessment: {
              type: 'FORMATIVE'
            }
          }
        });
        return {
          eligible: perfect >= criteria.value,
          progress: perfect,
          target: criteria.value
        };
      }

      default:
        return { eligible: false };
    }
  } catch (error) {
    console.error('Error checking badge eligibility:', error);
    return { eligible: false };
  }
}

/**
 * Award a badge to a user
 */
export async function awardBadge(
  userId: string,
  badgeCode: string
): Promise<{ success: boolean; badge?: any; error?: string }> {
  try {
    // Check eligibility first
    const eligibility = await checkBadgeEligibility(userId, badgeCode);
    
    if (!eligibility.eligible) {
      return {
        success: false,
        error: 'User not eligible for this badge'
      };
    }

    // Get badge
    const badge = await prisma.badge.findUnique({
      where: { code: badgeCode }
    });

    if (!badge) {
      return { success: false, error: 'Badge not found' };
    }

    // Award badge
    const userBadge = await prisma.userBadge.create({
      data: {
        userId,
        badgeId: badge.id
      },
      include: {
        badge: true
      }
    });

    // Award XP if badge has XP reward
    if (badge.xpReward > 0) {
      await awardXP(userId, badge.xpReward, `Earned badge: ${badge.code}`);
    }

    // TODO: Trigger notification

    return {
      success: true,
      badge: userBadge
    };
  } catch (error) {
    console.error('Error awarding badge:', error);
    return {
      success: false,
      error: 'Failed to award badge'
    };
  }
}

/**
 * Get badge progress for a user (all badges)
 */
export async function getBadgeProgress(userId: string) {
  try {
    // Get all active badges
    const badges = await prisma.badge.findMany({
      where: { isActive: true }
    });

    // Check progress for each
    const progress = await Promise.all(
      badges.map(async (badge) => {
        const eligibility = await checkBadgeEligibility(userId, badge.code);
        const earned = await prisma.userBadge.findUnique({
          where: {
            userId_badgeId: {
              userId,
              badgeId: badge.id
            }
          }
        });

        return {
          badge: {
            id: badge.id,
            code: badge.code,
            name: badge.name,
            nameFA: badge.nameFA,
            description: badge.description,
            descriptionFA: badge.descriptionFA,
            icon: badge.icon,
            category: badge.category,
            rarity: badge.rarity,
            xpReward: badge.xpReward
          },
          earned: !!earned,
          earnedAt: earned?.earnedAt,
          progress: eligibility.progress || 0,
          target: eligibility.target || 0,
          progressPercentage: eligibility.target
            ? Math.min((eligibility.progress || 0) / eligibility.target * 100, 100)
            : 0
        };
      })
    );

    return progress;
  } catch (error) {
    console.error('Error getting badge progress:', error);
    return [];
  }
}

/**
 * Check for auto-awardable badges after an action
 */
export async function checkAndAwardBadges(
  userId: string,
  action: 'lesson_complete' | 'assessment_perfect' | 'subject_complete'
): Promise<string[]> {
  try {
    const awardedBadges: string[] = [];

    // Get all badges related to this action
    const badges = await prisma.badge.findMany({
      where: { isActive: true }
    });

    for (const badge of badges) {
      const criteria = badge.criteria as unknown as BadgeCriteria;

      // Only check relevant badges
      if (
        (action === 'lesson_complete' && criteria.type === 'lesson_count') ||
        (action === 'assessment_perfect' && (criteria.type === 'assessment_score' || criteria.type === 'quiz_perfect')) ||
        (action === 'subject_complete' && criteria.type === 'subject_mastery')
      ) {
        const result = await awardBadge(userId, badge.code);
        if (result.success) {
          awardedBadges.push(badge.code);
        }
      }
    }

    return awardedBadges;
  } catch (error) {
    console.error('Error checking and awarding badges:', error);
    return [];
  }
}
