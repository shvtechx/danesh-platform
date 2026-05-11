// Simple script to seed sample scraped content
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating sample scraped content...\n');

  // Create Khan Academy source
  const source = await prisma.contentSource.upsert({
    where: { url: 'https://www.khanacademy.org' },
    update: {},
    create: {
      name: 'Khan Academy',
      nameFA: 'خان آکادمی',
      url: 'https://www.khanacademy.org',
      description: 'Free K-12 educational platform',
      isActive: true,
      respectsRobotsTxt: true,
      rateLimit: 1000,
      totalItemsScraped: 3,
      successRate: 100.0,
    },
  });
  console.log('✓ Source created:', source.name);

  // Get existing Math subject
  let mathSubject = await prisma.subject.findUnique({
    where: { code: 'MATH' },
  });

  if (!mathSubject) {
    mathSubject = await prisma.subject.create({
      data: {
        code: 'MATH',
        name: 'Mathematics',
        nameFA: 'ریاضیات',
        icon: '🔢',
        color: '#3B82F6',
        description: 'Mathematics K-12',
      },
    });
    console.log('✓ Subject created:', mathSubject.name);
  } else {
    console.log('✓ Using existing subject:', mathSubject.name);
  }

  // Create sample questions
  const questions = [
    {
      questionText: 'What is 3 + 4?',
      questionTextFA: '۳ + ۴ چند است؟',
      options: [
        { text: '5', textFA: '۵', isCorrect: false },
        { text: '6', textFA: '۶', isCorrect: false },
        { text: '7', textFA: '۷', isCorrect: true },
        { text: '8', textFA: '۸', isCorrect: false },
      ],
      correctAnswer: '7',
      explanation: '3 plus 4 equals 7',
      explanationFA: 'سه به علاوه چهار مساوی هفت است',
      difficultyEstimate: -1.5,
    },
    {
      questionText: 'What is 5 + 6?',
      questionTextFA: '۵ + ۶ چند است؟',
      options: [
        { text: '10', textFA: '۱۰', isCorrect: false },
        { text: '11', textFA: '۱۱', isCorrect: true },
        { text: '12', textFA: '۱۲', isCorrect: false },
        { text: '13', textFA: '۱۳', isCorrect: false },
      ],
      correctAnswer: '11',
      explanation: '5 plus 6 equals 11',
      explanationFA: 'پنج به علاوه شش مساوی یازده است',
      difficultyEstimate: -1.0,
    },
    {
      questionText: 'What is 8 + 7?',
      questionTextFA: '۸ + ۷ چند است؟',
      options: [
        { text: '14', textFA: '۱۴', isCorrect: false },
        { text: '15', textFA: '۱۵', isCorrect: true },
        { text: '16', textFA: '۱۶', isCorrect: false },
        { text: '17', textFA: '۱۷', isCorrect: false },
      ],
      correctAnswer: '15',
      explanation: '8 plus 7 equals 15',
      explanationFA: 'هشت به علاوه هفت مساوی پانزده است',
      difficultyEstimate: -0.5,
    },
  ];

  for (const q of questions) {
    await prisma.scrapedContent.create({
      data: {
        sourceId: source.id,
        sourceUrl: 'https://www.khanacademy.org/math/grade-1',
        contentType: 'QUESTION',
        questionText: q.questionText,
        questionTextFA: q.questionTextFA,
        questionType: 'MULTIPLE_CHOICE',
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        explanationFA: q.explanationFA,
        hints: ['Count carefully', 'Use your fingers'],
        difficultyEstimate: q.difficultyEstimate,
        subjectCode: 'MATH',
        strandCode: 'ARITHMETIC',
        skillCode: 'ADD_1D',
        gradeLevel: 1,
        reviewStatus: 'PENDING',
        originalAuthor: 'Khan Academy',
        license: 'CC BY-NC-SA',
        attributionRequired: true,
      },
    });
  }

  console.log(`✓ Created ${questions.length} sample questions\n`);
  console.log('✅ Done! Now you can:');
  console.log('  1. Go to: http://localhost:3000/en/admin/scraped-content');
  console.log('  2. Review and approve the 3 pending questions');
  console.log('  3. Visit: http://localhost:3000/en/student/skills to see them!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
