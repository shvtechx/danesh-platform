/**
 * Test script to initialize scraper and add sample practice problems
 */

import { PrismaClient } from '@prisma/client';
import { initializeContentSources } from './src/lib/scraper/educational-scraper';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Testing Educational Web Scraper\n');

  // Step 1: Initialize content sources
  console.log('Step 1: Initializing content sources...');
  const sources = await initializeContentSources();
  console.log(`✅ Created/updated ${sources.length} content sources:`);
  sources.forEach(s => console.log(`   - ${s.name} (${s.url})`));

  // Step 2: Check if we have any skills to link questions to
  console.log('\nStep 2: Checking available skills...');
  const skills = await prisma.skill.findMany({
    take: 5,
    include: { subject: true }
  });
  
  if (skills.length === 0) {
    console.log('⚠️  No skills found. Creating sample Math skill...');
    
    // Check if Math subject exists
    let mathSubject = await prisma.subject.findFirst({
      where: { code: 'MATH' }
    });

    if (!mathSubject) {
      console.log('   Creating Math subject...');
      mathSubject = await prisma.subject.create({
        data: {
          code: 'MATH',
          name: 'Mathematics',
          nameFA: 'ریاضیات',
          description: 'Mathematical concepts and problem solving',
          icon: '🔢',
          gradeBandMin: 1,
          gradeBandMax: 12,
          order: 1
        }
      });
    }

    // Create a strand
    let strand = await prisma.strand.findFirst({
      where: { code: 'NUMBER', subjectId: mathSubject.id }
    });

    if (!strand) {
      strand = await prisma.strand.create({
        data: {
          code: 'NUMBER',
          name: 'Number Operations',
          nameFA: 'عملیات اعداد',
          description: 'Basic arithmetic operations',
          subjectId: mathSubject.id,
          order: 1
        }
      });
    }

    // Create a sample skill
    const sampleSkill = await prisma.skill.create({
      data: {
        id: 'MATH_ADDITION_BASIC',
        code: 'ADD_BASIC',
        name: 'Basic Addition',
        nameFA: 'جمع پایه',
        description: 'Add two numbers together',
        descriptionFA: 'جمع دو عدد با هم',
        subjectId: mathSubject.id,
        strandId: strand.id,
        gradeBandMin: 1,
        gradeBandMax: 3,
        order: 1
      }
    });
    
    console.log(`✅ Created skill: ${sampleSkill.name} (${sampleSkill.id})`);
  } else {
    console.log(`✅ Found ${skills.length} existing skills:`);
    skills.forEach(s => console.log(`   - ${s.name} (${s.id}) - ${s.subject?.name || 'No subject'}`));
  }

  // Step 3: Add sample scraped content manually (simulating scraper)
  console.log('\nStep 3: Adding sample scraped content...');
  
  const oerSource = sources.find(s => s.name === 'OER Commons');
  
  if (oerSource) {
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
        explanation: '25 + 38 = 63. Add the ones place: 5 + 8 = 13. Add the tens place: 20 + 30 + 10 = 60. Total: 63.',
        explanationFA: '۲۵ + ۳۸ = ۶۳. یکان را جمع کنید: ۵ + ۸ = ۱۳. دهگان را جمع کنید: ۲۰ + ۳۰ + ۱۰ = ۶۰. مجموع: ۶۳.',
        difficultyEstimate: 0.2,
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
        explanation: 'Adding 156 and 247: 6+7=13 (carry 1), 5+4+1=10 (carry 1), 1+2+1=4. Result: 403.',
        explanationFA: 'جمع ۱۵۶ و ۲۴۷: ۶+۷=۱۳ (یک رقم به جلو)، ۵+۴+۱=۱۰ (یک رقم به جلو)، ۱+۲+۱=۴. نتیجه: ۴۰۳.',
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
        explanation: 'Step-by-step addition: 4+8=12, 3+7+1=11, 2+6+1=9, 1+5=6. Answer: 6,912.',
        explanationFA: 'جمع گام به گام: ۴+۸=۱۲، ۳+۷+۱=۱۱، ۲+۶+۱=۹، ۱+۵=۶. جواب: ۶٬۹۱۲.',
        difficultyEstimate: 1.2,
        gradeLevel: 5,
        subjectCode: 'MATH'
      }
    ];

    for (const q of sampleQuestions) {
      await prisma.scrapedContent.create({
        data: {
          sourceId: oerSource.id,
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

    console.log(`✅ Added ${sampleQuestions.length} sample practice problems to review queue`);
  }

  // Step 4: Show stats
  console.log('\nStep 4: Current system stats:');
  
  const pendingCount = await prisma.scrapedContent.count({
    where: { reviewStatus: 'PENDING' }
  });
  
  const approvedCount = await prisma.scrapedContent.count({
    where: { reviewStatus: 'APPROVED' }
  });

  const totalQuestions = await prisma.question.count();
  const totalSkills = await prisma.skill.count();

  console.log(`   📝 Scraped content pending review: ${pendingCount}`);
  console.log(`   ✅ Scraped content approved: ${approvedCount}`);
  console.log(`   ❓ Total questions in database: ${totalQuestions}`);
  console.log(`   🎯 Total skills available: ${totalSkills}`);

  console.log('\n✨ Next steps:');
  console.log('   1. Go to http://localhost:3000/en/admin/scraped-content');
  console.log('   2. Review the pending questions');
  console.log('   3. Approve them by clicking "Approve" and entering skill ID: MATH_ADDITION_BASIC');
  console.log('   4. Visit http://localhost:3000/en/student/practice/MATH_ADDITION_BASIC to try the adaptive assessment!');
  console.log('   5. Or visit http://localhost:3000/en/student/skills to see all available skills');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
