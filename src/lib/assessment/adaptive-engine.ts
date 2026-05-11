/**
 * Adaptive Assessment Engine
 * 
 * Implements IRT (Item Response Theory) based adaptive assessment
 * with mastery learning and personalized question selection.
 * 
 * Based on the 2-parameter logistic (2PL) IRT model:
 * P(θ) = 1 / (1 + e^(-a(θ - b)))
 * 
 * Where:
 * θ (theta) = Student ability parameter
 * b = Question difficulty parameter
 * a = Question discrimination parameter
 */

import prisma from '@/lib/db';
import { MasteryStatus } from '@prisma/client';

/**
 * Calculate probability of correct response using 2PL IRT model
 */
export function calculateProbability(
  ability: number,
  difficulty: number,
  discrimination: number = 1.0
): number {
  const exponent = -discrimination * (ability - difficulty);
  return 1 / (1 + Math.exp(exponent));
}

/**
 * Update student ability estimate after a response
 * Using simple Bayesian update (can be replaced with MLE for better accuracy)
 */
export function updateAbility(
  currentAbility: number,
  wasCorrect: boolean,
  questionDifficulty: number,
  learningRate: number = 0.2
): number {
  const expectedProbability = calculateProbability(currentAbility, questionDifficulty);
  const actualOutcome = wasCorrect ? 1 : 0;
  const error = actualOutcome - expectedProbability;
  
  // Update ability estimate
  const newAbility = currentAbility + learningRate * error;
  
  // Clamp to reasonable range (-3 to +3)
  return Math.max(-3, Math.min(3, newAbility));
}

/**
 * Convert ability estimate (theta) to mastery score (0-100)
 * 
 * Mapping:
 * θ = -3.0 → 0%
 * θ = -1.5 → 25%
 * θ = 0.0  → 50%
 * θ = 1.0  → 75%
 * θ = 2.0  → 90%
 * θ = 3.0  → 100%
 */
export function abilityToMasteryScore(ability: number): number {
  // Sigmoid transformation
  const score = 50 + (ability / 6) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Determine mastery status from score
 */
export function getMasteryStatus(score: number): MasteryStatus {
  if (score === 0) return 'NOT_STARTED';
  if (score < 50) return 'STRUGGLING';
  if (score < 70) return 'DEVELOPING';
  if (score < 85) return 'PROFICIENT';
  if (score < 95) return 'MASTERED';
  return 'EXPERT';
}

/**
 * Select next question based on current ability and question pool
 * Implements adaptive selection strategy
 */
export async function selectNextQuestion(
  skillId: string,
  currentAbility: number,
  attemptedQuestionIds: string[],
  questionsAttempted: number
): Promise<any> {
  // Initial assessment phase (first 5 questions): wide difficulty spread
  if (questionsAttempted < 5) {
    const targetDifficulties = [-1.5, -0.5, 0, 0.5, 1.5];
    const targetDifficulty = targetDifficulties[questionsAttempted];
    
    const question = await prisma.question.findFirst({
      where: {
        skillId,
        id: { notIn: attemptedQuestionIds },
        irtDifficulty: {
          gte: targetDifficulty - 0.3,
          lte: targetDifficulty + 0.3,
        },
      },
      include: {
        options: true,
      },
      orderBy: {
        irtDifficulty: 'asc',
      },
    });
    
    if (question) return question;
  }
  
  // Adaptive phase: target ability ± 0.3
  const question = await prisma.question.findFirst({
    where: {
      skillId,
      id: { notIn: attemptedQuestionIds },
      irtDifficulty: {
        gte: currentAbility - 0.3,
        lte: currentAbility + 0.3,
      },
    },
    include: {
      options: true,
    },
    orderBy: {
      // Prioritize questions at exact ability level
      irtDifficulty: 'asc',
    },
  });
  
  if (question) return question;
  
  // Fallback: any unattempted question in skill
  return await prisma.question.findFirst({
    where: {
      skillId,
      id: { notIn: attemptedQuestionIds },
    },
    include: {
      options: true,
    },
  });
}

/**
 * Start a new practice session
 */
export async function startPracticeSession(
  userId: string,
  skillId: string,
  sessionType: 'INITIAL' | 'PRACTICE' | 'REMEDIATION' | 'ENRICHMENT' | 'REVIEW' = 'PRACTICE'
): Promise<{
  sessionId: string;
  currentMastery: number;
  currentAbility: number;
  firstQuestion: any;
}> {
  // Get or create skill mastery record
  let mastery = await prisma.skillMastery.findUnique({
    where: {
      userId_skillId: { userId, skillId },
    },
  });
  
  if (!mastery) {
    mastery = await prisma.skillMastery.create({
      data: {
        userId,
        skillId,
        abilityEstimate: 0.0,
        masteryScore: 0,
        status: 'NOT_STARTED',
      },
    });
  }
  
  // Create practice session
  const session = await prisma.practiceSession.create({
    data: {
      userId,
      skillId,
      sessionType,
      masteryBefore: mastery.masteryScore,
    },
  });
  
  // Select first question
  const firstQuestion = await selectNextQuestion(
    skillId,
    mastery.abilityEstimate,
    [],
    0
  );
  
  if (!firstQuestion) {
    throw new Error('No questions available for this skill');
  }
  
  return {
    sessionId: session.id,
    currentMastery: mastery.masteryScore,
    currentAbility: mastery.abilityEstimate,
    firstQuestion,
  };
}

/**
 * Submit an answer and get next question
 */
export async function submitAnswer(
  sessionId: string,
  questionId: string,
  answer: string,
  timeSpentSeconds: number,
  hintsUsed: number = 0
): Promise<{
  isCorrect: boolean;
  explanation: string;
  explanationFA: string | null;
  newAbility: number;
  newMastery: number;
  nextQuestion: any | null;
  sessionComplete: boolean;
  xpEarned: number;
}> {
  // Get session and current mastery
  const session = await prisma.practiceSession.findUnique({
    where: { id: sessionId },
    include: {
      skill: true,
    },
  });
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  const mastery = await prisma.skillMastery.findUnique({
    where: {
      userId_skillId: {
        userId: session.userId,
        skillId: session.skillId,
      },
    },
  });
  
  if (!mastery) {
    throw new Error('Mastery record not found');
  }
  
  // Get question details
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { options: true },
  });
  
  if (!question) {
    throw new Error('Question not found');
  }
  
  // Check if answer is correct
  const correctOption = question.options.find(opt => opt.isCorrect);
  const isCorrect = correctOption?.text === answer;
  
  // Update ability estimate
  const difficulty = question.irtDifficulty || 0;
  const oldAbility = mastery.abilityEstimate;
  const newAbility = updateAbility(oldAbility, isCorrect, difficulty);
  const newMasteryScore = abilityToMasteryScore(newAbility);
  const newStatus = getMasteryStatus(newMasteryScore);
  
  // Record attempt
  await prisma.questionAttempt.create({
    data: {
      userId: session.userId,
      questionId,
      skillId: session.skillId,
      sessionId,
      isCorrect,
      timeSpentSeconds,
      hintsUsed,
      studentAnswer: answer,
      abilityBeforeAttempt: oldAbility,
      abilityAfterAttempt: newAbility,
      questionDifficulty: difficulty,
    },
  });
  
  // Update mastery record
  await prisma.skillMastery.update({
    where: { id: mastery.id },
    data: {
      abilityEstimate: newAbility,
      masteryScore: newMasteryScore,
      status: newStatus,
      questionsAttempted: { increment: 1 },
      questionsCorrect: isCorrect ? { increment: 1 } : undefined,
      lastPracticedAt: new Date(),
      firstMasteredAt:
        newStatus === 'MASTERED' && mastery.status !== 'MASTERED'
          ? new Date()
          : undefined,
    },
  });
  
  // Update session
  await prisma.practiceSession.update({
    where: { id: sessionId },
    data: {
      questionsAttempted: { increment: 1 },
      questionsCorrect: isCorrect ? { increment: 1 } : undefined,
      durationSeconds: { increment: timeSpentSeconds },
      masteryAfter: newMasteryScore,
    },
  });
  
  // Calculate XP earned
  const difficultyMultiplier = 1 + (difficulty + 3) / 6; // 1.0 to 2.0
  const firstAttemptBonus = isCorrect && hintsUsed === 0 ? 1.5 : 1.0;
  const xpEarned = Math.round(10 * difficultyMultiplier * firstAttemptBonus);
  
  // Get all attempted questions in this session
  const attempts = await prisma.questionAttempt.findMany({
    where: { sessionId },
    select: { questionId: true },
  });
  const attemptedIds = attempts.map(a => a.questionId);
  
  // Determine if session should continue
  const sessionComplete =
    session.questionsAttempted >= 20 || // Max 20 questions per session
    newMasteryScore >= 85; // Mastery achieved
  
  let nextQuestion = null;
  if (!sessionComplete) {
    nextQuestion = await selectNextQuestion(
      session.skillId,
      newAbility,
      attemptedIds,
      session.questionsAttempted + 1
    );
  }
  
  return {
    isCorrect,
    explanation: question.explanation || '',
    explanationFA: question.explanationFA,
    newAbility,
    newMastery: newMasteryScore,
    nextQuestion,
    sessionComplete: sessionComplete || !nextQuestion,
    xpEarned,
  };
}

/**
 * End a practice session
 */
export async function endPracticeSession(
  sessionId: string,
  exitReason: 'COMPLETED' | 'TIMEOUT' | 'QUIT' | 'MASTERED' | 'FRUSTRATED'
): Promise<{
  summary: {
    questionsAttempted: number;
    questionsCorrect: number;
    accuracy: number;
    masteryGain: number;
    xpEarned: number;
    timeSpent: number;
  };
  recommendations: {
    shouldContinue: boolean;
    nextSkill: string | null;
    message: string;
    messageFA: string;
  };
}> {
  const session = await prisma.practiceSession.findUnique({
    where: { id: sessionId },
  });
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  // Mark session as completed
  await prisma.practiceSession.update({
    where: { id: sessionId },
    data: {
      completedAt: new Date(),
      exitReason,
    },
  });
  
  const accuracy =
    session.questionsAttempted > 0
      ? (session.questionsCorrect / session.questionsAttempted) * 100
      : 0;
  
  const masteryGain = (session.masteryAfter || 0) - session.masteryBefore;
  
  // Get recommendations
  const mastery = await prisma.skillMastery.findUnique({
    where: {
      userId_skillId: {
        userId: session.userId,
        skillId: session.skillId,
      },
    },
  });
  
  const shouldContinue = !!(mastery && (mastery.masteryScore ?? 0) < 85);
  
  let message = '';
  let messageFA = '';
  
  const masteryScore = mastery?.masteryScore ?? 0;
  if (masteryScore >= 85) {
    message = 'Congratulations! You have mastered this skill.';
    messageFA = 'تبریک! شما این مهارت را به طور کامل یاد گرفته‌اید.';
  } else if (masteryScore >= 70) {
    message = 'Great progress! Keep practicing to reach mastery.';
    messageFA = 'پیشرفت عالی! به تمرین ادامه دهید تا به تسلط کامل برسید.';
  } else {
    message = 'Keep going! Practice makes perfect.';
    messageFA = 'ادامه دهید! تمرین باعث پیشرفت می‌شود.';
  }
  
  return {
    summary: {
      questionsAttempted: session.questionsAttempted,
      questionsCorrect: session.questionsCorrect,
      accuracy: Math.round(accuracy),
      masteryGain: Math.round(masteryGain),
      xpEarned: session.xpEarned,
      timeSpent: session.durationSeconds,
    },
    recommendations: {
      shouldContinue,
      nextSkill: null, // TODO: Implement prerequisite checking
      message,
      messageFA,
    },
  };
}

/**
 * Get recommended skills for practice based on prerequisites and mastery
 */
export async function getRecommendedSkills(
  userId: string,
  subjectId?: string
): Promise<{
  reviewDue: any[];
  nextInSequence: any[];
  needsReteaching: any[];
  readyForChallenge: any[];
}> {
  const where: any = {};
  if (subjectId) {
    where.skill = { subjectId };
  }
  
  // Get all user's masteries
  const masteries = await prisma.skillMastery.findMany({
    where: {
      userId,
      ...where,
    },
    include: {
      skill: true,
    },
  });
  
  // Skills that need review (mastered but not practiced recently)
  const reviewDue = masteries.filter(
    m =>
      m.masteryScore >= 70 &&
      m.lastPracticedAt &&
      Date.now() - m.lastPracticedAt.getTime() > 7 * 24 * 60 * 60 * 1000 // 7 days
  );
  
  // Skills that need reteaching (struggling)
  const needsReteaching = masteries.filter(m => m.masteryScore < 50);
  
  // Skills ready for challenge (expert level)
  const readyForChallenge = masteries.filter(m => m.masteryScore >= 95);
  
  return {
    reviewDue,
    nextInSequence: [], // TODO: Implement based on skill order
    needsReteaching,
    readyForChallenge,
  };
}
