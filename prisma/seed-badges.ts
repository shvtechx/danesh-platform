import { PrismaClient, BadgeCategory, BadgeRarity } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed initial badges
 */
async function seedBadges() {
  console.log('🏅 Seeding badges...');

  const badges = [
    {
      code: 'FIRST_LESSON',
      name: 'First Steps',
      nameFA: 'اولین قدم‌ها',
      description: 'Complete your first lesson',
      descriptionFA: 'اولین درس خود را تکمیل کنید',
      icon: '🎯',
      category: BadgeCategory.MASTERY,
      rarity: BadgeRarity.COMMON,
      xpReward: 50,
      criteria: {
        type: 'lesson_count',
        value: 1
      }
    },
    {
      code: 'LESSON_MASTER_5',
      name: 'Dedicated Learner',
      nameFA: 'یادگیرنده متعهد',
      description: 'Complete 5 lessons',
      descriptionFA: '5 درس را تکمیل کنید',
      icon: '📚',
      category: BadgeCategory.MASTERY,
      rarity: BadgeRarity.COMMON,
      xpReward: 100,
      criteria: {
        type: 'lesson_count',
        value: 5
      }
    },
    {
      code: 'LESSON_MASTER_10',
      name: 'Knowledge Seeker',
      nameFA: 'جوینده دانش',
      description: 'Complete 10 lessons',
      descriptionFA: '10 درس را تکمیل کنید',
      icon: '🎓',
      category: BadgeCategory.MASTERY,
      rarity: BadgeRarity.UNCOMMON,
      xpReward: 200,
      criteria: {
        type: 'lesson_count',
        value: 10
      }
    },
    {
      code: 'LESSON_MASTER_25',
      name: 'Scholar',
      nameFA: 'دانشمند',
      description: 'Complete 25 lessons',
      descriptionFA: '25 درس را تکمیل کنید',
      icon: '👨‍🎓',
      category: BadgeCategory.MASTERY,
      rarity: BadgeRarity.RARE,
      xpReward: 500,
      criteria: {
        type: 'lesson_count',
        value: 25
      }
    },
    {
      code: 'LESSON_MASTER_50',
      name: 'Master Student',
      nameFA: 'دانش‌آموز استاد',
      description: 'Complete 50 lessons',
      descriptionFA: '50 درس را تکمیل کنید',
      icon: '🌟',
      category: BadgeCategory.MASTERY,
      rarity: BadgeRarity.EPIC,
      xpReward: 1000,
      criteria: {
        type: 'lesson_count',
        value: 50
      }
    },
    {
      code: 'PERFECT_SCORE_1',
      name: 'Perfectionist',
      nameFA: 'کمال‌گرا',
      description: 'Score 100% on an assessment',
      descriptionFA: 'در یک آزمون نمره 100% بگیرید',
      icon: '💯',
      category: BadgeCategory.MASTERY,
      rarity: BadgeRarity.UNCOMMON,
      xpReward: 150,
      criteria: {
        type: 'assessment_score',
        value: 1
      }
    },
    {
      code: 'PERFECT_SCORE_3',
      name: 'Quiz Champion',
      nameFA: 'قهرمان آزمون',
      description: 'Score 100% on 3 assessments',
      descriptionFA: 'در 3 آزمون نمره 100% بگیرید',
      icon: '🏆',
      category: BadgeCategory.MASTERY,
      rarity: BadgeRarity.RARE,
      xpReward: 300,
      criteria: {
        type: 'assessment_score',
        value: 3
      }
    },
    {
      code: 'QUIZ_PERFECT_5',
      name: 'Perfect Streak',
      nameFA: 'رشته کامل',
      description: 'Score 100% on 5 formative quizzes',
      descriptionFA: 'در 5 آزمون تکوینی نمره 100% بگیرید',
      icon: '⭐',
      category: BadgeCategory.PERSEVERANCE,
      rarity: BadgeRarity.EPIC,
      xpReward: 500,
      criteria: {
        type: 'quiz_perfect',
        value: 5
      }
    },
    {
      code: 'MATH_EXPLORER',
      name: 'Math Explorer',
      nameFA: 'کاوشگر ریاضی',
      description: 'Complete 5 math lessons',
      descriptionFA: '5 درس ریاضی را تکمیل کنید',
      icon: '🔢',
      category: BadgeCategory.MASTERY,
      rarity: BadgeRarity.COMMON,
      xpReward: 100,
      criteria: {
        type: 'subject_mastery',
        value: 5,
        subjectCode: 'MATH'
      }
    },
    {
      code: 'SCIENCE_EXPLORER',
      name: 'Science Explorer',
      nameFA: 'کاوشگر علوم',
      description: 'Complete 5 science lessons',
      descriptionFA: '5 درس علوم را تکمیل کنید',
      icon: '🔬',
      category: BadgeCategory.MASTERY,
      rarity: BadgeRarity.COMMON,
      xpReward: 100,
      criteria: {
        type: 'subject_mastery',
        value: 5,
        subjectCode: 'SCI'
      }
    },
    {
      code: 'ROBOTICS_PIONEER',
      name: 'Robotics Pioneer',
      nameFA: 'پیشگام رباتیک',
      description: 'Complete 5 robotics lessons',
      descriptionFA: '5 درس رباتیک را تکمیل کنید',
      icon: '🤖',
      category: BadgeCategory.CREATIVITY,
      rarity: BadgeRarity.UNCOMMON,
      xpReward: 150,
      criteria: {
        type: 'subject_mastery',
        value: 5,
        subjectCode: 'ROBOT'
      }
    },
    {
      code: 'AI_ENTHUSIAST',
      name: 'AI Enthusiast',
      nameFA: 'علاقه‌مند هوش مصنوعی',
      description: 'Complete 5 AI lessons',
      descriptionFA: '5 درس هوش مصنوعی را تکمیل کنید',
      icon: '🧠',
      category: BadgeCategory.CREATIVITY,
      rarity: BadgeRarity.UNCOMMON,
      xpReward: 150,
      criteria: {
        type: 'subject_mastery',
        value: 5,
        subjectCode: 'AI'
      }
    }
  ];

  for (const badgeData of badges) {
    await prisma.badge.upsert({
      where: { code: badgeData.code },
      update: {
        ...badgeData,
        criteria: badgeData.criteria
      },
      create: {
        ...badgeData,
        criteria: badgeData.criteria
      }
    });
    console.log(`  ✓ ${badgeData.code}`);
  }

  console.log(`✅ Seeded ${badges.length} badges!`);
}

seedBadges()
  .catch((e) => {
    console.error('❌ Error seeding badges:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
