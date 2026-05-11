import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding sample data for testing...\n');

  // 1. Create sample educational sources
  console.log('📚 Creating content sources...');
  const source = await prisma.contentSource.upsert({
    where: { url: 'https://www.khanacademy.org' },
    update: {},
    create: {
      name: 'Khan Academy',
      nameFA: 'خان آکادمی',
      url: 'https://www.khanacademy.org',
      description: 'Free educational platform with comprehensive K-12 content',
      isActive: true,
      respectsRobotsTxt: true,
      rateLimit: 1000,
      totalItemsScraped: 0,
      successRate: 0,
    },
  });
  console.log(`✓ Created source: ${source.name}\n`);

  // 2. Get or create a Math subject and skill
  console.log('📖 Setting up Math curriculum...');
  
  const mathSubject = await prisma.subject.upsert({
    where: { code: 'MATH' },
    update: {},
    create: {
      code: 'MATH',
      name: 'Mathematics',
      nameFA: 'ریاضیات',
      description: 'Mathematics curriculum K-12',
      icon: '🔢',
      color: '#3B82F6',
      isActive: true,
      order: 1,
    },
  });

  // Create strands
  const arithmeticStrand = await prisma.strand.upsert({
    where: { id: 'MATH_ARITHMETIC' },
    update: {},
    create: {
      id: 'MATH_ARITHMETIC',
      subjectId: mathSubject.id,
      code: 'ARITHMETIC',
      name: 'Arithmetic',
      nameFA: 'حساب',
      description: 'Basic arithmetic operations',
      order: 1,
    },
  });

  // Create a sample skill
  const additionSkill = await prisma.skill.upsert({
    where: { id: 'ADD_SINGLE_DIGIT' },
    update: {},
    create: {
      id: 'ADD_SINGLE_DIGIT',
      subjectId: mathSubject.id,
      strandId: arithmeticStrand.id,
      code: 'ADD_1D',
      name: 'Single-Digit Addition',
      nameFA: 'جمع اعداد تک رقمی',
      description: 'Add two single-digit numbers',
      gradeBandMin: 1,
      gradeBandMax: 2,
      order: 1,
    },
  });

  console.log(`✓ Created skill: ${additionSkill.name}\n`);

  // 3. Create sample scraped content (PENDING status)
  console.log('🔍 Creating sample scraped content...');

  const sampleQuestions = [
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
      explanation: '3 plus 4 equals 7. Count: 3, 4, 5, 6, 7',
      explanationFA: 'سه به علاوه چهار مساوی هفت است',
      gradeLevel: 1,
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
      gradeLevel: 1,
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
      gradeLevel: 1,
      difficultyEstimate: -0.5,
    },
  ];

  for (const q of sampleQuestions) {
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
        hints: ['Look at each number carefully', 'Count on your fingers if needed'],
        difficultyEstimate: q.difficultyEstimate,
        subjectCode: 'MATH',
        strandCode: 'ARITHMETIC',
        skillCode: 'ADD_1D',
        gradeLevel: q.gradeLevel,
        reviewStatus: 'PENDING',
        originalAuthor: 'Khan Academy',
        license: 'CC BY-NC-SA',
        attributionRequired: true,
      },
    });
  }

  console.log(`✓ Created ${sampleQuestions.length} sample questions (PENDING review)\n`);

  // 4. Update source stats
  await prisma.contentSource.update({
    where: { id: source.id },
    data: {
      totalItemsScraped: sampleQuestions.length,
      lastScrapedAt: new Date(),
      successRate: 100,
    },
  });

  console.log('✅ Seeding complete!\n');
  console.log('📋 Next steps:');
  console.log('  1. Login as admin: superadmin@danesh.app / SuperAdmin@123');
  console.log('  2. Go to: http://localhost:3000/en/admin/scraped-content');
  console.log(`  3. Review and approve ${sampleQuestions.length} pending questions`);
  console.log(`  4. Use skillId: ${additionSkill.id} when approving`);
  console.log('  5. Go to: http://localhost:3000/en/student/skills');
  console.log('  6. See approved questions in practice sessions!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
