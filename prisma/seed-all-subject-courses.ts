/**
 * Seed script: creates one demo course per subject for all 14 DB subjects.
 * Safe to run multiple times (upsert).
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-all-subject-courses.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COURSE_DEFS: Array<{
  subjectCode: string;
  gradeCode: string;
  code: string;
  title: string;
  titleFA: string;
  description: string;
}> = [
  {
    subjectCode: 'AI',
    gradeCode: 'G9',
    code: 'AI-G9-INTRO',
    title: 'Introduction to Artificial Intelligence',
    titleFA: 'مقدمه‌ای بر هوش مصنوعی',
    description: 'Explore the fundamentals of AI: machine learning, neural networks, and real-world applications.',
  },
  {
    subjectCode: 'CS',
    gradeCode: 'G7',
    code: 'CS-G7-FOUND',
    title: 'Computer Science Foundations',
    titleFA: 'مبانی علوم کامپیوتر',
    description: 'Learn programming logic, algorithms, and problem-solving with hands-on coding activities.',
  },
  {
    subjectCode: 'ENG',
    gradeCode: 'G6',
    code: 'ENG-G6-SKILLS',
    title: 'English Language Skills',
    titleFA: 'مهارت‌های زبان انگلیسی',
    description: 'Build reading, writing, speaking, and listening skills in English for everyday communication.',
  },
  {
    subjectCode: 'ENTREP',
    gradeCode: 'G10',
    code: 'ENTREP-G10-BASICS',
    title: 'Entrepreneurship Basics',
    titleFA: 'مبانی کارآفرینی',
    description: 'Discover how to turn ideas into businesses: business models, pitching, and project management.',
  },
  {
    subjectCode: 'ETHICS',
    gradeCode: 'G8',
    code: 'ETHICS-G8-LIFE',
    title: 'Ethics & Life Skills',
    titleFA: 'اخلاق و مهارت‌های زندگی',
    description: 'Explore ethical thinking, values, critical reasoning, and responsible decision-making.',
  },
  {
    subjectCode: 'MATH',
    gradeCode: 'G5',
    code: 'MATH-G5-CORE',
    title: 'Mathematics Grade 5',
    titleFA: 'ریاضی پایه پنجم',
    description: 'Comprehensive mathematics covering fractions, geometry, and basic algebra for Grade 5.',
  },
  {
    subjectCode: 'MUS',
    gradeCode: 'G4',
    code: 'MUS-G4-INTRO',
    title: 'Music Appreciation & Basics',
    titleFA: 'آشنایی با موسیقی',
    description: 'Introduction to rhythm, melody, and music history through listening and creative activities.',
  },
  {
    subjectCode: 'PER_LIT',
    gradeCode: 'G7',
    code: 'PER-LIT-G7-CLASS',
    title: 'Persian Literature & Classics',
    titleFA: 'ادبیات فارسی کلاسیک',
    description: 'Journey through Persian poetry and prose: Hafez, Rumi, and the great literary heritage of Iran.',
  },
  {
    subjectCode: 'PE',
    gradeCode: 'G6',
    code: 'PE-G6-WELLNESS',
    title: 'Physical Education & Wellness',
    titleFA: 'تربیت بدنی و سلامت',
    description: 'Develop physical fitness, teamwork, and healthy lifestyle habits through sport and exercise.',
  },
  {
    subjectCode: 'ROBOT',
    gradeCode: 'G8',
    code: 'ROBOT-G8-BUILD',
    title: 'Robotics & Engineering',
    titleFA: 'رباتیک و مهندسی',
    description: 'Design, build, and program robots while learning engineering principles and creative problem-solving.',
  },
  {
    subjectCode: 'SCI',
    gradeCode: 'G5',
    code: 'SCI-G5-EXPLORE',
    title: 'Science Exploration Grade 5',
    titleFA: 'علوم تجربی پایه پنجم',
    description: 'Explore the natural world through experiments: life science, physical science, and earth science.',
  },
  {
    subjectCode: 'SEL',
    gradeCode: 'G3',
    code: 'SEL-G3-FEELINGS',
    title: 'Social-Emotional Learning',
    titleFA: 'یادگیری اجتماعی-هیجانی',
    description: 'Build emotional intelligence, empathy, communication, and resilience skills for school and life.',
  },
  {
    subjectCode: 'SOC',
    gradeCode: 'G6',
    code: 'SOC-G6-WORLD',
    title: 'Social Studies: Our World',
    titleFA: 'مطالعات اجتماعی: جهان ما',
    description: 'Discover geography, history, cultures, and civics to understand our interconnected world.',
  },
  {
    subjectCode: 'ART',
    gradeCode: 'G4',
    code: 'ART-G4-STUDIO',
    title: 'Visual Arts Studio',
    titleFA: 'هنرهای تجسمی',
    description: 'Express creativity through drawing, painting, and design while exploring art history and techniques.',
  },
];

async function main() {
  console.log('🌱 Seeding demo courses for all 14 subjects...\n');

  // Ensure framework exists
  const framework = await prisma.curriculumFramework.upsert({
    where: { code: 'IRANIAN_NATIONAL' },
    update: {},
    create: {
      code: 'IRANIAN_NATIONAL',
      name: 'Iranian National Curriculum',
      nameFA: 'برنامه درسی ملی ایران',
      description: 'Official curriculum framework of the Iranian Ministry of Education',
      isActive: true,
    },
  });

  console.log(`✓ Framework: ${framework.name}`);

  // Load all subjects
  const subjects = await prisma.subject.findMany({ select: { id: true, code: true, name: true } });
  const subjectMap = new Map(subjects.map(s => [s.code, s]));
  console.log(`✓ Found ${subjects.length} subjects in DB`);

  // Load all grade levels
  const grades = await prisma.gradeLevel.findMany({ select: { id: true, code: true } });
  const gradeMap = new Map(grades.map(g => [g.code, g]));
  console.log(`✓ Found ${grades.length} grade levels in DB\n`);

  if (grades.length === 0) {
    console.error('❌ No grade levels found. Run seed-curriculum-v2.ts first.');
    process.exit(1);
  }

  // Pick a fallback grade if a specific one is missing
  const fallbackGrade = grades[0];

  let created = 0;
  let skipped = 0;

  for (const def of COURSE_DEFS) {
    const subject = subjectMap.get(def.subjectCode);
    if (!subject) {
      console.log(`  ⚠ Subject ${def.subjectCode} not found in DB — skipping ${def.code}`);
      skipped++;
      continue;
    }

    const grade = gradeMap.get(def.gradeCode) || fallbackGrade;

    try {
      const course = await prisma.course.upsert({
        where: { code: def.code },
        update: {
          title: def.title,
          titleFA: def.titleFA,
          description: def.description,
          isPublished: true,
        },
        create: {
          code: def.code,
          title: def.title,
          titleFA: def.titleFA,
          description: def.description,
          subjectId: subject.id,
          gradeLevelId: grade.id,
          frameworkId: framework.id,
          isPublished: true,
        },
      });
      console.log(`  ✓ [${def.subjectCode}] ${course.title}`);
      created++;
    } catch (err) {
      console.error(`  ✗ Failed to upsert ${def.code}:`, err);
      skipped++;
    }
  }

  console.log(`\n📊 Done: ${created} courses created/updated, ${skipped} skipped.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
