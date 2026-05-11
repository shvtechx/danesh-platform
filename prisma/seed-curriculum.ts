/**
 * Comprehensive K-12 Curriculum Seed
 * Covers Iranian, IB, US Common Core, and British National Curriculum
 * Follows 5E/5ت Learning Cycle pedagogy
 */

import { PrismaClient, GradeBand } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// SUBJECT DEFINITIONS (K-12 Universal)
// ============================================================================

const SUBJECTS = [
  // Core Subjects
  {
    code: 'MATH',
    name: 'Mathematics',
    nameFA: 'ریاضیات',
    icon: '🔢',
    color: '#3B82F6',
    description: 'Numbers, algebra, geometry, statistics, and problem-solving',
  },
  {
    code: 'SCI',
    name: 'Science',
    nameFA: 'علوم',
    icon: '🔬',
    color: '#10B981',
    description: 'Physics, Chemistry, Biology, and Earth Sciences',
  },
  {
    code: 'ENG',
    name: 'English Language',
    nameFA: 'زبان انگلیسی',
    icon: '📖',
    color: '#8B5CF6',
    description: 'Reading, writing, grammar, and literature',
  },
  {
    code: 'PER_LIT',
    name: 'Persian Literature',
    nameFA: 'ادبیات فارسی',
    icon: '📜',
    color: '#F59E0B',
    description: 'Persian poetry, prose, and classical literature',
  },
  {
    code: 'SOC',
    name: 'Social Studies',
    nameFA: 'مطالعات اجتماعی',
    icon: '🌍',
    color: '#EC4899',
    description: 'History, geography, civics, and cultural studies',
  },
  
  // STEM & Innovation
  {
    code: 'CS',
    name: 'Computer Science',
    nameFA: 'علوم کامپیوتر',
    icon: '💻',
    color: '#06B6D4',
    description: 'Programming, algorithms, and computational thinking',
  },
  {
    code: 'ROBOT',
    name: 'Robotics & Engineering',
    nameFA: 'رباتیک و مهندسی',
    icon: '🤖',
    color: '#6366F1',
    description: 'Robotics, automation, mechanical and electrical engineering',
  },
  {
    code: 'AI',
    name: 'Artificial Intelligence',
    nameFA: 'هوش مصنوعی',
    icon: '🧠',
    color: '#8B5CF6',
    description: 'Machine learning, neural networks, and AI applications',
  },
  {
    code: 'ENTREP',
    name: 'Entrepreneurship & Innovation',
    nameFA: 'کارآفرینی و نوآوری',
    icon: '💡',
    color: '#F59E0B',
    description: 'Business skills, venture creation, and innovation thinking',
  },
  
  // Arts & Languages
  {
    code: 'ART',
    name: 'Visual Arts',
    nameFA: 'هنرهای تجسمی',
    icon: '🎨',
    color: '#EC4899',
    description: 'Drawing, painting, sculpture, and design',
  },
  {
    code: 'MUS',
    name: 'Music',
    nameFA: 'موسیقی',
    icon: '🎵',
    color: '#A855F7',
    description: 'Music theory, performance, and appreciation',
  },
  {
    code: 'PE',
    name: 'Physical Education',
    nameFA: 'تربیت بدنی',
    icon: '⚽',
    color: '#10B981',
    description: 'Sports, fitness, and healthy living',
  },
  
  // Life Skills
  {
    code: 'SEL',
    name: 'Social-Emotional Learning',
    nameFA: 'یادگیری اجتماعی-عاطفی',
    icon: '❤️',
    color: '#EF4444',
    description: 'Self-awareness, empathy, and relationship skills',
  },
  {
    code: 'ETHICS',
    name: 'Ethics & Philosophy',
    nameFA: 'اخلاق و فلسفه',
    icon: '🤔',
    color: '#64748B',
    description: 'Critical thinking, moral reasoning, and philosophy',
  },
];

// ============================================================================
// GRADE STRUCTURE (K-12)
// ============================================================================

const GRADES = {
  'EARLY_YEARS': ['KG', 'Grade 1', 'Grade 2', 'Grade 3'],
  'PRIMARY': ['Grade 4', 'Grade 5', 'Grade 6'],
  'MIDDLE': ['Grade 7', 'Grade 8', 'Grade 9'],
  'SECONDARY': ['Grade 10', 'Grade 11', 'Grade 12'],
};

// ============================================================================
// SAMPLE QUESTIONS BANK (5E Cycle Aligned)
// ============================================================================

const SAMPLE_QUESTIONS = {
  MATH: {
    'Grade 1': {
      engage: [
        {
          question: 'How many fingers do you have on both hands?',
          questionFA: 'چند انگشت روی هر دو دست داری؟',
          type: 'multiple_choice',
          options: ['8', '10', '12', '20'],
          correctAnswer: 1,
          explanation: 'Count 5 fingers on each hand: 5 + 5 = 10',
          explanationFA: 'پنج انگشت روی هر دست بشمار: ۵ + ۵ = ۱۰',
        },
      ],
      explore: [
        {
          question: 'If you have 3 apples and get 2 more, how many apples do you have?',
          questionFA: 'اگر ۳ سیب داشته باشی و ۲ تا دیگر بگیری، چند سیب داری؟',
          type: 'multiple_choice',
          options: ['4', '5', '6', '7'],
          correctAnswer: 1,
          explanation: 'Start with 3, add 2 more: 3 + 2 = 5',
          explanationFA: 'با ۳ شروع کن، ۲ تا اضافه کن: ۳ + ۲ = ۵',
        },
      ],
      explain: [
        {
          question: 'What does the + sign mean?',
          questionFA: 'علامت + یعنی چه؟',
          type: 'multiple_choice',
          options: ['Take away', 'Add together', 'Equal', 'Multiply'],
          optionsFA: ['کم کردن', 'جمع کردن', 'مساوی', 'ضرب کردن'],
          correctAnswer: 1,
          explanation: 'The + sign means to add or put numbers together',
          explanationFA: 'علامت + یعنی جمع کردن یا کنار هم گذاشتن اعداد',
        },
      ],
      elaborate: [
        {
          question: 'You have 4 red balloons and 3 blue balloons. How many balloons in total?',
          questionFA: 'تو ۴ بادکنک قرمز و ۳ بادکنک آبی داری. در مجموع چند بادکنک داری؟',
          type: 'multiple_choice',
          options: ['5', '6', '7', '8'],
          correctAnswer: 2,
          explanation: 'Add red and blue: 4 + 3 = 7 balloons',
          explanationFA: 'قرمز و آبی را جمع کن: ۴ + ۳ = ۷ بادکنک',
        },
      ],
      evaluate: [
        {
          question: 'Solve: 5 + 4 = ?',
          questionFA: 'حل کن: ۵ + ۴ = ؟',
          type: 'multiple_choice',
          options: ['7', '8', '9', '10'],
          correctAnswer: 2,
          explanation: '5 + 4 = 9',
          explanationFA: '۵ + ۴ = ۹',
        },
      ],
    },
    'Grade 8': {
      engage: [
        {
          question: 'If a phone plan costs $30/month plus $0.10 per text, which equation represents the monthly cost?',
          questionFA: 'اگر یک طرح تلفن ماهانه ۳۰ دلار به اضافه ۰.۱۰ دلار برای هر پیام باشد، کدام معادله هزینه ماهانه را نشان می‌دهد؟',
          type: 'multiple_choice',
          options: ['C = 30 + 0.10', 'C = 30x + 0.10', 'C = 30 + 0.10x', 'C = 0.10x'],
          correctAnswer: 2,
          explanation: 'Fixed cost ($30) + variable cost ($0.10 per text), where x = number of texts',
          explanationFA: 'هزینه ثابت (۳۰ دلار) + هزینه متغیر (۰.۱۰ دلار به ازای هر پیام)، که x تعداد پیام‌هاست',
        },
      ],
      explore: [
        {
          question: 'Solve: 2x + 5 = 13',
          questionFA: 'حل کن: 2x + 5 = 13',
          type: 'multiple_choice',
          options: ['x = 3', 'x = 4', 'x = 5', 'x = 9'],
          correctAnswer: 1,
          explanation: 'Subtract 5 from both sides: 2x = 8, then divide by 2: x = 4',
          explanationFA: 'از دو طرف ۵ کم کن: 2x = 8، سپس بر ۲ تقسیم کن: x = 4',
        },
      ],
    },
  },
  SCI: {
    'Grade 5': {
      engage: [
        {
          question: 'Why do plants need sunlight?',
          questionFA: 'چرا گیاهان به نور خورشید نیاز دارند؟',
          type: 'multiple_choice',
          options: [
            'To stay warm',
            'To make food through photosynthesis',
            'To look colorful',
            'To grow taller'
          ],
          optionsFA: [
            'برای گرم ماندن',
            'برای ساختن غذا از طریق فتوسنتز',
            'برای رنگی بودن',
            'برای بلندتر شدن'
          ],
          correctAnswer: 1,
          explanation: 'Plants use sunlight, water, and CO2 to make glucose (food) in photosynthesis',
          explanationFA: 'گیاهان از نور خورشید، آب و CO2 برای ساخت گلوکز (غذا) در فتوسنتز استفاده می‌کنند',
        },
      ],
    },
  },
  AI: {
    'Grade 10': {
      engage: [
        {
          question: 'What is the main goal of supervised machine learning?',
          questionFA: 'هدف اصلی یادگیری ماشین نظارت‌شده چیست؟',
          type: 'multiple_choice',
          options: [
            'Generate random outputs',
            'Learn patterns from labeled data to make predictions',
            'Store large amounts of data',
            'Replace human workers'
          ],
          optionsFA: [
            'تولید خروجی‌های تصادفی',
            'یادگیری الگوها از داده‌های برچسب‌دار برای پیش‌بینی',
            'ذخیره حجم زیادی از داده',
            'جایگزینی کارگران انسانی'
          ],
          correctAnswer: 1,
          explanation: 'Supervised learning uses labeled training data to learn patterns and make predictions on new data',
          explanationFA: 'یادگیری نظارت‌شده از داده‌های آموزشی برچسب‌دار برای یادگیری الگوها و پیش‌بینی روی داده‌های جدید استفاده می‌کند',
        },
      ],
    },
  },
  ROBOT: {
    'Grade 9': {
      engage: [
        {
          question: 'What are the three basic components of a robot?',
          questionFA: 'سه جزء اصلی یک ربات چیست؟',
          type: 'multiple_choice',
          options: [
            'Battery, wheels, and lights',
            'Sensors, controller/brain, and actuators/motors',
            'Camera, screen, and keyboard',
            'Power supply, memory, and display'
          ],
          optionsFA: [
            'باتری، چرخ‌ها و چراغ‌ها',
            'حسگرها، کنترلر/مغز و عملگرها/موتورها',
            'دوربین، صفحه نمایش و صفحه کلید',
            'منبع تغذیه، حافظه و نمایشگر'
          ],
          correctAnswer: 1,
          explanation: 'Robots need sensors (to perceive), a controller (to think/process), and actuators (to act/move)',
          explanationFA: 'رباتها به حسگرها (برای درک)، کنترلر (برای فکر کردن/پردازش) و عملگرها (برای عمل/حرکت) نیاز دارند',
        },
      ],
    },
  },
  ENTREP: {
    'Grade 11': {
      engage: [
        {
          question: 'What is a Minimum Viable Product (MVP)?',
          questionFA: 'محصول کمترین قابل قبول (MVP) چیست؟',
          type: 'multiple_choice',
          options: [
            'The cheapest product you can make',
            'A product with just enough features to test your idea with real users',
            'A perfect product with all features',
            'A prototype that never gets released'
          ],
          optionsFA: [
            'ارزان‌ترین محصولی که می‌توانی بسازی',
            'محصولی با ویژگی‌های کافی برای آزمایش ایده‌ات با کاربران واقعی',
            'محصول کاملی با همه ویژگی‌ها',
            'نمونه اولیه‌ای که هرگز منتشر نمی‌شود'
          ],
          correctAnswer: 1,
          explanation: 'An MVP has core features needed to solve the main problem and validate your business idea quickly',
          explanationFA: 'MVP ویژگی‌های اصلی مورد نیاز برای حل مشکل اصلی و تایید سریع ایده کسب‌وکارت را دارد',
        },
      ],
    },
  },
};

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedSubjects() {
  console.log('🌱 Seeding subjects...');
  
  for (const subject of SUBJECTS) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: subject,
      create: subject,
    });
  }
  
  console.log(`✅ Seeded ${SUBJECTS.length} subjects`);
}

async function seedQuestions() {
  console.log('🌱 Seeding sample questions...');
  
  let totalQuestions = 0;
  
  for (const [subjectCode, grades] of Object.entries(SAMPLE_QUESTIONS)) {
    const subject = await prisma.subject.findUnique({
      where: { code: subjectCode },
    });
    
    if (!subject) continue;
    
    for (const [grade, phases] of Object.entries(grades)) {
      for (const [phase, questions] of Object.entries(phases)) {
        for (const q of questions as any[]) {
          await prisma.question.create({
            data: {
              subjectId: subject.id,
              grade: grade,
              gradeBand: getGradeBand(grade),
              streamMetadata: {},
              type: q.type,
              question: q.question,
              questionFA: q.questionFA,
              options: q.options,
              optionsFA: q.optionsFA || q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              explanationFA: q.explanationFA,
              phase5E: phase.toUpperCase(),
              difficultyLevel: getDifficulty(grade),
              pointsValue: 10,
              timeLimit: 60,
              tags: [subjectCode, grade, phase],
            },
          });
          totalQuestions++;
        }
      }
    }
  }
  
  console.log(`✅ Seeded ${totalQuestions} sample questions`);
}

function getGradeBand(grade: string): GradeBand {
  if (['KG', 'Grade 1', 'Grade 2', 'Grade 3'].includes(grade)) return 'EARLY_YEARS';
  if (['Grade 4', 'Grade 5', 'Grade 6'].includes(grade)) return 'PRIMARY';
  if (['Grade 7', 'Grade 8', 'Grade 9'].includes(grade)) return 'MIDDLE';
  return 'SECONDARY';
}

function getDifficulty(grade: string): 'EASY' | 'MEDIUM' | 'HARD' {
  const gradeNum = parseInt(grade.replace(/\D/g, ''));
  if (gradeNum <= 3) return 'EASY';
  if (gradeNum <= 8) return 'MEDIUM';
  return 'HARD';
}

// ============================================================================
// MAIN SEED EXECUTION
// ============================================================================

async function main() {
  console.log('🚀 Starting curriculum seed...\n');
  
  try {
    await seedSubjects();
    await seedQuestions();
    
    console.log('\n✨ Curriculum seed completed successfully!');
    console.log('\n📚 Next steps:');
    console.log('1. Run this seed: npx ts-node prisma/seed-curriculum.ts');
    console.log('2. Check admin subjects page to see all subjects');
    console.log('3. Teachers can now create courses for any subject');
    console.log('4. Question bank is available for assessment creation\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
