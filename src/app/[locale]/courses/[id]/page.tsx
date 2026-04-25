'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { 
  BookOpen, Clock, Users, Star, Play, CheckCircle2, Lock, 
  ChevronRight, ChevronLeft, User, Award, BarChart 
} from 'lucide-react';
import { AUTH_STORAGE_KEY, getPrimaryRole } from '@/lib/auth/demo-users';

// Course data based on Iranian curriculum (Grade 8)
const coursesData: Record<string, any> = {
  '1': {
    title: { fa: 'ریاضی پایه هشتم', en: 'Grade 8 Mathematics' },
    description: { 
      fa: 'این دوره شامل مباحث کامل ریاضی پایه هشتم مطابق با برنامه درسی وزارت آموزش و پرورش ایران است.',
      en: 'This course covers complete Grade 8 Mathematics topics according to Iranian Ministry of Education curriculum.'
    },
    instructor: { fa: 'دکتر احمدی', en: 'Dr. Ahmadi' },
    progress: 65,
    totalLessons: 24,
    completedLessons: 16,
    duration: '12 hours',
    students: 1250,
    rating: 4.8,
    xpReward: 500,
    units: [
      {
        id: 'u1',
        title: { fa: 'فصل ۱: اعداد صحیح', en: 'Chapter 1: Integers' },
        lessons: [
          { id: 'l1', title: { fa: 'معرفی اعداد صحیح', en: 'Introduction to Integers' }, duration: '25 min', completed: true, xp: 20 },
          { id: 'l2', title: { fa: 'جمع و تفریق اعداد صحیح', en: 'Addition and Subtraction of Integers' }, duration: '30 min', completed: true, xp: 25 },
          { id: 'l3', title: { fa: 'ضرب و تقسیم اعداد صحیح', en: 'Multiplication and Division of Integers' }, duration: '35 min', completed: true, xp: 30 },
          { id: 'l4', title: { fa: 'تمرین‌های ترکیبی', en: 'Combined Exercises' }, duration: '20 min', completed: true, xp: 15 },
        ]
      },
      {
        id: 'u2',
        title: { fa: 'فصل ۲: اعداد گویا', en: 'Chapter 2: Rational Numbers' },
        lessons: [
          { id: 'l5', title: { fa: 'کسرها و اعداد اعشاری', en: 'Fractions and Decimals' }, duration: '30 min', completed: true, xp: 25 },
          { id: 'l6', title: { fa: 'عملیات روی اعداد گویا', en: 'Operations on Rational Numbers' }, duration: '35 min', completed: true, xp: 30 },
          { id: 'l7', title: { fa: 'مقایسه اعداد گویا', en: 'Comparing Rational Numbers' }, duration: '25 min', completed: true, xp: 20 },
        ]
      },
      {
        id: 'u3',
        title: { fa: 'فصل ۳: معادلات خطی', en: 'Chapter 3: Linear Equations' },
        lessons: [
          { id: 'l8', title: { fa: 'مفهوم معادله', en: 'Concept of Equations' }, duration: '30 min', completed: true, xp: 25 },
          { id: 'l9', title: { fa: 'حل معادلات یک مجهولی', en: 'Solving Single Variable Equations' }, duration: '40 min', completed: true, xp: 35 },
          { id: 'l10', title: { fa: 'حل معادلات دو مجهولی', en: 'Solving Two Variable Equations' }, duration: '45 min', completed: false, xp: 40, current: true },
          { id: 'l11', title: { fa: 'مسائل کاربردی', en: 'Applied Problems' }, duration: '35 min', completed: false, xp: 30 },
        ]
      },
      {
        id: 'u4',
        title: { fa: 'فصل ۴: هندسه', en: 'Chapter 4: Geometry' },
        lessons: [
          { id: 'l12', title: { fa: 'مثلث‌ها و خواص آن‌ها', en: 'Triangles and Their Properties' }, duration: '35 min', completed: false, xp: 30, locked: true },
          { id: 'l13', title: { fa: 'چهارضلعی‌ها', en: 'Quadrilaterals' }, duration: '30 min', completed: false, xp: 25, locked: true },
          { id: 'l14', title: { fa: 'دایره', en: 'Circles' }, duration: '40 min', completed: false, xp: 35, locked: true },
        ]
      },
    ]
  },
  '2': {
    title: { fa: 'علوم تجربی', en: 'Science' },
    description: { 
      fa: 'دوره جامع علوم تجربی شامل فیزیک، شیمی و زیست‌شناسی برای پایه هشتم',
      en: 'Comprehensive science course including Physics, Chemistry, and Biology for Grade 8'
    },
    instructor: { fa: 'استاد رضایی', en: 'Prof. Rezaei' },
    progress: 40,
    totalLessons: 32,
    completedLessons: 13,
    duration: '18 hours',
    students: 980,
    rating: 4.6,
    xpReward: 650,
    units: [
      {
        id: 'u1',
        title: { fa: 'فصل ۱: مواد و ترکیب آن‌ها', en: 'Chapter 1: Matter and Its Composition' },
        lessons: [
          { id: 'l1', title: { fa: 'ساختار اتم', en: 'Atomic Structure' }, duration: '30 min', completed: true, xp: 25 },
          { id: 'l2', title: { fa: 'جدول تناوبی', en: 'Periodic Table' }, duration: '35 min', completed: true, xp: 30 },
          { id: 'l3', title: { fa: 'پیوندهای شیمیایی', en: 'Chemical Bonds' }, duration: '40 min', completed: true, xp: 35 },
        ]
      },
      {
        id: 'u2',
        title: { fa: 'فصل ۲: نیرو و حرکت', en: 'Chapter 2: Force and Motion' },
        lessons: [
          { id: 'l4', title: { fa: 'قوانین نیوتن', en: 'Newton\'s Laws' }, duration: '45 min', completed: true, xp: 40 },
          { id: 'l5', title: { fa: 'اصطکاک', en: 'Friction' }, duration: '30 min', completed: true, xp: 25 },
          { id: 'l6', title: { fa: 'کار و انرژی', en: 'Work and Energy' }, duration: '40 min', completed: false, xp: 35, current: true },
        ]
      },
    ]
  },
  '3': {
    title: { fa: 'زبان انگلیسی', en: 'English Language' },
    description: { 
      fa: 'آموزش جامع زبان انگلیسی شامل گرامر، مکالمه و درک مطلب',
      en: 'Comprehensive English course including grammar, conversation, and reading comprehension'
    },
    instructor: { fa: 'خانم کریمی', en: 'Ms. Karimi' },
    progress: 80,
    totalLessons: 18,
    completedLessons: 14,
    duration: '10 hours',
    students: 2100,
    rating: 4.9,
    xpReward: 400,
    units: [
      {
        id: 'u1',
        title: { fa: 'واحد ۱: زمان‌های فعل', en: 'Unit 1: Verb Tenses' },
        lessons: [
          { id: 'l1', title: { fa: 'زمان حال ساده', en: 'Simple Present Tense' }, duration: '25 min', completed: true, xp: 20 },
          { id: 'l2', title: { fa: 'زمان گذشته ساده', en: 'Simple Past Tense' }, duration: '30 min', completed: true, xp: 25 },
          { id: 'l3', title: { fa: 'زمان آینده', en: 'Future Tense' }, duration: '30 min', completed: true, xp: 25 },
        ]
      },
      {
        id: 'u2',
        title: { fa: 'واحد ۲: مکالمه', en: 'Unit 2: Conversation' },
        lessons: [
          { id: 'l4', title: { fa: 'معرفی خود', en: 'Introducing Yourself' }, duration: '20 min', completed: true, xp: 15 },
          { id: 'l5', title: { fa: 'پرسیدن مسیر', en: 'Asking for Directions' }, duration: '25 min', completed: true, xp: 20 },
          { id: 'l6', title: { fa: 'خرید کردن', en: 'Shopping' }, duration: '25 min', completed: false, xp: 20, current: true },
        ]
      },
    ]
  },
  '4': {
    title: { fa: 'ادبیات فارسی', en: 'Persian Literature' },
    description: { 
      fa: 'آشنایی با شعر و نثر معاصر فارسی و آموزش نگارش',
      en: 'Introduction to contemporary Persian poetry and prose, and writing skills'
    },
    instructor: { fa: 'استاد محمدی', en: 'Prof. Mohammadi' },
    progress: 0,
    totalLessons: 20,
    completedLessons: 0,
    duration: '14 hours',
    students: 650,
    rating: 4.7,
    xpReward: 450,
    units: [
      {
        id: 'u1',
        title: { fa: 'فصل ۱: شعر معاصر', en: 'Chapter 1: Contemporary Poetry' },
        lessons: [
          { id: 'l1', title: { fa: 'نیما یوشیج و شعر نو', en: 'Nima Yushij and Modern Poetry' }, duration: '35 min', completed: false, xp: 30 },
          { id: 'l2', title: { fa: 'شاملو و شعر سپید', en: 'Shamlou and Free Verse' }, duration: '30 min', completed: false, xp: 25 },
          { id: 'l3', title: { fa: 'فروغ فرخزاد', en: 'Forough Farrokhzad' }, duration: '35 min', completed: false, xp: 30 },
        ]
      },
    ]
  },
  '5': {
    title: { fa: 'AI + Robotics Venture Lab', en: 'AI + Robotics Venture Lab' },
    description: {
      fa: 'دوره پرداختی و پروژه‌محور ۴ ترمه برای ساخت محصول واقعی هوش مصنوعی + رباتیک و راه‌اندازی کسب‌وکار دانش‌آموزی.',
      en: 'A paid 4-term, project-driven program to build real AI + robotics products and launch a student startup venture.'
    },
    instructor: { fa: 'Danesh Innovation Faculty', en: 'Danesh Innovation Faculty' },
    progress: 0,
    totalLessons: 12,
    completedLessons: 0,
    duration: '48 workshop hours',
    students: 120,
    rating: 4.9,
    xpReward: 1200,
    paid: true,
    price: '$249 / term',
    outcomes: {
      fa: [
        'تفکر مسئله‌محور و اعتبارسنجی نیاز بازار',
        'ساخت MVP نرم‌افزاری با کمک ابزارهای AI',
        'طراحی نمونه رباتیک هوشمند برای یک مسئله واقعی',
        'طراحی مدل کسب‌وکار، قیمت‌گذاری و ارائه نهایی'
      ],
      en: [
        'Opportunity discovery and customer-validated problem selection',
        'AI-assisted software MVP development with modern builder tools',
        'Smart robotics prototype design for a real-world use case',
        'Business model, pricing strategy, and investor-style final pitch'
      ]
    },
    recommendedSoftware: {
      fa: ['VS Code + GitHub Copilot', 'Python + Streamlit/FastAPI', 'Figma', 'Canva', 'Notion/Jira'],
      en: ['VS Code + GitHub Copilot', 'Python + Streamlit/FastAPI', 'Figma', 'Canva', 'Notion/Jira']
    },
    recommendedHardware: {
      fa: ['micro:bit یا Arduino Uno', 'سنسور فاصله/دما/حرکت', 'Servo Motor + Motor Driver', 'Raspberry Pi (اختیاری)', 'وبکم/دوربین USB'],
      en: ['micro:bit or Arduino Uno', 'Distance/temperature/motion sensors', 'Servo Motor + Motor Driver', 'Raspberry Pi (optional)', 'USB Webcam/Camera']
    },
    units: [
      {
        id: 't1',
        title: { fa: 'ترم ۱: Opportunity Discovery', en: 'Term 1: Opportunity Discovery' },
        goal: {
          fa: 'انتخاب مسئله واقعی با مصاحبه مشتری و تحلیل ریسک بازار',
          en: 'Select a high-value real-world problem through customer interviews and market-risk analysis.'
        },
        capstone: { fa: 'خروجی: Opportunity Brief', en: 'Capstone: Opportunity Brief + Validation Evidence' },
        lessons: [
          { id: 'ai-l1', title: { fa: 'Problem Spotting Sprint', en: 'Problem Spotting Sprint' }, duration: '120 min', completed: false, xp: 80, current: true },
          { id: 'ai-l2', title: { fa: 'Customer Interview Workshop', en: 'Customer Interview Workshop' }, duration: '120 min', completed: false, xp: 80 },
          { id: 'ai-l3', title: { fa: 'Term 1 Capstone Build', en: 'Term 1 Capstone Build' }, duration: '120 min', completed: false, xp: 100 },
        ]
      },
      {
        id: 't2',
        title: { fa: 'ترم ۲: AI MVP Engineering', en: 'Term 2: AI MVP Engineering' },
        goal: {
          fa: 'ساخت MVP اولیه با کمک Copilot و ابزارهای سریع توسعه',
          en: 'Build a functional AI-enabled MVP using Copilot-guided engineering and rapid prototyping.'
        },
        capstone: { fa: 'خروجی: MVP قابل استفاده', en: 'Capstone: Working AI MVP + User Test Report' },
        lessons: [
          { id: 'ai-l4', title: { fa: 'Copilot App Sprint', en: 'Copilot App Sprint' }, duration: '120 min', completed: false, xp: 90 },
          { id: 'ai-l5', title: { fa: 'Workflow Automation Lab', en: 'Workflow Automation Lab' }, duration: '120 min', completed: false, xp: 90 },
          { id: 'ai-l6', title: { fa: 'Term 2 MVP Capstone', en: 'Term 2 MVP Capstone' }, duration: '120 min', completed: false, xp: 110 },
        ]
      },
      {
        id: 't3',
        title: { fa: 'ترم ۳: Robotics Intelligence', en: 'Term 3: Robotics Intelligence' },
        goal: {
          fa: 'اتصال نرم‌افزار AI به سخت‌افزار واقعی و ارزیابی عملکرد نمونه',
          en: 'Integrate AI software decisions with real sensors/actuators and test reliability.'
        },
        capstone: { fa: 'خروجی: Smart Robotics Prototype', en: 'Capstone: Smart Robotics Prototype + Test Metrics' },
        lessons: [
          { id: 'ai-l7', title: { fa: 'Sensors & Actuators Studio', en: 'Sensors & Actuators Studio' }, duration: '120 min', completed: false, xp: 100 },
          { id: 'ai-l8', title: { fa: 'Vision & Edge AI Lab', en: 'Vision & Edge AI Lab' }, duration: '120 min', completed: false, xp: 100 },
          { id: 'ai-l9', title: { fa: 'Term 3 Robotics Capstone', en: 'Term 3 Robotics Capstone' }, duration: '120 min', completed: false, xp: 120 },
        ]
      },
      {
        id: 't4',
        title: { fa: 'ترم ۴: Venture Launch & Demo Day', en: 'Term 4: Venture Launch & Demo Day' },
        goal: {
          fa: 'نهایی‌سازی ارزش پیشنهادی، قیمت‌گذاری و ارائه سرمایه‌گذارپسند',
          en: 'Finalize value proposition, pricing model, and investor-grade storytelling for launch.'
        },
        capstone: { fa: 'خروجی: Demo Day Pitch', en: 'Capstone: Investor-Style Pitch + Live Product Demo' },
        lessons: [
          { id: 'ai-l10', title: { fa: 'Business Model & Pricing', en: 'Business Model & Pricing' }, duration: '120 min', completed: false, xp: 90 },
          { id: 'ai-l11', title: { fa: 'Pitch Deck & Story Design', en: 'Pitch Deck & Story Design' }, duration: '120 min', completed: false, xp: 90 },
          { id: 'ai-l12', title: { fa: 'Final Capstone Demo Day', en: 'Final Capstone Demo Day' }, duration: '120 min', completed: false, xp: 150 },
        ]
      },
    ]
  },
};

export default function CourseDetailPage({ params }: { params: { locale: string; id: string } }) {
  const { locale, id } = params;
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ChevronLeft : ChevronRight;
  const [activeRole, setActiveRole] = useState<string>('STUDENT');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { roles?: string[] };
      setActiveRole(getPrimaryRole(parsed?.roles || []));
    } catch {
      setActiveRole('STUDENT');
    }
  }, []);

  const course = coursesData[id] || coursesData['1'];
  const lang = isRTL ? 'fa' : 'en';
  const hasFullCourseAccess = activeRole === 'SUPER_ADMIN' || activeRole === 'SUBJECT_ADMIN';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b">
        <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Course Info */}
            <div className="flex-1 space-y-4">
              <Link 
                href={`/${locale}/courses`}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
              >
                {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                {isRTL ? 'بازگشت به دوره‌ها' : 'Back to Courses'}
              </Link>
              
              <h1 className="text-3xl font-bold">{course.title[lang]}</h1>
              <p className="text-lg text-muted-foreground">{course.description[lang]}</p>
              {course.paid && (
                <div className="inline-flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm dark:border-amber-700 dark:bg-amber-900/20">
                  <span className="font-semibold text-amber-700 dark:text-amber-300">
                    {hasFullCourseAccess
                      ? isRTL
                        ? 'دسترسی کامل مدیر'
                        : 'Admin Full Access'
                      : isRTL
                        ? 'دوره پولی ویژه'
                        : 'Premium Paid Program'}
                  </span>
                  <span className="font-bold text-primary">
                    {hasFullCourseAccess ? (isRTL ? 'Unlocked' : 'Unlocked') : course.price}
                  </span>
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span>{course.instructor[lang]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>{course.totalLessons} {isRTL ? 'درس' : 'lessons'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{course.students.toLocaleString()} {isRTL ? 'دانش‌آموز' : 'students'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span>{course.rating}</span>
                </div>
              </div>

              {/* Progress */}
              <div className="bg-card rounded-xl p-4 border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{isRTL ? 'پیشرفت شما' : 'Your Progress'}</span>
                  <span className="text-primary font-bold">{course.progress}%</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>{course.completedLessons} / {course.totalLessons} {isRTL ? 'درس تکمیل شده' : 'lessons completed'}</span>
                  <span className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-amber-500" />
                    +{course.xpReward} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Course Image/Preview */}
            <div className="lg:w-80">
              <div className="aspect-video bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl flex items-center justify-center border">
                <BookOpen className="h-16 w-16 text-primary/50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {course.outcomes && (
          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border bg-card p-4 lg:col-span-2">
              <h2 className="text-lg font-bold mb-3">{isRTL ? 'خروجی‌های یادگیری' : 'Learning Outcomes'}</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {course.outcomes[lang].map((outcome: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <h3 className="font-semibold mb-2">{isRTL ? 'پیشنهاد نرم‌افزار' : 'Recommended Software'}</h3>
              <ul className="space-y-1 text-sm text-muted-foreground mb-3">
                {course.recommendedSoftware?.[lang]?.map((tool: string, idx: number) => (
                  <li key={idx}>• {tool}</li>
                ))}
              </ul>
              <h3 className="font-semibold mb-2">{isRTL ? 'پیشنهاد سخت‌افزار' : 'Recommended Hardware'}</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {course.recommendedHardware?.[lang]?.map((item: string, idx: number) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold mb-6">{isRTL ? 'محتوای دوره' : 'Course Content'}</h2>
        
        <div className="space-y-4">
          {course.units.map((unit: any, unitIndex: number) => (
            <div key={unit.id} className="border rounded-xl overflow-hidden bg-card">
              {/* Unit Header */}
              <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {unitIndex + 1}
                  </div>
                  <h3 className="font-semibold">{unit.title[lang]}</h3>
                  {(unit.goal || unit.capstone) && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {unit.goal?.[lang]}
                      {unit.capstone?.[lang] ? ` • ${unit.capstone[lang]}` : ''}
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {unit.lessons.filter((l: any) => l.completed).length} / {unit.lessons.length}
                </span>
              </div>

              {/* Lessons */}
              <div className="divide-y">
                {unit.lessons.map((lesson: any, lessonIndex: number) => (
                  <Link
                    key={lesson.id}
                    href={lesson.locked ? '#' : `/${locale}/courses/${id}/lessons/${lesson.id}`}
                    className={`flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors ${
                      lesson.locked ? 'opacity-50 cursor-not-allowed' : ''
                    } ${lesson.current ? 'bg-primary/5 border-r-4 border-primary' : ''}`}
                  >
                    {/* Status Icon */}
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      lesson.completed 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30' 
                        : lesson.locked 
                          ? 'bg-muted text-muted-foreground'
                          : lesson.current
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                    }`}>
                      {lesson.completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : lesson.locked ? (
                        <Lock className="h-4 w-4" />
                      ) : lesson.current ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <span className="text-sm">{lessonIndex + 1}</span>
                      )}
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium truncate ${lesson.current ? 'text-primary' : ''}`}>
                        {lesson.title[lang]}
                      </h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {lesson.duration}
                        </span>
                        <span className="flex items-center gap-1 text-amber-600">
                          +{lesson.xp} XP
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    {!lesson.locked && (
                      <Arrow className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Course Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="bg-card border rounded-xl p-4 text-center">
            <BarChart className="h-8 w-8 mx-auto text-primary mb-2" />
            <div className="text-2xl font-bold">{course.completedLessons}</div>
            <div className="text-sm text-muted-foreground">{isRTL ? 'درس تکمیل شده' : 'Lessons Completed'}</div>
          </div>
          <div className="bg-card border rounded-xl p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">{course.duration}</div>
            <div className="text-sm text-muted-foreground">{isRTL ? 'زمان کل' : 'Total Duration'}</div>
          </div>
          <div className="bg-card border rounded-xl p-4 text-center">
            <Award className="h-8 w-8 mx-auto text-amber-500 mb-2" />
            <div className="text-2xl font-bold">+{course.xpReward}</div>
            <div className="text-sm text-muted-foreground">{isRTL ? 'امتیاز قابل کسب' : 'XP Available'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
