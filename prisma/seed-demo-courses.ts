import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting demo courses seed...\n');

  // Get subjects
  const mathSubject = await prisma.subject.findFirst({
    where: { code: 'MATH' }
  });

  const scienceSubject = await prisma.subject.findFirst({
    where: { code: 'SCI' }
  });

  if (!mathSubject || !scienceSubject) {
    console.log('❌ Subjects not found. Please run seed-curriculum-v2.ts first');
    return;
  }

  // Create a demo teacher (if not exists)
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@danesh.edu' },
    update: {},
    create: {
      email: 'teacher@danesh.edu',
      status: 'ACTIVE',
      profile: {
        create: {
          firstName: 'Demo',
          lastName: 'Teacher',
          displayName: 'Demo Teacher'
        }
      }
    }
  });

  // Get Grade 5
  const grade5 = await prisma.gradeLevel.findFirst({
    where: { code: 'G5' }
  });

  if (!grade5) {
    console.log('❌ Grade level not found. Please run seed-curriculum-v2.ts first');
    return;
  }

  // Create default curriculum framework if not exists
  const framework = await prisma.curriculumFramework.upsert({
    where: { code: 'IRANIAN_NATIONAL' },
    update: {},
    create: {
      code: 'IRANIAN_NATIONAL',
      name: 'Iranian National Curriculum',
      nameFA: 'برنامه درسی ملی ایران',
      description: 'Official curriculum framework of the Iranian Ministry of Education',
      isActive: true
    }
  });

  // Create Math Course for Grade 5
  const mathCourse = await prisma.course.upsert({
    where: { 
      code: 'MATH-G5-DEMO'
    },
    update: {},
    create: {
      code: 'MATH-G5-DEMO',
      title: 'Mathematics Grade 5',
      titleFA: 'ریاضی پایه پنجم',
      description: 'Comprehensive mathematics curriculum for 5th grade students',
      descriptionFA: 'برنامه درسی جامع ریاضیات برای دانش‌آموزان پایه پنجم',
      subjectId: mathSubject.id,
      gradeLevelId: grade5.id,
      frameworkId: framework.id,
      isPublished: true
    }
  });

  console.log(`✅ Created course: ${mathCourse.title}`);

  // Create Unit 1: Fractions
  const unit1 = await prisma.unit.upsert({
    where: {
      id: 'demo-unit-fractions'
    },
    update: {},
    create: {
      id: 'demo-unit-fractions',
      courseId: mathCourse.id,
      sequence: 1,
      title: 'Introduction to Fractions',
      titleFA: 'مقدمه‌ای بر کسرها',
      description: 'Learn the basics of fractions',
      descriptionFA: 'یادگیری مبانی کسرها'
    }
  });

  console.log(`  ✅ Created unit: ${unit1.title}`);

  // Create Lesson 1: ENGAGE - What are Fractions?
  const lesson1 = await prisma.lesson.upsert({
    where: {
      id: 'demo-lesson-1-engage'
    },
    update: {},
    create: {
      id: 'demo-lesson-1-engage',
      unitId: unit1.id,
      sequence: 1,
      title: 'What are Fractions?',
      titleFA: 'کسر چیست؟',
      phase: 'ENGAGE',
      estimatedTime: 15,
      isPublished: true
    }
  });

  // Create content for Lesson 1
  const content1 = await prisma.contentItem.create({
    data: {
      type: 'TEXT',
      title: 'Understanding Fractions',
      titleFA: 'درک کسرها',
      language: 'EN',
      modality: 'TEXT',
      body: `
        <h2>What is a Fraction?</h2>
        <p>A fraction represents a part of a whole. When you cut a pizza into 8 slices and eat 3 of them, you've eaten 3/8 (three-eighths) of the pizza!</p>
        
        <h3>The Parts of a Fraction</h3>
        <ul>
          <li><strong>Numerator</strong>: The top number (how many parts you have)</li>
          <li><strong>Denominator</strong>: The bottom number (total number of equal parts)</li>
        </ul>
        
        <p><strong>Example:</strong> In 3/8:</p>
        <ul>
          <li>3 is the numerator (you ate 3 slices)</li>
          <li>8 is the denominator (the pizza was cut into 8 slices)</li>
        </ul>
        
        <h3>Real-World Examples</h3>
        <ul>
          <li>🍕 Sharing a pizza with friends</li>
          <li>⏰ Half an hour (1/2 of 60 minutes = 30 minutes)</li>
          <li>🍫 A chocolate bar divided into squares</li>
          <li>🎂 Cutting a cake for a birthday party</li>
        </ul>
      `,
      bodyFA: `
        <h2>کسر چیست؟</h2>
        <p>کسر نشان‌دهنده بخشی از یک کل است. وقتی یک پیتزا را به ۸ تکه تقسیم می‌کنید و ۳ تکه آن را می‌خورید، ۳/۸ (سه هشتم) پیتزا را خورده‌اید!</p>
        
        <h3>اجزای یک کسر</h3>
        <ul>
          <li><strong>صورت</strong>: عدد بالایی (چند قسمت دارید)</li>
          <li><strong>مخرج</strong>: عدد پایینی (تعداد کل قسمت‌های مساوی)</li>
        </ul>
        
        <p><strong>مثال:</strong> در ۳/۸:</p>
        <ul>
          <li>۳ صورت است (۳ تکه خوردید)</li>
          <li>۸ مخرج است (پیتزا به ۸ تکه تقسیم شده بود)</li>
        </ul>
        
        <h3>نمونه‌های واقعی</h3>
        <ul>
          <li>🍕 تقسیم پیتزا با دوستان</li>
          <li>⏰ نیم ساعت (۱/۲ از ۶۰ دقیقه = ۳۰ دقیقه)</li>
          <li>🍫 یک شکلات تقسیم شده به مربع‌ها</li>
          <li>🎂 بریدن کیک برای جشن تولد</li>
        </ul>
      `
    }
  });

  await prisma.lessonContent.create({
    data: {
      lessonId: lesson1.id,
      contentItemId: content1.id,
      sequence: 1
    }
  });

  console.log(`    ✅ Created lesson: ${lesson1.title} (${lesson1.phase})`);

  // Create Lesson 2: EXPLORE - Visualizing Fractions
  const lesson2 = await prisma.lesson.upsert({
    where: {
      id: 'demo-lesson-2-explore'
    },
    update: {},
    create: {
      id: 'demo-lesson-2-explore',
      unitId: unit1.id,
      sequence: 2,
      title: 'Visualizing Fractions',
      titleFA: 'تصویرسازی کسرها',
      phase: 'EXPLORE',
      estimatedTime: 20,
      isPublished: true
    }
  });

  const content2 = await prisma.contentItem.create({
    data: {
      type: 'INTERACTIVE',
      title: 'Fraction Visualization Activity',
      titleFA: 'فعالیت تصویرسازی کسر',
      language: 'EN',
      modality: 'INTERACTIVE',
      body: `
        <h2>Interactive Fraction Explorer</h2>
        <p>In this activity, you will:</p>
        <ol>
          <li>See different shapes divided into equal parts</li>
          <li>Click on parts to shade them</li>
          <li>Watch how the fraction changes as you select more parts</li>
          <li>Try to create specific fractions like 1/2, 3/4, 2/3</li>
        </ol>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white; border-radius: 10px; margin: 20px 0;">
          <h3>🎨 Interactive Activity</h3>
          <p>Click "Start Activity" below to begin exploring fractions visually!</p>
        </div>
        
        <h3>What to Look For:</h3>
        <ul>
          <li>How the numerator changes when you select parts</li>
          <li>The denominator stays the same (total parts)</li>
          <li>Different ways to represent the same fraction (e.g., 2/4 = 1/2)</li>
        </ul>
      `,
      bodyFA: `
        <h2>کاوشگر تعاملی کسر</h2>
        <p>در این فعالیت، شما:</p>
        <ol>
          <li>اشکال مختلف تقسیم شده به قسمت‌های مساوی را خواهید دید</li>
          <li>روی قسمت‌ها کلیک کنید تا سایه‌دار شوند</li>
          <li>ببینید کسر چگونه با انتخاب قسمت‌های بیشتر تغییر می‌کند</li>
          <li>سعی کنید کسرهای خاصی مانند ۱/۲، ۳/۴، ۲/۳ ایجاد کنید</li>
        </ol>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white; border-radius: 10px; margin: 20px 0;">
          <h3>🎨 فعالیت تعاملی</h3>
          <p>برای شروع کاوش بصری کسرها، روی "شروع فعالیت" در زیر کلیک کنید!</p>
        </div>
        
        <h3>چه چیزی را باید بررسی کنید:</h3>
        <ul>
          <li>صورت چگونه با انتخاب قسمت‌ها تغییر می‌کند</li>
          <li>مخرج ثابت می‌ماند (کل قسمت‌ها)</li>
          <li>روش‌های مختلف نمایش یک کسر یکسان (مثلاً ۲/۴ = ۱/۲)</li>
        </ul>
      `
    }
  });

  await prisma.lessonContent.create({
    data: {
      lessonId: lesson2.id,
      contentItemId: content2.id,
      sequence: 1
    }
  });

  console.log(`    ✅ Created lesson: ${lesson2.title} (${lesson2.phase})`);

  // Create Lesson 3: EXPLAIN - Reading and Writing Fractions
  const lesson3 = await prisma.lesson.upsert({
    where: {
      id: 'demo-lesson-3-explain'
    },
    update: {},
    create: {
      id: 'demo-lesson-3-explain',
      unitId: unit1.id,
      sequence: 3,
      title: 'Reading and Writing Fractions',
      titleFA: 'خواندن و نوشتن کسرها',
      phase: 'EXPLAIN',
      estimatedTime: 25,
      isPublished: true
    }
  });

  const content3 = await prisma.contentItem.create({
    data: {
      type: 'VIDEO',
      title: 'How to Read and Write Fractions',
      titleFA: 'نحوه خواندن و نوشتن کسرها',
      language: 'EN',
      modality: 'VIDEO',
      body: `
        <h2>Learning to Read and Write Fractions</h2>
        <p>Watch this video to learn the proper way to read and write fractions.</p>
      `,
      bodyFA: `
        <h2>یادگیری خواندن و نوشتن کسرها</h2>
        <p>این ویدیو را تماشا کنید تا روش صحیح خواندن و نوشتن کسرها را بیاموزید.</p>
      `,
      metadata: {
        url: 'https://www.youtube.com/embed/uSzcP_rH17Y'
      }
    }
  });

  await prisma.lessonContent.create({
    data: {
      lessonId: lesson3.id,
      contentItemId: content3.id,
      sequence: 1
    }
  });

  console.log(`    ✅ Created lesson: ${lesson3.title} (${lesson3.phase})`);

  // Create Lesson 4: ELABORATE - Practice Problems
  const lesson4 = await prisma.lesson.upsert({
    where: {
      id: 'demo-lesson-4-elaborate'
    },
    update: {},
    create: {
      id: 'demo-lesson-4-elaborate',
      unitId: unit1.id,
      sequence: 4,
      title: 'Fraction Practice Problems',
      titleFA: 'تمرین‌های کسر',
      phase: 'ELABORATE',
      estimatedTime: 30,
      isPublished: true
    }
  });

  const content4 = await prisma.contentItem.create({
    data: {
      type: 'TEXT',
      title: 'Practice Exercises',
      titleFA: 'تمرینات عملی',
      language: 'EN',
      modality: 'TEXT',
      body: `
        <h2>Let's Practice!</h2>
        <p>Now it's time to apply what you've learned. Try these problems:</p>
        
        <h3>Problem 1: Pizza Party</h3>
        <p>Maria ordered 2 pizzas for her party. Each pizza was cut into 8 slices. Her friends ate 12 slices total. What fraction of the pizza was eaten?</p>
        <p><em>Hint: How many total slices were there? How many were eaten?</em></p>
        
        <h3>Problem 2: Chocolate Bar</h3>
        <p>A chocolate bar has 10 squares. You ate 3 squares. What fraction of the chocolate bar did you eat? What fraction is left?</p>
        
        <h3>Problem 3: Time</h3>
        <p>There are 60 minutes in an hour. If you spent 15 minutes reading, what fraction of an hour did you read?</p>
        <p><em>Hint: Simplify your answer!</em></p>
        
        <h3>Challenge Problem</h3>
        <p>A recipe needs 3/4 cup of sugar. If you only have a 1/4 cup measuring cup, how many times do you need to fill it?</p>
      `,
      bodyFA: `
        <h2>بیایید تمرین کنیم!</h2>
        <p>حالا وقت آن است که آنچه یاد گرفته‌اید را به کار ببرید. این مسائل را امتحان کنید:</p>
        
        <h3>مسئله ۱: مهمانی پیتزا</h3>
        <p>ماریا ۲ پیتزا برای مهمانی‌اش سفارش داد. هر پیتزا به ۸ تکه بریده شد. دوستانش در مجموع ۱۲ تکه خوردند. چه کسری از پیتزا خورده شد؟</p>
        <p><em>نکته: در مجموع چند تکه وجود داشت؟ چند تکه خورده شد؟</em></p>
        
        <h3>مسئله ۲: شکلات</h3>
        <p>یک شکلات ۱۰ مربع دارد. شما ۳ مربع خوردید. چه کسری از شکلات را خوردید؟ چه کسری باقی مانده؟</p>
        
        <h3>مسئله ۳: زمان</h3>
        <p>۶۰ دقیقه در یک ساعت وجود دارد. اگر ۱۵ دقیقه برای خواندن صرف کردید، چه کسری از یک ساعت خواندید؟</p>
        <p><em>نکته: پاسخ خود را ساده کنید!</em></p>
        
        <h3>مسئله چالشی</h3>
        <p>یک دستور العمل به ۳/۴ فنجان شکر نیاز دارد. اگر فقط یک پیمانه اندازه‌گیری ۱/۴ فنجان دارید، چند بار باید آن را پر کنید؟</p>
      `
    }
  });

  await prisma.lessonContent.create({
    data: {
      lessonId: lesson4.id,
      contentItemId: content4.id,
      sequence: 1
    }
  });

  console.log(`    ✅ Created lesson: ${lesson4.title} (${lesson4.phase})`);

  // Create Lesson 5: EVALUATE - Fractions Quiz
  const lesson5 = await prisma.lesson.upsert({
    where: {
      id: 'demo-lesson-5-evaluate'
    },
    update: {},
    create: {
      id: 'demo-lesson-5-evaluate',
      unitId: unit1.id,
      sequence: 5,
      title: 'Fractions Assessment',
      titleFA: 'ارزیابی کسرها',
      phase: 'EVALUATE',
      estimatedTime: 20,
      isPublished: true
    }
  });

  // Create assessment for this lesson
  const assessment = await prisma.assessment.create({
    data: {
      type: 'SUMMATIVE',
      title: 'Fractions Quiz - Unit 1',
      titleFA: 'آزمون کسرها - واحد ۱',
      description: 'Test your understanding of fractions',
      timeLimit: 20,
      passingScore: 70,
      isPublished: true
    }
  });

  // Link assessment to lesson
  await prisma.lessonAssessment.create({
    data: {
      lessonId: lesson5.id,
      assessmentId: assessment.id,
      sequence: 1
    }
  });

  console.log(`    ✅ Created lesson: ${lesson5.title} (${lesson5.phase}) with assessment`);

  console.log('\n✅ Demo courses seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 1 Course: ${mathCourse.title}`);
  console.log(`   - 1 Unit: ${unit1.title}`);
  console.log(`   - 5 Lessons covering all 5E phases`);
  console.log(`   - Content items: TEXT, VIDEO, INTERACTIVE`);
  console.log(`   - 1 Assessment\n`);
  console.log('🎓 You can now access the student dashboard and start learning!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding demo courses:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
