import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed sample Math skills with IRT-calibrated questions
 * Grade 3 Mathematics - Addition and Subtraction
 */
async function main() {
  console.log('🌱 Seeding Math skills...');

  // Find or create Math subject
  let mathSubject = await prisma.subject.findFirst({
    where: { code: 'MATH' },
  });

  if (!mathSubject) {
    mathSubject = await prisma.subject.create({
      data: {
        code: 'MATH',
        name: 'Mathematics',
        nameFA: 'ریاضیات',
        description: 'Mathematics curriculum',
        descriptionFA: 'برنامه درسی ریاضیات',
        gradeBandMin: 1,
        gradeBandMax: 12,
        order: 1,
      },
    });
    console.log('✅ Created Math subject');
  }

  // Find or create Number & Operations strand
  let strand = await prisma.strand.findFirst({
    where: {
      subjectId: mathSubject.id,
      code: 'NUMBER_OPS',
    },
  });

  if (!strand) {
    strand = await prisma.strand.create({
      data: {
        subjectId: mathSubject.id,
        code: 'NUMBER_OPS',
        name: 'Number & Operations',
        nameFA: 'عدد و عملیات',
        order: 1,
      },
    });
    console.log('✅ Created Number & Operations strand');
  }

  // Create Skills
  const skills = [
    {
      code: 'ADD_SINGLE_DIGIT',
      name: 'Single-Digit Addition',
      nameFA: 'جمع تک‌رقمی',
      description: 'Add two single-digit numbers (0-9)',
      descriptionFA: 'جمع دو عدد تک‌رقمی (۰-۹)',
      gradeBandMin: 1,
      gradeBandMax: 2,
      order: 1,
    },
    {
      code: 'ADD_TWO_DIGIT',
      name: 'Two-Digit Addition',
      nameFA: 'جمع دو رقمی',
      description: 'Add two two-digit numbers without regrouping',
      descriptionFA: 'جمع دو عدد دو رقمی بدون نقل مکان',
      gradeBandMin: 2,
      gradeBandMax: 3,
      order: 2,
    },
    {
      code: 'ADD_REGROUPING',
      name: 'Addition with Regrouping',
      nameFA: 'جمع با نقل مکان',
      description: 'Add numbers with carrying/regrouping',
      descriptionFA: 'جمع اعداد با به دست آوردن',
      gradeBandMin: 3,
      gradeBandMax: 4,
      order: 3,
    },
    {
      code: 'SUB_SINGLE_DIGIT',
      name: 'Single-Digit Subtraction',
      nameFA: 'تفریق تک‌رقمی',
      description: 'Subtract two single-digit numbers',
      descriptionFA: 'تفریق دو عدد تک‌رقمی',
      gradeBandMin: 1,
      gradeBandMax: 2,
      order: 4,
    },
    {
      code: 'SUB_TWO_DIGIT',
      name: 'Two-Digit Subtraction',
      nameFA: 'تفریق دو رقمی',
      description: 'Subtract two two-digit numbers without borrowing',
      descriptionFA: 'تفریق دو عدد دو رقمی بدون قرض گرفتن',
      gradeBandMin: 2,
      gradeBandMax: 3,
      order: 5,
    },
  ];

  const createdSkills = [];
  for (const skillData of skills) {
    const existing = await prisma.skill.findUnique({
      where: { code: skillData.code },
    });

    if (existing) {
      console.log(`⏭️  Skill ${skillData.code} already exists`);
      createdSkills.push(existing);
      continue;
    }

    const skill = await prisma.skill.create({
      data: {
        ...skillData,
        subjectId: mathSubject.id,
        strandId: strand.id,
      },
    });
    createdSkills.push(skill);
    console.log(`✅ Created skill: ${skill.name}`);
  }

  // Create prerequisites
  // Two-digit addition requires single-digit addition
  const singleDigitAdd = createdSkills.find(s => s.code === 'ADD_SINGLE_DIGIT');
  const twoDigitAdd = createdSkills.find(s => s.code === 'ADD_TWO_DIGIT');
  const addRegrouping = createdSkills.find(s => s.code === 'ADD_REGROUPING');
  const singleDigitSub = createdSkills.find(s => s.code === 'SUB_SINGLE_DIGIT');
  const twoDigitSub = createdSkills.find(s => s.code === 'SUB_TWO_DIGIT');

  if (singleDigitAdd && twoDigitAdd) {
    await prisma.skillPrerequisite.upsert({
      where: {
        skillId_prerequisiteId: {
          skillId: twoDigitAdd.id,
          prerequisiteId: singleDigitAdd.id,
        },
      },
      update: {},
      create: {
        skillId: twoDigitAdd.id,
        prerequisiteId: singleDigitAdd.id,
        isRequired: true,
      },
    });
    console.log('✅ Created prerequisite: Two-digit addition requires single-digit addition');
  }

  if (twoDigitAdd && addRegrouping) {
    await prisma.skillPrerequisite.upsert({
      where: {
        skillId_prerequisiteId: {
          skillId: addRegrouping.id,
          prerequisiteId: twoDigitAdd.id,
        },
      },
      update: {},
      create: {
        skillId: addRegrouping.id,
        prerequisiteId: twoDigitAdd.id,
        isRequired: true,
      },
    });
    console.log('✅ Created prerequisite: Addition with regrouping requires two-digit addition');
  }

  if (singleDigitSub && twoDigitSub) {
    await prisma.skillPrerequisite.upsert({
      where: {
        skillId_prerequisiteId: {
          skillId: twoDigitSub.id,
          prerequisiteId: singleDigitSub.id,
        },
      },
      update: {},
      create: {
        skillId: twoDigitSub.id,
        prerequisiteId: singleDigitSub.id,
        isRequired: true,
      },
    });
    console.log('✅ Created prerequisite: Two-digit subtraction requires single-digit subtraction');
  }

  // Create sample questions with IRT parameters for Single-Digit Addition
  if (singleDigitAdd) {
    const questions = [
      {
        text: 'What is 2 + 3?',
        textFA: '۲ + ۳ چند است؟',
        difficulty: -2.0, // Very easy
        discrimination: 1.5,
        correctAnswer: '5',
        options: ['3', '4', '5', '6'],
        explanation: '2 + 3 = 5. You can count up from 2: 3, 4, 5.',
        explanationFA: '۲ + ۳ = ۵. می‌توانید از ۲ شروع به شمارش کنید: ۳، ۴، ۵.',
        hints: ['Try counting on your fingers', 'Start at 2 and count 3 more'],
      },
      {
        text: 'What is 5 + 4?',
        textFA: '۵ + ۴ چند است؟',
        difficulty: -1.0, // Easy
        discrimination: 1.2,
        correctAnswer: '9',
        options: ['7', '8', '9', '10'],
        explanation: '5 + 4 = 9. Count up from 5: 6, 7, 8, 9.',
        explanationFA: '۵ + ۴ = ۹. از ۵ شروع کنید: ۶، ۷، ۸، ۹.',
        hints: ['Use your fingers to count', 'Think: 5 + 5 = 10, so 5 + 4 = 9'],
      },
      {
        text: 'What is 7 + 6?',
        textFA: '۷ + ۶ چند است؟',
        difficulty: 0.0, // Medium
        discrimination: 1.0,
        correctAnswer: '13',
        options: ['11', '12', '13', '14'],
        explanation: '7 + 6 = 13. Think of it as 7 + 3 + 3 = 10 + 3 = 13.',
        explanationFA: '۷ + ۶ = ۱۳. به صورت ۷ + ۳ + ۳ = ۱۰ + ۳ = ۱۳ فکر کنید.',
        hints: ['Make a ten: 7 + 3 = 10, then add 3 more', 'Think: 6 + 6 = 12, so 7 + 6 = 13'],
      },
      {
        text: 'What is 8 + 7?',
        textFA: '۸ + ۷ چند است؟',
        difficulty: 0.8, // Medium-hard
        discrimination: 1.3,
        correctAnswer: '15',
        options: ['13', '14', '15', '16'],
        explanation: '8 + 7 = 15. Decompose: 8 + 2 + 5 = 10 + 5 = 15.',
        explanationFA: '۸ + ۷ = ۱۵. تجزیه کنید: ۸ + ۲ + ۵ = ۱۰ + ۵ = ۱۵.',
        hints: ['Make ten first', 'Think: 8 + 8 = 16, so 8 + 7 = 15'],
      },
      {
        text: 'What is 9 + 8?',
        textFA: '۹ + ۸ چند است؟',
        difficulty: 1.5, // Hard
        discrimination: 1.8,
        correctAnswer: '17',
        options: ['15', '16', '17', '18'],
        explanation: '9 + 8 = 17. Think: 9 + 1 + 7 = 10 + 7 = 17, or 10 + 10 - 3 = 17.',
        explanationFA: '۹ + ۸ = ۱۷. فکر کنید: ۹ + ۱ + ۷ = ۱۰ + ۷ = ۱۷، یا ۱۰ + ۱۰ - ۳ = ۱۷.',
        hints: ['Add 1 to 9 to make 10', 'Think: 9 + 9 = 18, so 9 + 8 = 17'],
      },
    ];

    for (const qData of questions) {
      const existing = await prisma.question.findFirst({
        where: {
          skillId: singleDigitAdd.id,
          text: qData.text,
        },
      });

      if (existing) {
        console.log(`⏭️  Question "${qData.text}" already exists`);
        continue;
      }

      const question = await prisma.question.create({
        data: {
          skillId: singleDigitAdd.id,
          text: qData.text,
          textFA: qData.textFA,
          type: 'MULTIPLE_CHOICE',
          irtDifficulty: qData.difficulty,
          irtDiscrimination: qData.discrimination,
          irtGuessing: 0.25, // 25% guess rate for 4-option MC
          timeEstimate: 30, // 30 seconds
          explanation: qData.explanation,
          explanationFA: qData.explanationFA,
          hints: qData.hints,
          commonMisconceptions: [
            'Adding instead of subtracting',
            'Forgetting to carry when sum > 10',
          ],
          points: 10,
        },
      });

      // Create options
      for (let i = 0; i < qData.options.length; i++) {
        await prisma.questionOption.create({
          data: {
            questionId: question.id,
            text: qData.options[i],
            textFA: qData.options[i], // Numbers are same in both languages
            isCorrect: qData.options[i] === qData.correctAnswer,
            order: i + 1,
          },
        });
      }

      console.log(`✅ Created question: "${qData.text}"`);
    }
  }

  console.log('\n🎉 Seeding complete!');
  console.log('\nCreated:');
  console.log(`- 1 Subject (Mathematics)`);
  console.log(`- 1 Strand (Number & Operations)`);
  console.log(`- ${createdSkills.length} Skills`);
  console.log(`- 3 Prerequisites`);
  console.log(`- 5 Questions with 20 Options`);
  console.log('\nYou can now test the adaptive assessment system!');
  console.log(`Visit: /en/student/practice/${singleDigitAdd?.id || '[skillId]'}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
