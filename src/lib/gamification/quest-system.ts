import prisma from '@/lib/db';
import { QuestStatus } from '@prisma/client';
import { awardXP } from './xp-system';

/**
 * Quest Step Criteria Interface
 * Defines completion requirements for each quest step
 */
export interface QuestStepCriteria {
  type:
    | 'lesson_count'
    | 'assessment_count'
    | 'assessment_score'
    | 'badge_count'
    | 'login_streak'
    | 'time_spent'
    | 'perfect_quizzes';
  value: number;
  subjectCode?: string;
  phase?: string;
  minScore?: number;
}

/**
 * Check if a user has completed a specific quest step
 */
export async function checkQuestStepCompletion(
  userId: string,
  criteria: QuestStepCriteria
): Promise<{ completed: boolean; progress: number; target: number }> {
  let completed = false;
  let progress = 0;
  const target = criteria.value;

  try {
    switch (criteria.type) {
      case 'lesson_count': {
        const filter: any = { userId };
        if (criteria.subjectCode) {
          filter.lesson = {
            unit: {
              course: {
                subjectCode: criteria.subjectCode,
              },
            },
          };
        }
        if (criteria.phase) {
          filter.lesson = {
            ...filter.lesson,
            phase5E: criteria.phase,
          };
        }
        progress = await prisma.lessonCompletion.count({ where: filter });
        completed = progress >= target;
        break;
      }

      case 'assessment_count': {
        const filter: any = {
          userId,
          status: 'SUBMITTED',
        };
        if (criteria.subjectCode) {
          filter.assessment = {
            subjectCode: criteria.subjectCode,
          };
        }
        progress = await prisma.studentAttempt.count({ where: filter });
        completed = progress >= target;
        break;
      }

      case 'assessment_score': {
        const filter: any = {
          userId,
          status: 'SUBMITTED',
        };
        if (criteria.minScore) {
          filter.score = { gte: criteria.minScore };
        }
        if (criteria.subjectCode) {
          filter.assessment = {
            subjectCode: criteria.subjectCode,
          };
        }
        progress = await prisma.studentAttempt.count({ where: filter });
        completed = progress >= target;
        break;
      }

      case 'badge_count': {
        progress = await prisma.userBadge.count({ where: { userId } });
        completed = progress >= target;
        break;
      }

      case 'login_streak': {
        // Check consecutive days with XP activity
        const xpLogs = await prisma.xPLedger.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 30,
        });

        let currentStreak = 0;
        let lastDate: Date | null = null;

        for (const log of xpLogs) {
          const logDate = new Date(log.createdAt);
          logDate.setHours(0, 0, 0, 0);

          if (!lastDate) {
            currentStreak = 1;
            lastDate = logDate;
          } else {
            const dayDiff = Math.floor(
              (lastDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (dayDiff === 1) {
              currentStreak++;
              lastDate = logDate;
            } else if (dayDiff === 0) {
              // Same day, continue
              continue;
            } else {
              // Streak broken
              break;
            }
          }
        }

        progress = currentStreak;
        completed = progress >= target;
        break;
      }

      case 'perfect_quizzes': {
        const attempts = await prisma.studentAttempt.findMany({
          where: {
            userId,
            status: 'SUBMITTED',
            assessment: {
              type: 'FORMATIVE',
            },
          },
          include: {
            assessment: {
              include: {
                questions: {
                  include: {
                    question: true,
                  },
                },
              },
            },
          },
        });

        let perfectCount = 0;
        for (const attempt of attempts) {
          // Calculate max score from questions
          const maxScore = attempt.assessment.questions.reduce(
            (sum, q) => sum + (q.question.points || 1),
            0
          );
          if (attempt.score === maxScore) {
            perfectCount++;
          }
        }

        progress = perfectCount;
        completed = progress >= target;
        break;
      }

      case 'time_spent': {
        const completions = await prisma.lessonCompletion.findMany({
          where: { userId },
          select: { timeSpent: true },
        });
        // Convert seconds to minutes
        progress = completions.reduce(
          (sum, c) => sum + Math.floor((c.timeSpent || 0) / 60),
          0
        );
        completed = progress >= target;
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error('Error checking quest step completion:', error);
  }

  return { completed, progress, target };
}

/**
 * Start a quest for a user
 */
export async function startQuest(
  userId: string,
  questId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if quest exists and is active
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      include: { steps: { orderBy: { sequence: 'asc' } } },
    });

    if (!quest) {
      return { success: false, error: 'Quest not found' };
    }

    if (!quest.isActive) {
      return { success: false, error: 'Quest is not active' };
    }

    // Check if already started
    const existing = await prisma.userQuestProgress.findUnique({
      where: {
        userId_questId: { userId, questId },
      },
    });

    if (existing && existing.status !== QuestStatus.EXPIRED) {
      return { success: false, error: 'Quest already started' };
    }

    // Create or update progress
    await prisma.userQuestProgress.upsert({
      where: {
        userId_questId: { userId, questId },
      },
      update: {
        status: QuestStatus.IN_PROGRESS,
        currentStep: 0,
        startedAt: new Date(),
        stepProgress: {},
      },
      create: {
        userId,
        questId,
        status: QuestStatus.IN_PROGRESS,
        currentStep: 0,
        startedAt: new Date(),
        stepProgress: {},
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error starting quest:', error);
    return { success: false, error: 'Failed to start quest' };
  }
}

/**
 * Update quest progress after a user action
 */
export async function updateQuestProgress(
  userId: string,
  action: 'lesson_complete' | 'assessment_complete' | 'badge_earned' | 'login'
): Promise<string[]> {
  const completedQuests: string[] = [];

  try {
    // Get all in-progress quests
    const userQuests = await prisma.userQuestProgress.findMany({
      where: {
        userId,
        status: QuestStatus.IN_PROGRESS,
      },
      include: {
        quest: {
          include: {
            steps: { orderBy: { sequence: 'asc' } },
          },
        },
      },
    });

    for (const userQuest of userQuests) {
      const quest = userQuest.quest;
      const currentStepIndex = userQuest.currentStep;

      // Check if quest has expired
      if (quest.endDate && new Date() > quest.endDate) {
        await prisma.userQuestProgress.update({
          where: { id: userQuest.id },
          data: { status: QuestStatus.EXPIRED },
        });
        continue;
      }

      // Get current step
      const currentStep = quest.steps[currentStepIndex];
      if (!currentStep) continue;

      const criteria = currentStep.criteria as unknown as QuestStepCriteria;

      // Check if step is completed
      const stepCompletion = await checkQuestStepCompletion(userId, criteria);

      if (stepCompletion.completed) {
        // Award step XP
        if (currentStep.xpReward > 0) {
          await awardXP(
            userId,
            currentStep.xpReward,
            `Quest step: ${quest.title} - Step ${currentStepIndex + 1}`
          );
        }

        // Move to next step
        const nextStepIndex = currentStepIndex + 1;

        if (nextStepIndex >= quest.steps.length) {
          // Quest completed!
          await prisma.userQuestProgress.update({
            where: { id: userQuest.id },
            data: {
              status: QuestStatus.COMPLETED,
              completedAt: new Date(),
              currentStep: nextStepIndex,
            },
          });

          // Award quest completion rewards
          if (quest.xpReward > 0) {
            await awardXP(userId, quest.xpReward, `Quest completed: ${quest.title}`);
          }

          // Award coins if applicable
          if (quest.coinReward > 0) {
            await prisma.virtualWallet.upsert({
              where: { userId },
              update: {
                coins: { increment: quest.coinReward },
              },
              create: {
                userId,
                coins: quest.coinReward,
                gems: 0,
              },
            });

            await prisma.virtualTransaction.create({
              data: {
                walletId: (await prisma.virtualWallet.findUnique({ where: { userId } }))!.id,
                type: 'EARN',
                amount: quest.coinReward,
                currency: 'COINS',
                description: `Quest completed: ${quest.title}`,
              },
            });
          }

          completedQuests.push(quest.code);
        } else {
          // Move to next step
          await prisma.userQuestProgress.update({
            where: { id: userQuest.id },
            data: {
              currentStep: nextStepIndex,
              stepProgress: {},
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error updating quest progress:', error);
  }

  return completedQuests;
}

/**
 * Get all active quests for a user
 */
export async function getUserQuests(userId: string): Promise<{
  active: any[];
  completed: any[];
  available: any[];
}> {
  try {
    const now = new Date();

    // Get user's quest progress
    const userProgress = await prisma.userQuestProgress.findMany({
      where: { userId },
      include: {
        quest: {
          include: {
            steps: { orderBy: { sequence: 'asc' } },
          },
        },
      },
    });

    // Get all active quests
    const allQuests = await prisma.quest.findMany({
      where: {
        isActive: true,
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: {
        steps: { orderBy: { sequence: 'asc' } },
      },
    });

    const active: any[] = [];
    const completed: any[] = [];
    const available: any[] = [];

    // Process user progress
    for (const up of userProgress) {
      const currentStep = up.quest.steps[up.currentStep];
      let stepProgress = null;

      if (currentStep && up.status === QuestStatus.IN_PROGRESS) {
        const criteria = currentStep.criteria as unknown as QuestStepCriteria;
        stepProgress = await checkQuestStepCompletion(userId, criteria);
      }

      const questData = {
        ...up.quest,
        userProgress: {
          status: up.status,
          currentStep: up.currentStep,
          startedAt: up.startedAt,
          completedAt: up.completedAt,
          stepProgress,
        },
      };

      if (up.status === QuestStatus.COMPLETED) {
        completed.push(questData);
      } else if (up.status === QuestStatus.IN_PROGRESS) {
        active.push(questData);
      }
    }

    // Find available quests (not started yet)
    const startedQuestIds = userProgress.map((up) => up.questId);
    for (const quest of allQuests) {
      if (!startedQuestIds.includes(quest.id)) {
        available.push(quest);
      }
    }

    return { active, completed, available };
  } catch (error) {
    console.error('Error getting user quests:', error);
    return { active: [], completed: [], available: [] };
  }
}

/**
 * Expire old quests
 */
export async function expireOldQuests(): Promise<number> {
  try {
    const now = new Date();

    const result = await prisma.userQuestProgress.updateMany({
      where: {
        status: { in: [QuestStatus.NOT_STARTED, QuestStatus.IN_PROGRESS] },
        quest: {
          endDate: { lt: now },
        },
      },
      data: {
        status: QuestStatus.EXPIRED,
      },
    });

    return result.count;
  } catch (error) {
    console.error('Error expiring old quests:', error);
    return 0;
  }
}
