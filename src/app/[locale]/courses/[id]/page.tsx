'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { 
  BookOpen, Clock, Users, Star, Play, CheckCircle2, Lock, 
  ChevronRight, ChevronLeft, User, Award, BarChart, Sparkles,
  ExternalLink, FlaskConical, Sigma, Languages, Bot
} from 'lucide-react';
import { AUTH_STORAGE_KEY, createUserHeaders, getPrimaryRole, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import { isDemoDataEnabled } from '@/lib/demo/demo-mode';

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

type SimulationRecommendation = {
  id: string;
  title: { fa: string; en: string };
  description: { fa: string; en: string };
  provider: string;
  url: string;
  bestFor: { fa: string; en: string };
  tags: { fa: string[]; en: string[] };
  cta: { fa: string; en: string };
  icon: any;
  accent: string;
};

function getLocalizedText(value: any, locale: 'fa' | 'en', fallback = '') {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object') {
    const localizedValue = value[locale] || value.en || value.fa;
    if (typeof localizedValue === 'string') {
      return localizedValue;
    }
  }

  return fallback;
}

function getSimulationRecommendations(courseId: string, course: any): SimulationRecommendation[] {
  const titleText = `${course?.title?.fa || ''} ${course?.title?.en || ''}`.toLowerCase();

  if (courseId === '1' || /math|ریاضی|algebra|geometry|equation/.test(titleText)) {
    return [
      {
        id: 'geogebra-graphing',
        title: { fa: 'آزمایشگاه جبر و نمودار GeoGebra', en: 'GeoGebra Algebra & Graphing Lab' },
        description: {
          fa: 'معادله‌ها، نمودارها و الگوها را با دست‌کاری زنده ببینید و حدس‌های خود را سریع آزمایش کنید.',
          en: 'Manipulate equations, graphs, and patterns live to test mathematical ideas quickly.',
        },
        provider: 'GeoGebra',
        url: 'https://www.geogebra.org/graphing',
        bestFor: { fa: 'بهترین زمان: فصل معادلات و نمایش بصری رابطه‌ها', en: 'Best for: equations and visualizing relationships' },
        tags: { fa: ['کاوش', 'نمایش بصری', 'حل مسئله'], en: ['Explore', 'Visualize', 'Problem solving'] },
        cta: { fa: 'ورود به آزمایشگاه', en: 'Open lab' },
        icon: Sigma,
        accent: 'from-sky-500/15 to-indigo-500/10 border-sky-200/70 dark:border-sky-800/70',
      },
      {
        id: 'phet-area-builder',
        title: { fa: 'شبیه‌ساز مساحت‌ساز PhET', en: 'PhET Area Builder' },
        description: {
          fa: 'شکل بسازید، مساحت را تغییر دهید و از راه مشاهده به فرمول برسید.',
          en: 'Build shapes, vary dimensions, and discover area relationships through exploration.',
        },
        provider: 'PhET',
        url: 'https://phet.colorado.edu/en/simulations/area-builder',
        bestFor: { fa: 'بهترین زمان: هندسه، مساحت و استدلال فضایی', en: 'Best for: geometry, area, and spatial reasoning' },
        tags: { fa: ['هندسه', 'کشف فرمول', '۵ت/تحقیق'], en: ['Geometry', 'Formula discovery', 'Explore'] },
        cta: { fa: 'اجرای شبیه‌ساز', en: 'Launch simulation' },
        icon: Sparkles,
        accent: 'from-emerald-500/15 to-teal-500/10 border-emerald-200/70 dark:border-emerald-800/70',
      },
      {
        id: 'mathigon-polypad',
        title: { fa: 'Mathigon Polypad', en: 'Mathigon Polypad' },
        description: {
          fa: 'با ابزارک‌های عددی و هندسی، الگوها و مدل‌ها را به‌صورت تعاملی بسازید.',
          en: 'Use digital manipulatives to build number models, patterns, and geometric ideas interactively.',
        },
        provider: 'Mathigon',
        url: 'https://mathigon.org/polypad',
        bestFor: { fa: 'بهترین زمان: تمرین ترکیبی و مدل‌سازی مفهومی', en: 'Best for: mixed practice and conceptual modeling' },
        tags: { fa: ['مدل‌سازی', 'تمرین فعال', 'بازنمایی چندگانه'], en: ['Modeling', 'Active practice', 'Multiple representations'] },
        cta: { fa: 'باز کردن Polypad', en: 'Open Polypad' },
        icon: Sigma,
        accent: 'from-violet-500/15 to-fuchsia-500/10 border-violet-200/70 dark:border-violet-800/70',
      },
    ];
  }

  if (courseId === '2' || /science|علوم|atom|force|motion|energy/.test(titleText)) {
    return [
      {
        id: 'phet-build-an-atom',
        title: { fa: 'PhET: ساختن اتم', en: 'PhET: Build an Atom' },
        description: {
          fa: 'با جابه‌جا کردن پروتون، نوترون و الکترون، ساختار اتم و تغییرات بار را تجربه کنید.',
          en: 'Experiment with protons, neutrons, and electrons to understand atomic structure and charge.',
        },
        provider: 'PhET',
        url: 'https://phet.colorado.edu/en/simulations/build-an-atom',
        bestFor: { fa: 'بهترین زمان: ساختار اتم و جدول تناوبی', en: 'Best for: atomic structure and periodic thinking' },
        tags: { fa: ['شیمی', 'مدل‌سازی', 'کشف'], en: ['Chemistry', 'Modeling', 'Discovery'] },
        cta: { fa: 'اجرای شبیه‌ساز', en: 'Launch simulation' },
        icon: FlaskConical,
        accent: 'from-cyan-500/15 to-blue-500/10 border-cyan-200/70 dark:border-cyan-800/70',
      },
      {
        id: 'phet-forces-motion',
        title: { fa: 'PhET: نیرو و حرکت', en: 'PhET: Forces and Motion Basics' },
        description: {
          fa: 'تأثیر نیرو، اصطکاک و جرم را با سناریوهای واقعی و تغییرپذیر ببینید.',
          en: 'Test how force, friction, and mass change motion in interactive scenarios.',
        },
        provider: 'PhET',
        url: 'https://phet.colorado.edu/en/simulations/forces-and-motion-basics',
        bestFor: { fa: 'بهترین زمان: قوانین حرکت و استدلال علت-معلولی', en: 'Best for: motion laws and cause-effect reasoning' },
        tags: { fa: ['فیزیک', 'آزمایش مجازی', 'استدلال'], en: ['Physics', 'Virtual experiment', 'Reasoning'] },
        cta: { fa: 'آغاز آزمایش', en: 'Start experiment' },
        icon: FlaskConical,
        accent: 'from-amber-500/15 to-orange-500/10 border-amber-200/70 dark:border-amber-800/70',
      },
      {
        id: 'phet-energy-forms',
        title: { fa: 'PhET: شکل‌های انرژی', en: 'PhET: Energy Forms and Changes' },
        description: {
          fa: 'تبدیل انرژی و انتقال گرما را در یک محیط بصری و مرحله‌به‌مرحله بررسی کنید.',
          en: 'Explore heat transfer and energy transformation with visual, step-by-step interactions.',
        },
        provider: 'PhET',
        url: 'https://phet.colorado.edu/en/simulations/energy-forms-and-changes',
        bestFor: { fa: 'بهترین زمان: کار، انرژی و پیوند با زندگی روزمره', en: 'Best for: work, energy, and real-life transfer examples' },
        tags: { fa: ['انرژی', 'زندگی واقعی', 'تعمیم'], en: ['Energy', 'Real world', 'Elaborate'] },
        cta: { fa: 'مشاهده تعاملی', en: 'Open interactive' },
        icon: Sparkles,
        accent: 'from-rose-500/15 to-red-500/10 border-rose-200/70 dark:border-rose-800/70',
      },
    ];
  }

  if (courseId === '3' || /english|زبان انگلیسی|conversation|grammar/.test(titleText)) {
    return [
      {
        id: 'bc-grammar',
        title: { fa: 'آزمایشگاه گرامر British Council', en: 'British Council Grammar Lab' },
        description: {
          fa: 'گرامر را با تمرین‌های کوتاه، بازخورد فوری و سناریوهای قابل‌فهم تمرین کنید.',
          en: 'Practice grammar through short interactions, instant feedback, and clear scenarios.',
        },
        provider: 'British Council',
        url: 'https://learnenglish.britishcouncil.org/grammar',
        bestFor: { fa: 'بهترین زمان: تثبیت ساختار جمله و زمان‌ها', en: 'Best for: sentence structure and tense reinforcement' },
        tags: { fa: ['گرامر', 'بازخورد فوری', 'تمرین هدایت‌شده'], en: ['Grammar', 'Instant feedback', 'Guided practice'] },
        cta: { fa: 'شروع تمرین', en: 'Start practice' },
        icon: Languages,
        accent: 'from-indigo-500/15 to-blue-500/10 border-indigo-200/70 dark:border-indigo-800/70',
      },
      {
        id: 'bc-listening',
        title: { fa: 'آزمایشگاه شنیداری LearnEnglish', en: 'LearnEnglish Listening Lab' },
        description: {
          fa: 'مکالمه و درک مطلب شنیداری را با فایل، تمرین و پرسش پیگیری کنید.',
          en: 'Strengthen listening comprehension with audio-supported tasks and follow-up questions.',
        },
        provider: 'British Council',
        url: 'https://learnenglish.britishcouncil.org/skills/listening',
        bestFor: { fa: 'بهترین زمان: مکالمه و درک گفتار واقعی', en: 'Best for: conversation and real-world listening' },
        tags: { fa: ['شنیداری', 'مکالمه', 'درک مطلب'], en: ['Listening', 'Conversation', 'Comprehension'] },
        cta: { fa: 'باز کردن فعالیت', en: 'Open activity' },
        icon: Languages,
        accent: 'from-emerald-500/15 to-lime-500/10 border-emerald-200/70 dark:border-emerald-800/70',
      },
      {
        id: 'lyrics-training',
        title: { fa: 'LyricsTraining', en: 'LyricsTraining' },
        description: {
          fa: 'شنیدن، تکمیل واژه‌ها و توجه به تلفظ را در یک تجربه بازی‌وار ترکیب کنید.',
          en: 'Blend listening, word completion, and pronunciation awareness in a game-like experience.',
        },
        provider: 'LyricsTraining',
        url: 'https://lyricstraining.com/',
        bestFor: { fa: 'بهترین زمان: تقویت واژگان، املا و ریتم زبان', en: 'Best for: vocabulary, spelling, and language rhythm' },
        tags: { fa: ['واژگان', 'تلفظ', 'بازی‌وار'], en: ['Vocabulary', 'Pronunciation', 'Gamified'] },
        cta: { fa: 'ورود به فعالیت', en: 'Enter activity' },
        icon: Sparkles,
        accent: 'from-pink-500/15 to-rose-500/10 border-pink-200/70 dark:border-pink-800/70',
      },
    ];
  }

  if (courseId === '4' || /ادبیات|literature|poetry|writing/.test(titleText)) {
    return [
      {
        id: 'storymap',
        title: { fa: 'StoryMapJS', en: 'StoryMapJS' },
        description: {
          fa: 'روایت، مکان و خط زمانی متن را در یک نقشه تعاملی کنار هم ببینید.',
          en: 'Map narrative, setting, and sequence visually through an interactive story journey.',
        },
        provider: 'Knight Lab',
        url: 'https://storymap.knightlab.com/',
        bestFor: { fa: 'بهترین زمان: تحلیل روایت و بازسازی سیر داستان', en: 'Best for: narrative analysis and sequencing ideas' },
        tags: { fa: ['روایت', 'تحلیل متن', 'بازنمایی بصری'], en: ['Narrative', 'Text analysis', 'Visual mapping'] },
        cta: { fa: 'باز کردن ابزار', en: 'Open tool' },
        icon: BookOpen,
        accent: 'from-amber-500/15 to-yellow-500/10 border-amber-200/70 dark:border-amber-800/70',
      },
      {
        id: 'mindmup',
        title: { fa: 'MindMup برای نقشه‌برداری مفهومی', en: 'MindMup Concept Mapping' },
        description: {
          fa: 'تصویرسازی رابطه شخصیت‌ها، مضامین و صنایع ادبی را به‌صورت ذهن‌نقشه انجام دهید.',
          en: 'Build concept maps for themes, characters, and literary devices in a visual workspace.',
        },
        provider: 'MindMup',
        url: 'https://www.mindmup.com/',
        bestFor: { fa: 'بهترین زمان: توضیح و تعمیم ایده‌های ادبی', en: 'Best for: explaining and extending literary ideas' },
        tags: { fa: ['مضمون', 'نقشه ذهنی', 'تعمیم'], en: ['Theme', 'Mind map', 'Elaborate'] },
        cta: { fa: 'ساخت نقشه', en: 'Build map' },
        icon: Sparkles,
        accent: 'from-orange-500/15 to-amber-500/10 border-orange-200/70 dark:border-orange-800/70',
      },
    ];
  }

  if (courseId === '5' || /robot|ai|هوش مصنوعی|ربات/.test(titleText)) {
    return [
      {
        id: 'tinkercad-circuits',
        title: { fa: 'Tinkercad Circuits', en: 'Tinkercad Circuits' },
        description: {
          fa: 'مدار، حسگر و منطق کنترلی را پیش از کار با سخت‌افزار واقعی شبیه‌سازی کنید.',
          en: 'Prototype circuits, sensors, and control logic before touching real hardware.',
        },
        provider: 'Autodesk',
        url: 'https://www.tinkercad.com/circuits',
        bestFor: { fa: 'بهترین زمان: طراحی اولیه رباتیک و آزمون سریع ایده', en: 'Best for: early robotics prototyping and rapid idea testing' },
        tags: { fa: ['مدار', 'نمونه‌سازی', 'رباتیک'], en: ['Circuits', 'Prototype', 'Robotics'] },
        cta: { fa: 'ورود به شبیه‌ساز', en: 'Open simulator' },
        icon: Bot,
        accent: 'from-cyan-500/15 to-teal-500/10 border-cyan-200/70 dark:border-cyan-800/70',
      },
      {
        id: 'ml-kids',
        title: { fa: 'Machine Learning for Kids', en: 'Machine Learning for Kids' },
        description: {
          fa: 'مدل‌های ساده هوش مصنوعی بسازید و آن‌ها را به پروژه‌های کدنویسی وصل کنید.',
          en: 'Train simple machine learning models and connect them to coding projects.',
        },
        provider: 'ML for Kids',
        url: 'https://machinelearningforkids.co.uk/',
        bestFor: { fa: 'بهترین زمان: شروع یادگیری AI کاربردی برای دانش‌آموزان', en: 'Best for: student-friendly applied AI projects' },
        tags: { fa: ['هوش مصنوعی', 'پروژه‌محور', 'داده'], en: ['AI', 'Project-based', 'Data'] },
        cta: { fa: 'شروع پروژه', en: 'Start project' },
        icon: Bot,
        accent: 'from-violet-500/15 to-indigo-500/10 border-violet-200/70 dark:border-violet-800/70',
      },
      {
        id: 'teachable-machine',
        title: { fa: 'Teachable Machine', en: 'Teachable Machine' },
        description: {
          fa: 'با تصویر، صدا یا حرکت یک مدل هوش مصنوعی سریع بسازید و ایده محصول را تست کنید.',
          en: 'Build a quick AI model with images, sound, or poses to test product concepts fast.',
        },
        provider: 'Google',
        url: 'https://teachablemachine.withgoogle.com/',
        bestFor: { fa: 'بهترین زمان: اعتبارسنجی MVP و دموی سریع', en: 'Best for: MVP validation and fast demos' },
        tags: { fa: ['MVP', 'بینایی ماشین', 'دمو'], en: ['MVP', 'Computer vision', 'Demo'] },
        cta: { fa: 'ساخت مدل', en: 'Build model' },
        icon: Bot,
        accent: 'from-fuchsia-500/15 to-rose-500/10 border-fuchsia-200/70 dark:border-fuchsia-800/70',
      },
    ];
  }

  return [];
}

export default function CourseDetailPage({ params }: { params: { locale: string; id: string } }) {
  const { locale, id } = params;
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const demoDataEnabled = isDemoDataEnabled();
  const Arrow = isRTL ? ChevronLeft : ChevronRight;
  const [activeRole, setActiveRole] = useState<string>('STUDENT');
  const [resolvedCourse, setResolvedCourse] = useState<any | null>(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(demoDataEnabled ? !coursesData[id] : true);

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

  useEffect(() => {
    let active = true;

    const loadCourse = async () => {
      try {
        setIsLoadingCourse(true);
        const userId = getStoredUserId();

        const [courseRes, enrolledRes] = await Promise.all([
          fetch(`/api/v1/courses/${id}?locale=${locale}`),
          userId
            ? fetch('/api/v1/student/courses', { headers: createUserHeaders(userId) })
            : Promise.resolve(null),
        ]);

        if (!courseRes.ok) {
          if (active) {
            setResolvedCourse(null);
          }
          return;
        }

        const courseData = await courseRes.json();
        let enrolledCourse: any | null = null;

        if (enrolledRes?.ok) {
          const enrolledData = await enrolledRes.json();
          enrolledCourse = (enrolledData.courses || []).find((course: any) => course.id === id) || null;
        }

        const completedLessonIds = new Set(
          enrolledCourse?.units
            ?.flatMap((unit: any) => unit.lessons)
            ?.filter((lesson: any) => lesson.completion?.completedAt)
            ?.map((lesson: any) => lesson.id) || []
        );

        const currentLessonId =
          enrolledCourse?.units
            ?.flatMap((unit: any) => unit.lessons)
            ?.find((lesson: any) => !lesson.completion?.completedAt)?.id || null;

        const totalLessons = courseData.totalLessons || 0;
        const completedLessons = completedLessonIds.size;
        const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        const totalDuration = courseData.totalDuration || 0;
        const durationLabel =
          totalDuration >= 60
            ? `${Math.round(totalDuration / 60)} ${isRTL ? 'ساعت' : 'hours'}`
            : totalDuration > 0
              ? `${totalDuration} ${isRTL ? 'دقیقه' : 'minutes'}`
              : isRTL
                ? 'با سرعت دلخواه'
                : 'Self paced';

        const normalizedCourse = {
          title: { fa: courseData.title, en: courseData.title },
          description: {
            fa: courseData.description || 'توضیحی برای این دوره ثبت نشده است.',
            en: courseData.description || 'No description available for this course.',
          },
          instructor: {
            fa: 'تیم آموزشی دانش',
            en: 'Danesh Teaching Team',
          },
          progress,
          totalLessons,
          completedLessons,
          duration: durationLabel,
          students: courseData.enrollmentsCount || 0,
          rating: 4.8,
          xpReward: totalLessons * 25,
          units: (courseData.units || []).map((unit: any) => ({
            id: unit.id,
            title: { fa: unit.title, en: unit.title },
            lessons: (unit.lessons || []).map((lesson: any, lessonIndex: number) => ({
              id: lesson.id,
              title: { fa: lesson.title, en: lesson.title },
              duration: lesson.estimatedTime
                ? `${lesson.estimatedTime} ${isRTL ? 'دقیقه' : 'min'}`
                : isRTL
                  ? 'زمان نامشخص'
                  : 'Flexible pace',
              completed: completedLessonIds.has(lesson.id),
              xp: 25 + lessonIndex * 5,
              current: currentLessonId === lesson.id,
              locked: false,
            })),
          })),
        };

        if (active) {
          setResolvedCourse(normalizedCourse);
        }
      } catch (error) {
        console.error('Error loading course detail:', error);
        if (active) {
          setResolvedCourse(null);
        }
      } finally {
        if (active) {
          setIsLoadingCourse(false);
        }
      }
    };

    loadCourse();

    return () => {
      active = false;
    };
  }, [id, isRTL, locale]);

  const course = resolvedCourse || (demoDataEnabled ? coursesData[id] : null) || null;
  const lang = isRTL ? 'fa' : 'en';
  const hasFullCourseAccess = activeRole === 'SUPER_ADMIN' || activeRole === 'SUBJECT_ADMIN';
  const simulationRecommendations = course ? getSimulationRecommendations(id, course) : [];
  const currentLesson = course?.units
    ?.flatMap((unit: any) => unit.lessons)
    ?.find((lesson: any) => lesson.current) || course?.units?.flatMap((unit: any) => unit.lessons)?.find((lesson: any) => !lesson.locked) || null;

  if (isLoadingCourse && !course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          {isRTL ? 'دوره یافت نشد.' : 'Course not found.'}
        </div>
      </div>
    );
  }

  const courseTitle = getLocalizedText(course.title, lang, isRTL ? 'دوره' : 'Course');
  const courseDescription = getLocalizedText(course.description, lang);
  const courseInstructor = getLocalizedText(course.instructor, lang, isRTL ? 'مدرس نامشخص' : 'Instructor not set');

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
              
              <h1 className="text-3xl font-bold">{courseTitle}</h1>
              <p className="text-lg text-muted-foreground">{courseDescription}</p>
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
                  <span>{courseInstructor}</span>
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
                {currentLesson ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/${locale}/student/lessons/${currentLesson.id}/learn`}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                    >
                      <Play className="h-4 w-4" />
                      {currentLesson.completed
                        ? isRTL
                          ? 'مرور آخرین درس'
                          : 'Review latest lesson'
                        : isRTL
                          ? 'ادامه همین درس'
                          : 'Continue this lesson'}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {getLocalizedText(currentLesson.title, lang)}
                    </span>
                  </div>
                ) : null}

                <div className="mt-4 rounded-xl border border-primary/15 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {isRTL ? 'دسترسی به کلاس زنده فقط هنگام فعال بودن معلم نمایش داده می‌شود' : 'Live class access appears only when the teacher is actively live'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isRTL
                      ? 'برای تجربه بهتر، لینک ورود کلاس زنده فقط در داشبورد و اعلان‌ها هنگام شروع جلسه نشان داده می‌شود.'
                      : 'For a cleaner experience, the join link only appears on the dashboard and notifications when a session starts.'}
                  </p>
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

        {simulationRecommendations.length > 0 && (
          <section className="mb-8 overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/5 via-background to-primary/10 shadow-sm">
            <div className="border-b bg-background/70 px-6 py-5 backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    {isRTL ? 'شبیه‌سازی‌ها و آزمایشگاه‌های تعاملی' : 'Interactive simulations & labs'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {isRTL ? 'کاوش مفهومی با تجربه‌های تعاملی' : 'Concept exploration through interactive experiences'}
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                      {isRTL
                        ? 'برای هر درس مناسب، چند ابزار منتخب اضافه شده است تا دانش‌آموز ابتدا مفهوم را ببیند، سپس آزمایش کند و در پایان آن را به حل مسئله و پروژه وصل کند.'
                        : 'Each relevant course now includes curated tools so learners can visualize ideas, test them actively, and transfer them into problem solving and projects.'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border bg-card/80 p-4 text-sm shadow-sm">
                  <p className="font-semibold">{isRTL ? 'روال پیشنهادی' : 'Suggested flow'}</p>
                  <ol className="mt-2 space-y-1 text-muted-foreground">
                    <li>1. {isRTL ? 'قبل از درس: یک پیش‌بینی کوتاه بنویسید.' : 'Before the lesson: write one quick prediction.'}</li>
                    <li>2. {isRTL ? 'حین کاوش: یک متغیر را تغییر دهید و نتیجه را ثبت کنید.' : 'During exploration: change one variable and record the result.'}</li>
                    <li>3. {isRTL ? 'بعد از کار: یافته را به یک مسئله نوشتاری وصل کنید.' : 'Afterward: connect the finding to a written problem.'}</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-6 lg:grid-cols-2 xl:grid-cols-3">
              {simulationRecommendations.map((resource) => {
                const Icon = resource.icon;

                return (
                  <article
                    key={resource.id}
                    className={`rounded-3xl border bg-gradient-to-br ${resource.accent} p-5 shadow-sm transition-transform hover:-translate-y-1`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-background/85 p-3 shadow-sm">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {resource.provider}
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-foreground">{resource.title[lang]}</h3>
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{resource.description[lang]}</p>

                    <div className="mt-4 rounded-2xl bg-background/70 p-3 text-sm shadow-sm">
                      <p className="font-medium text-foreground">{resource.bestFor[lang]}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {resource.tags[lang].map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                    >
                      {resource.cta[lang]}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </article>
                );
              })}
            </div>
          </section>
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
                  <h3 className="font-semibold">{getLocalizedText(unit.title, lang)}</h3>
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
                    href={lesson.locked ? '#' : `/${locale}/student/lessons/${lesson.id}/learn`}
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
                        {getLocalizedText(lesson.title, lang)}
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
