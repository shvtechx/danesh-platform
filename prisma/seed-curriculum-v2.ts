/**
 * Comprehensive K-12 Curriculum Seed - Version 2
 * Matches actual Prisma schema structure
 * Covers Iranian, IB, US Common Core, and British National Curriculum
 * Follows 5E/5ت Learning Cycle pedagogy
 */

import { 
  PrismaClient, 
  GradeBand, 
  QuestionType, 
  Difficulty, 
  BloomLevel 
} from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// SUBJECT DEFINITIONS
// ============================================================================

const SUBJECTS = [
  // Core Academic Subjects
  { 
    code: 'MATH', 
    name: 'Mathematics', 
    nameFA: 'ریاضیات',
    icon: '🔢',
    color: '#3B82F6',
    description: 'Mathematical reasoning, problem-solving, and computational skills'
  },
  { 
    code: 'SCI', 
    name: 'Science', 
    nameFA: 'علوم',
    icon: '🔬',
    color: '#10B981',
    description: 'Scientific inquiry, experimentation, and understanding of natural phenomena'
  },
  { 
    code: 'ENG', 
    name: 'English Language', 
    nameFA: 'زبان انگلیسی',
    icon: '📖',
    color: '#8B5CF6',
    description: 'English reading, writing, speaking, and listening skills'
  },
  { 
    code: 'PER_LIT', 
    name: 'Persian Literature', 
    nameFA: 'ادبیات فارسی',
    icon: '📜',
    color: '#EC4899',
    description: 'Persian language arts, poetry, and classical literature'
  },
  { 
    code: 'SOC', 
    name: 'Social Studies', 
    nameFA: 'مطالعات اجتماعی',
    icon: '🌍',
    color: '#F59E0B',
    description: 'History, geography, civics, and cultural studies'
  },
  
  // STEM & Technology
  { 
    code: 'CS', 
    name: 'Computer Science', 
    nameFA: 'علوم کامپیوتر',
    icon: '💻',
    color: '#06B6D4',
    description: 'Programming, algorithms, and computational thinking'
  },
  { 
    code: 'ROBOT', 
    name: 'Robotics', 
    nameFA: 'رباتیک',
    icon: '🤖',
    color: '#6366F1',
    description: 'Robot design, programming, and mechatronics'
  },
  { 
    code: 'AI', 
    name: 'Artificial Intelligence', 
    nameFA: 'هوش مصنوعی',
    icon: '🧠',
    color: '#8B5CF6',
    description: 'Machine learning, AI ethics, and intelligent systems'
  },
  
  // Practical Skills
  { 
    code: 'ENTREP', 
    name: 'Entrepreneurship', 
    nameFA: 'کارآفرینی',
    icon: '💡',
    color: '#F97316',
    description: 'Business skills, innovation, and project management'
  },
  
  // Arts & Humanities
  { 
    code: 'ART', 
    name: 'Visual Arts', 
    nameFA: 'هنرهای تجسمی',
    icon: '🎨',
    color: '#EF4444',
    description: 'Drawing, painting, sculpture, and visual design'
  },
  { 
    code: 'MUS', 
    name: 'Music', 
    nameFA: 'موسیقی',
    icon: '🎵',
    color: '#A855F7',
    description: 'Music theory, performance, and appreciation'
  },
  
  // Physical & Social-Emotional
  { 
    code: 'PE', 
    name: 'Physical Education', 
    nameFA: 'تربیت بدنی',
    icon: '⚽',
    color: '#14B8A6',
    description: 'Physical fitness, sports, and healthy living'
  },
  { 
    code: 'SEL', 
    name: 'Social-Emotional Learning', 
    nameFA: 'یادگیری اجتماعی-عاطفی',
    icon: '❤️',
    color: '#F43F5E',
    description: 'Emotional intelligence, relationships, and wellbeing'
  },
  { 
    code: 'ETHICS', 
    name: 'Ethics & Philosophy', 
    nameFA: 'اخلاق و فلسفه',
    icon: '⚖️',
    color: '#6B7280',
    description: 'Moral reasoning, philosophical thinking, and values education'
  }
];

// ============================================================================
// GRADE LEVEL STRUCTURE
// ============================================================================

const GRADE_LEVELS = [
  // EARLY_YEARS (KG - Grade 3)
  { code: 'KG', name: 'Kindergarten', nameFA: 'پیش‌دبستانی', gradeBand: GradeBand.EARLY_YEARS, order: 0 },
  { code: 'G1', name: 'Grade 1', nameFA: 'پایه اول', gradeBand: GradeBand.EARLY_YEARS, order: 1 },
  { code: 'G2', name: 'Grade 2', nameFA: 'پایه دوم', gradeBand: GradeBand.EARLY_YEARS, order: 2 },
  { code: 'G3', name: 'Grade 3', nameFA: 'پایه سوم', gradeBand: GradeBand.EARLY_YEARS, order: 3 },
  
  // PRIMARY (Grades 4-6)
  { code: 'G4', name: 'Grade 4', nameFA: 'پایه چهارم', gradeBand: GradeBand.PRIMARY, order: 4 },
  { code: 'G5', name: 'Grade 5', nameFA: 'پایه پنجم', gradeBand: GradeBand.PRIMARY, order: 5 },
  { code: 'G6', name: 'Grade 6', nameFA: 'پایه ششم', gradeBand: GradeBand.PRIMARY, order: 6 },
  
  // MIDDLE (Grades 7-9)
  { code: 'G7', name: 'Grade 7', nameFA: 'پایه هفتم', gradeBand: GradeBand.MIDDLE, order: 7 },
  { code: 'G8', name: 'Grade 8', nameFA: 'پایه هشتم', gradeBand: GradeBand.MIDDLE, order: 8 },
  { code: 'G9', name: 'Grade 9', nameFA: 'پایه نهم', gradeBand: GradeBand.MIDDLE, order: 9 },
  
  // SECONDARY (Grades 10-12)
  { code: 'G10', name: 'Grade 10', nameFA: 'پایه دهم', gradeBand: GradeBand.SECONDARY, order: 10 },
  { code: 'G11', name: 'Grade 11', nameFA: 'پایه یازدهم', gradeBand: GradeBand.SECONDARY, order: 11 },
  { code: 'G12', name: 'Grade 12', nameFA: 'پایه دوازدهم', gradeBand: GradeBand.SECONDARY, order: 12 }
];

// ============================================================================
// SAMPLE QUESTIONS - Following 5E Cycle
// ============================================================================

interface SampleQuestion {
  stem: string;
  stemFA: string;
  type: QuestionType;
  options?: { text: string; textFA: string; isCorrect: boolean; feedback: string; feedbackFA: string }[];
  explanation: string;
  explanationFA: string;
  difficulty: Difficulty;
  bloomLevel: BloomLevel;
  phase5E: '5E_ENGAGE' | '5E_EXPLORE' | '5E_EXPLAIN' | '5E_ELABORATE' | '5E_EVALUATE';
}

// Mathematics - Grade 1
const MATH_G1_QUESTIONS: SampleQuestion[] = [
  {
    stem: 'Look at this picture of 3 apples and 2 oranges. Which fruit has more?',
    stemFA: 'به این تصویر ۳ سیب و ۲ پرتقال نگاه کن. کدام میوه بیشتر است؟',
    type: QuestionType.MULTIPLE_CHOICE,
    options: [
      { text: 'Apples', textFA: 'سیب', isCorrect: true, feedback: 'Correct! 3 is more than 2.', feedbackFA: 'درست! ۳ بیشتر از ۲ است.' },
      { text: 'Oranges', textFA: 'پرتقال', isCorrect: false, feedback: 'Try counting again.', feedbackFA: 'دوباره بشمار.' },
      { text: 'They are equal', textFA: 'یکسان هستند', isCorrect: false, feedback: 'Count carefully.', feedbackFA: 'با دقت بشمار.' }
    ],
    explanation: 'When comparing numbers, we can use counting to see which is greater.',
    explanationFA: 'برای مقایسه اعداد، می‌توانیم از شمارش استفاده کنیم تا ببینیم کدام بزرگتر است.',
    difficulty: Difficulty.EASY,
    bloomLevel: BloomLevel.UNDERSTAND,
    phase5E: '5E_ENGAGE'
  },
  {
    stem: 'Use blocks to show the number 5. How many different ways can you group them?',
    stemFA: 'از مکعب‌ها برای نشان دادن عدد ۵ استفاده کن. چند روش مختلف می‌توانی آن‌ها را گروه‌بندی کنی؟',
    type: QuestionType.SHORT_ANSWER,
    explanation: 'We can make 5 using: 1+4, 2+3, 3+2, 4+1, or all 5 together. This shows number decomposition.',
    explanationFA: 'می‌توانیم ۵ را این‌طور بسازیم: ۱+۴، ۲+۳، ۳+۲، ۴+۱، یا همه ۵تا با هم. این تجزیه عدد را نشان می‌دهد.',
    difficulty: Difficulty.MEDIUM,
    bloomLevel: BloomLevel.APPLY,
    phase5E: '5E_EXPLORE'
  }
];

// Science - Grade 5
const SCI_G5_QUESTIONS: SampleQuestion[] = [
  {
    stem: 'What happens to water when it freezes? Choose all that apply.',
    stemFA: 'وقتی آب یخ می‌زند چه اتفاقی می‌افتد؟ همه موارد درست را انتخاب کن.',
    type: QuestionType.MULTIPLE_CHOICE,
    options: [
      { text: 'It becomes solid', textFA: 'جامد می‌شود', isCorrect: true, feedback: 'Yes! Ice is solid water.', feedbackFA: 'بله! یخ آب جامد است.' },
      { text: 'It disappears', textFA: 'ناپدید می‌شود', isCorrect: false, feedback: 'No, matter cannot disappear.', feedbackFA: 'نه، ماده نمی‌تواند ناپدید شود.' },
      { text: 'Its molecules slow down', textFA: 'مولکول‌هایش کندتر می‌شوند', isCorrect: true, feedback: 'Correct! Cold slows molecular motion.', feedbackFA: 'درست! سرما حرکت مولکولی را کند می‌کند.' }
    ],
    explanation: 'Freezing is a phase change from liquid to solid, where molecules lose energy and move slower.',
    explanationFA: 'یخ زدن یک تغییر فاز از مایع به جامد است، جایی که مولکول‌ها انرژی خود را از دست می‌دهند و کندتر حرکت می‌کنند.',
    difficulty: Difficulty.MEDIUM,
    bloomLevel: BloomLevel.UNDERSTAND,
    phase5E: '5E_EXPLAIN'
  }
];

// Robotics - Grade 9
const ROBOT_G9_QUESTIONS: SampleQuestion[] = [
  {
    stem: 'You need a robot to pick up objects of different sizes. Which sensor would be most helpful?',
    stemFA: 'به رباتی نیاز داری که اشیای با اندازه‌های مختلف را بردارد. کدام حسگر مفیدتر است؟',
    type: QuestionType.MULTIPLE_CHOICE,
    options: [
      { text: 'Ultrasonic distance sensor', textFA: 'حسگر فاصله‌سنج فراصوتی', isCorrect: true, feedback: 'Perfect! This measures object proximity and size.', feedbackFA: 'عالی! این نزدیکی و اندازه جسم را اندازه می‌گیرد.' },
      { text: 'Temperature sensor', textFA: 'حسگر دما', isCorrect: false, feedback: 'Temperature does not help with size detection.', feedbackFA: 'دما به تشخیص اندازه کمک نمی‌کند.' },
      { text: 'Light sensor', textFA: 'حسگر نور', isCorrect: false, feedback: 'Light sensors detect brightness, not dimensions.', feedbackFA: 'حسگرهای نور روشنایی را تشخیص می‌دهند، نه ابعاد را.' }
    ],
    explanation: 'Ultrasonic sensors emit sound waves and measure their reflection time to determine distance and object dimensions.',
    explanationFA: 'حسگرهای فراصوتی امواج صوتی منتشر می‌کنند و زمان بازتاب آن‌ها را برای تعیین فاصله و ابعاد جسم اندازه‌گیری می‌کنند.',
    difficulty: Difficulty.MEDIUM,
    bloomLevel: BloomLevel.APPLY,
    phase5E: '5E_ELABORATE'
  }
];

// AI - Grade 10
const AI_G10_QUESTIONS: SampleQuestion[] = [
  {
    stem: 'What is the main ethical concern with facial recognition technology?',
    stemFA: 'اصلی‌ترین نگرانی اخلاقی در مورد فناوری تشخیص چهره چیست؟',
    type: QuestionType.MULTIPLE_CHOICE,
    options: [
      { text: 'Privacy and surveillance', textFA: 'حریم خصوصی و نظارت', isCorrect: true, feedback: 'Yes! Facial recognition can enable mass surveillance and violate privacy.', feedbackFA: 'بله! تشخیص چهره می‌تواند نظارت گسترده را فعال کند و به حریم خصوصی لطمه بزند.' },
      { text: 'Processing speed', textFA: 'سرعت پردازش', isCorrect: false, feedback: 'Speed is a technical issue, not an ethical one.', feedbackFA: 'سرعت یک مسئله فنی است، نه اخلاقی.' },
      { text: 'Cost of cameras', textFA: 'هزینه دوربین‌ها', isCorrect: false, feedback: 'Cost is economic, not an ethical concern.', feedbackFA: 'هزینه اقتصادی است، نه نگرانی اخلاقی.' }
    ],
    explanation: 'AI ethics focuses on ensuring technology respects human rights, privacy, and autonomy.',
    explanationFA: 'اخلاق هوش مصنوعی بر اطمینان از احترام فناوری به حقوق بشر، حریم خصوصی و استقلال متمرکز است.',
    difficulty: Difficulty.MEDIUM,
    bloomLevel: BloomLevel.EVALUATE,
    phase5E: '5E_EVALUATE'
  }
];

// Entrepreneurship - Grade 11
const ENTREP_G11_QUESTIONS: SampleQuestion[] = [
  {
    stem: 'What is the primary purpose of a business model canvas?',
    stemFA: 'هدف اصلی بوم مدل کسب‌وکار چیست؟',
    type: QuestionType.MULTIPLE_CHOICE,
    options: [
      { text: 'To visualize how a business creates and delivers value', textFA: 'تجسم چگونگی ایجاد و ارائه ارزش توسط کسب‌وکار', isCorrect: true, feedback: 'Exactly! It maps out all key aspects of the business.', feedbackFA: 'دقیقاً! تمام جنبه‌های کلیدی کسب‌وکار را نقشه‌برداری می‌کند.' },
      { text: 'To calculate exact profits', textFA: 'محاسبه سود دقیق', isCorrect: false, feedback: 'That is the role of financial statements.', feedbackFA: 'آن نقش صورت‌های مالی است.' },
      { text: 'To replace a full business plan', textFA: 'جایگزینی برنامه کامل کسب‌وکار', isCorrect: false, feedback: 'It complements but does not replace a business plan.', feedbackFA: 'مکمل است اما جایگزین برنامه کسب‌وکار نمی‌شود.' }
    ],
    explanation: 'A business model canvas is a strategic tool that provides a one-page overview of a business structure.',
    explanationFA: 'بوم مدل کسب‌وکار ابزار استراتژیک است که نمای کلی یک صفحه‌ای از ساختار کسب‌وکار ارائه می‌دهد.',
    difficulty: Difficulty.MEDIUM,
    bloomLevel: BloomLevel.UNDERSTAND,
    phase5E: '5E_EXPLAIN'
  }
];

// English - Grade 3
const ENG_G3_QUESTIONS: SampleQuestion[] = [
  {
    stem: 'Which sentence uses the correct verb tense?',
    stemFA: 'کدام جمله زمان فعل درست را استفاده می‌کند؟',
    type: QuestionType.MULTIPLE_CHOICE,
    options: [
      { text: 'She walks to school every day', textFA: 'او هر روز به مدرسه می‌رود', isCorrect: true, feedback: 'Correct! Present tense for habitual actions.', feedbackFA: 'درست! زمان حال برای اعمال عادتی.' },
      { text: 'She walk to school every day', textFA: 'او رفتن به مدرسه هر روز', isCorrect: false, feedback: 'The verb needs an "s" for third person singular.', feedbackFA: 'فعل برای سوم شخص مفرد به "s" نیاز دارد.' },
      { text: 'She walking to school every day', textFA: 'او دارد رفتن به مدرسه هر روز', isCorrect: false, feedback: 'This is present continuous, not simple present.', feedbackFA: 'این زمان حال استمراری است، نه حال ساده.' }
    ],
    explanation: 'For habitual actions in English, we use simple present tense with third person singular ending in -s.',
    explanationFA: 'برای اعمال عادتی در انگلیسی، از زمان حال ساده با پایان سوم شخص مفرد -s استفاده می‌کنیم.',
    difficulty: Difficulty.EASY,
    bloomLevel: BloomLevel.APPLY,
    phase5E: '5E_EXPLAIN'
  },
  {
    stem: 'Read this sentence: "The happy dog ran quickly." What type of word is "quickly"?',
    stemFA: 'این جمله را بخوان: "سگ خوشحال سریع دوید." کلمه "quickly" چه نوع کلمه‌ای است؟',
    type: QuestionType.MULTIPLE_CHOICE,
    options: [
      { text: 'Adverb', textFA: 'قید', isCorrect: true, feedback: 'Yes! Adverbs describe how an action happens.', feedbackFA: 'بله! قیدها توصیف می‌کنند چگونه یک عمل اتفاق می‌افتد.' },
      { text: 'Adjective', textFA: 'صفت', isCorrect: false, feedback: 'Adjectives describe nouns, not verbs.', feedbackFA: 'صفت‌ها اسم را توصیف می‌کنند، نه فعل را.' },
      { text: 'Verb', textFA: 'فعل', isCorrect: false, feedback: 'The verb in this sentence is "ran".', feedbackFA: 'فعل در این جمله "ran" است.' }
    ],
    explanation: 'Adverbs modify verbs and often end in -ly. They tell us how, when, where, or to what extent.',
    explanationFA: 'قیدها فعل را تغییر می‌دهند و اغلب به -ly ختم می‌شوند. آن‌ها به ما می‌گویند چگونه، کی، کجا یا تا چه حد.',
    difficulty: Difficulty.MEDIUM,
    bloomLevel: BloomLevel.UNDERSTAND,
    phase5E: '5E_EVALUATE'
  }
];

// Computer Science - Grade 6
const CS_G6_QUESTIONS: SampleQuestion[] = [
  {
    stem: 'What is an algorithm?',
    stemFA: 'الگوریتم چیست؟',
    type: QuestionType.MULTIPLE_CHOICE,
    options: [
      { text: 'A step-by-step set of instructions to solve a problem', textFA: 'مجموعه دستورالعمل‌های گام‌به‌گام برای حل یک مسئله', isCorrect: true, feedback: 'Perfect! Algorithms are like recipes for computers.', feedbackFA: 'عالی! الگوریتم‌ها مانند دستورالعمل‌های آشپزی برای کامپیوترها هستند.' },
      { text: 'A programming language', textFA: 'یک زبان برنامه‌نویسی', isCorrect: false, feedback: 'That\'s different - languages express algorithms.', feedbackFA: 'آن متفاوت است - زبان‌ها الگوریتم‌ها را بیان می‌کنند.' },
      { text: 'A type of computer hardware', textFA: 'نوعی سخت‌افزار کامپیوتر', isCorrect: false, feedback: 'Algorithms are logical, not physical.', feedbackFA: 'الگوریتم‌ها منطقی هستند، نه فیزیکی.' }
    ],
    explanation: 'An algorithm is a precise sequence of instructions to accomplish a task, like a recipe or assembly instructions.',
    explanationFA: 'الگوریتم توالی دقیق دستورالعمل‌ها برای انجام یک کار است، مانند یک دستور پخت یا دستورالعمل مونتاژ.',
    difficulty: Difficulty.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    phase5E: '5E_ENGAGE'
  },
  {
    stem: 'Write an algorithm to make a peanut butter and jelly sandwich. List at least 5 steps.',
    stemFA: 'الگوریتمی برای درست کردن ساندویچ کره بادام‌زمینی و مربا بنویس. حداقل ۵ مرحله فهرست کن.',
    type: QuestionType.SHORT_ANSWER,
    explanation: 'Example: 1) Get two slices of bread, 2) Open peanut butter jar, 3) Spread peanut butter on one slice, 4) Open jelly jar, 5) Spread jelly on other slice, 6) Put slices together. Good algorithms are clear and complete!',
    explanationFA: 'مثال: ۱) دو تکه نان بگیر، ۲) شیشه کره بادام‌زمینی را باز کن، ۳) کره بادام‌زمینی را روی یک تکه بمال، ۴) شیشه مربا را باز کن، ۵) مربا را روی تکه دیگر بمال، ۶) تکه‌ها را کنار هم بگذار. الگوریتم‌های خوب واضح و کامل هستند!',
    difficulty: Difficulty.MEDIUM,
    bloomLevel: BloomLevel.APPLY,
    phase5E: '5E_EXPLORE'
  }
];

// Social Studies - Grade 7
const SOC_G7_QUESTIONS: SampleQuestion[] = [
  {
    stem: 'Why did ancient civilizations often develop near rivers?',
    stemFA: 'چرا تمدن‌های باستانی اغلب نزدیک رودخانه‌ها توسعه می‌یافتند؟',
    type: QuestionType.MULTIPLE_CHOICE,
    options: [
      { text: 'Rivers provided water for drinking, farming, and transportation', textFA: 'رودخانه‌ها آب برای نوشیدن، کشاورزی و حمل‌ونقل فراهم می‌کردند', isCorrect: true, feedback: 'Exactly! Rivers were essential for survival and trade.', feedbackFA: 'دقیقاً! رودخانه‌ها برای بقا و تجارت ضروری بودند.' },
      { text: 'Rivers had gold and precious metals', textFA: 'رودخانه‌ها طلا و فلزات گرانبها داشتند', isCorrect: false, feedback: 'While some did, this wasn\'t the main reason.', feedbackFA: 'در حالی که برخی داشتند، این دلیل اصلی نبود.' },
      { text: 'Rivers protected them from enemies', textFA: 'رودخانه‌ها آن‌ها را از دشمنان محافظت می‌کردند', isCorrect: false, feedback: 'Rivers could be crossed; water supply was more important.', feedbackFA: 'رودخانه‌ها قابل عبور بودند؛ تأمین آب مهم‌تر بود.' }
    ],
    explanation: 'The Nile, Tigris-Euphrates, Indus, and Yellow River civilizations all thrived because rivers enabled agriculture and commerce.',
    explanationFA: 'تمدن‌های نیل، دجله-فرات، سند و رود زرد همگی رونق یافتند زیرا رودخانه‌ها کشاورزی و تجارت را ممکن می‌کردند.',
    difficulty: Difficulty.MEDIUM,
    bloomLevel: BloomLevel.UNDERSTAND,
    phase5E: '5E_EXPLAIN'
  }
];

// Persian Literature - Grade 8
const PER_LIT_G8_QUESTIONS: SampleQuestion[] = [
  {
    stem: 'Who is known as the "Master of Persian Poetry" and wrote the Shahnameh?',
    stemFA: 'چه کسی به عنوان "استاد شعر فارسی" شناخته می‌شود و شاهنامه را نوشت؟',
    type: QuestionType.MULTIPLE_CHOICE,
    options: [
      { text: 'Ferdowsi', textFA: 'فردوسی', isCorrect: true, feedback: 'Correct! Ferdowsi spent 30 years writing the epic Shahnameh.', feedbackFA: 'درست! فردوسی ۳۰ سال صرف نوشتن حماسه شاهنامه کرد.' },
      { text: 'Hafez', textFA: 'حافظ', isCorrect: false, feedback: 'Hafez is famous for ghazals (lyric poetry), not epic poetry.', feedbackFA: 'حافظ برای غزل معروف است، نه شعر حماسی.' },
      { text: 'Rumi', textFA: 'مولانا', isCorrect: false, feedback: 'Rumi wrote mystical poetry (Masnavi), not historical epics.', feedbackFA: 'مولانا شعر عرفانی (مثنوی) نوشت، نه حماسه تاریخی.' }
    ],
    explanation: 'Ferdowsi (940-1020 CE) preserved Persian language and culture through the 60,000-verse Shahnameh, the Book of Kings.',
    explanationFA: 'فردوسی (۹۴۰-۱۰۲۰ میلادی) زبان و فرهنگ فارسی را از طریق شاهنامه ۶۰ هزار بیتی، کتاب پادشاهان، حفظ کرد.',
    difficulty: Difficulty.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    phase5E: '5E_ENGAGE'
  }
];

// Physical Education - Grade 4
const PE_G4_QUESTIONS: SampleQuestion[] = [
  {
    stem: 'What should you do before exercising?',
    stemFA: 'قبل از ورزش چه باید بکنی؟',
    type: QuestionType.MULTIPLE_CHOICE,
    options: [
      { text: 'Warm up with light stretching and movement', textFA: 'با کشش ملایم و حرکت گرم کردن', isCorrect: true, feedback: 'Great! Warming up prevents injuries and prepares your body.', feedbackFA: 'عالی! گرم کردن از آسیب جلوگیری می‌کند و بدنت را آماده می‌کند.' },
      { text: 'Eat a large meal', textFA: 'یک وعده غذایی بزرگ بخور', isCorrect: false, feedback: 'A large meal can make you feel sluggish during exercise.', feedbackFA: 'یک وعده غذایی بزرگ می‌تواند احساس سستی در حین ورزش ایجاد کند.' },
      { text: 'Skip warm-up to save time', textFA: 'گرم کردن را برای صرفه‌جویی در وقت رد کن', isCorrect: false, feedback: 'Skipping warm-up increases injury risk.', feedbackFA: 'رد کردن گرم کردن خطر آسیب را افزایش می‌دهد.' }
    ],
    explanation: 'Warming up gradually increases heart rate and blood flow to muscles, reducing the risk of strains and sprains.',
    explanationFA: 'گرم کردن به تدریج ضربان قلب و جریان خون به عضلات را افزایش می‌دهد و خطر کشیدگی و پیچ خوردگی را کاهش می‌دهد.',
    difficulty: Difficulty.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    phase5E: '5E_ENGAGE'
  }
];

// Social-Emotional Learning - Grade 5
const SEL_G5_QUESTIONS: SampleQuestion[] = [
  {
    stem: 'Your friend is upset because they lost a game. What is the best way to show empathy?',
    stemFA: 'دوستت ناراحت است چون در یک بازی باخت. بهترین راه برای نشان دادن همدلی چیست؟',
    type: QuestionType.MULTIPLE_CHOICE,
    options: [
      { text: 'Listen and say "I understand it feels bad to lose"', textFA: 'گوش بده و بگو "می‌فهمم که باختن احساس بدی دارد"', isCorrect: true, feedback: 'Perfect! Acknowledging their feelings shows you care.', feedbackFA: 'عالی! قبول کردن احساساتشان نشان می‌دهد که اهمیت می‌دهی.' },
      { text: 'Tell them "It\'s just a game, get over it"', textFA: 'بهشون بگو "این فقط یک بازی است، فراموشش کن"', isCorrect: false, feedback: 'This dismisses their feelings and isn\'t empathetic.', feedbackFA: 'این احساساتشان را نادیده می‌گیرد و همدلانه نیست.' },
      { text: 'Ignore them until they feel better', textFA: 'نادیده‌شان بگیر تا احساس بهتری پیدا کنند', isCorrect: false, feedback: 'People need support when they\'re upset.', feedbackFA: 'وقتی ناراحت هستند به حمایت نیاز دارند.' }
    ],
    explanation: 'Empathy means understanding and sharing another person\'s feelings. Active listening and validation are key.',
    explanationFA: 'همدلی یعنی درک و اشتراک احساسات دیگران. گوش دادن فعال و تأیید کلیدی هستند.',
    difficulty: Difficulty.MEDIUM,
    bloomLevel: BloomLevel.APPLY,
    phase5E: '5E_EXPLORE'
  }
];

// Visual Arts - Grade 6
const ART_G6_QUESTIONS: SampleQuestion[] = [
  {
    stem: 'What are primary colors?',
    stemFA: 'رنگ‌های اولیه چیستند؟',
    type: QuestionType.MULTIPLE_CHOICE,
    options: [
      { text: 'Red, blue, and yellow', textFA: 'قرمز، آبی و زرد', isCorrect: true, feedback: 'Correct! Primary colors cannot be made by mixing other colors.', feedbackFA: 'درست! رنگ‌های اولیه را نمی‌توان با مخلوط کردن رنگ‌های دیگر ساخت.' },
      { text: 'Red, green, and blue', textFA: 'قرمز، سبز و آبی', isCorrect: false, feedback: 'Those are primary colors for light, not paint.', feedbackFA: 'آن‌ها رنگ‌های اولیه نور هستند، نه رنگ.' },
      { text: 'Orange, purple, and green', textFA: 'نارنجی، بنفش و سبز', isCorrect: false, feedback: 'Those are secondary colors, made by mixing primaries.', feedbackFA: 'آن‌ها رنگ‌های ثانویه هستند که با مخلوط اولیه‌ها ساخته می‌شوند.' }
    ],
    explanation: 'In traditional color theory for painting, red + blue = purple, blue + yellow = green, red + yellow = orange.',
    explanationFA: 'در نظریه رنگ سنتی برای نقاشی، قرمز + آبی = بنفش، آبی + زرد = سبز، قرمز + زرد = نارنجی.',
    difficulty: Difficulty.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    phase5E: '5E_ENGAGE'
  }
];

// Ethics & Philosophy - Grade 10
const ETHICS_G10_QUESTIONS: SampleQuestion[] = [
  {
    stem: 'A self-driving car must choose: swerve left and hit one pedestrian, or continue straight and hit five pedestrians. What ethical framework helps analyze this dilemma?',
    stemFA: 'یک خودروی خودران باید انتخاب کند: به چپ بپیچد و به یک عابر بزند، یا مستقیم برود و به پنج عابر بزند. کدام چارچوب اخلاقی به تحلیل این معضل کمک می‌کند؟',
    type: QuestionType.MULTIPLE_CHOICE,
    options: [
      { text: 'Utilitarianism (minimize total harm)', textFA: 'سودگرایی (به حداقل رساندن آسیب کل)', isCorrect: true, feedback: 'Yes! Utilitarianism seeks the greatest good for the greatest number.', feedbackFA: 'بله! سودگرایی بزرگترین خیر را برای بیشترین تعداد می‌جوید.' },
      { text: 'Deontological ethics (follow rules)', textFA: 'اخلاق وظیفه‌گرا (پیروی از قوانین)', isCorrect: false, feedback: 'Deontology focuses on duty, not outcomes - it might say "never intentionally harm."', feedbackFA: 'وظیفه‌گرایی بر وظیفه تمرکز دارد نه نتایج - ممکن است بگوید "هرگز عمداً آسیب نرسان."' },
      { text: 'Virtue ethics (cultivate good character)', textFA: 'اخلاق فضیلت (پرورش شخصیت خوب)', isCorrect: false, feedback: 'Virtue ethics asks "What would a virtuous person do?" - less clear in this scenario.', feedbackFA: 'اخلاق فضیلت می‌پرسد "فرد با فضیلت چه می‌کرد؟" - در این سناریو واضح‌تر نیست.' }
    ],
    explanation: 'The "trolley problem" is a classic thought experiment in ethics. Different frameworks (utilitarian, deontological, virtue) give different answers.',
    explanationFA: 'مسئله "ترولی" یک آزمایش فکری کلاسیک در اخلاق است. چارچوب‌های مختلف (سودگرا، وظیفه‌گرا، فضیلت) پاسخ‌های متفاوتی می‌دهند.',
    difficulty: Difficulty.HARD,
    bloomLevel: BloomLevel.ANALYZE,
    phase5E: '5E_EVALUATE'
  }
];

// ============================================================================
// SEEDING FUNCTIONS
// ============================================================================

async function seedSubjects() {
  console.log('🌱 Seeding subjects...');
  
  for (const subject of SUBJECTS) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: subject,
      create: subject
    });
    console.log(`  ✓ ${subject.name} (${subject.code})`);
  }
}

async function seedGradeLevels() {
  console.log('🌱 Seeding grade levels...');
  
  for (const grade of GRADE_LEVELS) {
    await prisma.gradeLevel.upsert({
      where: { code: grade.code },
      update: grade,
      create: grade
    });
    console.log(`  ✓ ${grade.name} (${grade.code})`);
  }
}

async function seedQuestions() {
  console.log('🌱 Seeding sample questions...');
  
  // Helper function to create questions
  async function createQuestionsForSubject(
    subjectCode: string, 
    gradeCode: string, 
    questions: SampleQuestion[]
  ) {
    const subject = await prisma.subject.findUnique({ where: { code: subjectCode } });
    const gradeLevel = await prisma.gradeLevel.findUnique({ where: { code: gradeCode } });
    
    if (!subject || !gradeLevel) {
      console.log(`  ⚠️  Skipping ${subjectCode} ${gradeCode} - not found`);
      return;
    }
    
    for (const q of questions) {
      const questionData: any = {
        type: q.type,
        stem: q.stem,
        stemFA: q.stemFA,
        explanation: q.explanation,
        explanationFA: q.explanationFA,
        difficulty: q.difficulty,
        bloomLevel: q.bloomLevel,
        gradeLevel: {
          connect: { id: gradeLevel.id }
        },
        metadata: {
          phase5E: q.phase5E,
          subjectCode: subjectCode
        }
      };
      
      // Create the question
      const createdQuestion = await prisma.question.create({
        data: questionData
      });
      
      // Create options if it's a multiple choice question
      if (q.options && q.type === QuestionType.MULTIPLE_CHOICE) {
        for (let i = 0; i < q.options.length; i++) {
          await prisma.questionOption.create({
            data: {
              questionId: createdQuestion.id,
              text: q.options[i].text,
              textFA: q.options[i].textFA,
              isCorrect: q.options[i].isCorrect,
              feedback: q.options[i].feedback,
              feedbackFA: q.options[i].feedbackFA,
              order: i
            }
          });
        }
      }
      
      console.log(`  ✓ Created question for ${subjectCode} ${gradeCode} - ${q.phase5E}`);
    }
  }
  
  // Seed questions for each subject
  await createQuestionsForSubject('MATH', 'G1', MATH_G1_QUESTIONS);
  await createQuestionsForSubject('SCI', 'G5', SCI_G5_QUESTIONS);
  await createQuestionsForSubject('ROBOT', 'G9', ROBOT_G9_QUESTIONS);
  await createQuestionsForSubject('AI', 'G10', AI_G10_QUESTIONS);
  await createQuestionsForSubject('ENTREP', 'G11', ENTREP_G11_QUESTIONS);
  await createQuestionsForSubject('ENG', 'G3', ENG_G3_QUESTIONS);
  await createQuestionsForSubject('CS', 'G6', CS_G6_QUESTIONS);
  await createQuestionsForSubject('SOC', 'G7', SOC_G7_QUESTIONS);
  await createQuestionsForSubject('PER_LIT', 'G8', PER_LIT_G8_QUESTIONS);
  await createQuestionsForSubject('PE', 'G4', PE_G4_QUESTIONS);
  await createQuestionsForSubject('SEL', 'G5', SEL_G5_QUESTIONS);
  await createQuestionsForSubject('ART', 'G6', ART_G6_QUESTIONS);
  await createQuestionsForSubject('ETHICS', 'G10', ETHICS_G10_QUESTIONS);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    console.log('🚀 Starting curriculum seed...\n');
    
    await seedSubjects();
    console.log();
    
    await seedGradeLevels();
    console.log();
    
    await seedQuestions();
    console.log();
    
    console.log('✅ Curriculum seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${SUBJECTS.length} subjects`);
    console.log(`   - ${GRADE_LEVELS.length} grade levels`);
    const totalQuestions = MATH_G1_QUESTIONS.length + SCI_G5_QUESTIONS.length + 
      ROBOT_G9_QUESTIONS.length + AI_G10_QUESTIONS.length + ENTREP_G11_QUESTIONS.length +
      ENG_G3_QUESTIONS.length + CS_G6_QUESTIONS.length + SOC_G7_QUESTIONS.length +
      PER_LIT_G8_QUESTIONS.length + PE_G4_QUESTIONS.length + SEL_G5_QUESTIONS.length +
      ART_G6_QUESTIONS.length + ETHICS_G10_QUESTIONS.length;
    console.log(`   - ${totalQuestions} sample questions across ${13} subjects`);
    console.log(`   - Coverage: All 5E phases (Engage, Explore, Explain, Elaborate, Evaluate)`);
    console.log(`   - Bilingual support: English and Persian`);
    console.log(`\n🎯 Next: Add more questions per subject/grade to reach MVP goal!`);
    
  } catch (error) {
    console.error('❌ Error seeding curriculum:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
