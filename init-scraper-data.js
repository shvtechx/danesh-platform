// Quick script to initialize scraper and add sample data
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('📚 Initializing Educational Web Scraper System\n');

  // Step 1: Initialize content sources
  console.log('Step 1: Creating content sources...');
  
  const khan = await prisma.contentSource.upsert({
    where: { url: 'https://www.khanacademy.org' },
    update: {},
    create: {
      name: 'Khan Academy',
      nameFA: 'آکادمی خان',
      url: 'https://www.khanacademy.org',
      description: 'Free educational videos and exercises',
      isActive: true,
      respectsRobotsTxt: true,
      rateLimit: 2000,
      successRate: 95.0
    }
  });

  const oer = await prisma.contentSource.upsert({
    where: { url: 'https://www.oercommons.org' },
    update: {},
    create: {
      name: 'OER Commons',
      nameFA: 'منابع آموزشی آزاد',
      url: 'https://www.oercommons.org',
      description: 'Open educational resources',
      isActive: true,
      respectsRobotsTxt: true,
      rateLimit: 1000,
      successRate: 90.0
    }
  });

  console.log(`✅ Created: ${khan.name} and ${oer.name}`);

  // Step 2: Add sample scraped content
  console.log('\nStep 2: Adding 10 sample practice problems...');
  
  const sampleQuestions = [
    {
      questionText: 'What is 5 + 3?',
      questionTextFA: '۵ + ۳ چقدر است؟',
      questionType: 'MULTIPLE_CHOICE',
      options: [
        { text: '6', textFA: '۶', isCorrect: false },
        { text: '7', textFA: '۷', isCorrect: false },
        { text: '8', textFA: '۸', isCorrect: true },
        { text: '9', textFA: '۹', isCorrect: false }
      ],
      correctAnswer: '8',
      explanation: 'When you add 5 and 3 together, you get 8.',
      explanationFA: 'وقتی ۵ و ۳ را با هم جمع می‌کنید، ۸ به دست می‌آید.',
      difficultyEstimate: -1.5,
      gradeLevel: 1,
      subjectCode: 'MATH'
    },
    {
      questionText: 'What is 12 + 7?',
      questionTextFA: '۱۲ + ۷ چقدر است؟',
      questionType: 'MULTIPLE_CHOICE',
      options: [
        { text: '18', textFA: '۱۸', isCorrect: false },
        { text: '19', textFA: '۱۹', isCorrect: true },
        { text: '20', textFA: '۲۰', isCorrect: false },
        { text: '21', textFA: '۲۱', isCorrect: false }
      ],
      correctAnswer: '19',
      explanation: 'Adding 12 and 7 gives you 19.',
      explanationFA: 'جمع ۱۲ و ۷ برابر با ۱۹ است.',
      difficultyEstimate: -0.8,
      gradeLevel: 2,
      subjectCode: 'MATH'
    },
    {
      questionText: 'Solve: 25 + 38 = ?',
      questionTextFA: 'حل کنید: ۲۵ + ۳۸ = ؟',
      questionType: 'MULTIPLE_CHOICE',
      options: [
        { text: '61', textFA: '۶۱', isCorrect: false },
        { text: '62', textFA: '۶۲', isCorrect: false },
        { text: '63', textFA: '۶۳', isCorrect: true },
        { text: '64', textFA: '۶۴', isCorrect: false }
      ],
      correctAnswer: '63',
      explanation: '25 + 38 = 63. Add the ones place first, then the tens place.',
      explanationFA: '۲۵ + ۳۸ = ۶۳. ابتدا یکان را جمع کنید، سپس دهگان را.',
      difficultyEstimate: 0.2,
      gradeLevel: 3,
      subjectCode: 'MATH'
    },
    {
      questionText: 'What is 8 × 6?',
      questionTextFA: '۸ × ۶ چقدر است؟',
      questionType: 'MULTIPLE_CHOICE',
      options: [
        { text: '42', textFA: '۴۲', isCorrect: false },
        { text: '46', textFA: '۴۶', isCorrect: false },
        { text: '48', textFA: '۴۸', isCorrect: true },
        { text: '54', textFA: '۵۴', isCorrect: false }
      ],
      correctAnswer: '48',
      explanation: '8 times 6 equals 48.',
      explanationFA: '۸ ضرب در ۶ برابر با ۴۸ است.',
      difficultyEstimate: 0.5,
      gradeLevel: 3,
      subjectCode: 'MATH'
    },
    {
      questionText: 'What is 156 + 247?',
      questionTextFA: '۱۵۶ + ۲۴۷ چقدر است؟',
      questionType: 'MULTIPLE_CHOICE',
      options: [
        { text: '401', textFA: '۴۰۱', isCorrect: false },
        { text: '402', textFA: '۴۰۲', isCorrect: false },
        { text: '403', textFA: '۴۰۳', isCorrect: true },
        { text: '404', textFA: '۴۰۴', isCorrect: false }
      ],
      correctAnswer: '403',
      explanation: 'Adding 156 and 247 gives you 403.',
      explanationFA: 'جمع ۱۵۶ و ۲۴۷ برابر با ۴۰۳ است.',
      difficultyEstimate: 0.8,
      gradeLevel: 4,
      subjectCode: 'MATH'
    },
    {
      questionText: 'Calculate: 1,234 + 5,678 = ?',
      questionTextFA: 'محاسبه کنید: ۱٬۲۳۴ + ۵٬۶۷۸ = ؟',
      questionType: 'MULTIPLE_CHOICE',
      options: [
        { text: '6,910', textFA: '۶٬۹۱۰', isCorrect: false },
        { text: '6,911', textFA: '۶٬۹۱۱', isCorrect: false },
        { text: '6,912', textFA: '۶٬۹۱۲', isCorrect: true },
        { text: '6,913', textFA: '۶٬۹۱۳', isCorrect: false }
      ],
      correctAnswer: '6,912',
      explanation: 'Step-by-step addition gives you 6,912.',
      explanationFA: 'جمع گام به گام برابر با ۶٬۹۱۲ است.',
      difficultyEstimate: 1.2,
      gradeLevel: 5,
      subjectCode: 'MATH'
    },
    {
      questionText: 'What is 15 × 12?',
      questionTextFA: '۱۵ × ۱۲ چقدر است؟',
      questionType: 'MULTIPLE_CHOICE',
      options: [
        { text: '170', textFA: '۱۷۰', isCorrect: false },
        { text: '180', textFA: '۱۸۰', isCorrect: true },
        { text: '190', textFA: '۱۹۰', isCorrect: false },
        { text: '200', textFA: '۲۰۰', isCorrect: false }
      ],
      correctAnswer: '180',
      explanation: '15 times 12 equals 180.',
      explanationFA: '۱۵ ضرب در ۱۲ برابر با ۱۸۰ است.',
      difficultyEstimate: 1.5,
      gradeLevel: 5,
      subjectCode: 'MATH'
    },
    {
      questionText: 'Solve: 3x + 5 = 20',
      questionTextFA: 'حل کنید: ۳x + ۵ = ۲۰',
      questionType: 'MULTIPLE_CHOICE',
      options: [
        { text: 'x = 3', textFA: 'x = ۳', isCorrect: false },
        { text: 'x = 4', textFA: 'x = ۴', isCorrect: false },
        { text: 'x = 5', textFA: 'x = ۵', isCorrect: true },
        { text: 'x = 6', textFA: 'x = ۶', isCorrect: false }
      ],
      correctAnswer: 'x = 5',
      explanation: 'Subtract 5 from both sides: 3x = 15. Divide by 3: x = 5.',
      explanationFA: 'از هر دو طرف ۵ کم کنید: ۳x = ۱۵. بر ۳ تقسیم کنید: x = ۵.',
      difficultyEstimate: 2.0,
      gradeLevel: 7,
      subjectCode: 'MATH'
    },
    {
      questionText: 'What is the area of a circle with radius 5 cm? (Use π ≈ 3.14)',
      questionTextFA: 'مساحت دایره‌ای با شعاع ۵ سانتی‌متر چقدر است؟ (از π ≈ ۳.۱۴ استفاده کنید)',
      questionType: 'MULTIPLE_CHOICE',
      options: [
        { text: '78.5 cm²', textFA: '۷۸.۵ سانتی‌متر مربع', isCorrect: true },
        { text: '31.4 cm²', textFA: '۳۱.۴ سانتی‌متر مربع', isCorrect: false },
        { text: '15.7 cm²', textFA: '۱۵.۷ سانتی‌متر مربع', isCorrect: false },
        { text: '25 cm²', textFA: '۲۵ سانتی‌متر مربع', isCorrect: false }
      ],
      correctAnswer: '78.5 cm²',
      explanation: 'Area = πr² = 3.14 × 5² = 3.14 × 25 = 78.5 cm²',
      explanationFA: 'مساحت = πr² = ۳.۱۴ × ۵² = ۳.۱۴ × ۲۵ = ۷۸.۵ سانتی‌متر مربع',
      difficultyEstimate: 1.8,
      gradeLevel: 8,
      subjectCode: 'MATH'
    },
    {
      questionText: 'Simplify: (2x + 3)(x - 4)',
      questionTextFA: 'ساده کنید: (۲x + ۳)(x - ۴)',
      questionType: 'MULTIPLE_CHOICE',
      options: [
        { text: '2x² - 5x - 12', textFA: '۲x² - ۵x - ۱۲', isCorrect: true },
        { text: '2x² + 5x - 12', textFA: '۲x² + ۵x - ۱۲', isCorrect: false },
        { text: '2x² - 8x - 12', textFA: '۲x² - ۸x - ۱۲', isCorrect: false },
        { text: '2x² - 5x + 12', textFA: '۲x² - ۵x + ۱۲', isCorrect: false }
      ],
      correctAnswer: '2x² - 5x - 12',
      explanation: 'Use FOIL: (2x)(x) + (2x)(-4) + (3)(x) + (3)(-4) = 2x² - 8x + 3x - 12 = 2x² - 5x - 12',
      explanationFA: 'از روش FOIL استفاده کنید: (۲x)(x) + (۲x)(-۴) + (۳)(x) + (۳)(-۴) = ۲x² - ۸x + ۳x - ۱۲ = ۲x² - ۵x - ۱۲',
      difficultyEstimate: 2.3,
      gradeLevel: 9,
      subjectCode: 'MATH'
    }
  ];

  for (const q of sampleQuestions) {
    await prisma.scrapedContent.create({
      data: {
        sourceId: oer.id,
        sourceUrl: `https://www.oercommons.org/courses/math-grade-${q.gradeLevel}`,
        contentType: 'QUESTION',
        questionText: q.questionText,
        questionTextFA: q.questionTextFA,
        questionType: q.questionType,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        explanationFA: q.explanationFA,
        difficultyEstimate: q.difficultyEstimate,
        gradeLevel: q.gradeLevel,
        subjectCode: q.subjectCode,
        skillCode: 'ADD_BASIC',
        reviewStatus: 'PENDING',
        license: 'CC BY',
        attributionRequired: true,
        originalAuthor: 'OER Commons Math Team'
      }
    });
  }

  console.log(`✅ Added ${sampleQuestions.length} practice problems to review queue`);

  // Step 3: Show stats
  console.log('\nStep 3: System Statistics');
  
  const pendingCount = await prisma.scrapedContent.count({ where: { reviewStatus: 'PENDING' } });
  const totalSources = await prisma.contentSource.count();

  console.log(`   📚 Content sources: ${totalSources}`);
  console.log(`   📝 Pending review: ${pendingCount}`);
  
  console.log('\n✨ Next Steps:');
  console.log('   1. Open: http://localhost:3000/en/admin/scraped-content');
  console.log('   2. Review the 10 sample questions');
  console.log('   3. Click "Approve" on each question');
  console.log('   4. Enter skill ID when prompted (any existing skill ID from your database)');
  console.log('   5. Test adaptive assessment at: http://localhost:3000/en/student/practice/[skillId]');
  
  console.log('\n🎉 Scraper system is ready!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
