import { PrismaClient, QuestCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function seedQuests() {
  console.log('🎯 Seeding quests...');

  const quests = [
    // Daily Quests
    {
      code: 'DAILY_EXPLORER',
      title: 'Daily Explorer',
      titleFA: 'کاوشگر روزانه',
      description: 'Complete 3 lessons today',
      descriptionFA: 'امروز 3 درس را تکمیل کنید',
      narrative: 'Every day is a new adventure in learning! Complete 3 lessons to prove your dedication.',
      narrativeFA: 'هر روز یک ماجراجویی جدید در یادگیری است! 3 درس را تکمیل کنید تا تعهد خود را ثابت کنید.',
      category: QuestCategory.SEASONAL,
      xpReward: 100,
      coinReward: 50,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      steps: [
        {
          sequence: 1,
          title: 'Complete 3 lessons',
          titleFA: '3 درس را تکمیل کنید',
          description: 'Complete any 3 lessons from any subject',
          descriptionFA: 'از هر موضوعی 3 درس را تکمیل کنید',
          criteria: {
            type: 'lesson_count',
            value: 3,
          },
          xpReward: 0,
        },
      ],
    },
    {
      code: 'WEEKLY_CHAMPION',
      title: 'Weekly Champion',
      titleFA: 'قهرمان هفتگی',
      description: 'Complete 5 quizzes with 80%+ score this week',
      descriptionFA: 'این هفته 5 آزمون را با نمره 80% یا بالاتر تکمیل کنید',
      narrative: 'Show your mastery by acing quizzes throughout the week. Quality over quantity!',
      narrativeFA: 'با موفقیت در آزمون‌ها در طول هفته، تسلط خود را نشان دهید. کیفیت بر کمیت!',
      category: QuestCategory.GLOBAL_SCIENCE,
      xpReward: 300,
      coinReward: 150,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      steps: [
        {
          sequence: 1,
          title: 'Pass 5 quizzes',
          titleFA: '5 آزمون را قبول شوید',
          description: 'Complete 5 formative assessments with 80% or higher',
          descriptionFA: '5 آزمون تکوینی را با 80% یا بالاتر تکمیل کنید',
          criteria: {
            type: 'assessment_score',
            value: 5,
            minScore: 80,
          },
          xpReward: 0,
        },
      ],
    },
    {
      code: 'BADGE_COLLECTOR',
      title: 'Badge Collector',
      titleFA: 'جمع‌آوری کننده نشان‌ها',
      description: 'Earn 3 new badges',
      descriptionFA: '3 نشان جدید کسب کنید',
      narrative: 'Badges represent your achievements. Collect 3 to show your diverse skills!',
      narrativeFA: 'نشان‌ها نماینده دستاوردهای شما هستند. 3 تا جمع کنید تا مهارت‌های متنوع خود را نشان دهید!',
      category: QuestCategory.PERSIAN_MYTHOLOGY,
      xpReward: 500,
      coinReward: 250,
      isActive: true,
      steps: [
        {
          sequence: 1,
          title: 'Earn 3 badges',
          titleFA: '3 نشان کسب کنید',
          description: 'Complete achievements to earn badges',
          descriptionFA: 'دستاوردها را تکمیل کنید تا نشان کسب کنید',
          criteria: {
            type: 'badge_count',
            value: 3,
          },
          xpReward: 0,
        },
      ],
    },
    // Multi-step quest
    {
      code: 'MATH_MASTER_JOURNEY',
      title: 'Math Master Journey',
      titleFA: 'سفر استاد ریاضی',
      description: 'Complete a journey through mathematics',
      descriptionFA: 'یک سفر در ریاضیات را تکمیل کنید',
      narrative:
        'Mathematics is the language of the universe. Follow this quest to become a true Math Master!',
      narrativeFA:
        'ریاضیات زبان جهان است. این ماموریت را دنبال کنید تا به استاد واقعی ریاضی تبدیل شوید!',
      category: QuestCategory.GLOBAL_SCIENCE,
      xpReward: 1000,
      coinReward: 500,
      isActive: true,
      steps: [
        {
          sequence: 1,
          title: 'Complete 5 Math lessons',
          titleFA: '5 درس ریاضی را تکمیل کنید',
          description: 'Start your journey by completing 5 math lessons',
          descriptionFA: 'سفر خود را با تکمیل 5 درس ریاضی آغاز کنید',
          criteria: {
            type: 'lesson_count',
            value: 5,
            subjectCode: 'MATH',
          },
          xpReward: 100,
        },
        {
          sequence: 2,
          title: 'Pass 3 Math quizzes',
          titleFA: '3 آزمون ریاضی را قبول شوید',
          description: 'Complete 3 math assessments',
          descriptionFA: '3 آزمون ریاضی را تکمیل کنید',
          criteria: {
            type: 'assessment_count',
            value: 3,
            subjectCode: 'MATH',
          },
          xpReward: 200,
        },
        {
          sequence: 3,
          title: 'Ace a Math test',
          titleFA: 'در یک آزمون ریاضی عالی عمل کنید',
          description: 'Score 100% on a math assessment',
          descriptionFA: 'در یک آزمون ریاضی نمره 100% بگیرید',
          criteria: {
            type: 'assessment_score',
            value: 1,
            subjectCode: 'MATH',
            minScore: 100,
          },
          xpReward: 300,
        },
      ],
    },
    {
      code: 'SCIENCE_EXPLORER_PATH',
      title: 'Science Explorer Path',
      titleFA: 'مسیر کاوشگر علوم',
      description: 'Explore the wonders of science',
      descriptionFA: 'شگفتی‌های علوم را کاوش کنید',
      narrative:
        'Science reveals the secrets of nature. Complete this quest to become a true explorer!',
      narrativeFA: 'علوم رازهای طبیعت را آشکار می‌کند. این ماموریت را تکمیل کنید تا به کاوشگر واقعی تبدیل شوید!',
      category: QuestCategory.GLOBAL_SCIENCE,
      xpReward: 1000,
      coinReward: 500,
      isActive: true,
      steps: [
        {
          sequence: 1,
          title: 'Complete 5 Science lessons',
          titleFA: '5 درس علوم را تکمیل کنید',
          description: 'Begin exploring science with 5 lessons',
          descriptionFA: 'با 5 درس، کاوش علوم را آغاز کنید',
          criteria: {
            type: 'lesson_count',
            value: 5,
            subjectCode: 'SCI',
          },
          xpReward: 100,
        },
        {
          sequence: 2,
          title: 'Conduct 3 experiments',
          titleFA: '3 آزمایش انجام دهید',
          description: 'Complete 3 Explore phase science lessons',
          descriptionFA: '3 درس علوم فاز کاوش را تکمیل کنید',
          criteria: {
            type: 'lesson_count',
            value: 3,
            subjectCode: 'SCI',
            phase: '5E_EXPLORE',
          },
          xpReward: 200,
        },
      ],
    },
    {
      code: 'PERFECT_WEEK',
      title: 'Perfect Week',
      titleFA: 'هفته کامل',
      description: 'Achieve perfection in all your work this week',
      descriptionFA: 'این هفته در تمام کارهای خود به کمال برسید',
      narrative: 'Perfection is the result of dedication and practice. Aim for excellence!',
      narrativeFA: 'کمال نتیجه تعهد و تمرین است. به برتری هدف بگذارید!',
      category: QuestCategory.ISLAMIC_SCHOLARS,
      xpReward: 800,
      coinReward: 400,
      isActive: true,
      steps: [
        {
          sequence: 1,
          title: 'Login 7 days in a row',
          titleFA: '7 روز متوالی وارد شوید',
          description: 'Maintain a 7-day login streak',
          descriptionFA: 'یک رشته 7 روزه ورود حفظ کنید',
          criteria: {
            type: 'login_streak',
            value: 7,
          },
          xpReward: 200,
        },
        {
          sequence: 2,
          title: 'Score perfect on 3 quizzes',
          titleFA: 'در 3 آزمون نمره کامل بگیرید',
          description: 'Achieve 100% on 3 formative quizzes',
          descriptionFA: 'در 3 آزمون تکوینی 100% بگیرید',
          criteria: {
            type: 'perfect_quizzes',
            value: 3,
          },
          xpReward: 300,
        },
      ],
    },
    {
      code: 'DEDICATED_LEARNER',
      title: 'Dedicated Learner',
      titleFA: 'یادگیرنده متعهد',
      description: 'Show your commitment to learning',
      descriptionFA: 'تعهد خود به یادگیری را نشان دهید',
      narrative: 'True learning requires dedication and time. Invest in yourself!',
      narrativeFA: 'یادگیری واقعی نیازمند تعهد و زمان است. در خودتان سرمایه‌گذاری کنید!',
      category: QuestCategory.CITIZENSHIP,
      xpReward: 600,
      coinReward: 300,
      isActive: true,
      steps: [
        {
          sequence: 1,
          title: 'Spend 120 minutes learning',
          titleFA: '120 دقیقه یادگیری کنید',
          description: 'Accumulate 2 hours of learning time',
          descriptionFA: '2 ساعت زمان یادگیری جمع کنید',
          criteria: {
            type: 'time_spent',
            value: 120,
          },
          xpReward: 200,
        },
        {
          sequence: 2,
          title: 'Complete 10 lessons',
          titleFA: '10 درس را تکمیل کنید',
          description: 'Finish 10 lessons from any subject',
          descriptionFA: '10 درس از هر موضوعی را به پایان برسانید',
          criteria: {
            type: 'lesson_count',
            value: 10,
          },
          xpReward: 300,
        },
      ],
    },
  ];

  for (const questData of quests) {
    const { steps, ...questInfo } = questData;

    const quest = await prisma.quest.upsert({
      where: { code: questData.code },
      update: {
        ...questInfo,
      },
      create: {
        ...questInfo,
      },
    });

    // Create steps
    for (const stepData of steps) {
      await prisma.questStep.upsert({
        where: {
          questId_sequence: {
            questId: quest.id,
            sequence: stepData.sequence,
          },
        },
        update: {
          ...stepData,
          criteria: stepData.criteria,
        },
        create: {
          questId: quest.id,
          ...stepData,
          criteria: stepData.criteria,
        },
      });
    }

    console.log(`  ✓ ${questData.code} (${steps.length} steps)`);
  }

  console.log(`✅ Seeded ${quests.length} quests!`);
}

seedQuests()
  .catch((e) => {
    console.error('❌ Error seeding quests:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
