'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { 
  ChevronRight, ChevronLeft, Play, Pause, CheckCircle2, 
  BookOpen, Clock, Award, MessageSquare, ThumbsUp, 
  SkipForward, SkipBack, Volume2, Settings, Maximize,
  FileText, HelpCircle, Lightbulb, Target, Brain
} from 'lucide-react';
import type { PracticeQuestion } from '@/components/learning/InteractivePractice';

const InteractivePractice = dynamic(
  () => import('@/components/learning/InteractivePractice').then((mod) => mod.InteractivePractice),
  {
    ssr: false,
    loading: () => (
      <div className="bg-card border rounded-xl p-6 text-center text-muted-foreground">
        Loading practice module...
      </div>
    ),
  }
);

// Lesson content data
const lessonsData: Record<string, any> = {
  'l1': {
    title: { fa: 'معرفی اعداد صحیح', en: 'Introduction to Integers' },
    course: { fa: 'ریاضی پایه هشتم', en: 'Grade 8 Mathematics' },
    courseId: '1',
    duration: '25 min',
    xp: 20,
    objectives: {
      fa: ['درک مفهوم اعداد صحیح', 'شناسایی اعداد مثبت و منفی', 'نمایش اعداد صحیح روی محور اعداد'],
      en: ['Understand the concept of integers', 'Identify positive and negative numbers', 'Represent integers on a number line']
    },
    content: {
      fa: `
# اعداد صحیح چیست؟

اعداد صحیح شامل اعداد طبیعی (۱، ۲، ۳، ...)، صفر و اعداد منفی (...، -۳، -۲، -۱) هستند.

## نکات کلیدی

- **اعداد مثبت**: اعدادی که بزرگتر از صفر هستند
- **اعداد منفی**: اعدادی که کوچکتر از صفر هستند
- **صفر**: نه مثبت است نه منفی

## کاربرد در زندگی روزمره

- دمای هوا (مثلاً -۵ درجه سانتیگراد)
- ارتفاع نسبت به سطح دریا
- موجودی حساب بانکی

## مثال

اگر دمای هوا ۳ درجه زیر صفر باشد، آن را با عدد **-۳** نشان می‌دهیم.
      `,
      en: `
# What are Integers?

Integers include natural numbers (1, 2, 3, ...), zero, and negative numbers (..., -3, -2, -1).

## Key Points

- **Positive numbers**: Numbers greater than zero
- **Negative numbers**: Numbers less than zero
- **Zero**: Neither positive nor negative

## Real-life Applications

- Temperature (e.g., -5 degrees Celsius)
- Altitude relative to sea level
- Bank account balance

## Example

If the temperature is 3 degrees below zero, we represent it as **-3**.
      `
    },
    quiz: [
      {
        question: { fa: 'کدام گزینه یک عدد صحیح است؟', en: 'Which of the following is an integer?' },
        options: { fa: ['۳/۴', '-۵', '۲.۵', 'π'], en: ['3/4', '-5', '2.5', 'π'] },
        correct: 1
      },
      {
        question: { fa: 'عدد صفر چه نوع عددی است؟', en: 'What type of number is zero?' },
        options: { 
          fa: ['فقط مثبت', 'فقط منفی', 'نه مثبت و نه منفی', 'هم مثبت و هم منفی'], 
          en: ['Only positive', 'Only negative', 'Neither positive nor negative', 'Both positive and negative'] 
        },
        correct: 2
      }
    ],
    nextLesson: 'l2',
    prevLesson: null
  },
  'l2': {
    title: { fa: 'جمع و تفریق اعداد صحیح', en: 'Addition and Subtraction of Integers' },
    course: { fa: 'ریاضی پایه هشتم', en: 'Grade 8 Mathematics' },
    courseId: '1',
    duration: '30 min',
    xp: 25,
    objectives: {
      fa: ['جمع کردن اعداد صحیح', 'تفریق اعداد صحیح', 'حل مسائل ترکیبی'],
      en: ['Add integers', 'Subtract integers', 'Solve combined problems']
    },
    content: {
      fa: `
# جمع و تفریق اعداد صحیح

## قواعد جمع

1. **جمع دو عدد مثبت**: همیشه مثبت است
   - مثال: ۳ + ۵ = ۸

2. **جمع دو عدد منفی**: همیشه منفی است
   - مثال: (-۳) + (-۵) = -۸

3. **جمع یک عدد مثبت و یک عدد منفی**: علامت عدد بزرگتر را می‌گیرد
   - مثال: ۵ + (-۳) = ۲
   - مثال: (-۵) + ۳ = -۲

## قواعد تفریق

تفریق یک عدد صحیح معادل جمع با قرینه آن عدد است:
- a - b = a + (-b)
- مثال: ۵ - ۸ = ۵ + (-۸) = -۳
      `,
      en: `
# Addition and Subtraction of Integers

## Addition Rules

1. **Adding two positive numbers**: Always positive
   - Example: 3 + 5 = 8

2. **Adding two negative numbers**: Always negative
   - Example: (-3) + (-5) = -8

3. **Adding a positive and a negative number**: Takes the sign of the larger absolute value
   - Example: 5 + (-3) = 2
   - Example: (-5) + 3 = -2

## Subtraction Rules

Subtracting an integer is the same as adding its opposite:
- a - b = a + (-b)
- Example: 5 - 8 = 5 + (-8) = -3
      `
    },
    quiz: [
      {
        question: { fa: 'حاصل (-۷) + ۳ چیست؟', en: 'What is (-7) + 3?' },
        options: { fa: ['۱۰', '-۱۰', '۴', '-۴'], en: ['10', '-10', '4', '-4'] },
        correct: 3
      }
    ],
    nextLesson: 'l3',
    prevLesson: 'l1'
  },
  'l10': {
    title: { fa: 'حل معادلات دو مجهولی', en: 'Solving Two Variable Equations' },
    course: { fa: 'ریاضی پایه هشتم', en: 'Grade 8 Mathematics' },
    courseId: '1',
    duration: '45 min',
    xp: 40,
    objectives: {
      fa: ['درک مفهوم دستگاه معادلات', 'روش جایگزینی', 'روش حذفی'],
      en: ['Understand systems of equations', 'Substitution method', 'Elimination method']
    },
    content: {
      fa: `
# حل دستگاه معادلات دو مجهولی

## دستگاه معادلات چیست؟

دستگاه معادلات مجموعه‌ای از معادلات است که باید همزمان حل شوند.

**مثال:**
- x + y = 5
- x - y = 1

## روش اول: جایگزینی

1. از یک معادله، یک متغیر را بر حسب دیگری بنویسید
2. در معادله دوم جایگزین کنید
3. حل کنید

**مثال:**
از معادله اول: x = 5 - y
جایگزینی در معادله دوم: (5 - y) - y = 1
حل: 5 - 2y = 1 → y = 2
پس: x = 5 - 2 = 3

## روش دوم: حذفی

1. معادلات را طوری ضرب کنید که ضرایب یک متغیر برابر شوند
2. معادلات را جمع یا تفریق کنید تا یک متغیر حذف شود
3. حل کنید

**مثال:**
x + y = 5
x - y = 1
جمع دو معادله: 2x = 6 → x = 3
جایگزینی: 3 + y = 5 → y = 2
      `,
      en: `
# Solving Systems of Two Variable Equations

## What is a System of Equations?

A system of equations is a set of equations that must be solved simultaneously.

**Example:**
- x + y = 5
- x - y = 1

## Method 1: Substitution

1. From one equation, express one variable in terms of the other
2. Substitute into the second equation
3. Solve

**Example:**
From first equation: x = 5 - y
Substitute in second: (5 - y) - y = 1
Solve: 5 - 2y = 1 → y = 2
So: x = 5 - 2 = 3

## Method 2: Elimination

1. Multiply equations so coefficients of one variable are equal
2. Add or subtract equations to eliminate one variable
3. Solve

**Example:**
x + y = 5
x - y = 1
Add both: 2x = 6 → x = 3
Substitute: 3 + y = 5 → y = 2
      `
    },
    quiz: [
      {
        question: { fa: 'اگر x + y = 7 و x - y = 3 باشد، x چقدر است؟', en: 'If x + y = 7 and x - y = 3, what is x?' },
        options: { fa: ['۲', '۵', '۳', '۴'], en: ['2', '5', '3', '4'] },
        correct: 1
      }
    ],
    nextLesson: 'l11',
    prevLesson: 'l9'
  },
  'l6': {
    title: { fa: 'کار و انرژی', en: 'Work and Energy' },
    course: { fa: 'علوم تجربی', en: 'Science' },
    courseId: '2',
    duration: '40 min',
    xp: 35,
    objectives: {
      fa: ['تعریف کار فیزیکی', 'انواع انرژی', 'قانون پایستگی انرژی'],
      en: ['Define physical work', 'Types of energy', 'Law of conservation of energy']
    },
    content: {
      fa: `
# کار و انرژی

## کار فیزیکی

کار = نیرو × جابجایی × cos(θ)
W = F × d × cos(θ)

**واحد کار**: ژول (J)

## انواع انرژی

1. **انرژی جنبشی**: انرژی ناشی از حرکت
   - Ek = ½mv²

2. **انرژی پتانسیل گرانشی**: انرژی ناشی از ارتفاع
   - Ep = mgh

3. **انرژی مکانیکی**: مجموع انرژی جنبشی و پتانسیل
   - E = Ek + Ep

## قانون پایستگی انرژی

انرژی نه خلق می‌شود و نه از بین می‌رود، فقط از شکلی به شکل دیگر تبدیل می‌شود.
      `,
      en: `
# Work and Energy

## Physical Work

Work = Force × Displacement × cos(θ)
W = F × d × cos(θ)

**Unit of work**: Joule (J)

## Types of Energy

1. **Kinetic Energy**: Energy due to motion
   - Ek = ½mv²

2. **Gravitational Potential Energy**: Energy due to height
   - Ep = mgh

3. **Mechanical Energy**: Sum of kinetic and potential energy
   - E = Ek + Ep

## Law of Conservation of Energy

Energy is neither created nor destroyed, only transformed from one form to another.
      `
    },
    quiz: [
      {
        question: { fa: 'واحد کار چیست؟', en: 'What is the unit of work?' },
        options: { fa: ['نیوتن', 'ژول', 'وات', 'پاسکال'], en: ['Newton', 'Joule', 'Watt', 'Pascal'] },
        correct: 1
      }
    ],
    nextLesson: 'l7',
    prevLesson: 'l5'
  },
  'ai-l1': {
    title: { fa: 'Problem Spotting Sprint', en: 'Problem Spotting Sprint' },
    course: { fa: 'AI + Robotics Venture Lab', en: 'AI + Robotics Venture Lab' },
    courseId: '5',
    duration: '120 min',
    xp: 80,
    objectives: {
      fa: ['شناسایی مسائل واقعی کاربران', 'استفاده از 5E برای شروع کارگاه', 'اولویت‌بندی ایده‌ها با معیار بازار'],
      en: ['Identify real user pain points', 'Use 5E workshop flow in class', 'Prioritize ideas using market criteria']
    },
    content: {
      fa: `
# Term 1 Workshop 1: Problem Spotting Sprint

## Slide 1 — Engage
- Icebreaker: What daily frustration wastes your family’s time?
- Share 3 examples in teams.

## Slide 2 — Explore
- Run a 20-minute observation walk (school/home/business context).
- Capture evidence: photo, quote, and timestamp.

## Slide 3 — Explain
- Convert each observation into a problem statement:
  "[User] struggles with [task] because [barrier]."

## Slide 4 — Elaborate
- Score each problem from 1-5 on:
  - Urgency
  - Frequency
  - Willingness to pay

## Slide 5 — Evaluate
- Select top 1 opportunity and define success metric for next week.

## Scaffolding Questions
- Who experiences this problem most often?
- What happens if this problem is not solved?
- Why is now the right time to solve it?
      `,
      en: `
# Term 1 Workshop 1: Problem Spotting Sprint

## Slide 1 — Engage
- Icebreaker: What daily frustration wastes your family’s time?
- Share 3 examples in teams.

## Slide 2 — Explore
- Run a 20-minute observation walk (school/home/business context).
- Capture evidence: photo, quote, and timestamp.

## Slide 3 — Explain
- Convert each observation into a problem statement:
  "[User] struggles with [task] because [barrier]."

## Slide 4 — Elaborate
- Score each problem from 1-5 on:
  - Urgency
  - Frequency
  - Willingness to pay

## Slide 5 — Evaluate
- Select top 1 opportunity and define a success metric for next week.

## Scaffolding Questions
- Who experiences this problem most often?
- What happens if this problem is not solved?
- Why is now the right time to solve it?
      `
    },
    engagementActions: [
      { label: { fa: 'Idea Sprint Board', en: 'Idea Sprint Board' }, tab: 'discussion' },
      { label: { fa: 'Start Step Practice', en: 'Start Step Practice' }, tab: 'practice' }
    ],
    discussionPrompts: {
      fa: ['کدام مسئله از نظر بازار جذاب‌تر است؟', 'چطور این مسئله را با داده اثبات می‌کنید؟'],
      en: ['Which problem has the strongest market pull?', 'How will you prove this pain with evidence?']
    },
    tip: {
      fa: 'به جای ایده‌محوری، کار را با مسئله کاربر شروع کنید.',
      en: 'Start from user pain, not from a cool solution idea.'
    },
    quiz: [
      {
        question: { fa: 'بهترین صورت‌بندی مسئله کدام است؟', en: 'Which is the best problem statement?' },
        options: {
          fa: ['ما یک اپ عالی می‌خواهیم', 'دانش‌آموزان در تحویل تکلیف زمان‌بندی موثری ندارند', 'AI خیلی جذاب است', 'ربات بسازیم چون باحال است'],
          en: ['We want a cool app', 'Students struggle to manage homework deadlines consistently', 'AI is exciting', 'Let’s build a robot because it is fun']
        },
        correct: 1
      }
    ],
    prevLesson: null,
    nextLesson: 'ai-l2'
  },
  'ai-l2': {
    title: { fa: 'Customer Interview Workshop', en: 'Customer Interview Workshop' },
    course: { fa: 'AI + Robotics Venture Lab', en: 'AI + Robotics Venture Lab' },
    courseId: '5',
    duration: '120 min',
    xp: 80,
    objectives: {
      fa: ['طراحی سوالات مصاحبه بدون سوگیری', 'استخراج الگوهای نیاز مشتری', 'ساخت پرسونا و نقشه سفر'],
      en: ['Design unbiased interview questions', 'Extract customer pain patterns', 'Create persona and journey map']
    },
    content: {
      fa: `
# Term 1 Workshop 2: Customer Interview Studio

## 5E Flow
## Engage
- Watch 2 interview clips and identify biased vs neutral questions.

## Explore
- Interview 3 users (10 min each) with a script.

## Explain
- Cluster quotes into pain categories.

## Elaborate
- Build one persona + one journey map.

## Evaluate
- Present top insight in 60 seconds.

## Slide Prompts
- "What surprised you most?"
- "Where in the journey does friction peak?"
      `,
      en: `
# Term 1 Workshop 2: Customer Interview Studio

## 5E Flow
## Engage
- Watch 2 interview clips and identify biased vs neutral questions.

## Explore
- Interview 3 users (10 min each) with a script.

## Explain
- Cluster quotes into pain categories.

## Elaborate
- Build one persona + one journey map.

## Evaluate
- Present top insight in 60 seconds.

## Slide Prompts
- "What surprised you most?"
- "Where in the journey does friction peak?"
      `
    },
    engagementActions: [
      { label: { fa: 'Open Interview Rubric', en: 'Open Interview Rubric' }, tab: 'content' },
      { label: { fa: 'Team Debrief', en: 'Team Debrief' }, tab: 'discussion' }
    ],
    discussionPrompts: {
      fa: ['کدام نقل‌قول مشتری مهم‌ترین بینش را داد؟'],
      en: ['Which customer quote changed your original assumption the most?']
    },
    quiz: [
      {
        question: { fa: 'کدام سوال برای مصاحبه مناسب‌تر است؟', en: 'Which interview question is better?' },
        options: {
          fa: ['آیا اپ ما را دوست دارید؟', 'آخرین بار چه زمانی با این مشکل روبرو شدید؟', 'اگر ربات بدهیم عالی نیست؟', 'ما راه‌حل داریم، می‌خرید؟'],
          en: ['Do you like our app?', 'Tell me about the last time this problem happened.', 'Wouldn’t our robot be amazing?', 'We already built it, would you buy?']
        },
        correct: 1
      }
    ],
    prevLesson: 'ai-l1',
    nextLesson: 'ai-l3'
  },
  'ai-l3': {
    title: { fa: 'Term 1 Capstone Build', en: 'Term 1 Capstone Build' },
    course: { fa: 'AI + Robotics Venture Lab', en: 'AI + Robotics Venture Lab' },
    courseId: '5',
    duration: '120 min',
    xp: 100,
    objectives: {
      fa: ['تهیه Opportunity Brief', 'تعریف KPI و ریسک‌ها', 'آمادگی برای Go/No-Go'],
      en: ['Produce an opportunity brief', 'Define KPI and key risks', 'Prepare for Go/No-Go review']
    },
    content: {
      fa: `
# Term 1 Capstone: Opportunity Brief

## Deliverables
- Problem statement (validated)
- Target user profile
- Market snapshot
- Success metric for Term 2 MVP

## Judge Criteria
- Evidence quality
- Clarity of user pain
- Feasibility in 8 weeks
      `,
      en: `
# Term 1 Capstone: Opportunity Brief

## Deliverables
- Problem statement (validated)
- Target user profile
- Market snapshot
- Success metric for Term 2 MVP

## Judge Criteria
- Evidence quality
- Clarity of user pain
- Feasibility in 8 weeks
      `
    },
    engagementActions: [
      { label: { fa: 'Capstone Checklist', en: 'Capstone Checklist' }, tab: 'content' },
      { label: { fa: 'Pitch Rehearsal', en: 'Pitch Rehearsal' }, tab: 'discussion' }
    ],
    quiz: [
      {
        question: { fa: 'بهترین KPI برای ترم ۲ چیست؟', en: 'What is the best KPI for Term 2?' },
        options: {
          fa: ['تعداد اسلایدها', 'درصد کاربران که MVP را تا پایان استفاده می‌کنند', 'رنگ لوگو', 'تعداد فایل‌ها'],
          en: ['Number of slides', 'Percentage of users who complete core MVP flow', 'Logo color choice', 'Number of files in repo']
        },
        correct: 1
      }
    ],
    prevLesson: 'ai-l2',
    nextLesson: 'ai-l4'
  },
  'ai-l4': {
    title: { fa: 'Copilot App Sprint', en: 'Copilot App Sprint' },
    course: { fa: 'AI + Robotics Venture Lab', en: 'AI + Robotics Venture Lab' },
    courseId: '5',
    duration: '120 min',
    xp: 90,
    objectives: {
      fa: ['استفاده حرفه‌ای از Copilot', 'پیاده‌سازی سریع MVP', 'ثبت تصمیم‌های فنی'],
      en: ['Use Copilot effectively', 'Implement MVP quickly', 'Document engineering decisions']
    },
    content: {
      fa: `
# Term 2 Workshop 1: Copilot App Sprint

## Suggested Stack
- VS Code + GitHub Copilot
- Python + FastAPI or Streamlit
- SQLite/PostgreSQL

## 5E Sprint
## Engage: Define one user story
## Explore: Prompt Copilot for scaffolding
## Explain: Review generated code as a team
## Elaborate: Add validation + logging
## Evaluate: Demo one complete flow
      `,
      en: `
# Term 2 Workshop 1: Copilot App Sprint

## Suggested Stack
- VS Code + GitHub Copilot
- Python + FastAPI or Streamlit
- SQLite/PostgreSQL

## 5E Sprint
## Engage: Define one user story
## Explore: Prompt Copilot for scaffolding
## Explain: Review generated code as a team
## Elaborate: Add validation + logging
## Evaluate: Demo one complete flow
      `
    },
    engagementActions: [
      { label: { fa: 'Switch to Practice', en: 'Switch to Practice' }, tab: 'practice' },
      { label: { fa: 'Code Review Circle', en: 'Code Review Circle' }, tab: 'discussion' }
    ],
    quiz: [
      {
        question: { fa: 'در کار با Copilot کدام اصل مهم‌تر است؟', en: 'What is most important when using Copilot?' },
        options: {
          fa: ['قبول بدون بررسی خروجی', 'بررسی و تست هر قطعه کد', 'حذف مستندات', 'نادیده گرفتن خطاها'],
          en: ['Accepting output without review', 'Reviewing and testing each generated block', 'Skipping documentation', 'Ignoring errors']
        },
        correct: 1
      }
    ],
    prevLesson: 'ai-l3',
    nextLesson: 'ai-l5'
  },
  'ai-l5': {
    title: { fa: 'Workflow Automation Lab', en: 'Workflow Automation Lab' },
    course: { fa: 'AI + Robotics Venture Lab', en: 'AI + Robotics Venture Lab' },
    courseId: '5',
    duration: '120 min',
    xp: 90,
    objectives: {
      fa: ['خودکارسازی فرایندها', 'اتصال داده و اعلان', 'کاهش زمان اجرای کار'],
      en: ['Automate repetitive workflows', 'Connect data and notifications', 'Reduce process time']
    },
    content: {
      fa: `
# Term 2 Workshop 2: Workflow Automation Lab

## Tools
- Airtable/Google Sheets
- Zapier or Make
- Telegram/Email notifications

## Build Challenge
- Trigger: New customer request
- Action: Classify with AI label
- Output: Notify team and update dashboard
      `,
      en: `
# Term 2 Workshop 2: Workflow Automation Lab

## Tools
- Airtable/Google Sheets
- Zapier or Make
- Telegram/Email notifications

## Build Challenge
- Trigger: New customer request
- Action: Classify with AI label
- Output: Notify team and update dashboard
      `
    },
    quiz: [
      {
        question: { fa: 'خودکارسازی خوب چه اثری دارد؟', en: 'What is a key benefit of automation?' },
        options: {
          fa: ['افزایش کار تکراری', 'کاهش خطا و زمان پاسخ', 'پیچیدگی بیشتر برای کاربر', 'حذف نیاز مشتری'],
          en: ['More repetitive manual work', 'Lower error rate and faster response', 'Higher user friction', 'Eliminates customer need']
        },
        correct: 1
      }
    ],
    prevLesson: 'ai-l4',
    nextLesson: 'ai-l6'
  },
  'ai-l6': {
    title: { fa: 'Term 2 MVP Capstone', en: 'Term 2 MVP Capstone' },
    course: { fa: 'AI + Robotics Venture Lab', en: 'AI + Robotics Venture Lab' },
    courseId: '5',
    duration: '120 min',
    xp: 110,
    objectives: {
      fa: ['تحویل MVP عملیاتی', 'اندازه‌گیری تجربه کاربر', 'برنامه بهبود نسخه بعدی'],
      en: ['Deliver a working MVP', 'Measure user experience', 'Plan next iteration']
    },
    content: {
      fa: `
# Term 2 Capstone: Working MVP

## Required Demo
- User sign-in or profile flow
- Core value action in < 3 steps
- Basic analytics event logging

## Evaluation Rubric
- Usability (40)
- Reliability (30)
- Value clarity (30)
      `,
      en: `
# Term 2 Capstone: Working MVP

## Required Demo
- User sign-in or profile flow
- Core value action in < 3 steps
- Basic analytics event logging

## Evaluation Rubric
- Usability (40)
- Reliability (30)
- Value clarity (30)
      `
    },
    quiz: [
      {
        question: { fa: 'MVP موفق در این ترم باید چه ویژگی داشته باشد؟', en: 'A successful MVP in this term should:' },
        options: {
          fa: ['فقط UI زیبا', 'حل یک مسئله اصلی کاربر به‌صورت قابل تست', 'بدون داده کار کند', 'فقط ارائه اسلاید باشد'],
          en: ['Only have attractive UI', 'Solve one core user problem in a testable way', 'Run with no data evidence', 'Be only a slide presentation']
        },
        correct: 1
      }
    ],
    prevLesson: 'ai-l5',
    nextLesson: 'ai-l7'
  },
  'ai-l7': {
    title: { fa: 'Sensors & Actuators Studio', en: 'Sensors & Actuators Studio' },
    course: { fa: 'AI + Robotics Venture Lab', en: 'AI + Robotics Venture Lab' },
    courseId: '5',
    duration: '120 min',
    xp: 100,
    objectives: {
      fa: ['خواندن داده سنسور', 'کنترل عملگر', 'کالیبراسیون پایه'],
      en: ['Read sensor data', 'Control an actuator safely', 'Perform baseline calibration']
    },
    content: {
      fa: `
# Term 3 Workshop 1: Sensors & Actuators

## Hardware Kit
- micro:bit/Arduino
- Ultrasonic or PIR sensor
- Servo motor

## Workshop Flow
- Capture sensor values
- Set threshold rules
- Trigger motor action
- Log test results
      `,
      en: `
# Term 3 Workshop 1: Sensors & Actuators

## Hardware Kit
- micro:bit/Arduino
- Ultrasonic or PIR sensor
- Servo motor

## Workshop Flow
- Capture sensor values
- Set threshold rules
- Trigger motor action
- Log test results
      `
    },
    quiz: [
      {
        question: { fa: 'هدف کالیبراسیون سنسور چیست؟', en: 'Why do we calibrate sensors?' },
        options: {
          fa: ['زیبایی برد', 'افزایش دقت قرائت در شرایط واقعی', 'کاهش تعداد سیم', 'حذف الگوریتم'],
          en: ['Board aesthetics', 'Improve reading accuracy in real conditions', 'Reduce wire count only', 'Remove algorithms entirely']
        },
        correct: 1
      }
    ],
    prevLesson: 'ai-l6',
    nextLesson: 'ai-l8'
  },
  'ai-l8': {
    title: { fa: 'Vision & Edge AI Lab', en: 'Vision & Edge AI Lab' },
    course: { fa: 'AI + Robotics Venture Lab', en: 'AI + Robotics Venture Lab' },
    courseId: '5',
    duration: '120 min',
    xp: 100,
    objectives: {
      fa: ['طراحی سناریوی بینایی ماشین', 'ارزیابی دقت/سرعت', 'اتصال خروجی AI به ربات'],
      en: ['Design a computer-vision scenario', 'Evaluate accuracy/latency', 'Connect AI output to robot behavior']
    },
    content: {
      fa: `
# Term 3 Workshop 2: Vision & Edge AI

## Slide Structure
- Engage: Watch failure cases of poor detection
- Explore: Train/test a simple classifier
- Explain: Compare precision and recall
- Elaborate: Improve threshold + lighting setup
- Evaluate: Live robot reaction test
      `,
      en: `
# Term 3 Workshop 2: Vision & Edge AI

## Slide Structure
- Engage: Watch failure cases of poor detection
- Explore: Train/test a simple classifier
- Explain: Compare precision and recall
- Elaborate: Improve threshold + lighting setup
- Evaluate: Live robot reaction test
      `
    },
    quiz: [
      {
        question: { fa: 'کدام معیار برای خطای مثبت کاذب مهم است؟', en: 'Which metric helps with false positives?' },
        options: {
          fa: ['Precision', 'Voltage', 'FPS only', 'Battery size'],
          en: ['Precision', 'Voltage', 'FPS only', 'Battery size']
        },
        correct: 0
      }
    ],
    prevLesson: 'ai-l7',
    nextLesson: 'ai-l9'
  },
  'ai-l9': {
    title: { fa: 'Term 3 Robotics Capstone', en: 'Term 3 Robotics Capstone' },
    course: { fa: 'AI + Robotics Venture Lab', en: 'AI + Robotics Venture Lab' },
    courseId: '5',
    duration: '120 min',
    xp: 120,
    objectives: {
      fa: ['نمونه رباتیک هوشمند', 'تست پایایی', 'مستندسازی نتایج'],
      en: ['Build a smart robotics prototype', 'Run reliability tests', 'Document measurable results']
    },
    content: {
      fa: `
# Term 3 Capstone: Smart Prototype

## Demo Expectations
- Sensor input + AI decision + actuator response
- At least 10 test runs
- Failure log and mitigation plan
      `,
      en: `
# Term 3 Capstone: Smart Prototype

## Demo Expectations
- Sensor input + AI decision + actuator response
- At least 10 test runs
- Failure log and mitigation plan
      `
    },
    quiz: [
      {
        question: { fa: 'حداقل چه چیزی باید در گزارش کاپستون باشد؟', en: 'What must the capstone report include?' },
        options: {
          fa: ['فقط عکس تیم', 'نتایج تست و برنامه رفع خطا', 'نام تیم', 'تم رنگی پروژه'],
          en: ['Only team photo', 'Test outcomes and mitigation plan', 'Team name only', 'Project color theme']
        },
        correct: 1
      }
    ],
    prevLesson: 'ai-l8',
    nextLesson: 'ai-l10'
  },
  'ai-l10': {
    title: { fa: 'Business Model & Pricing', en: 'Business Model & Pricing' },
    course: { fa: 'AI + Robotics Venture Lab', en: 'AI + Robotics Venture Lab' },
    courseId: '5',
    duration: '120 min',
    xp: 90,
    objectives: {
      fa: ['طراحی BMC', 'قیمت‌گذاری مبتنی بر ارزش', 'برآورد CAC/LTV پایه'],
      en: ['Design BMC', 'Set value-based pricing', 'Estimate basic CAC/LTV']
    },
    content: {
      fa: `
# Term 4 Workshop 1: Business Model & Pricing

## Slide Deck Plan
- Customer segment selection
- Value proposition fit
- Pricing experiments (3 options)
- Unit economics sanity check
      `,
      en: `
# Term 4 Workshop 1: Business Model & Pricing

## Slide Deck Plan
- Customer segment selection
- Value proposition fit
- Pricing experiments (3 options)
- Unit economics sanity check
      `
    },
    quiz: [
      {
        question: { fa: 'قیمت‌گذاری مبتنی بر ارزش یعنی؟', en: 'Value-based pricing means:' },
        options: {
          fa: ['براساس هزینه قطعات فقط', 'براساس ارزشی که مشتری دریافت می‌کند', 'ارزان‌ترین قیمت بازار', 'بدون توجه به رقبا'],
          en: ['Only based on component cost', 'Based on customer-perceived value delivered', 'Always cheapest in market', 'Ignoring competition completely']
        },
        correct: 1
      }
    ],
    prevLesson: 'ai-l9',
    nextLesson: 'ai-l11'
  },
  'ai-l11': {
    title: { fa: 'Pitch Deck & Story Design', en: 'Pitch Deck & Story Design' },
    course: { fa: 'AI + Robotics Venture Lab', en: 'AI + Robotics Venture Lab' },
    courseId: '5',
    duration: '120 min',
    xp: 90,
    objectives: {
      fa: ['داستان‌گویی کارآفرینانه', 'ساختار اسلاید تاثیرگذار', 'تمرین ارائه ۳ دقیقه‌ای'],
      en: ['Entrepreneurial storytelling', 'Design a persuasive deck', 'Practice a 3-minute pitch']
    },
    content: {
      fa: `
# Term 4 Workshop 2: Pitch Deck Studio

## 10-Slide Sequence
1) Problem
2) Customer
3) Solution
4) Demo
5) Market
6) Business model
7) Traction
8) Competition
9) Roadmap
10) Ask
      `,
      en: `
# Term 4 Workshop 2: Pitch Deck Studio

## 10-Slide Sequence
1) Problem
2) Customer
3) Solution
4) Demo
5) Market
6) Business model
7) Traction
8) Competition
9) Roadmap
10) Ask
      `
    },
    discussionPrompts: {
      fa: ['قوی‌ترین اسلاید شما کدام است و چرا؟'],
      en: ['Which slide is your strongest and why?']
    },
    quiz: [
      {
        question: { fa: 'در دک ارائه، کدام بخش اعتماد سرمایه‌گذار را بیشتر می‌کند؟', en: 'Which section most increases investor trust?' },
        options: {
          fa: ['شوخی زیاد', 'شواهد واقعی از کاربر و عملکرد', 'انیمیشن‌های سنگین', 'حذف رقبا از تحلیل'],
          en: ['Many jokes', 'Real user and performance evidence', 'Heavy animation effects', 'Skipping competitor analysis']
        },
        correct: 1
      }
    ],
    prevLesson: 'ai-l10',
    nextLesson: 'ai-l12'
  },
  'ai-l12': {
    title: { fa: 'Final Capstone Demo Day', en: 'Final Capstone Demo Day' },
    course: { fa: 'AI + Robotics Venture Lab', en: 'AI + Robotics Venture Lab' },
    courseId: '5',
    duration: '120 min',
    xp: 150,
    objectives: {
      fa: ['ارائه نهایی محصول', 'دموی زنده ربات + AI', 'دریافت بازخورد داور و برنامه رشد'],
      en: ['Deliver final venture pitch', 'Run live robotics + AI demo', 'Collect judge feedback and growth plan']
    },
    content: {
      fa: `
# Final Capstone: Demo Day

## Required Sections
- Live product demo (software + robotics)
- Business viability summary
- 90-day execution roadmap

## Success Rule
- Clear user value + reliable demo + believable growth plan
      `,
      en: `
# Final Capstone: Demo Day

## Required Sections
- Live product demo (software + robotics)
- Business viability summary
- 90-day execution roadmap

## Success Rule
- Clear user value + reliable demo + believable growth plan
      `
    },
    engagementActions: [
      { label: { fa: 'Open Evaluation Rubric', en: 'Open Evaluation Rubric' }, tab: 'quiz' },
      { label: { fa: 'Peer Feedback Round', en: 'Peer Feedback Round' }, tab: 'discussion' }
    ],
    quiz: [
      {
        question: { fa: 'کدام ترکیب برای Demo Day برنده است؟', en: 'Which combination wins Demo Day?' },
        options: {
          fa: ['فقط ایده', 'ارزش کاربر + دمو پایدار + مدل کسب‌وکار', 'تنها اسلاید جذاب', 'فقط سخت‌افزار'],
          en: ['Only a big idea', 'User value + stable demo + business model', 'Only attractive slides', 'Only hardware build']
        },
        correct: 1
      }
    ],
    prevLesson: 'ai-l11',
    nextLesson: null
  }
};

// Default lesson for unknown IDs
const defaultLesson = {
  title: { fa: 'درس', en: 'Lesson' },
  course: { fa: 'دوره آموزشی', en: 'Course' },
  courseId: '1',
  duration: '30 min',
  xp: 25,
  objectives: {
    fa: ['یادگیری مفاهیم پایه', 'تمرین و تکرار'],
    en: ['Learn basic concepts', 'Practice and review']
  },
  content: {
    fa: '# محتوای درس\n\nاین درس به زودی اضافه خواهد شد.',
    en: '# Lesson Content\n\nThis lesson will be added soon.'
  },
  quiz: [],
  nextLesson: null,
  prevLesson: null
};

const getAiLessonNumber = (id: string) => {
  const match = id.match(/^ai-l(\d+)$/);
  return match ? Number(match[1]) : null;
};

const getAiTermNumber = (lessonNumber: number) => {
  if (lessonNumber <= 3) return 1;
  if (lessonNumber <= 6) return 2;
  if (lessonNumber <= 9) return 3;
  return 4;
};

const buildAiLessonPack = (lessonNumber: number) => {
  const termNumber = getAiTermNumber(lessonNumber);

  const termLabels = {
    fa: {
      1: 'Opportunity Discovery',
      2: 'AI MVP Engineering',
      3: 'Robotics Intelligence',
      4: 'Venture Launch & Demo Day',
    },
    en: {
      1: 'Opportunity Discovery',
      2: 'AI MVP Engineering',
      3: 'Robotics Intelligence',
      4: 'Venture Launch & Demo Day',
    },
  };

  const termCapstone = {
    fa: {
      1: 'Opportunity Brief + Validation Evidence',
      2: 'Working MVP + User Test Report',
      3: 'Smart Robotics Prototype + Reliability Metrics',
      4: 'Investor Pitch + Live Product Demo',
    },
    en: {
      1: 'Opportunity Brief + Validation Evidence',
      2: 'Working MVP + User Test Report',
      3: 'Smart Robotics Prototype + Reliability Metrics',
      4: 'Investor Pitch + Live Product Demo',
    },
  };

  const requiredMaterials = {
    fa: [
      'دانشنامه کارگاه (Student Workbook) برای یادداشت‌های تیمی',
      'لپ‌تاپ (۱ عدد برای هر ۲ نفر) + اینترنت پایدار',
      'VS Code + GitHub Copilot + Python محیط آماده',
      'تخته/Sticky Notes برای نقشه‌کشی جریان و مدل کسب‌وکار',
      'فرم ارزیابی همتایان + Rubric داوری'
    ],
    en: [
      'Workshop student workbook for team notes and evidence',
      'Laptop (1 per 2 students) + stable internet',
      'VS Code + GitHub Copilot + ready Python environment',
      'Whiteboard/sticky notes for mapping user flow and business model',
      'Peer-review form + instructor judging rubric'
    ],
  };

  const hardwareMaterials = {
    fa: [
      'micro:bit یا Arduino Uno',
      'سنسور فاصله/حرکت + Servo Motor',
      'بردبورد، سیم جامپر، منبع تغذیه',
      'وبکم USB یا دوربین برای سناریوی بینایی'
    ],
    en: [
      'micro:bit or Arduino Uno',
      'Distance/motion sensor + servo motor',
      'Breadboard, jumper wires, safe power source',
      'USB webcam or camera for vision scenarios'
    ],
  };

  const sessionAgenda = {
    fa: [
      '00:00-00:15 | Engage: Warm-up challenge + success criteria',
      '00:15-00:45 | Explore: Team experiment / discovery task',
      '00:45-01:10 | Explain: Evidence debrief + concept mapping',
      '01:10-01:40 | Elaborate: Build iteration with constraints',
      '01:40-02:00 | Evaluate: Showcase, rubric scoring, retro'
    ],
    en: [
      '00:00-00:15 | Engage: Warm-up challenge + success criteria',
      '00:15-00:45 | Explore: Team experiment / discovery task',
      '00:45-01:10 | Explain: Evidence debrief + concept mapping',
      '01:10-01:40 | Elaborate: Build iteration with constraints',
      '01:40-02:00 | Evaluate: Showcase, rubric scoring, retro'
    ],
  };

  const deliverables = {
    fa: [
      'نسخه ۱ خروجی تیمی + اسکرین‌شات/ویدیو شواهد',
      'گزارش کوتاه تصمیمات: چه چیزی کار کرد / نکرد / گام بعد',
      'KPI جلسه: یک عدد قابل اندازه‌گیری برای پیشرفت',
      `همراستایی با کاپستون ترم: ${termCapstone.fa[termNumber as 1 | 2 | 3 | 4]}`
    ],
    en: [
      'Team artifact v1 + screenshot/video proof of execution',
      'Short decision log: what worked / failed / next step',
      'Session KPI: one measurable progress indicator',
      `Capstone alignment: ${termCapstone.en[termNumber as 1 | 2 | 3 | 4]}`
    ],
  };

  const assessmentRubric = {
    fa: [
      'Problem Fit (25): مسئله واقعی و معتبر',
      'Technical Quality (25): پایداری، خوانایی، تست',
      'User Value (25): ارزش ملموس برای کاربر',
      'Execution & Pitch (25): مدیریت زمان، ارائه، پاسخ به سوال'
    ],
    en: [
      'Problem Fit (25): validated real need',
      'Technical Quality (25): reliability, readability, tests',
      'User Value (25): clear practical value',
      'Execution & Pitch (25): time management, communication, defense'
    ],
  };

  const facilitatorGuide = {
    fa: [
      'ابتدا معیار موفقیت را شفاف و قابل اندازه‌گیری کنید.',
      'به‌جای پاسخ مستقیم، از تیم‌ها سوال سقراطی بپرسید.',
      'برای هر تیم یک تصمیم طراحی کلیدی را ثبت و بازبینی کنید.'
    ],
    en: [
      'Start with one measurable success criterion before building.',
      'Use Socratic prompts instead of giving direct solutions.',
      'Capture and review one critical design decision per team.'
    ],
  };

  const extensionChallenges = {
    fa: [
      'نسخه Advanced: یک constraint جدید اضافه و راه‌حل را بازطراحی کنید.',
      'نسخه Business: فرض قیمت‌گذاری را با ۵ کاربر واقعی تست کنید.'
    ],
    en: [
      'Advanced track: add one new hard constraint and redesign.',
      'Business track: validate one pricing assumption with 5 users.'
    ],
  };

  return {
    termLabel: {
      fa: `Term ${termNumber}: ${termLabels.fa[termNumber as 1 | 2 | 3 | 4]}`,
      en: `Term ${termNumber}: ${termLabels.en[termNumber as 1 | 2 | 3 | 4]}`,
    },
    requiredMaterials,
    hardwareMaterials,
    sessionAgenda,
    deliverables,
    assessmentRubric,
    facilitatorGuide,
    extensionChallenges,
  };
};

export default function LessonPage({ params }: { params: { locale: string; id: string; lessonId: string } }) {
  const { locale, id, lessonId } = params;
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const lang = isRTL ? 'fa' : 'en';

  const [activeTab, setActiveTab] = useState<'content' | 'practice' | 'quiz' | 'discussion'>('content');
  const [isPlaying, setIsPlaying] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [discussionDraft, setDiscussionDraft] = useState('');
  const [discussionLikes, setDiscussionLikes] = useState<Record<string, number>>({ 'sample-1': 3 });

  const lesson = lessonsData[lessonId] || defaultLesson;
  const aiLessonNumber = getAiLessonNumber(lessonId);
  const isAiVentureLesson = lesson.courseId === '5' && aiLessonNumber !== null;
  const aiLessonPack = isAiVentureLesson ? buildAiLessonPack(aiLessonNumber) : null;
  const fiveEConnectedStages = aiLessonPack
    ? [
        {
          key: 'engage',
          label: isRTL ? 'Engage' : 'Engage',
          agenda: aiLessonPack.sessionAgenda[lang][0],
          output: isRTL
            ? 'خروجی: تعریف معیار موفقیت + مسئله/هدف جلسه'
            : 'Output: Success metric + clear session target',
        },
        {
          key: 'explore',
          label: isRTL ? 'Explore' : 'Explore',
          agenda: aiLessonPack.sessionAgenda[lang][1],
          output: isRTL
            ? 'خروجی: شواهد اولیه (داده، مشاهده، تست سریع)'
            : 'Output: Initial evidence (data, observations, rapid test)',
        },
        {
          key: 'explain',
          label: isRTL ? 'Explain' : 'Explain',
          agenda: aiLessonPack.sessionAgenda[lang][2],
          output: isRTL
            ? 'خروجی: تحلیل تیمی + تصمیم‌های کلیدی'
            : 'Output: Team analysis + key design decisions',
        },
        {
          key: 'elaborate',
          label: isRTL ? 'Elaborate' : 'Elaborate',
          agenda: aiLessonPack.sessionAgenda[lang][3],
          output: isRTL
            ? 'خروجی: نسخه بهبودیافته + تکمیل Deliverables'
            : 'Output: Improved iteration + completed deliverables',
        },
        {
          key: 'evaluate',
          label: isRTL ? 'Evaluate' : 'Evaluate',
          agenda: aiLessonPack.sessionAgenda[lang][4],
          output: isRTL
            ? 'خروجی: امتیاز Rubric + KPI + گام بعدی'
            : 'Output: Rubric score + KPI + next step',
        },
      ]
    : [];
  const sampleDiscussion = [
    {
      id: 'sample-1',
      author: isRTL ? 'سارا م.' : 'Sara M.',
      time: isRTL ? '۲ ساعت پیش' : '2 hours ago',
      content: isRTL
        ? 'سلام، آیا می‌توانید بیشتر درباره روش حذفی توضیح دهید؟'
        : 'Hello, can you explain more about the elimination method?',
    },
  ];

  const handleDiscussionSend = () => {
    if (!discussionDraft.trim()) return;
    setDiscussionDraft('');
  };

  const handleDiscussionLike = (discussionId: string) => {
    setDiscussionLikes((current) => ({
      ...current,
      [discussionId]: (current[discussionId] ?? 0) + 1,
    }));
  };

  const handleDiscussionReply = (author: string) => {
    setDiscussionDraft(`@${author} `);
  };

  const practiceQuestions: PracticeQuestion[] = lesson.quiz.map((q: any, idx: number) => ({
    id: `${lessonId}-${idx + 1}`,
    type: 'multiple-choice',
    difficulty: idx === 0 ? 'easy' : idx % 2 === 0 ? 'hard' : 'medium',
    question: q.question.en,
    questionFA: q.question.fa,
    options: q.options.en,
    optionsFA: q.options.fa,
    correctAnswer: q.correct,
    explanation: 'Review the concept from the lesson content and try similar examples.',
    explanationFA: 'مفهوم را در محتوای درس مرور کنید و مثال‌های مشابه را تمرین کنید.',
    hint: 'Eliminate obviously incorrect options first.',
    hintFA: 'ابتدا گزینه‌های کاملاً نادرست را حذف کنید.',
    xp: Math.max(10, Math.round(lesson.xp / Math.max(1, lesson.quiz.length))),
    skill: lesson.title.en,
  }));

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
  };

  const getQuizScore = () => {
    if (!lesson.quiz.length) return 0;
    let correct = 0;
    lesson.quiz.forEach((q: any, idx: number) => {
      if (quizAnswers[idx] === q.correct) correct++;
    });
    return Math.round((correct / lesson.quiz.length) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/${locale}/courses/${id}`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
            >
              {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              {lesson.course[lang]}
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {lesson.duration}
            <span className="mx-2">|</span>
            <Award className="h-4 w-4 text-amber-500" />
            +{lesson.xp} XP
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player Placeholder */}
            <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="h-16 w-16 rounded-full bg-primary/90 flex items-center justify-center hover:bg-primary transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="h-8 w-8 text-white" />
                  ) : (
                    <Play className="h-8 w-8 text-white ml-1" />
                  )}
                </button>
              </div>
              
              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsPlaying(!isPlaying)} className="text-white">
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>
                  <SkipBack className="h-5 w-5 text-white/70 cursor-pointer hover:text-white" />
                  <SkipForward className="h-5 w-5 text-white/70 cursor-pointer hover:text-white" />
                  <div className="flex-1 h-1 bg-white/30 rounded-full">
                    <div className="h-full w-1/3 bg-primary rounded-full" />
                  </div>
                  <span className="text-sm text-white">8:24 / 25:00</span>
                  <Volume2 className="h-5 w-5 text-white/70 cursor-pointer hover:text-white" />
                  <Settings className="h-5 w-5 text-white/70 cursor-pointer hover:text-white" />
                  <Maximize className="h-5 w-5 text-white/70 cursor-pointer hover:text-white" />
                </div>
              </div>
            </div>

            {/* Lesson Title */}
            <div>
              <h1 className="text-2xl font-bold">{lesson.title[lang]}</h1>
            </div>

            {/* Tabs */}
            <div className="border-b flex gap-4">
              <button
                onClick={() => setActiveTab('content')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'content' 
                    ? 'border-primary text-primary font-medium' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                {isRTL ? 'محتوا' : 'Content'}
              </button>
              <button
                onClick={() => setActiveTab('practice')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'practice' 
                    ? 'border-primary text-primary font-medium' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Brain className="h-4 w-4 inline mr-2" />
                {isRTL ? 'تمرین مرحله‌ای' : 'Step Practice'}
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'quiz' 
                    ? 'border-primary text-primary font-medium' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <HelpCircle className="h-4 w-4 inline mr-2" />
                {isRTL ? 'آزمون' : 'Quiz'}
              </button>
              <button
                onClick={() => setActiveTab('discussion')}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'discussion' 
                    ? 'border-primary text-primary font-medium' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                {isRTL ? 'بحث' : 'Discussion'}
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-card border rounded-xl p-6">
              {activeTab === 'content' && (
                <div className="space-y-5">
                  {lesson.engagementActions?.length > 0 && (
                    <div className="rounded-lg border bg-primary/5 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        {isRTL ? 'دکمه‌های هدایت کارگاه' : 'Workshop Scaffolding Actions'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {lesson.engagementActions.map((action: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setActiveTab(action.tab)}
                            className="rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-muted"
                          >
                            {action.label[lang]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="prose dark:prose-invert max-w-none">
                    {lesson.content[lang].split('\n').map((line: string, idx: number) => {
                      if (line.startsWith('# ')) {
                        return <h1 key={idx} className="text-2xl font-bold mt-6 mb-4">{line.slice(2)}</h1>;
                      } else if (line.startsWith('## ')) {
                        return <h2 key={idx} className="text-xl font-semibold mt-5 mb-3">{line.slice(3)}</h2>;
                      } else if (line.startsWith('### ')) {
                        return <h3 key={idx} className="text-lg font-semibold mt-4 mb-2">{line.slice(4)}</h3>;
                      } else if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={idx} className="font-bold">{line.slice(2, -2)}</p>;
                      } else if (line.startsWith('- ')) {
                        return <p key={idx} className="my-1 ps-4">• {line.slice(2)}</p>;
                      } else if (line.trim()) {
                        return <p key={idx} className="my-2">{line}</p>;
                      }
                      return null;
                    })}
                  </div>

                  {aiLessonPack && (
                    <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                      <h3 className="text-lg font-semibold">
                        {isRTL ? 'Connected 5E Session Blueprint' : 'Connected 5E Session Blueprint'}
                      </h3>
                      <p className="text-sm text-muted-foreground">{aiLessonPack.termLabel[lang]}</p>

                      <div className="grid gap-3 md:grid-cols-5">
                        {fiveEConnectedStages.map((stage: any, idx: number) => (
                          <div key={stage.key} className="rounded-lg border bg-card p-3">
                            <p className="text-xs uppercase tracking-wide text-primary mb-1">{stage.label}</p>
                            <p className="text-xs text-muted-foreground mb-2">{stage.agenda}</p>
                            <p className="text-sm font-medium">{stage.output}</p>
                            {idx < fiveEConnectedStages.length - 1 && (
                              <p className="mt-2 text-xs text-muted-foreground">{isRTL ? '↓ انتقال به گام بعد' : '↓ handoff to next stage'}</p>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border bg-card p-3">
                          <p className="font-medium mb-2">{isRTL ? 'مواد و ابزار موردنیاز' : 'Required Materials'}</p>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {aiLessonPack.requiredMaterials[lang].map((item: string, idx: number) => (
                              <li key={idx}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-lg border bg-card p-3">
                          <p className="font-medium mb-2">{isRTL ? 'سخت‌افزار (در صورت نیاز)' : 'Hardware Kit (when applicable)'}</p>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {aiLessonPack.hardwareMaterials[lang].map((item: string, idx: number) => (
                              <li key={idx}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-lg border bg-card p-3 md:col-span-2">
                          <p className="font-medium mb-2">{isRTL ? 'برنامه زمانی دقیق کارگاه (120 دقیقه)' : '120-Minute Session Agenda'}</p>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {aiLessonPack.sessionAgenda[lang].map((item: string, idx: number) => (
                              <li key={idx}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-lg border bg-card p-3">
                          <p className="font-medium mb-2">{isRTL ? 'تحویل‌دادنی‌های جلسه' : 'Session Deliverables'}</p>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {aiLessonPack.deliverables[lang].map((item: string, idx: number) => (
                              <li key={idx}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-lg border bg-card p-3">
                          <p className="font-medium mb-2">{isRTL ? 'Rubric ارزیابی' : 'Assessment Rubric'}</p>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {aiLessonPack.assessmentRubric[lang].map((item: string, idx: number) => (
                              <li key={idx}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-lg border bg-card p-3">
                          <p className="font-medium mb-2">{isRTL ? 'راهنمای مدرس' : 'Facilitator Guide'}</p>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {aiLessonPack.facilitatorGuide[lang].map((item: string, idx: number) => (
                              <li key={idx}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-lg border bg-card p-3">
                          <p className="font-medium mb-2">{isRTL ? 'چالش‌های توسعه' : 'Extension Challenges'}</p>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {aiLessonPack.extensionChallenges[lang].map((item: string, idx: number) => (
                              <li key={idx}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'quiz' && (
                <div className="space-y-6">
                  {lesson.quiz.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {isRTL ? 'آزمونی برای این درس موجود نیست' : 'No quiz available for this lesson'}
                    </div>
                  ) : (
                    <>
                      {lesson.quiz.map((q: any, idx: number) => (
                        <div key={idx} className="space-y-3">
                          <h3 className="font-medium">
                            {idx + 1}. {q.question[lang]}
                          </h3>
                          <div className="space-y-2">
                            {q.options[lang].map((opt: string, optIdx: number) => (
                              <label
                                key={optIdx}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  quizSubmitted
                                    ? optIdx === q.correct
                                      ? 'bg-green-100 border-green-500 dark:bg-green-900/30'
                                      : quizAnswers[idx] === optIdx
                                        ? 'bg-red-100 border-red-500 dark:bg-red-900/30'
                                        : ''
                                    : quizAnswers[idx] === optIdx
                                      ? 'bg-primary/10 border-primary'
                                      : 'hover:bg-muted'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`q${idx}`}
                                  disabled={quizSubmitted}
                                  checked={quizAnswers[idx] === optIdx}
                                  onChange={() => setQuizAnswers(prev => ({ ...prev, [idx]: optIdx }))}
                                  className="h-4 w-4"
                                />
                                <span>{opt}</span>
                                {quizSubmitted && optIdx === q.correct && (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      {!quizSubmitted ? (
                        <button
                          onClick={handleQuizSubmit}
                          disabled={Object.keys(quizAnswers).length < lesson.quiz.length}
                          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
                        >
                          {isRTL ? 'ارسال پاسخ‌ها' : 'Submit Answers'}
                        </button>
                      ) : (
                        <div className="bg-muted rounded-lg p-4 text-center">
                          <p className="text-lg font-bold">
                            {isRTL ? 'نمره شما:' : 'Your Score:'} {getQuizScore()}%
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            +{Math.round((getQuizScore() / 100) * lesson.xp)} XP {isRTL ? 'کسب شد' : 'earned'}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'practice' && (
                <div className="space-y-6">
                  {aiLessonPack && (
                    <div className="rounded-lg border bg-primary/5 p-4">
                      <p className="font-medium mb-2">{isRTL ? 'کاربرگ تمرین جلسه' : 'Workshop Practice Workbook'}</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• {isRTL ? 'Task A: یک فرضیه قابل سنجش تعریف کنید.' : 'Task A: Define one testable hypothesis.'}</li>
                        <li>• {isRTL ? 'Task B: یک آزمایش سریع و کم‌هزینه اجرا کنید.' : 'Task B: Run one low-cost rapid experiment.'}</li>
                        <li>• {isRTL ? 'Task C: نتیجه را با KPI گزارش کنید.' : 'Task C: Report outcome using your KPI.'}</li>
                      </ul>
                    </div>
                  )}

                  {practiceQuestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {isRTL ? 'تمرینی برای این درس تعریف نشده است' : 'No practice defined for this lesson yet'}
                    </div>
                  ) : (
                    <>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="rounded-lg border p-3 bg-background">
                          <p className="text-xs text-muted-foreground">{isRTL ? 'گام ۱' : 'Step 1'}</p>
                          <p className="font-medium">{isRTL ? 'مشاهده محتوا' : 'Learn concept'}</p>
                        </div>
                        <div className="rounded-lg border p-3 bg-primary/5 border-primary/30">
                          <p className="text-xs text-muted-foreground">{isRTL ? 'گام ۲' : 'Step 2'}</p>
                          <p className="font-medium">{isRTL ? 'تمرین تعاملی' : 'Interactive practice'}</p>
                        </div>
                        <div className="rounded-lg border p-3 bg-background">
                          <p className="text-xs text-muted-foreground">{isRTL ? 'گام ۳' : 'Step 3'}</p>
                          <p className="font-medium">{isRTL ? 'تسلط و ادامه' : 'Master & continue'}</p>
                        </div>
                      </div>

                      <InteractivePractice
                        locale={locale}
                        questions={practiceQuestions}
                        skillName={lesson.title.en}
                        skillNameFA={lesson.title.fa}
                      />
                    </>
                  )}
                </div>
              )}

              {activeTab === 'discussion' && (
                <div className="space-y-4">
                  {lesson.discussionPrompts?.[lang]?.length > 0 && (
                    <div className="rounded-lg border bg-muted/40 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        {isRTL ? 'پرسش‌های راهنمای تسهیل‌گر' : 'Facilitator Scaffolding Prompts'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {lesson.discussionPrompts[lang].map((prompt: string, idx: number) => (
                          <span key={idx} className="rounded-full border bg-background px-3 py-1 text-xs">
                            {prompt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                      ع
                    </div>
                    <input
                      type="text"
                      value={discussionDraft}
                      onChange={(event) => setDiscussionDraft(event.target.value)}
                      placeholder={isRTL ? 'سوال یا نظر خود را بنویسید...' : 'Write your question or comment...'}
                      className="flex-1 h-10 px-4 rounded-lg border bg-background"
                    />
                    <button type="button" onClick={handleDiscussionSend} className="px-4 h-10 rounded-lg bg-primary text-primary-foreground">
                      {isRTL ? 'ارسال' : 'Send'}
                    </button>
                  </div>
                  
                  {/* Sample Discussion */}
                  <div className="space-y-4 mt-6">
                    {sampleDiscussion.map((discussionItem) => (
                    <div key={discussionItem.id} className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold">
                          س
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{discussionItem.author}</span>
                            <span className="text-xs text-muted-foreground">{discussionItem.time}</span>
                          </div>
                          <p className="text-sm mt-1">
                            {discussionItem.content}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <button type="button" onClick={() => handleDiscussionLike(discussionItem.id)} className="flex items-center gap-1 hover:text-primary">
                              <ThumbsUp className="h-4 w-4" />
                              {discussionLikes[discussionItem.id] ?? 0}
                            </button>
                            <button type="button" onClick={() => handleDiscussionReply(discussionItem.author)} className="hover:text-primary">{isRTL ? 'پاسخ' : 'Reply'}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Learning Objectives */}
            <div className="bg-card border rounded-xl p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-primary" />
                {isRTL ? 'اهداف یادگیری' : 'Learning Objectives'}
              </h3>
              <ul className="space-y-2">
                {lesson.objectives[lang].map((obj: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {obj}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tips */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-400">
                <Lightbulb className="h-5 w-5" />
                {isRTL ? 'نکته' : 'Tip'}
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {lesson.tip?.[lang] || (isRTL 
                  ? 'برای یادگیری بهتر، ویدیو را چند بار ببینید و سپس آزمون را حل کنید.'
                  : 'For better learning, watch the video multiple times and then take the quiz.')}
              </p>
            </div>

            {/* Navigation */}
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <h3 className="font-semibold">{isRTL ? 'ناوبری درس' : 'Lesson Navigation'}</h3>
              
              {lesson.prevLesson && (
                <Link
                  href={`/${locale}/courses/${id}/lessons/${lesson.prevLesson}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                >
                  {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  {isRTL ? 'درس قبلی' : 'Previous Lesson'}
                </Link>
              )}
              
              {lesson.nextLesson && (
                <Link
                  href={`/${locale}/courses/${id}/lessons/${lesson.nextLesson}`}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90"
                >
                  {isRTL ? 'درس بعدی' : 'Next Lesson'}
                  {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Link>
              )}
              
              {!lesson.nextLesson && (
                <Link
                  href={`/${locale}/courses/${id}`}
                  className="flex items-center justify-center w-full px-4 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {isRTL ? 'تکمیل درس' : 'Complete Lesson'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
