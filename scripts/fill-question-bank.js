const {
  PrismaClient,
  GradeBand,
  QuestionType,
  Difficulty,
  BloomLevel,
} = require('@prisma/client');

const prisma = new PrismaClient();

const PHASE_SEQUENCE = [
  '5E_ENGAGE',
  '5E_EXPLORE',
  '5E_EXPLAIN',
  '5E_ELABORATE',
  '5E_EVALUATE',
  '5E_EXPLORE',
  '5E_EXPLAIN',
  '5E_ELABORATE',
  '5E_EVALUATE',
  '5E_EXPLAIN',
];

const IRT_SEQUENCE = [-2.1, -1.4, -0.9, -0.3, 0.1, 0.5, 0.9, 1.3, 1.7, 2.1];
const DIFFICULTY_SEQUENCE = [
  Difficulty.EASY,
  Difficulty.EASY,
  Difficulty.EASY,
  Difficulty.MEDIUM,
  Difficulty.MEDIUM,
  Difficulty.MEDIUM,
  Difficulty.MEDIUM,
  Difficulty.HARD,
  Difficulty.HARD,
  Difficulty.HARD,
];
const BLOOM_SEQUENCE = [
  BloomLevel.REMEMBER,
  BloomLevel.UNDERSTAND,
  BloomLevel.APPLY,
  BloomLevel.UNDERSTAND,
  BloomLevel.APPLY,
  BloomLevel.ANALYZE,
  BloomLevel.APPLY,
  BloomLevel.ANALYZE,
  BloomLevel.EVALUATE,
  BloomLevel.CREATE,
];

const SUBJECTS = [
  { code: 'MATH', name: 'Mathematics', nameFA: 'ریاضیات', icon: '🔢', color: '#3B82F6', description: 'Mathematical reasoning and problem solving' },
  { code: 'SCI', name: 'Science', nameFA: 'علوم', icon: '🔬', color: '#10B981', description: 'Scientific inquiry and understanding of natural phenomena' },
  { code: 'ENG', name: 'English Language', nameFA: 'زبان انگلیسی', icon: '📖', color: '#8B5CF6', description: 'English literacy and communication' },
  { code: 'CS', name: 'Computer Science', nameFA: 'علوم کامپیوتر', icon: '💻', color: '#06B6D4', description: 'Algorithms and computational thinking' },
  { code: 'AI', name: 'Artificial Intelligence', nameFA: 'هوش مصنوعی', icon: '🧠', color: '#8B5CF6', description: 'AI literacy and ethics' },
  { code: 'ROBOT', name: 'Robotics', nameFA: 'رباتیک', icon: '🤖', color: '#6366F1', description: 'Robotics design and control systems' },
  { code: 'SOC', name: 'Social Studies', nameFA: 'مطالعات اجتماعی', icon: '🌍', color: '#F59E0B', description: 'Civics, geography, and culture' },
];

const STRANDS = [
  { subjectCode: 'MATH', code: 'FOUNDATIONS', name: 'Math Foundations', nameFA: 'مبانی ریاضی', order: 1 },
  { subjectCode: 'SCI', code: 'INQUIRY', name: 'Scientific Inquiry', nameFA: 'کاوش علمی', order: 1 },
  { subjectCode: 'ENG', code: 'LITERACY', name: 'Literacy', nameFA: 'سواد زبانی', order: 1 },
  { subjectCode: 'CS', code: 'COMP_THINK', name: 'Computational Thinking', nameFA: 'تفکر محاسباتی', order: 1 },
  { subjectCode: 'AI', code: 'AI_LITERACY', name: 'AI Literacy', nameFA: 'سواد هوش مصنوعی', order: 1 },
  { subjectCode: 'ROBOT', code: 'ROBOT_SYSTEMS', name: 'Robot Systems', nameFA: 'سامانه‌های رباتیک', order: 1 },
  { subjectCode: 'SOC', code: 'CIVICS_GEO', name: 'Civics and Geography', nameFA: 'مدنی و جغرافیا', order: 1 },
];

const GRADE_LEVELS = [
  { code: 'KG', name: 'Kindergarten', nameFA: 'پیش‌دبستانی', order: 0, gradeBand: GradeBand.EARLY_YEARS },
  { code: 'G1', name: 'Grade 1', nameFA: 'پایه اول', order: 1, gradeBand: GradeBand.EARLY_YEARS },
  { code: 'G2', name: 'Grade 2', nameFA: 'پایه دوم', order: 2, gradeBand: GradeBand.EARLY_YEARS },
  { code: 'G3', name: 'Grade 3', nameFA: 'پایه سوم', order: 3, gradeBand: GradeBand.EARLY_YEARS },
  { code: 'G4', name: 'Grade 4', nameFA: 'پایه چهارم', order: 4, gradeBand: GradeBand.PRIMARY },
  { code: 'G5', name: 'Grade 5', nameFA: 'پایه پنجم', order: 5, gradeBand: GradeBand.PRIMARY },
  { code: 'G6', name: 'Grade 6', nameFA: 'پایه ششم', order: 6, gradeBand: GradeBand.PRIMARY },
  { code: 'G7', name: 'Grade 7', nameFA: 'پایه هفتم', order: 7, gradeBand: GradeBand.MIDDLE },
  { code: 'G8', name: 'Grade 8', nameFA: 'پایه هشتم', order: 8, gradeBand: GradeBand.MIDDLE },
  { code: 'G9', name: 'Grade 9', nameFA: 'پایه نهم', order: 9, gradeBand: GradeBand.MIDDLE },
  { code: 'G10', name: 'Grade 10', nameFA: 'پایه دهم', order: 10, gradeBand: GradeBand.SECONDARY },
  { code: 'G11', name: 'Grade 11', nameFA: 'پایه یازدهم', order: 11, gradeBand: GradeBand.SECONDARY },
  { code: 'G12', name: 'Grade 12', nameFA: 'پایه دوازدهم', order: 12, gradeBand: GradeBand.SECONDARY },
];

const SKILL_DEFINITIONS = [
  { code: 'MATH_ADD_WITHIN_20', subjectCode: 'MATH', strandCode: 'FOUNDATIONS', gradeCode: 'G1', name: 'Addition within 20', nameFA: 'جمع تا ۲۰', description: 'Add numbers within 20 using counting and decomposition strategies', descriptionFA: 'جمع اعداد تا ۲۰ با استفاده از شمارش و تجزیه', order: 1 },
  { code: 'MATH_PLACE_VALUE_3_DIGIT', subjectCode: 'MATH', strandCode: 'FOUNDATIONS', gradeCode: 'G2', name: 'Three-Digit Place Value', nameFA: 'ارزش مکانی سه‌رقمی', description: 'Interpret hundreds, tens, and ones in three-digit numbers', descriptionFA: 'درک صدگان، دهگان و یکان در اعداد سه‌رقمی', order: 2 },
  { code: 'MATH_MULTIPLICATION_FACTS', subjectCode: 'MATH', strandCode: 'FOUNDATIONS', gradeCode: 'G3', name: 'Multiplication Facts', nameFA: 'واقعیت‌های ضرب', description: 'Use arrays, equal groups, and facts through 10×10', descriptionFA: 'استفاده از آرایه‌ها، گروه‌های مساوی و جدول ضرب تا ۱۰×۱۰', order: 3 },
  { code: 'MATH_EQUIVALENT_FRACTIONS', subjectCode: 'MATH', strandCode: 'FOUNDATIONS', gradeCode: 'G4', name: 'Equivalent Fractions', nameFA: 'کسرهای معادل', description: 'Recognize and generate equivalent fractions', descriptionFA: 'تشخیص و ساخت کسرهای معادل', order: 4 },
  { code: 'MATH_DECIMALS_PLACE_VALUE', subjectCode: 'MATH', strandCode: 'FOUNDATIONS', gradeCode: 'G5', name: 'Decimal Place Value', nameFA: 'ارزش مکانی اعشار', description: 'Interpret tenths and hundredths in decimal numbers', descriptionFA: 'درک دهم‌ها و صدم‌ها در اعداد اعشاری', order: 5 },
  { code: 'MATH_ONE_STEP_EQUATIONS', subjectCode: 'MATH', strandCode: 'FOUNDATIONS', gradeCode: 'G7', name: 'One-Step Equations', nameFA: 'معادله‌های یک‌مرحله‌ای', description: 'Solve one-step equations using inverse operations', descriptionFA: 'حل معادله‌های یک‌مرحله‌ای با عملیات معکوس', order: 6 },
  { code: 'MATH_PROPORTIONAL_RELATIONSHIPS', subjectCode: 'MATH', strandCode: 'FOUNDATIONS', gradeCode: 'G8', name: 'Proportional Relationships', nameFA: 'رابطه‌های تناسبی', description: 'Reason about unit rates and proportional situations', descriptionFA: 'استدلال درباره نرخ واحد و موقعیت‌های تناسبی', order: 7 },
  { code: 'MATH_QUADRATIC_FACTORING', subjectCode: 'MATH', strandCode: 'FOUNDATIONS', gradeCode: 'G10', name: 'Factoring Quadratics', nameFA: 'تجزیه عبارت‌های درجه دوم', description: 'Factor simple quadratic expressions into binomials', descriptionFA: 'تجزیه عبارت‌های درجه دوم ساده به دو جمله‌ای‌ها', order: 8 },
  { code: 'SCI_STATES_OF_MATTER', subjectCode: 'SCI', strandCode: 'INQUIRY', gradeCode: 'G4', name: 'States of Matter', nameFA: 'حالت‌های ماده', description: 'Explain solids, liquids, gases, and changes of state', descriptionFA: 'توضیح جامد، مایع، گاز و تغییر حالت', order: 9 },
  { code: 'SCI_ECOSYSTEMS', subjectCode: 'SCI', strandCode: 'INQUIRY', gradeCode: 'G5', name: 'Ecosystems and Food Webs', nameFA: 'بوم‌سازگان و شبکه غذایی', description: 'Analyze ecosystems, producers, consumers, and interdependence', descriptionFA: 'تحلیل بوم‌سازگان، تولیدکننده‌ها، مصرف‌کننده‌ها و وابستگی متقابل', order: 10 },
  { code: 'SCI_FORCES_AND_MOTION', subjectCode: 'SCI', strandCode: 'INQUIRY', gradeCode: 'G7', name: 'Forces and Motion', nameFA: 'نیرو و حرکت', description: 'Describe how balanced and unbalanced forces affect motion', descriptionFA: 'توضیح اثر نیروهای متعادل و نامتعادل بر حرکت', order: 11 },
  { code: 'SCI_CHEMICAL_REACTIONS', subjectCode: 'SCI', strandCode: 'INQUIRY', gradeCode: 'G9', name: 'Chemical Reactions', nameFA: 'واکنش‌های شیمیایی', description: 'Identify evidence and models of chemical change', descriptionFA: 'تشخیص شواهد و مدل‌های تغییر شیمیایی', order: 12 },
  { code: 'ENG_MAIN_IDEA', subjectCode: 'ENG', strandCode: 'LITERACY', gradeCode: 'G4', name: 'Main Idea and Details', nameFA: 'ایده اصلی و جزئیات', description: 'Determine the main idea of a short passage and supporting details', descriptionFA: 'تشخیص ایده اصلی متن کوتاه و جزئیات پشتیبان', order: 13 },
  { code: 'ENG_SUBJECT_VERB_AGREEMENT', subjectCode: 'ENG', strandCode: 'LITERACY', gradeCode: 'G3', name: 'Subject-Verb Agreement', nameFA: 'هماهنگی نهاد و فعل', description: 'Use verbs that agree with singular and plural subjects', descriptionFA: 'استفاده از فعل‌های هماهنگ با نهاد مفرد و جمع', order: 14 },
  { code: 'CS_ALGORITHMS', subjectCode: 'CS', strandCode: 'COMP_THINK', gradeCode: 'G6', name: 'Algorithms and Sequencing', nameFA: 'الگوریتم و ترتیب', description: 'Design and debug step-by-step procedures', descriptionFA: 'طراحی و اشکال‌زدایی روش‌های گام‌به‌گام', order: 15 },
  { code: 'AI_BIAS_FAIRNESS', subjectCode: 'AI', strandCode: 'AI_LITERACY', gradeCode: 'G10', name: 'AI Bias and Fairness', nameFA: 'سوگیری و انصاف در هوش مصنوعی', description: 'Evaluate fairness, bias, and responsible AI design', descriptionFA: 'ارزیابی انصاف، سوگیری و طراحی مسئولانه هوش مصنوعی', order: 16 },
  { code: 'ROBOT_SENSOR_CONTROL', subjectCode: 'ROBOT', strandCode: 'ROBOT_SYSTEMS', gradeCode: 'G8', name: 'Robot Sensors and Control', nameFA: 'حسگرها و کنترل ربات', description: 'Select sensors and control logic for robot tasks', descriptionFA: 'انتخاب حسگرها و منطق کنترل برای کارهای ربات', order: 17 },
  { code: 'SOC_CITIZENSHIP', subjectCode: 'SOC', strandCode: 'CIVICS_GEO', gradeCode: 'G5', name: 'Citizenship and Community', nameFA: 'شهروندی و جامعه', description: 'Understand rights, responsibilities, and civic participation', descriptionFA: 'درک حقوق، مسئولیت‌ها و مشارکت مدنی', order: 18 },
  { code: 'SOC_MAP_SKILLS', subjectCode: 'SOC', strandCode: 'CIVICS_GEO', gradeCode: 'G6', name: 'Map Skills and Geography', nameFA: 'مهارت‌های نقشه و جغرافیا', description: 'Use map keys, scale, and coordinates to interpret place', descriptionFA: 'استفاده از راهنمای نقشه، مقیاس و مختصات برای تفسیر مکان', order: 19 },
];

function toFaDigits(value) {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}

function faMathExpr(expr) {
  return toFaDigits(expr).replace(/\./g, '٫');
}

function buildMcOptions(answers, correctAnswer, explanationBaseEn, explanationBaseFa) {
  return answers.map((answer, index) => ({
    text: String(answer),
    textFA: faMathExpr(answer),
    isCorrect: String(answer) === String(correctAnswer),
    feedback: String(answer) === String(correctAnswer)
      ? `Correct. ${explanationBaseEn}`
      : `Not quite. ${explanationBaseEn}`,
    feedbackFA: String(answer) === String(correctAnswer)
      ? `درست است. ${explanationBaseFa}`
      : `هنوز درست نیست. ${explanationBaseFa}`,
    order: index + 1,
  }));
}

function createBaseMetadata(skillDef, phase) {
  return {
    phase5E: phase,
    subjectCode: skillDef.subjectCode,
    skillCode: skillDef.code,
    gradeCode: skillDef.gradeCode,
    sourceType: 'danesh_original_aligned',
    sourceNote: 'Original Danesh item aligned to official curriculum objectives and open educational resource guidance without copying protected question text.',
    alignment: {
      iranian: `Aligned to ${skillDef.gradeCode} ${skillDef.subjectCode} learning objectives`,
      international: skillDef.subjectCode === 'MATH'
        ? 'Aligned to Common Core style numeracy/algebra progressions'
        : skillDef.subjectCode === 'SCI'
          ? 'Aligned to NGSS style inquiry and disciplinary core ideas'
          : 'Aligned to bilingual K-12 competency-based objectives',
    },
  };
}

function withAdaptiveFields(skillDef, items) {
  return items.map((item, index) => ({
    ...item,
    type: item.type || QuestionType.MULTIPLE_CHOICE,
    phase5E: item.phase5E || PHASE_SEQUENCE[index % PHASE_SEQUENCE.length],
    difficulty: item.difficulty || DIFFICULTY_SEQUENCE[index % DIFFICULTY_SEQUENCE.length],
    bloomLevel: item.bloomLevel || BLOOM_SEQUENCE[index % BLOOM_SEQUENCE.length],
    irtDifficulty: item.irtDifficulty ?? IRT_SEQUENCE[index % IRT_SEQUENCE.length],
    irtDiscrimination: item.irtDiscrimination ?? 1.1 + ((index % 4) * 0.2),
    irtGuessing: item.irtGuessing ?? 0.25,
    timeEstimate: item.timeEstimate ?? 60,
    points: item.points ?? 10,
    hints: item.hints || [],
    commonMisconceptions: item.commonMisconceptions || [],
    metadata: {
      ...createBaseMetadata(skillDef, item.phase5E || PHASE_SEQUENCE[index % PHASE_SEQUENCE.length]),
      ...(item.metadata || {}),
    },
  }));
}

function additionQuestions() {
  const pairs = [[3,5],[6,4],[7,2],[8,5],[9,6],[4,7],[5,8],[9,4],[7,7],[8,9]];
  return pairs.map(([a, b], index) => {
    const correct = a + b;
    const distractors = Array.from(new Set([correct - 1, correct + 1, correct + 2])).filter((n) => n >= 0).slice(0, 3);
    const options = buildMcOptions([correct, ...distractors].sort((x, y) => x - y), correct, `${a} + ${b} = ${correct}.`, `${faMathExpr(a)} + ${faMathExpr(b)} = ${faMathExpr(correct)}.`);
    return {
      stem: `What is ${a} + ${b}?`,
      stemFA: `${faMathExpr(a)} + ${faMathExpr(b)} چند می‌شود؟`,
      explanation: `${a} + ${b} = ${correct}. You can count on or make a ten to solve it efficiently.`,
      explanationFA: `${faMathExpr(a)} + ${faMathExpr(b)} = ${faMathExpr(correct)}. می‌توانی با شمارش رو به جلو یا ساختن ده جواب را پیدا کنی.`,
      options,
      hints: ['Count on from the larger number.', 'Try making ten first if that helps.'],
      commonMisconceptions: ['Stopping the count too soon', 'Counting the first addend twice'],
      timeEstimate: 40 + index * 3,
    };
  });
}

function placeValueQuestions() {
  const configs = [
    { number: 347, ask: 'hundreds', correct: '3', options: ['2', '3', '4', '7'] },
    { number: 582, ask: 'tens', correct: '8', options: ['5', '8', '2', '58'] },
    { number: 406, ask: 'ones', correct: '6', options: ['4', '0', '6', '40'] },
    { number: 290, ask: 'expanded', correct: '200 + 90', options: ['20 + 90', '200 + 9', '200 + 90', '290 + 0'] },
    { number: 731, ask: 'value of 3', correct: '30', options: ['3', '30', '300', '13'] },
    { number: 915, ask: 'digit in ones', correct: '5', options: ['1', '5', '9', '15'] },
    { number: 624, ask: 'value of 6', correct: '600', options: ['6', '60', '600', '624'] },
    { number: 148, ask: 'compose', correct: '100 + 40 + 8', options: ['100 + 4 + 8', '100 + 40 + 8', '10 + 40 + 8', '140 + 8 + 8'] },
    { number: 870, ask: 'value of 7', correct: '70', options: ['7', '70', '700', '17'] },
    { number: 563, ask: 'which digit is in the hundreds place', correct: '5', options: ['5', '6', '3', '56'] },
  ];

  return configs.map((config) => {
    let stem = '';
    let stemFA = '';
    let explanation = '';
    let explanationFA = '';

    if (config.ask === 'hundreds') {
      stem = `In the number ${config.number}, which digit is in the hundreds place?`;
      stemFA = `در عدد ${faMathExpr(config.number)}، کدام رقم در جایگاه صدگان است؟`;
      explanation = `In ${config.number}, the first digit from the left shows the hundreds place.`;
      explanationFA = `در ${faMathExpr(config.number)}، اولین رقم از سمت چپ صدگان را نشان می‌دهد.`;
    } else if (config.ask === 'tens') {
      stem = `In the number ${config.number}, which digit is in the tens place?`;
      stemFA = `در عدد ${faMathExpr(config.number)}، کدام رقم در جایگاه دهگان است؟`;
      explanation = `The middle digit in a three-digit number shows the tens place.`;
      explanationFA = `در عدد سه‌رقمی، رقم وسط دهگان را نشان می‌دهد.`;
    } else if (config.ask === 'ones') {
      stem = `In the number ${config.number}, which digit is in the ones place?`;
      stemFA = `در عدد ${faMathExpr(config.number)}، کدام رقم در جایگاه یکان است؟`;
      explanation = `The last digit in a whole number shows the ones place.`;
      explanationFA = `آخرین رقم در عدد صحیح جایگاه یکان را نشان می‌دهد.`;
    } else if (config.ask === 'expanded') {
      stem = `Which expanded form matches ${config.number}?`;
      stemFA = `کدام شکل گسترده با ${faMathExpr(config.number)} برابر است؟`;
      explanation = `${config.number} has 2 hundreds and 9 tens, so it is 200 + 90.`;
      explanationFA = `${faMathExpr(config.number)} شامل ۲ صدگان و ۹ دهگان است، پس برابر با ۲۰۰ + ۹۰ است.`;
    } else if (config.ask === 'value of 3') {
      stem = `What is the value of the digit 3 in ${config.number}?`;
      stemFA = `ارزش رقم ۳ در ${faMathExpr(config.number)} چیست؟`;
      explanation = `The digit 3 is in the tens place, so its value is 30.`;
      explanationFA = `رقم ۳ در جایگاه دهگان است، پس ارزش آن ۳۰ است.`;
    } else if (config.ask === 'digit in ones') {
      stem = `Which digit is in the ones place in ${config.number}?`;
      stemFA = `کدام رقم در جایگاه یکانِ ${faMathExpr(config.number)} قرار دارد؟`;
      explanation = `The ones place is always the last digit.`;
      explanationFA = `جایگاه یکان همیشه آخرین رقم است.`;
    } else if (config.ask === 'value of 6') {
      stem = `What is the value of the digit 6 in ${config.number}?`;
      stemFA = `ارزش رقم ۶ در ${faMathExpr(config.number)} چیست؟`;
      explanation = `The digit 6 is in the hundreds place, so its value is 600.`;
      explanationFA = `رقم ۶ در جایگاه صدگان است، پس ارزش آن ۶۰۰ است.`;
    } else if (config.ask === 'compose') {
      stem = `Which expression builds the number ${config.number}?`;
      stemFA = `کدام عبارت عدد ${faMathExpr(config.number)} را می‌سازد؟`;
      explanation = `${config.number} is composed of 1 hundred, 4 tens, and 8 ones.`;
      explanationFA = `${faMathExpr(config.number)} از ۱ صدگان، ۴ دهگان و ۸ یکان ساخته شده است.`;
    } else if (config.ask === 'value of 7') {
      stem = `What is the value of the digit 7 in ${config.number}?`;
      stemFA = `ارزش رقم ۷ در ${faMathExpr(config.number)} چیست؟`;
      explanation = `The 7 is in the tens place, so it means 70.`;
      explanationFA = `رقم ۷ در جایگاه دهگان است، پس ۷۰ را نشان می‌دهد.`;
    } else {
      stem = `Which digit is in the hundreds place in ${config.number}?`;
      stemFA = `کدام رقم در جایگاه صدگانِ ${faMathExpr(config.number)} است؟`;
      explanation = `The first digit in a three-digit number is the hundreds digit.`;
      explanationFA = `در عدد سه‌رقمی، رقم اول صدگان است.`;
    }

    return {
      stem,
      stemFA,
      explanation,
      explanationFA,
      options: config.options.map((opt, index) => ({
        text: String(opt),
        textFA: faMathExpr(opt),
        isCorrect: String(opt) === String(config.correct),
        feedback: String(opt) === String(config.correct) ? 'Correct. Use place value to justify your answer.' : 'Check the place named in the question.',
        feedbackFA: String(opt) === String(config.correct) ? 'درست است. با ارزش مکانی جواب خود را توجیه کن.' : 'جایگاهی را که در سوال آمده دوباره بررسی کن.',
        order: index + 1,
      })),
      hints: ['Read the number from left to right.', 'Think about hundreds, tens, and ones.'],
      commonMisconceptions: ['Confusing the digit with its value', 'Reading the number out of order'],
      timeEstimate: 55,
    };
  });
}

function multiplicationQuestions() {
  const facts = [[2,6],[3,4],[4,7],[5,5],[6,3],[7,8],[9,4],[8,6],[10,7],[6,9]];
  return facts.map(([a, b]) => {
    const correct = a * b;
    const options = Array.from(new Set([correct - a, correct, correct + a, correct + 2])).slice(0, 4).sort((x, y) => x - y);
    return {
      stem: `What is ${a} × ${b}?`,
      stemFA: `${faMathExpr(a)} × ${faMathExpr(b)} چند است؟`,
      explanation: `${a} groups of ${b} make ${correct}. You can think of repeated addition or an array.`,
      explanationFA: `${faMathExpr(a)} گروهِ ${faMathExpr(b)}تایی برابر با ${faMathExpr(correct)} است. می‌توانی به جمع تکراری یا آرایه فکر کنی.`,
      options: buildMcOptions(options, correct, `${a} × ${b} = ${correct}.`, `${faMathExpr(a)} × ${faMathExpr(b)} = ${faMathExpr(correct)}.`),
      hints: ['Think of equal groups.', 'Use a known fact and build from it.'],
      commonMisconceptions: ['Adding instead of multiplying', 'Skipping a group while counting'],
      timeEstimate: 45,
    };
  });
}

function fractionQuestions() {
  const items = [
    ['1/2', '2/4', ['1/3', '2/4', '3/4', '4/2']],
    ['3/4', '6/8', ['3/8', '4/8', '6/8', '9/8']],
    ['2/3', '4/6', ['3/6', '4/6', '5/6', '6/6']],
    ['1/5', '2/10', ['1/10', '2/10', '5/10', '10/10']],
    ['4/5', '8/10', ['4/10', '5/10', '8/10', '10/8']],
    ['3/5', '6/10', ['5/10', '6/10', '7/10', '8/10']],
    ['2/4', '1/2', ['1/2', '1/4', '2/8', '4/8']],
    ['5/6', '10/12', ['5/12', '6/12', '10/12', '12/10']],
    ['3/8', '6/16', ['5/16', '6/16', '8/16', '9/16']],
    ['7/10', '14/20', ['10/20', '12/20', '14/20', '17/20']],
  ];
  return items.map(([fraction, equivalent, options]) => ({
    stem: `Which fraction is equivalent to ${fraction}?`,
    stemFA: `کدام کسر با ${faMathExpr(fraction)} معادل است؟`,
    explanation: `Equivalent fractions name the same amount even though the numerator and denominator look different.`,
    explanationFA: `کسرهای معادل مقدار یکسانی را نشان می‌دهند، حتی اگر صورت و مخرج متفاوت باشند.`,
    options: options.map((opt, index) => ({
      text: opt,
      textFA: faMathExpr(opt),
      isCorrect: opt === equivalent,
      feedback: opt === equivalent ? 'Correct. Multiply or divide the numerator and denominator by the same number.' : 'Check whether the numerator and denominator were scaled by the same factor.',
      feedbackFA: opt === equivalent ? 'درست است. صورت و مخرج را در یک عدد یکسان ضرب یا تقسیم می‌کنیم.' : 'بررسی کن که آیا صورت و مخرج با یک ضریب یکسان تغییر کرده‌اند یا نه.',
      order: index + 1,
    })),
    hints: ['Try multiplying the numerator and denominator by the same number.', 'Equivalent fractions show the same part of a whole.'],
    commonMisconceptions: ['Changing only the numerator', 'Assuming bigger numbers mean a bigger fraction'],
    timeEstimate: 60,
  }));
}

function decimalQuestions() {
  const items = [
    { stem: 'In 4.7, what is the value of the digit 7?', stemFA: 'در ۴٫۷، ارزش رقم ۷ چیست؟', correct: '0.7', options: ['7', '0.7', '0.07', '70'], explanation: 'The 7 is in the tenths place.', explanationFA: 'رقم ۷ در جایگاه دهم‌ها است.' },
    { stem: 'Which number has 3 tenths and 5 hundredths?', stemFA: 'کدام عدد ۳ دهم و ۵ صدم دارد؟', correct: '0.35', options: ['0.53', '0.35', '3.5', '0.305'], explanation: '3 tenths is 0.3 and 5 hundredths is 0.05, so together they make 0.35.', explanationFA: '۳ دهم برابر ۰٫۳ و ۵ صدم برابر ۰٫۰۵ است، پس با هم ۰٫۳۵ می‌شود.' },
    { stem: 'What is the value of the 2 in 6.24?', stemFA: 'ارزش رقم ۲ در ۶٫۲۴ چیست؟', correct: '0.2', options: ['2', '0.02', '0.2', '20'], explanation: 'The 2 is in the tenths place.', explanationFA: 'رقم ۲ در جایگاه دهم‌ها است.' },
    { stem: 'Which is greater: 0.6 or 0.58?', stemFA: 'کدام بزرگ‌تر است: ۰٫۶ یا ۰٫۵۸؟', correct: '0.6', options: ['0.6', '0.58', 'They are equal', 'Not enough information'], explanation: '0.6 can be written as 0.60, and 0.60 is greater than 0.58.', explanationFA: '۰٫۶ را می‌توان ۰٫۶۰ نوشت، و ۰٫۶۰ از ۰٫۵۸ بزرگ‌تر است.' },
    { stem: 'Which number is written in expanded form as 2 + 0.4 + 0.03?', stemFA: 'کدام عدد به شکل گسترده ۲ + ۰٫۴ + ۰٫۰۳ نوشته می‌شود؟', correct: '2.43', options: ['2.34', '2.403', '2.43', '24.3'], explanation: 'The number has 2 ones, 4 tenths, and 3 hundredths.', explanationFA: 'این عدد ۲ یکان، ۴ دهم و ۳ صدم دارد.' },
    { stem: 'What is the value of the 9 in 0.49?', stemFA: 'ارزش رقم ۹ در ۰٫۴۹ چیست؟', correct: '0.09', options: ['0.9', '0.09', '9', '0.009'], explanation: 'The 9 is in the hundredths place.', explanationFA: 'رقم ۹ در جایگاه صدم‌ها است.' },
    { stem: 'Which decimal represents 8 tenths?', stemFA: 'کدام عدد اعشاری ۸ دهم را نشان می‌دهد؟', correct: '0.8', options: ['8.0', '0.08', '0.8', '0.18'], explanation: 'Tenths are one place to the right of the decimal point.', explanationFA: 'دهم‌ها یک جایگاه سمت راست ممیز هستند.' },
    { stem: 'Which number is smaller?', stemFA: 'کدام عدد کوچک‌تر است؟', correct: '0.27', options: ['0.27', '0.72', '0.207', '2.7'], explanation: 'Compare tenths first, then hundredths if needed.', explanationFA: 'ابتدا دهم‌ها را مقایسه کن و اگر لازم بود بعد صدم‌ها را بررسی کن.' },
    { stem: 'What decimal is equal to 14 hundredths?', stemFA: 'کدام عدد اعشاری با ۱۴ صدم برابر است؟', correct: '0.14', options: ['1.4', '0.14', '0.41', '14.0'], explanation: 'Fourteen hundredths is 0.14.', explanationFA: 'چهارده صدم برابر ۰٫۱۴ است.' },
    { stem: 'Which decimal is equivalent to 5 tenths?', stemFA: 'کدام عدد اعشاری با ۵ دهم معادل است؟', correct: '0.50', options: ['0.05', '0.5', '0.50', '5.0'], explanation: '0.5 and 0.50 represent the same value.', explanationFA: '۰٫۵ و ۰٫۵۰ مقدار یکسانی را نشان می‌دهند.' },
  ];

  return items.map((item) => ({
    ...item,
    options: item.options.map((opt, index) => ({
      text: opt,
      textFA: faMathExpr(opt),
      isCorrect: opt === item.correct,
      feedback: opt === item.correct ? 'Correct. Use place value to justify your answer.' : 'Check the place value of each digit carefully.',
      feedbackFA: opt === item.correct ? 'درست است. با ارزش مکانی جواب را توجیه کن.' : 'ارزش مکانی هر رقم را با دقت بررسی کن.',
      order: index + 1,
    })),
    hints: ['Tenths come before hundredths.', 'Rewrite decimals with the same number of digits to compare them.'],
    commonMisconceptions: ['Confusing tenths with hundredths', 'Thinking trailing zeros change value'],
    timeEstimate: 60,
  }));
}

function oneStepEquationQuestions() {
  const items = [
    ['x + 5 = 12', '7'],
    ['x - 4 = 9', '13'],
    ['3x = 18', '6'],
    ['x / 5 = 3', '15'],
    ['x + 9 = 20', '11'],
    ['x - 8 = 14', '22'],
    ['4x = 28', '7'],
    ['x / 6 = 4', '24'],
    ['x + 13 = 31', '18'],
    ['7x = 49', '7'],
  ];
  return items.map(([equation, correct]) => {
    const numeric = Number(correct);
    const options = Array.from(new Set([numeric - 2, numeric - 1, numeric, numeric + 2])).sort((a, b) => a - b);
    return {
      stem: `Solve: ${equation}`,
      stemFA: `حل کن: ${faMathExpr(equation)}`,
      explanation: `Use the inverse operation to isolate x in ${equation}.`,
      explanationFA: `برای جدا کردن x در ${faMathExpr(equation)} از عمل معکوس استفاده کن.`,
      options: buildMcOptions(options, correct, `The solution is x = ${correct}.`, `پاسخ x = ${faMathExpr(correct)} است.`),
      hints: ['Undo addition with subtraction and multiplication with division.', 'Check your answer by substituting it back into the equation.'],
      commonMisconceptions: ['Applying the same operation in the wrong direction', 'Forgetting to divide when the variable has a coefficient'],
      timeEstimate: 75,
    };
  });
}

function proportionalQuestions() {
  const items = [
    { stem: 'A recipe uses 2 cups of flour for 5 servings. How many cups are needed for 10 servings?', stemFA: 'در یک دستور پخت، برای ۵ وعده ۲ پیمانه آرد لازم است. برای ۱۰ وعده چند پیمانه لازم است؟', correct: '4', options: ['2', '4', '5', '10'], explanation: 'Doubling the servings doubles the flour.', explanationFA: 'با دو برابر شدن تعداد وعده‌ها، مقدار آرد نیز دو برابر می‌شود.' },
    { stem: 'A car travels 180 kilometers in 3 hours. What is the unit rate?', stemFA: 'یک خودرو در ۳ ساعت ۱۸۰ کیلومتر حرکت می‌کند. نرخ واحد آن چیست؟', correct: '60 km/h', options: ['30 km/h', '60 km/h', '90 km/h', '183 km/h'], explanation: 'Divide distance by time: 180 ÷ 3 = 60.', explanationFA: 'مسافت را بر زمان تقسیم می‌کنیم: ۱۸۰ ÷ ۳ = ۶۰.' },
    { stem: 'If 4 notebooks cost $12, how much do 8 notebooks cost at the same rate?', stemFA: 'اگر ۴ دفتر ۱۲ دلار باشد، ۸ دفتر با همان نرخ چند دلار می‌شود؟', correct: '$24', options: ['$16', '$20', '$24', '$32'], explanation: 'Eight notebooks are twice as many as four notebooks, so the cost doubles.', explanationFA: '۸ دفتر دو برابر ۴ دفتر است، پس هزینه نیز دو برابر می‌شود.' },
    { stem: 'Which ratio is equivalent to 3:7?', stemFA: 'کدام نسبت با ۳:۷ معادل است؟', correct: '6:14', options: ['6:14', '9:14', '10:21', '12:25'], explanation: 'Multiply both terms by the same number to make an equivalent ratio.', explanationFA: 'برای ساخت نسبت معادل، هر دو جمله را در یک عدد یکسان ضرب می‌کنیم.' },
    { stem: 'A runner completes 5 laps in 20 minutes. At this rate, how many laps in 32 minutes?', stemFA: 'یک دونده ۵ دور را در ۲۰ دقیقه کامل می‌کند. با این نرخ، در ۳۲ دقیقه چند دور می‌دود؟', correct: '8', options: ['6', '7', '8', '10'], explanation: 'The runner completes 1 lap in 4 minutes, so 32 minutes allows 8 laps.', explanationFA: 'دونده هر ۴ دقیقه یک دور می‌دود، پس در ۳۲ دقیقه ۸ دور می‌دود.' },
    { stem: 'If y is proportional to x and y = 18 when x = 6, what is the constant of proportionality?', stemFA: 'اگر y با x متناسب باشد و وقتی x = ۶ است، y = ۱۸ باشد، ثابت تناسب چیست؟', correct: '3', options: ['2', '3', '6', '12'], explanation: 'In a proportional relationship, y = kx, so k = 18 ÷ 6 = 3.', explanationFA: 'در رابطه تناسبی، y = kx است؛ بنابراین k = ۱۸ ÷ ۶ = ۳.', },
    { stem: '3 pens cost $4.50. What is the price of 1 pen?', stemFA: '۳ خودکار ۴٫۵۰ دلار قیمت دارد. قیمت ۱ خودکار چقدر است؟', correct: '$1.50', options: ['$1.00', '$1.25', '$1.50', '$2.00'], explanation: 'Divide the total cost by the number of pens.', explanationFA: 'هزینه کل را بر تعداد خودکارها تقسیم می‌کنیم.' },
    { stem: 'A map scale says 1 centimeter = 5 kilometers. What distance does 7 centimeters represent?', stemFA: 'مقیاس نقشه می‌گوید ۱ سانتی‌متر = ۵ کیلومتر. ۷ سانتی‌متر چه مسافتی را نشان می‌دهد؟', correct: '35 kilometers', options: ['12 kilometers', '30 kilometers', '35 kilometers', '70 kilometers'], explanation: 'Multiply 7 by the scale factor of 5.', explanationFA: '۷ را در ضریب مقیاس ۵ ضرب می‌کنیم.' },
    { stem: 'A classroom has 12 girls and 8 boys. What is the ratio of girls to boys in simplest form?', stemFA: 'در یک کلاس ۱۲ دختر و ۸ پسر هستند. نسبت دخترها به پسرها در ساده‌ترین شکل چیست؟', correct: '3:2', options: ['12:8', '6:4', '3:2', '2:3'], explanation: 'Divide both parts of the ratio by 4 to simplify.', explanationFA: 'برای ساده‌سازی نسبت، هر دو بخش را بر ۴ تقسیم می‌کنیم.' },
    { stem: 'At a constant rate, 9 meters of ribbon cost $27. How much would 15 meters cost?', stemFA: 'با نرخ ثابت، ۹ متر روبان ۲۷ دلار است. ۱۵ متر چند دلار می‌شود؟', correct: '$45', options: ['$36', '$42', '$45', '$54'], explanation: 'Each meter costs $3, so 15 meters cost $45.', explanationFA: 'هر متر ۳ دلار است، پس ۱۵ متر ۴۵ دلار می‌شود.' },
  ];
  return items.map((item) => ({
    ...item,
    options: item.options.map((opt, index) => ({
      text: opt,
      textFA: faMathExpr(opt),
      isCorrect: opt === item.correct,
      feedback: opt === item.correct ? 'Correct. Look for the constant multiplier.' : 'Check the unit rate or scale factor again.',
      feedbackFA: opt === item.correct ? 'درست است. ضریب ثابت را پیدا کن.' : 'نرخ واحد یا ضریب مقیاس را دوباره بررسی کن.',
      order: index + 1,
    })),
    hints: ['Find the value for 1 unit first when possible.', 'In a proportional relationship, the multiplier stays constant.'],
    commonMisconceptions: ['Adding instead of scaling', 'Using the wrong unit when calculating a rate'],
    timeEstimate: 80,
  }));
}

function quadraticQuestions() {
  const items = [
    ['x² + 5x + 6', '(x + 2)(x + 3)', ['(x + 2)(x + 3)', '(x + 1)(x + 6)', '(x + 2)(x + 2)', '(x + 3)(x + 4)']],
    ['x² + 7x + 12', '(x + 3)(x + 4)', ['(x + 3)(x + 4)', '(x + 2)(x + 6)', '(x + 1)(x + 12)', '(x + 4)(x + 4)']],
    ['x² + 8x + 15', '(x + 3)(x + 5)', ['(x + 3)(x + 5)', '(x + 2)(x + 6)', '(x + 1)(x + 15)', '(x + 5)(x + 5)']],
    ['x² + 9x + 20', '(x + 4)(x + 5)', ['(x + 2)(x + 10)', '(x + 4)(x + 5)', '(x + 1)(x + 20)', '(x + 5)(x + 5)']],
    ['x² + 11x + 24', '(x + 3)(x + 8)', ['(x + 3)(x + 8)', '(x + 4)(x + 6)', '(x + 2)(x + 12)', '(x + 1)(x + 24)']],
    ['x² + 6x + 8', '(x + 2)(x + 4)', ['(x + 2)(x + 4)', '(x + 1)(x + 8)', '(x + 3)(x + 3)', '(x + 4)(x + 4)']],
    ['x² - x - 6', '(x - 3)(x + 2)', ['(x - 3)(x + 2)', '(x - 2)(x + 3)', '(x - 6)(x + 1)', '(x - 1)(x + 6)']],
    ['x² - 5x + 6', '(x - 2)(x - 3)', ['(x - 2)(x - 3)', '(x - 1)(x - 6)', '(x - 2)(x - 2)', '(x - 3)(x - 4)']],
    ['x² - 7x + 12', '(x - 3)(x - 4)', ['(x - 3)(x - 4)', '(x - 2)(x - 6)', '(x - 1)(x - 12)', '(x - 4)(x - 4)']],
    ['x² - 9x + 20', '(x - 4)(x - 5)', ['(x - 2)(x - 10)', '(x - 4)(x - 5)', '(x - 1)(x - 20)', '(x - 5)(x - 5)']],
  ];
  return items.map(([expression, correct, options]) => ({
    stem: `Which factorization is correct for ${expression}?`,
    stemFA: `کدام تجزیه برای ${faMathExpr(expression)} درست است؟`,
    explanation: `Find two numbers that multiply to the constant term and add to the middle coefficient.`,
    explanationFA: `دو عددی را پیدا کن که حاصل‌ضرب‌شان جمله ثابت و حاصل‌جمع‌شان ضریب جمله میانی باشد.`,
    options: options.map((opt, index) => ({
      text: opt,
      textFA: faMathExpr(opt),
      isCorrect: opt === correct,
      feedback: opt === correct ? 'Correct. Check the product and the sum of the binomial terms.' : 'Test whether the factors expand back to the original trinomial.',
      feedbackFA: opt === correct ? 'درست است. حاصل‌ضرب و مجموع جمله‌های دو پرانتز را بررسی کن.' : 'بررسی کن که آیا این عوامل دوباره به عبارت اصلی بسط می‌یابند یا نه.',
      order: index + 1,
    })),
    hints: ['Look for factor pairs of the constant term.', 'The pair must also add to the middle coefficient.'],
    commonMisconceptions: ['Using a factor pair with the right product but wrong sum', 'Forgetting to handle negative signs'],
    timeEstimate: 90,
  }));
}

function explicitQuestion(stem, stemFA, options, correctIndex, explanation, explanationFA, extra = {}) {
  return {
    stem,
    stemFA,
    explanation,
    explanationFA,
    options: options.map((option, index) => ({
      text: option[0],
      textFA: option[1],
      isCorrect: index === correctIndex,
      feedback: index === correctIndex ? 'Correct. Use the key science idea in the explanation.' : 'Revisit the concept and compare each option carefully.',
      feedbackFA: index === correctIndex ? 'درست است. از ایده اصلی علمی در توضیح استفاده کن.' : 'دوباره مفهوم را مرور کن و گزینه‌ها را با دقت مقایسه کن.',
      order: index + 1,
    })),
    hints: extra.hints || ['Use evidence from the situation to eliminate wrong answers.'],
    commonMisconceptions: extra.commonMisconceptions || ['Choosing an answer based on a keyword instead of the full concept'],
    timeEstimate: extra.timeEstimate || 70,
    bloomLevel: extra.bloomLevel,
    difficulty: extra.difficulty,
    phase5E: extra.phase5E,
    metadata: extra.metadata,
  };
}

function statesOfMatterQuestions() {
  return [
    explicitQuestion('Which statement best describes a solid?', 'کدام عبارت بهترین توصیف برای جامد است؟', [['It keeps its shape', 'شکل خود را حفظ می‌کند'], ['It fills any container', 'هر ظرفی را پر می‌کند'], ['It changes volume quickly', 'حجمش سریع تغییر می‌کند'], ['It cannot be measured', 'قابل اندازه‌گیری نیست']], 0, 'A solid has a definite shape and a definite volume.', 'جامد شکل و حجم معین دارد.'),
    explicitQuestion('Why does steam spread out in a room?', 'چرا بخار در یک اتاق پخش می‌شود؟', [['Its particles are fixed', 'ذره‌هایش ثابت هستند'], ['Its particles move freely', 'ذره‌هایش آزادانه حرکت می‌کنند'], ['Its particles disappear', 'ذره‌هایش ناپدید می‌شوند'], ['Its particles turn into light', 'ذره‌هایش به نور تبدیل می‌شوند']], 1, 'Gas particles move freely and spread to fill available space.', 'ذره‌های گاز آزادانه حرکت می‌کنند و فضای موجود را پر می‌کنند.'),
    explicitQuestion('What is melting?', 'ذوب شدن چیست؟', [['Gas changing to liquid', 'تغییر گاز به مایع'], ['Solid changing to liquid', 'تغییر جامد به مایع'], ['Liquid changing to gas', 'تغییر مایع به گاز'], ['Liquid changing to solid', 'تغییر مایع به جامد']], 1, 'Melting is the change of state from solid to liquid.', 'ذوب شدن تغییر حالت از جامد به مایع است.'),
    explicitQuestion('A closed bottle of juice is put in the freezer and breaks. Why?', 'یک بطری بسته آبمیوه در فریزر گذاشته می‌شود و می‌شکند. چرا؟', [['The bottle gets lighter', 'بطری سبک‌تر می‌شود'], ['The liquid shrinks', 'مایع کوچک‌تر می‌شود'], ['The freezing liquid expands', 'مایع هنگام یخ زدن منبسط می‌شود'], ['The air disappears', 'هوا ناپدید می‌شود']], 2, 'Many liquids expand when they freeze, creating pressure on the bottle.', 'بسیاری از مایعات هنگام یخ زدن منبسط می‌شوند و به بطری فشار وارد می‌کنند.'),
    explicitQuestion('Which example shows evaporation?', 'کدام مثال تبخیر را نشان می‌دهد؟', [['Ice turning to water', 'یخ که به آب تبدیل می‌شود'], ['Rain falling from clouds', 'باران که از ابر می‌بارد'], ['A wet shirt drying on a line', 'پیراهن خیس که روی بند خشک می‌شود'], ['Water turning to ice cubes', 'آب که به یخ تبدیل می‌شود']], 2, 'Evaporation happens when liquid water becomes water vapor.', 'تبخیر وقتی رخ می‌دهد که آب مایع به بخار آب تبدیل شود.'),
    explicitQuestion('Which particle model matches a liquid?', 'کدام مدل ذره‌ای با مایع سازگار است؟', [['Particles locked tightly in place', 'ذره‌ها محکم در جای خود قفل شده‌اند'], ['Particles close together but able to slide', 'ذره‌ها نزدیک هم هستند اما می‌توانند بلغزند'], ['Particles very far apart and moving randomly', 'ذره‌ها خیلی از هم دورند و تصادفی حرکت می‌کنند'], ['Particles with no motion at all', 'ذره‌هایی که اصلاً حرکت ندارند']], 1, 'Liquid particles stay close together but can move past one another.', 'ذره‌های مایع نزدیک هم می‌مانند اما می‌توانند از کنار هم حرکت کنند.'),
    explicitQuestion('What happens during condensation?', 'در چگالش چه اتفاقی می‌افتد؟', [['A liquid becomes a gas', 'مایع به گاز تبدیل می‌شود'], ['A gas becomes a liquid', 'گاز به مایع تبدیل می‌شود'], ['A solid becomes a gas', 'جامد به گاز تبدیل می‌شود'], ['A solid becomes a liquid', 'جامد به مایع تبدیل می‌شود']], 1, 'Condensation changes a gas into a liquid as particles lose energy.', 'چگالش وقتی رخ می‌دهد که گاز با از دست دادن انرژی به مایع تبدیل شود.'),
    explicitQuestion('A student says, “Gas has no mass.” What is the best response?', 'دانش‌آموزی می‌گوید: «گاز جرم ندارد.» بهترین پاسخ چیست؟', [['That is true because gas is invisible', 'درست است چون گاز نامرئی است'], ['That is true only for hot gas', 'فقط برای گاز داغ درست است'], ['That is false because gases are matter and have mass', 'نادرست است چون گازها ماده هستند و جرم دارند'], ['That is false because gases are liquids', 'نادرست است چون گازها مایع هستند']], 2, 'Gases are a state of matter, so they have mass and take up space.', 'گازها یکی از حالت‌های ماده هستند، پس جرم دارند و فضا اشغال می‌کنند.'),
  ];
}

function ecosystemQuestions() {
  return [
    explicitQuestion('Which organism is a producer in a forest ecosystem?', 'کدام جاندار در بوم‌سازگان جنگل تولیدکننده است؟', [['Oak tree', 'درخت بلوط'], ['Rabbit', 'خرگوش'], ['Fox', 'روباه'], ['Mushroom', 'قارچ']], 0, 'Producers make their own food, usually through photosynthesis.', 'تولیدکننده‌ها غذای خود را معمولاً از طریق فتوسنتز می‌سازند.'),
    explicitQuestion('What would most likely happen if insects disappeared from a food web?', 'اگر حشرات از یک شبکه غذایی ناپدید شوند، به احتمال زیاد چه اتفاقی می‌افتد؟', [['Plants would stop needing sunlight', 'گیاهان دیگر به نور خورشید نیاز نخواهند داشت'], ['Animals that eat insects would have less food', 'جانورانی که حشرات را می‌خورند غذای کمتری خواهند داشت'], ['Predators would all become producers', 'همه شکارچیان تولیدکننده می‌شوند'], ['Nothing would change', 'هیچ چیز تغییر نمی‌کند']], 1, 'Food webs show interdependence, so removing one group affects others.', 'شبکه‌های غذایی وابستگی متقابل را نشان می‌دهند؛ پس حذف یک گروه بر بقیه اثر می‌گذارد.'),
    explicitQuestion('Why are decomposers important?', 'چرا تجزیه‌کننده‌ها مهم هستند؟', [['They make sunlight', 'نور خورشید تولید می‌کنند'], ['They return nutrients to the soil', 'مواد مغذی را به خاک برمی‌گردانند'], ['They hunt every animal', 'همه جانوران را شکار می‌کنند'], ['They stop all decay', 'همه پوسیدگی را متوقف می‌کنند']], 1, 'Decomposers break down dead material and recycle nutrients.', 'تجزیه‌کننده‌ها مواد مرده را تجزیه و مواد مغذی را بازیافت می‌کنند.'),
    explicitQuestion('Which chain shows energy moving from producer to top consumer?', 'کدام زنجیره حرکت انرژی از تولیدکننده تا مصرف‌کننده رأس را نشان می‌دهد؟', [['Hawk → grass → mouse', 'شاهین ← علف ← موش'], ['Grass → mouse → snake → hawk', 'علف → موش → مار → شاهین'], ['Snake → grass → hawk', 'مار → علف → شاهین'], ['Mouse → grass → hawk', 'موش → علف → شاهین']], 1, 'Energy in food webs starts with producers and moves through consumers.', 'انرژی در شبکه غذایی از تولیدکننده‌ها آغاز می‌شود و به مصرف‌کننده‌ها می‌رسد.'),
    explicitQuestion('A pond loses many frogs after pollution enters the water. Which is the best explanation?', 'پس از ورود آلودگی به آب، تعداد زیادی قورباغه در یک برکه از بین می‌روند. بهترین توضیح چیست؟', [['Pollution can damage habitat and food sources', 'آلودگی می‌تواند زیستگاه و منابع غذایی را آسیب بزند'], ['Frogs do not need clean water', 'قورباغه‌ها به آب تمیز نیاز ندارند'], ['Pollution only affects plants', 'آلودگی فقط بر گیاهان اثر می‌گذارد'], ['Frogs become producers when water is dirty', 'قورباغه‌ها هنگام آلودگی آب تولیدکننده می‌شوند']], 0, 'Ecosystem health depends on suitable habitat conditions and food availability.', 'سلامت بوم‌سازگان به شرایط مناسب زیستگاه و در دسترس بودن غذا بستگی دارد.'),
    explicitQuestion('Which statement about food webs is true?', 'کدام عبارت درباره شبکه‌های غذایی درست است؟', [['Each organism can have only one food source', 'هر جاندار فقط یک منبع غذا دارد'], ['Food webs show many connected feeding relationships', 'شبکه‌های غذایی رابطه‌های غذایی متعدد و به‌هم‌پیوسته را نشان می‌دهند'], ['Food webs do not include plants', 'شبکه‌های غذایی شامل گیاهان نیستند'], ['Food webs always have the same number of levels', 'شبکه‌های غذایی همیشه تعداد سطح یکسان دارند']], 1, 'Food webs are networks, not single straight chains.', 'شبکه‌های غذایی شبکه هستند، نه فقط یک زنجیره مستقیم.'),
    explicitQuestion('What is a consumer?', 'مصرف‌کننده چیست؟', [['An organism that makes its own food', 'جانداری که غذای خود را می‌سازد'], ['An organism that gets energy by eating other organisms', 'جانداری که با خوردن جانداران دیگر انرژی می‌گیرد'], ['A nonliving part of an ecosystem', 'بخش غیرزنده یک بوم‌سازگان'], ['A machine used by scientists', 'دستگاهی که دانشمندان استفاده می‌کنند']], 1, 'Consumers cannot make their own food and depend on other organisms for energy.', 'مصرف‌کننده‌ها نمی‌توانند غذای خود را بسازند و برای انرژی به جانداران دیگر وابسته‌اند.'),
    explicitQuestion('Why does biodiversity help an ecosystem?', 'چرا تنوع زیستی به یک بوم‌سازگان کمک می‌کند؟', [['It makes every organism identical', 'همه جانداران را یکسان می‌کند'], ['It can make the ecosystem more stable when conditions change', 'می‌تواند بوم‌سازگان را هنگام تغییر شرایط پایدارتر کند'], ['It removes all competition', 'همه رقابت‌ها را حذف می‌کند'], ['It stops nutrient cycles', 'چرخه‌های مواد مغذی را متوقف می‌کند']], 1, 'More biodiversity can increase resilience because different organisms play different roles.', 'تنوع زیستی بیشتر می‌تواند تاب‌آوری را افزایش دهد، چون جانداران مختلف نقش‌های متفاوتی دارند.'),
  ];
}

function forcesQuestions() {
  return [
    explicitQuestion('What happens when balanced forces act on an object?', 'وقتی نیروهای متعادل بر جسم اثر می‌گذارند چه اتفاقی می‌افتد؟', [['Its motion changes immediately', 'حرکتش فوراً تغییر می‌کند'], ['It accelerates in one direction', 'در یک جهت شتاب می‌گیرد'], ['Its motion stays the same unless another force acts', 'حرکتش همان می‌ماند مگر اینکه نیروی دیگری اثر کند'], ['It disappears', 'ناپدید می‌شود']], 2, 'Balanced forces do not change an object’s motion.', 'نیروهای متعادل حرکت جسم را تغییر نمی‌دهند.'),
    explicitQuestion('A soccer ball at rest is kicked. Which force changed its motion?', 'یک توپ فوتبال ساکن لگد زده می‌شود. کدام نیرو حرکت آن را تغییر داد؟', [['Gravity only', 'فقط گرانش'], ['An unbalanced push from the kick', 'یک نیروی نامتعادل ناشی از لگد'], ['Magnetism', 'مغناطیس'], ['No force at all', 'هیچ نیرویی']], 1, 'The kick applies an unbalanced force that changes the ball’s motion.', 'لگد یک نیروی نامتعادل وارد می‌کند و حرکت توپ را تغییر می‌دهد.'),
    explicitQuestion('Why does a rolling skateboard eventually stop on rough pavement?', 'چرا یک اسکیت‌بردِ در حال حرکت روی سطح زبر سرانجام می‌ایستد؟', [['Because gravity disappears', 'چون گرانش ناپدید می‌شود'], ['Because friction opposes motion', 'چون اصطکاک با حرکت مخالفت می‌کند'], ['Because the wheels get heavier', 'چون چرخ‌ها سنگین‌تر می‌شوند'], ['Because motion cannot continue', 'چون حرکت نمی‌تواند ادامه یابد']], 1, 'Friction is a force that resists motion between surfaces.', 'اصطکاک نیرویی است که با حرکت بین سطوح مخالفت می‌کند.'),
    explicitQuestion('If the same force is applied to a lighter cart and a heavier cart, which cart accelerates more?', 'اگر نیروی یکسانی به یک گاری سبک و یک گاری سنگین وارد شود، کدام‌یک بیشتر شتاب می‌گیرد؟', [['The heavier cart', 'گاری سنگین'], ['Both the same', 'هر دو یکسان'], ['The lighter cart', 'گاری سبک'], ['Neither one', 'هیچ‌کدام']], 2, 'For the same force, less mass means greater acceleration.', 'برای نیروی یکسان، جرم کمتر به معنای شتاب بیشتر است.'),
    explicitQuestion('Which is an example of contact force?', 'کدام مورد نمونه‌ای از نیروی تماسی است؟', [['Gravity pulling an apple down', 'کشیدن سیب به پایین توسط گرانش'], ['Magnet attracting iron', 'جذب آهن توسط آهنربا'], ['Friction between a shoe and the ground', 'اصطکاک بین کفش و زمین'], ['Earth orbiting the sun', 'مدار زدن زمین به دور خورشید']], 2, 'Contact forces act when objects touch.', 'نیروهای تماسی وقتی اثر می‌کنند که اجسام با هم تماس داشته باشند.'),
    explicitQuestion('A car turns left. What must happen to its direction of force?', 'یک خودرو به سمت چپ می‌پیچد. جهت نیرو چه باید بکند؟', [['It must also act left', 'باید به سمت چپ اثر کند'], ['It must act up', 'باید به سمت بالا اثر کند'], ['It must disappear', 'باید ناپدید شود'], ['It must act backward only', 'باید فقط به سمت عقب اثر کند']], 0, 'Changing direction requires a net force toward the new direction.', 'برای تغییر جهت، نیروی خالص باید به سوی جهت جدید باشد.'),
    explicitQuestion('Why is wearing a seatbelt important in a sudden stop?', 'چرا بستن کمربند ایمنی هنگام توقف ناگهانی مهم است؟', [['It increases the car’s speed', 'سرعت خودرو را زیاد می‌کند'], ['It helps your body keep moving forward', 'به بدن کمک می‌کند رو به جلو حرکت کند'], ['It provides a force that stops your body more safely', 'نیرویی فراهم می‌کند که بدن را ایمن‌تر متوقف کند'], ['It removes inertia from your body', 'اینرسی بدن را از بین می‌برد']], 2, 'Because of inertia, your body keeps moving forward unless another force acts.', 'به دلیل اینرسی، بدن شما رو به جلو حرکت می‌کند مگر اینکه نیروی دیگری اثر کند.'),
    explicitQuestion('Which statement best compares speed and velocity?', 'کدام عبارت بهترین مقایسه را بین سرعت و تندی انجام می‌دهد؟', [['They mean exactly the same thing', 'کاملاً یک معنی دارند'], ['Velocity includes direction, speed does not', 'سرعت برداری جهت دارد اما تندی ندارد'], ['Speed includes force, velocity does not', 'تندی شامل نیرو است اما سرعت برداری نه'], ['Velocity only describes slow motion', 'سرعت برداری فقط حرکت آهسته را توصیف می‌کند']], 1, 'Velocity describes both how fast and in what direction an object moves.', 'سرعت برداری هم تندی و هم جهت حرکت جسم را توصیف می‌کند.'),
  ];
}

function chemicalReactionQuestions() {
  return [
    explicitQuestion('Which observation is strong evidence that a chemical reaction has occurred?', 'کدام مشاهده شواهد قوی برای وقوع واکنش شیمیایی است؟', [['A solid melts into liquid', 'یک جامد به مایع تبدیل می‌شود'], ['A gas forms and a new odor appears', 'گاز تشکیل می‌شود و بوی جدیدی ظاهر می‌شود'], ['Water boils', 'آب می‌جوشد'], ['Sugar dissolves in tea', 'شکر در چای حل می‌شود']], 1, 'Gas production and odor change are common signs of chemical change.', 'تشکیل گاز و تغییر بو از نشانه‌های رایج تغییر شیمیایی هستند.'),
    explicitQuestion('Rust forming on iron is an example of:', 'زنگ زدن آهن نمونه‌ای از چیست؟', [['A physical change only', 'فقط یک تغییر فیزیکی'], ['A chemical change', 'یک تغییر شیمیایی'], ['A change with no new substance', 'تغییری بدون ماده جدید'], ['A reversible phase change', 'یک تغییر حالت برگشت‌پذیر']], 1, 'Rusting produces a new substance, iron oxide.', 'زنگ زدن ماده جدیدی به نام اکسید آهن تولید می‌کند.'),
    explicitQuestion('What is conserved in a chemical reaction?', 'در یک واکنش شیمیایی چه چیزی پایسته می‌ماند؟', [['Mass', 'جرم'], ['Color', 'رنگ'], ['Temperature', 'دما'], ['State of matter', 'حالت ماده']], 0, 'Atoms are rearranged, but total mass is conserved.', 'اتم‌ها دوباره آرایش می‌یابند، اما جرم کل پایسته می‌ماند.'),
    explicitQuestion('Why is baking a cake considered a chemical change?', 'چرا پختن کیک یک تغییر شیمیایی محسوب می‌شود؟', [['Because the pan gets hot', 'چون قالب داغ می‌شود'], ['Because new substances form during baking', 'چون هنگام پخت مواد جدید تشکیل می‌شود'], ['Because the batter becomes liquid', 'چون مایه کیک مایع می‌شود'], ['Because sugar disappears', 'چون شکر ناپدید می‌شود']], 1, 'Heat causes ingredients to react and form new substances with new properties.', 'گرما باعث می‌شود مواد واکنش دهند و مواد جدید با ویژگی‌های جدید تشکیل شود.'),
    explicitQuestion('Which process is NOT a chemical change?', 'کدام فرایند تغییر شیمیایی نیست؟', [['Burning wood', 'سوختن چوب'], ['Cooking an egg', 'پختن تخم‌مرغ'], ['Tearing paper', 'پاره کردن کاغذ'], ['Tarnishing silver', 'تیره شدن نقره']], 2, 'Tearing paper changes size or shape but does not create a new substance.', 'پاره کردن کاغذ اندازه یا شکل را تغییر می‌دهد، اما ماده جدیدی ایجاد نمی‌کند.'),
    explicitQuestion('In the reaction vinegar + baking soda, what evidence is easiest to observe?', 'در واکنش سرکه و جوش‌شیرین، چه شاهدی راحت‌تر دیده می‌شود؟', [['Bubbles form', 'حباب تشکیل می‌شود'], ['The mixture turns to metal', 'مخلوط به فلز تبدیل می‌شود'], ['Nothing changes', 'هیچ چیز تغییر نمی‌کند'], ['The mass vanishes', 'جرم ناپدید می‌شود']], 0, 'The bubbling shows that a gas is being produced.', 'حباب‌ها نشان می‌دهند که گاز تولید می‌شود.'),
    explicitQuestion('Why do chemical equations need to be balanced?', 'چرا معادله‌های شیمیایی باید موازنه شوند؟', [['To make them look neat', 'تا ظاهر مرتبی داشته باشند'], ['To show that atoms are created', 'تا نشان دهند اتم‌ها ایجاد می‌شوند'], ['To show the same number of each type of atom on both sides', 'تا تعداد یکسانی از هر نوع اتم را در دو طرف نشان دهند'], ['To change the reaction speed', 'تا سرعت واکنش را تغییر دهند']], 2, 'Balanced equations reflect the conservation of atoms and mass.', 'معادله‌های موازنه‌شده پایستگی اتم‌ها و جرم را نشان می‌دهند.'),
    explicitQuestion('Which classroom activity is the best model of atoms rearranging in a reaction?', 'کدام فعالیت کلاسی بهترین مدل برای آرایش دوباره اتم‌ها در یک واکنش است؟', [['Students leaving the room', 'دانش‌آموزان که از کلاس بیرون می‌روند'], ['Colored blocks connecting in new groups', 'مکعب‌های رنگی که در گروه‌های جدید وصل می‌شوند'], ['Water freezing in cups', 'آب که در لیوان یخ می‌زند'], ['A pencil being sharpened', 'مدادی که تراشیده می‌شود']], 1, 'Chemical reactions rearrange existing atoms into new combinations.', 'واکنش‌های شیمیایی اتم‌های موجود را در ترکیب‌های جدید دوباره آرایش می‌دهند.'),
  ];
}

function mainIdeaQuestions() {
  const passages = [
    {
      passage: 'Bees visit flowers to collect nectar. As they move from flower to flower, they also carry pollen. This helps many plants make seeds.',
      passageFA: 'زنبورها برای جمع‌آوری شهد به گل‌ها سر می‌زنند. وقتی از گلی به گل دیگر می‌روند، گرده را هم جابه‌جا می‌کنند. این کار به بسیاری از گیاهان کمک می‌کند دانه بسازند.',
      question: 'What is the main idea of the passage?',
      questionFA: 'ایده اصلی این متن چیست؟',
      options: [['Bees only like yellow flowers', 'زنبورها فقط گل زرد را دوست دارند'], ['Bees help plants reproduce while collecting nectar', 'زنبورها هنگام جمع‌آوری شهد به تولیدمثل گیاهان کمک می‌کنند'], ['Seeds are larger than pollen', 'دانه‌ها از گرده بزرگ‌ترند'], ['Flowers move from place to place', 'گل‌ها از جایی به جای دیگر می‌روند']],
      correct: 1,
      explanation: 'Most details explain how bees support plant reproduction.',
      explanationFA: 'بیشتر جزئیات توضیح می‌دهند که زنبورها چگونه به تولیدمثل گیاهان کمک می‌کنند.'
    },
    {
      passage: 'Mina trained for the school race every afternoon. She stretched before running, drank water after practice, and kept track of her times in a notebook.',
      passageFA: 'مینا هر بعدازظهر برای مسابقه مدرسه تمرین می‌کرد. قبل از دویدن نرمش می‌کرد، بعد از تمرین آب می‌نوشید و زمان‌هایش را در دفتری یادداشت می‌کرد.',
      question: 'Which sentence states the main idea?',
      questionFA: 'کدام جمله ایده اصلی را بیان می‌کند؟',
      options: [['Mina used a blue notebook', 'مینا از دفتر آبی استفاده می‌کرد'], ['Mina prepared carefully for the race', 'مینا با دقت برای مسابقه آماده می‌شد'], ['Running is difficult for everyone', 'دویدن برای همه دشوار است'], ['The race happened in winter', 'مسابقه در زمستان برگزار شد']],
      correct: 1,
      explanation: 'The details all show Mina’s careful preparation.',
      explanationFA: 'همه جزئیات نشان می‌دهند که مینا با دقت آماده می‌شد.'
    },
    {
      passage: 'Libraries offer more than books. Many libraries now lend puzzles, musical instruments, and science kits. They also host workshops for families.',
      passageFA: 'کتابخانه‌ها فقط کتاب ارائه نمی‌دهند. اکنون بسیاری از کتابخانه‌ها پازل، سازهای موسیقی و بسته‌های علمی هم امانت می‌دهند. آن‌ها همچنین برای خانواده‌ها کارگاه برگزار می‌کنند.',
      question: 'What is the passage mostly about?',
      questionFA: 'این متن بیشتر درباره چیست؟',
      options: [['Why books are expensive', 'چرا کتاب‌ها گران هستند'], ['How libraries provide many kinds of resources and programs', 'چگونه کتابخانه‌ها انواع گوناگونی از منابع و برنامه‌ها را ارائه می‌دهند'], ['Why families should stop reading', 'چرا خانواده‌ها باید خواندن را متوقف کنند'], ['How to build a puzzle', 'چگونه یک پازل بسازیم']],
      correct: 1,
      explanation: 'The details list several resources and programs that libraries provide.',
      explanationFA: 'جزئیات چندین منبع و برنامه را که کتابخانه‌ها ارائه می‌دهند فهرست می‌کنند.'
    },
    {
      passage: 'A desert may seem empty, but it is full of life. Lizards rest in the shade during the day, cacti store water, and many animals come out at night to avoid the heat.',
      passageFA: 'ممکن است بیابان خالی به نظر برسد، اما پر از زندگی است. مارمولک‌ها در روز در سایه استراحت می‌کنند، کاکتوس‌ها آب ذخیره می‌کنند و بسیاری از جانوران برای دوری از گرما شب‌ها بیرون می‌آیند.',
      question: 'Which idea is supported by all the details?',
      questionFA: 'کدام ایده با همه جزئیات پشتیبانی می‌شود؟',
      options: [['The desert has living things with special adaptations', 'بیابان جاندارانی با سازگاری‌های ویژه دارد'], ['Deserts are always cold', 'بیابان‌ها همیشه سرد هستند'], ['Cacti are animals', 'کاکتوس‌ها جانور هستند'], ['Night is shorter in deserts', 'شب در بیابان کوتاه‌تر است']],
      correct: 0,
      explanation: 'The details show how living things survive desert conditions.',
      explanationFA: 'جزئیات نشان می‌دهند جانداران چگونه در شرایط بیابان زنده می‌مانند.'
    },
    {
      passage: 'Farid wanted to make less trash at lunch. He packed food in reusable containers, filled a metal water bottle, and used a cloth napkin instead of paper ones.',
      passageFA: 'فرید می‌خواست هنگام ناهار زباله کمتری تولید کند. او غذا را در ظرف‌های قابل استفاده دوباره گذاشت، بطری فلزی آب را پر کرد و به‌جای دستمال کاغذی از دستمال پارچه‌ای استفاده کرد.',
      question: 'What is the main idea?',
      questionFA: 'ایده اصلی چیست؟',
      options: [['Farid forgot his lunch', 'فرید ناهارش را فراموش کرد'], ['Farid used different ways to reduce lunch waste', 'فرید از راه‌های مختلف برای کاهش زباله ناهار استفاده کرد'], ['Metal is heavier than paper', 'فلز از کاغذ سنگین‌تر است'], ['Lunch should be shorter', 'ناهار باید کوتاه‌تر باشد']],
      correct: 1,
      explanation: 'Every detail explains a strategy for reducing waste.',
      explanationFA: 'هر جزئیات یک راهبرد برای کاهش زباله را توضیح می‌دهد.'
    },
    {
      passage: 'The city planted young trees along the street. Over time, the trees will provide shade, cool the air, and make the neighborhood more pleasant to walk in.',
      passageFA: 'شهر در امتداد خیابان درختان جوان کاشت. با گذشت زمان، این درختان سایه فراهم می‌کنند، هوا را خنک‌تر می‌کنند و محله را برای پیاده‌روی دلپذیرتر می‌سازند.',
      question: 'Which sentence best states the main idea?',
      questionFA: 'کدام جمله بهترین بیانِ ایده اصلی است؟',
      options: [['Young trees need water', 'درختان جوان به آب نیاز دارند'], ['Planting trees can improve a neighborhood in several ways', 'کاشت درخت می‌تواند از چند جهت یک محله را بهتر کند'], ['Walking is faster than driving', 'پیاده‌روی از رانندگی سریع‌تر است'], ['Cities have many streets', 'شهرها خیابان‌های زیادی دارند']],
      correct: 1,
      explanation: 'The details describe several benefits of planting trees.',
      explanationFA: 'جزئیات چندین فایدهٔ کاشت درخت را توصیف می‌کنند.'
    },
    {
      passage: 'During rehearsal, the choir practiced starting together, listening carefully, and matching pitch. By concert day, the singers sounded confident and blended well.',
      passageFA: 'در طول تمرین، گروه کُر شروع همزمان، گوش دادن دقیق و هماهنگ کردن زیر و بمی صدا را تمرین کرد. تا روز اجرا، خوانندگان مطمئن و هماهنگ به نظر می‌رسیدند.',
      question: 'What is the passage mainly about?',
      questionFA: 'این متن عمدتاً درباره چیست؟',
      options: [['How choir practice improves performance', 'چگونه تمرین گروه کُر اجرا را بهتر می‌کند'], ['Why concerts should be canceled', 'چرا کنسرت‌ها باید لغو شوند'], ['How to build a stage', 'چگونه صحنه بسازیم'], ['Why every singer wears the same shoes', 'چرا هر خواننده کفش یکسان می‌پوشد']],
      correct: 0,
      explanation: 'The details focus on practice habits and the result on concert day.',
      explanationFA: 'جزئیات بر عادت‌های تمرینی و نتیجه در روز اجرا تمرکز دارند.'
    },
    {
      passage: 'Turtles have existed on Earth for millions of years. Their shells protect them, and many species can live in lakes, oceans, or on land.',
      passageFA: 'لاک‌پشت‌ها میلیون‌ها سال است که روی زمین وجود دارند. لاک آن‌ها از آن‌ها محافظت می‌کند و بسیاری از گونه‌ها می‌توانند در دریاچه‌ها، اقیانوس‌ها یا روی خشکی زندگی کنند.',
      question: 'Which idea best combines the details?',
      questionFA: 'کدام ایده بهترین ترکیبِ جزئیات است؟',
      options: [['Turtles are ancient animals with features that help them survive in different habitats', 'لاک‌پشت‌ها جانوران باستانی با ویژگی‌هایی هستند که به آن‌ها کمک می‌کند در زیستگاه‌های گوناگون زنده بمانند'], ['All turtles live in the ocean', 'همه لاک‌پشت‌ها در اقیانوس زندگی می‌کنند'], ['Turtles do not need protection', 'لاک‌پشت‌ها به حفاظت نیاز ندارند'], ['Shells make turtles run fast', 'لاک باعث می‌شود لاک‌پشت‌ها سریع بدوند']],
      correct: 0,
      explanation: 'The details support the idea that turtles are adaptable and well protected.',
      explanationFA: 'جزئیات از این ایده پشتیبانی می‌کنند که لاک‌پشت‌ها سازگار و خوب محافظت‌شده هستند.'
    },
  ];

  return passages.map((p) => explicitQuestion(`${p.passage}\n\n${p.question}`, `${p.passageFA}\n\n${p.questionFA}`, p.options, p.correct, p.explanation, p.explanationFA, {
    hints: ['Look for the idea that includes most of the details.', 'Do not choose a detail that is too narrow.'],
    commonMisconceptions: ['Choosing an interesting detail instead of the whole-text idea'],
    timeEstimate: 85,
  }));
}

function subjectVerbAgreementQuestions() {
  return [
    explicitQuestion('Choose the sentence with correct subject-verb agreement.', 'جمله‌ای را انتخاب کن که هماهنگی درستِ نهاد و فعل دارد.', [['The dogs runs fast.', 'The dogs runs fast.'], ['The dogs run fast.', 'The dogs run fast.'], ['The dogs running fast.', 'The dogs running fast.'], ['The dogs is fast.', 'The dogs is fast.']], 1, 'A plural subject like “dogs” takes the verb “run.”', 'نهاد جمع مانند dogs فعل run می‌گیرد.'),
    explicitQuestion('Which sentence is correct?', 'کدام جمله درست است؟', [['My brother play chess after school.', 'My brother play chess after school.'], ['My brother plays chess after school.', 'My brother plays chess after school.'], ['My brother playing chess after school.', 'My brother playing chess after school.'], ['My brother are chess after school.', 'My brother are chess after school.']], 1, 'A singular third-person subject usually takes a verb ending in -s in the present tense.', 'نهاد مفرد سوم‌شخص در زمان حال معمولاً فعلِ دارای -s می‌گیرد.'),
    explicitQuestion('Fill in the blank: The birds ___ in the tree every morning.', 'جای خالی را پر کن: The birds ___ in the tree every morning.', [['sings', 'sings'], ['sing', 'sing'], ['is singing', 'is singing'], ['was sing', 'was sing']], 1, 'The plural subject “birds” matches the base verb “sing.”', 'نهاد جمع birds با فعل پایه sing هماهنگ است.'),
    explicitQuestion('Which sentence needs correction?', 'کدام جمله نیاز به اصلاح دارد؟', [['The teacher reads aloud.', 'The teacher reads aloud.'], ['My friends enjoy science.', 'My friends enjoy science.'], ['The kitten chase the yarn.', 'The kitten chase the yarn.'], ['The players practice daily.', 'The players practice daily.']], 2, '“Kitten” is singular, so the verb should be “chases.”', 'kitten مفرد است، پس فعل باید chases باشد.'),
    explicitQuestion('Choose the best verb: The class ___ ready for the trip.', 'بهترین فعل را انتخاب کن: The class ___ ready for the trip.', [['are', 'are'], ['is', 'is'], ['be', 'be'], ['were', 'were']], 1, '“Class” is treated as a singular group noun in this sentence.', 'در این جمله class به‌صورت یک اسم گروهی مفرد در نظر گرفته شده است.'),
    explicitQuestion('Which sentence is correct?', 'کدام جمله درست است؟', [['Sara and Lina walks home.', 'Sara and Lina walks home.'], ['Sara and Lina walk home.', 'Sara and Lina walk home.'], ['Sara and Lina walking home.', 'Sara and Lina walking home.'], ['Sara and Lina is home.', 'Sara and Lina is home.']], 1, 'A compound subject joined by “and” is usually plural.', 'نهاد مرکب که با and آمده معمولاً جمع است.'),
    explicitQuestion('Choose the correct verb: One puppy ___ in the basket.', 'فعل درست را انتخاب کن: One puppy ___ in the basket.', [['sleep', 'sleep'], ['sleeps', 'sleeps'], ['sleeping', 'sleeping'], ['are sleeping', 'are sleeping']], 1, '“One puppy” is singular, so it takes “sleeps.”', 'عبارت One puppy مفرد است، پس sleeps می‌گیرد.'),
    explicitQuestion('Which sentence shows correct agreement?', 'کدام جمله هماهنگی درست را نشان می‌دهد؟', [['The boxes is heavy.', 'The boxes is heavy.'], ['The box are heavy.', 'The box are heavy.'], ['The boxes are heavy.', 'The boxes are heavy.'], ['The boxes heavy.', 'The boxes heavy.']], 2, 'A plural subject like “boxes” matches the plural verb “are.”', 'نهاد جمعی مانند boxes با فعل جمع are هماهنگ است.'),
  ];
}

function algorithmQuestions() {
  return [
    explicitQuestion('Which description best defines an algorithm?', 'کدام توصیف بهترین تعریف برای الگوریتم است؟', [['A random guess', 'یک حدس تصادفی'], ['A step-by-step procedure for solving a problem', 'یک روش گام‌به‌گام برای حل مسئله'], ['A broken computer part', 'یک قطعه خراب رایانه'], ['A picture on a screen', 'یک تصویر روی صفحه']], 1, 'An algorithm is a clear sequence of steps for completing a task.', 'الگوریتم دنباله‌ای روشن از گام‌ها برای انجام یک کار است.'),
    explicitQuestion('A student writes directions for making a sandwich. What should come first?', 'دانش‌آموزی برای درست کردن ساندویچ دستور می‌نویسد. چه چیزی باید اول بیاید؟', [['Eat the sandwich', 'ساندویچ را بخور'], ['Place ingredients between slices of bread', 'مواد را بین تکه‌های نان بگذار'], ['Gather the ingredients', 'مواد لازم را جمع کن'], ['Clean the table after eating', 'بعد از خوردن میز را تمیز کن']], 2, 'A useful algorithm begins with needed inputs or materials.', 'یک الگوریتم مفید با مواد یا ورودی‌های لازم شروع می‌شود.'),
    explicitQuestion('What is debugging?', 'اشکال‌زدایی چیست؟', [['Adding more errors to a program', 'اضافه کردن خطاهای بیشتر به برنامه'], ['Finding and fixing mistakes in a procedure or code', 'پیدا کردن و برطرف کردن اشتباه‌ها در یک فرایند یا کد'], ['Turning off a computer', 'خاموش کردن رایانه'], ['Drawing a flowchart with no labels', 'کشیدن یک فلوچارت بدون برچسب']], 1, 'Debugging means locating the source of an error and correcting it.', 'اشکال‌زدایی یعنی پیدا کردن منبع خطا و اصلاح آن.'),
    explicitQuestion('If a robot should move forward, turn right, and stop, which sequence is correct?', 'اگر ربات باید جلو برود، به راست بچرخد و بایستد، کدام ترتیب درست است؟', [['Stop, move forward, turn right', 'ایست، جلو برو، به راست بپیچ'], ['Move forward, turn right, stop', 'جلو برو، به راست بپیچ، ایست'], ['Turn right, stop, move forward', 'به راست بپیچ، ایست، جلو برو'], ['Move forward, stop, turn right', 'جلو برو، ایست، به راست بپیچ']], 1, 'Order matters in algorithms because each step affects the next one.', 'ترتیب در الگوریتم مهم است چون هر گام بر گام بعدی اثر می‌گذارد.'),
    explicitQuestion('Which is the best reason to test an algorithm with sample inputs?', 'بهترین دلیل برای آزمودن یک الگوریتم با ورودی‌های نمونه چیست؟', [['To make it longer', 'برای طولانی‌تر کردن آن'], ['To see whether it works as intended', 'برای دیدن اینکه آیا همان‌طور که می‌خواهیم کار می‌کند یا نه'], ['To hide the steps', 'برای پنهان کردن گام‌ها'], ['To avoid using logic', 'برای پرهیز از منطق']], 1, 'Testing helps reveal mistakes, missing cases, or unclear steps.', 'آزمودن به آشکار شدن اشتباه‌ها، حالت‌های جاافتاده یا گام‌های مبهم کمک می‌کند.'),
    explicitQuestion('Which flowchart symbol usually represents a decision?', 'کدام نماد فلوچارت معمولاً تصمیم را نشان می‌دهد؟', [['Rectangle', 'مستطیل'], ['Diamond', 'لوزی'], ['Circle', 'دایره'], ['Arrow', 'فلش']], 1, 'A diamond is commonly used for yes/no or true/false decisions.', 'لوزی معمولاً برای تصمیم‌های بله/خیر یا درست/نادرست به کار می‌رود.'),
    explicitQuestion('A program should repeat a step 5 times. Which structure is most useful?', 'برنامه باید یک گام را ۵ بار تکرار کند. کدام ساختار مفیدتر است؟', [['A loop', 'حلقه'], ['A battery', 'باتری'], ['A file name', 'نام فایل'], ['A screenshot', 'تصویر صفحه']], 0, 'Loops repeat instructions efficiently.', 'حلقه‌ها دستورها را به‌صورت کارآمد تکرار می‌کنند.'),
    explicitQuestion('Which statement best explains decomposition in computing?', 'کدام عبارت بهترین توضیح برای تجزیه در رایانش است؟', [['Breaking a big problem into smaller parts', 'شکستن یک مسئله بزرگ به بخش‌های کوچک‌تر'], ['Making a problem more confusing', 'پیچیده‌تر کردن یک مسئله'], ['Deleting all data', 'پاک کردن همه داده‌ها'], ['Turning text into images', 'تبدیل متن به تصویر']], 0, 'Decomposition makes complex problems easier to solve and test.', 'تجزیه باعث می‌شود حل و آزمودن مسئله‌های پیچیده آسان‌تر شود.'),
  ];
}

function aiBiasQuestions() {
  return [
    explicitQuestion('What is AI bias?', 'سوگیری در هوش مصنوعی چیست؟', [['When an AI system always runs quickly', 'وقتی یک سامانه هوش مصنوعی همیشه سریع اجرا می‌شود'], ['When an AI system gives unfairly skewed results to some groups', 'وقتی سامانه هوش مصنوعی برای برخی گروه‌ها نتایج ناعادلانه و کج‌دار می‌دهد'], ['When an AI system uses electricity', 'وقتی سامانه هوش مصنوعی از برق استفاده می‌کند'], ['When an AI system is offline', 'وقتی سامانه هوش مصنوعی آفلاین است']], 1, 'AI bias happens when system outputs systematically disadvantage or misrepresent some people.', 'سوگیری هوش مصنوعی وقتی رخ می‌دهد که خروجی‌های سامانه به‌طور نظام‌مند به برخی افراد آسیب بزند یا آن‌ها را نادرست بازنمایی کند.'),
    explicitQuestion('Which practice helps reduce bias in an AI system?', 'کدام کار به کاهش سوگیری در یک سامانه هوش مصنوعی کمک می‌کند؟', [['Using only one type of data from one group', 'استفاده از یک نوع داده فقط از یک گروه'], ['Reviewing data for representation and fairness', 'بازبینی داده‌ها از نظر نمایندگی و انصاف'], ['Ignoring user feedback', 'نادیده گرفتن بازخورد کاربران'], ['Never testing the system', 'هرگز سامانه را آزمایش نکردن']], 1, 'Fair AI design includes checking whether the training data represents different groups well.', 'طراحی منصفانه هوش مصنوعی شامل بررسی این است که آیا داده‌های آموزشی گروه‌های مختلف را به‌خوبی نمایندگی می‌کنند یا نه.'),
    explicitQuestion('Why is human oversight important when AI is used in schools or hiring?', 'چرا نظارت انسانی وقتی از هوش مصنوعی در مدرسه یا استخدام استفاده می‌شود مهم است؟', [['Because AI never makes mistakes', 'چون هوش مصنوعی هرگز اشتباه نمی‌کند'], ['Because people can review context and question unfair outputs', 'چون انسان‌ها می‌توانند زمینه را بررسی و خروجی‌های ناعادلانه را زیر سوال ببرند'], ['Because computers cannot store data', 'چون رایانه‌ها نمی‌توانند داده ذخیره کنند'], ['Because oversight makes systems more biased', 'چون نظارت سامانه‌ها را سوگیرتر می‌کند']], 1, 'Human review helps catch errors, missing context, and harmful patterns.', 'بازبینی انسانی به شناسایی خطاها، زمینه‌های جاافتاده و الگوهای زیان‌بار کمک می‌کند.'),
    explicitQuestion('An AI translation tool works poorly for a regional dialect. What is the most likely cause?', 'یک ابزار ترجمه هوش مصنوعی برای یک گویش محلی خوب کار نمی‌کند. محتمل‌ترین علت چیست؟', [['It was trained with no language data at all', 'اصلاً با هیچ داده زبانی آموزش ندیده است'], ['The training data may not include enough examples of that dialect', 'ممکن است داده‌های آموزشی نمونه‌های کافی از آن گویش نداشته باشند'], ['Dialects cannot be translated', 'گویش‌ها قابل ترجمه نیستند'], ['The internet stopped working', 'اینترنت قطع شده است']], 1, 'Systems perform worse for underrepresented patterns in the training data.', 'سامانه‌ها برای الگوهای کم‌نماینده در داده‌های آموزشی ضعیف‌تر عمل می‌کنند.'),
    explicitQuestion('Which question is best to ask when evaluating AI fairness?', 'بهترین پرسش هنگام ارزیابی انصاف هوش مصنوعی کدام است؟', [['Is the screen bright enough?', 'آیا صفحه به اندازه کافی روشن است؟'], ['Who might be helped or harmed by this system?', 'چه کسانی ممکن است از این سامانه سود ببرند یا آسیب ببینند؟'], ['Can it print in color?', 'آیا می‌تواند رنگی چاپ کند؟'], ['Does it have a logo?', 'آیا لوگو دارد؟']], 1, 'Fairness evaluation considers impacts on different groups of people.', 'ارزیابی انصاف اثر سامانه بر گروه‌های مختلف مردم را در نظر می‌گیرد.'),
    explicitQuestion('Why should users know when AI is making a recommendation?', 'چرا کاربران باید بدانند چه زمانی هوش مصنوعی در حال ارائه توصیه است؟', [['To make the system secret', 'برای مخفی نگه داشتن سامانه'], ['To support transparency and informed decision-making', 'برای پشتیبانی از شفافیت و تصمیم‌گیری آگاهانه'], ['Because AI recommendations are always correct', 'چون توصیه‌های هوش مصنوعی همیشه درست است'], ['To remove accountability', 'برای حذف مسئولیت‌پذیری']], 1, 'Transparency helps people decide how much to trust or verify an output.', 'شفافیت به مردم کمک می‌کند تصمیم بگیرند تا چه اندازه به خروجی اعتماد کنند یا آن را بررسی کنند.'),
    explicitQuestion('What is one sign that an AI model should be reviewed before deployment?', 'یک نشانه که مدل هوش مصنوعی باید پیش از استقرار بازبینی شود چیست؟', [['It gives much lower accuracy for one group than another', 'برای یک گروه دقت بسیار کمتری نسبت به گروه دیگر دارد'], ['It saves files correctly', 'فایل‌ها را درست ذخیره می‌کند'], ['It runs on a laptop', 'روی لپ‌تاپ اجرا می‌شود'], ['It uses short code', 'از کد کوتاه استفاده می‌کند']], 0, 'Large performance gaps across groups can signal unfairness or poor data coverage.', 'اختلاف زیاد در عملکرد بین گروه‌ها می‌تواند نشانه ناعادلانه بودن یا پوشش ضعیف داده باشد.'),
    explicitQuestion('Which design choice best supports responsible AI?', 'کدام انتخاب طراحی بیشترین پشتیبانی را از هوش مصنوعی مسئولانه می‌کند؟', [['Hiding training data decisions', 'پنهان کردن تصمیم‌های مربوط به داده آموزشی'], ['Documenting data sources, limitations, and review steps', 'مستندسازی منابع داده، محدودیت‌ها و گام‌های بازبینی'], ['Skipping evaluation to save time', 'حذف ارزیابی برای صرفه‌جویی در زمان'], ['Removing all humans from the process', 'حذف همه انسان‌ها از فرایند']], 1, 'Documentation makes systems more auditable, understandable, and accountable.', 'مستندسازی سامانه‌ها را قابل ممیزی، قابل فهم و مسئولانه‌تر می‌کند.'),
  ];
}

function robotQuestions() {
  return [
    explicitQuestion('Which sensor is most useful for a robot that must stop before hitting a wall?', 'کدام حسگر برای رباتی که باید پیش از برخورد با دیوار بایستد مفیدتر است؟', [['Temperature sensor', 'حسگر دما'], ['Distance sensor', 'حسگر فاصله'], ['Sound speaker', 'بلندگو'], ['Battery meter only', 'فقط نشانگر باتری']], 1, 'A distance sensor detects how close the robot is to an obstacle.', 'حسگر فاصله تشخیص می‌دهد ربات چقدر به مانع نزدیک است.'),
    explicitQuestion('A line-following robot keeps losing the path. Which sensor should be checked first?', 'یک ربات دنبال‌کننده خط مدام مسیر را گم می‌کند. کدام حسگر باید اول بررسی شود؟', [['Light or color sensor', 'حسگر نور یا رنگ'], ['Temperature sensor', 'حسگر دما'], ['Moisture sensor', 'حسگر رطوبت'], ['Compass only', 'فقط قطب‌نما']], 0, 'Line-following robots usually depend on light or color contrast sensors.', 'ربات‌های دنبال‌کننده خط معمولاً به حسگرهای تفاوت نور یا رنگ وابسته‌اند.'),
    explicitQuestion('What is the purpose of a control loop in robotics?', 'هدف از حلقه کنترل در رباتیک چیست؟', [['To decorate the robot', 'برای تزئین ربات'], ['To repeatedly sense, decide, and act', 'برای حس کردن، تصمیم گرفتن و عمل کردن به‌صورت تکراری'], ['To reduce all motion', 'برای کاهش همه حرکت‌ها'], ['To replace the battery', 'برای تعویض باتری']], 1, 'Robots use control loops to keep updating their actions based on sensor input.', 'ربات‌ها از حلقه‌های کنترل برای به‌روزرسانی مداوم عمل خود براساس ورودی حسگر استفاده می‌کنند.'),
    explicitQuestion('If a robot turns too far every time, what is the best first adjustment?', 'اگر ربات هر بار بیش از حد بچرخد، بهترین تنظیم اولیه چیست؟', [['Increase turn time or motor power', 'زمان چرخش یا قدرت موتور را بیشتر کن'], ['Reduce turn time or motor power', 'زمان چرخش یا قدرت موتور را کمتر کن'], ['Remove the sensors', 'حسگرها را بردار'], ['Change the robot’s color', 'رنگ ربات را عوض کن']], 1, 'Overshooting a turn often means the turning command is too strong or too long.', 'زیاد چرخیدن معمولاً یعنی فرمان چرخش بیش از حد قوی یا طولانی است.'),
    explicitQuestion('Which action best uses sensor feedback?', 'کدام عمل بهترین استفاده را از بازخورد حسگر می‌کند؟', [['The robot always moves forward no matter what it senses', 'ربات همیشه بدون توجه به حسگرها جلو می‌رود'], ['The robot slows down when an object gets closer', 'ربات وقتی جسم نزدیک‌تر می‌شود سرعتش را کم می‌کند'], ['The robot ignores the line sensor', 'ربات حسگر خط را نادیده می‌گیرد'], ['The robot never changes direction', 'ربات هرگز جهت را تغییر نمی‌دهد']], 1, 'Sensor feedback allows behavior to change in response to conditions.', 'بازخورد حسگر باعث می‌شود رفتار ربات در پاسخ به شرایط تغییر کند.'),
    explicitQuestion('Why might a robot need a gyro sensor?', 'چرا ممکن است یک ربات به حسگر ژیروسکوپ نیاز داشته باشد؟', [['To measure temperature', 'برای اندازه‌گیری دما'], ['To sense rotation and orientation changes', 'برای تشخیص چرخش و تغییر جهت'], ['To taste food', 'برای چشیدن غذا'], ['To store programs', 'برای ذخیره برنامه‌ها']], 1, 'Gyro sensors help robots measure turning and stabilize movement.', 'ژیروسکوپ به ربات کمک می‌کند میزان چرخش را اندازه بگیرد و حرکت را پایدار کند.'),
    explicitQuestion('A robot must sort metal and plastic objects. Which sensor or mechanism is most useful?', 'یک ربات باید اشیای فلزی و پلاستیکی را جدا کند. کدام حسگر یا سازوکار مفیدتر است؟', [['Magnet or metal detector', 'آهنربا یا آشکارساز فلز'], ['Humidity sensor', 'حسگر رطوبت'], ['Light bulb', 'لامپ'], ['Speaker', 'بلندگو']], 0, 'Metal detection or magnetic interaction can distinguish metal from plastic.', 'تشخیص فلز یا تعامل مغناطیسی می‌تواند فلز را از پلاستیک جدا کند.'),
    explicitQuestion('What is the best reason to test a robot in the real environment where it will work?', 'بهترین دلیل برای آزمایش ربات در محیط واقعی کار چیست؟', [['Real environments reveal conditions the robot must handle', 'محیط واقعی شرایطی را آشکار می‌کند که ربات باید با آن‌ها کنار بیاید'], ['Real environments remove the need for sensors', 'محیط واقعی نیاز به حسگر را از بین می‌برد'], ['Real environments make code unnecessary', 'محیط واقعی کد را غیرضروری می‌کند'], ['Real environments always make robots faster', 'محیط واقعی همیشه ربات‌ها را سریع‌تر می‌کند']], 0, 'Testing in context helps identify lighting, surface, spacing, and obstacle issues.', 'آزمودن در محیط واقعی به شناسایی مشکل‌های نور، سطح، فاصله و موانع کمک می‌کند.'),
  ];
}

function citizenshipQuestions() {
  return [
    explicitQuestion('Which action is an example of responsible citizenship at school?', 'کدام عمل نمونه‌ای از شهروندی مسئولانه در مدرسه است؟', [['Ignoring school rules', 'نادیده گرفتن قوانین مدرسه'], ['Helping keep shared spaces clean', 'کمک به تمیز نگه داشتن فضاهای مشترک'], ['Damaging library books', 'آسیب زدن به کتاب‌های کتابخانه'], ['Talking over everyone in class', 'حرف زدن روی صحبت دیگران در کلاس']], 1, 'Responsible citizens care for shared spaces and the wellbeing of others.', 'شهروندان مسئول از فضاهای مشترک و رفاه دیگران مراقبت می‌کنند.'),
    explicitQuestion('Why is voting important in a democracy?', 'چرا رأی دادن در یک دموکراسی مهم است؟', [['It lets one person make all decisions', 'به یک نفر اجازه می‌دهد همه تصمیم‌ها را بگیرد'], ['It gives citizens a voice in choosing leaders and policies', 'به شهروندان در انتخاب رهبران و سیاست‌ها حق اظهار نظر می‌دهد'], ['It removes all disagreements', 'همه اختلاف‌نظرها را از بین می‌برد'], ['It only matters to children', 'فقط برای کودکان مهم است']], 1, 'Voting is one way citizens participate in government.', 'رأی دادن یکی از راه‌های مشارکت شهروندان در حکومت است.'),
    explicitQuestion('Which statement best describes a community responsibility?', 'کدام عبارت بهترین توصیف برای یک مسئولیت اجتماعی است؟', [['Respecting others and following fair rules', 'احترام به دیگران و پیروی از قوانین منصفانه'], ['Taking things that belong to others', 'برداشتن وسایل دیگران'], ['Ignoring safety signs', 'نادیده گرفتن علائم ایمنی'], ['Preventing others from speaking', 'جلوگیری از صحبت کردن دیگران']], 0, 'Communities work better when people act respectfully and follow agreed rules.', 'وقتی مردم محترمانه رفتار کنند و از قوانین پذیرفته‌شده پیروی کنند، جامعه بهتر عمل می‌کند.'),
    explicitQuestion('A town plans a new park. Which action shows civic participation?', 'شهری قصد ساخت یک پارک جدید را دارد. کدام عمل مشارکت مدنی را نشان می‌دهد؟', [['Reading about the plan and sharing ideas at a meeting', 'خواندن طرح و بیان نظرها در یک جلسه'], ['Breaking the playground equipment', 'شکستن وسایل زمین بازی'], ['Ignoring all information about the plan', 'نادیده گرفتن همه اطلاعات مربوط به طرح'], ['Spreading false rumors', 'پخش شایعات نادرست']], 0, 'Civic participation means engaging in decisions that affect the community.', 'مشارکت مدنی یعنی در تصمیم‌هایی که بر جامعه اثر می‌گذارند درگیر شدن.'),
    explicitQuestion('Which is a right of citizens in many societies?', 'کدام مورد در بسیاری از جوامع از حقوق شهروندان است؟', [['To be treated fairly under the law', 'اینکه زیر قانون منصفانه با آن‌ها رفتار شود'], ['To break laws without consequence', 'قانون‌شکنی بدون پیامد'], ['To prevent others from learning', 'جلوگیری از یادگیری دیگران'], ['To damage public property', 'آسیب زدن به اموال عمومی']], 0, 'Rights protect people, while responsibilities guide how they act toward others.', 'حقوق از مردم محافظت می‌کند، و مسئولیت‌ها راهنمای رفتار آن‌ها نسبت به دیگران است.'),
    explicitQuestion('Why are community rules useful?', 'چرا قوانین اجتماعی مفید هستند؟', [['They make all people identical', 'همه مردم را یکسان می‌کنند'], ['They help people live and work together safely and fairly', 'به مردم کمک می‌کنند با ایمنی و انصاف در کنار هم زندگی و کار کنند'], ['They remove every problem forever', 'همه مشکلات را برای همیشه از بین می‌برند'], ['They are only for emergencies', 'فقط برای شرایط اضطراری هستند']], 1, 'Rules can support safety, fairness, and cooperation.', 'قوانین می‌توانند از ایمنی، انصاف و همکاری پشتیبانی کنند.'),
    explicitQuestion('What is the best response when people in a community disagree?', 'وقتی مردم یک جامعه اختلاف‌نظر دارند، بهترین پاسخ چیست؟', [['Listen, discuss evidence, and seek a fair solution', 'گوش دادن، گفت‌وگو بر اساس شواهد، و جست‌وجوی راه‌حل منصفانه'], ['Refuse to listen to anyone', 'امتناع از گوش دادن به دیگران'], ['Use insults to win the argument', 'استفاده از توهین برای بردن بحث'], ['Ignore the issue forever', 'نادیده گرفتن همیشگی موضوع']], 0, 'Healthy communities solve disagreements through respectful dialogue and evidence-based reasoning.', 'جامعه‌های سالم اختلاف‌نظرها را با گفت‌وگوی محترمانه و استدلال مبتنی بر شواهد حل می‌کنند.'),
    explicitQuestion('Which example best shows serving the common good?', 'کدام مثال بهترین نمونه برای خدمت به خیر عمومی است؟', [['Planting trees in a shared park', 'کاشتن درخت در یک پارک عمومی'], ['Taking all the sports equipment home', 'بردن همه وسایل ورزشی به خانه'], ['Blocking access to a public sidewalk', 'مسدود کردن دسترسی به پیاده‌رو عمومی'], ['Ignoring recycling bins', 'نادیده گرفتن سطل‌های بازیافت']], 0, 'Serving the common good means acting in ways that benefit the wider community.', 'خدمت به خیر عمومی یعنی به شکلی عمل کنیم که به جامعه گسترده‌تر سود برساند.'),
  ];
}

function mapSkillQuestions() {
  return [
    explicitQuestion('What does a map key help a reader understand?', 'راهنمای نقشه به خواننده کمک می‌کند چه چیزی را بفهمد؟', [['The meaning of symbols on the map', 'معنای نمادهای روی نقشه'], ['The weather tomorrow', 'هوای فردا'], ['Who drew the map', 'چه کسی نقشه را کشیده'], ['The age of the paper', 'سن کاغذ']], 0, 'A map key or legend explains what symbols and colors represent.', 'راهنمای نقشه یا لِجند توضیح می‌دهد نمادها و رنگ‌ها چه چیزی را نشان می‌دهند.'),
    explicitQuestion('If the scale says 1 centimeter = 2 kilometers, what does 4 centimeters represent?', 'اگر مقیاس بگوید ۱ سانتی‌متر = ۲ کیلومتر، ۴ سانتی‌متر چه چیزی را نشان می‌دهد؟', [['2 kilometers', '۲ کیلومتر'], ['4 kilometers', '۴ کیلومتر'], ['6 kilometers', '۶ کیلومتر'], ['8 kilometers', '۸ کیلومتر']], 3, 'Multiply the map distance by the scale factor.', 'فاصله روی نقشه را در ضریب مقیاس ضرب کن.'),
    explicitQuestion('Which direction is opposite of east?', 'کدام جهت مقابل شرق است؟', [['North', 'شمال'], ['South', 'جنوب'], ['West', 'غرب'], ['Northeast', 'شمال‌شرق']], 2, 'West is opposite east on a compass rose.', 'غرب در قطب‌نما مقابل شرق است.'),
    explicitQuestion('What do coordinates help you do on a map grid?', 'مختصات در شبکه نقشه به چه کاری کمک می‌کنند؟', [['Color the map', 'رنگ‌آمیزی نقشه'], ['Find an exact location', 'پیدا کردن یک مکان دقیق'], ['Measure temperature', 'اندازه‌گیری دما'], ['Predict earthquakes', 'پیش‌بینی زلزله']], 1, 'Coordinates identify precise positions using a grid system.', 'مختصات با استفاده از یک دستگاه شبکه‌ای موقعیت‌های دقیق را مشخص می‌کنند.'),
    explicitQuestion('A map shows a blue line running through a city. What does it most likely represent?', 'نقشه یک خط آبی را که از میان شهر می‌گذرد نشان می‌دهد. به احتمال زیاد چه چیزی را نشان می‌دهد؟', [['A road', 'جاده'], ['A river', 'رودخانه'], ['A border wall', 'دیوار مرزی'], ['A mountain trail only', 'فقط مسیر کوهستانی']], 1, 'Blue on physical maps commonly represents water features.', 'رنگ آبی در نقشه‌های طبیعی معمولاً پدیده‌های آبی را نشان می‌دهد.'),
    explicitQuestion('Why is a compass rose useful?', 'چرا قطب‌نما روی نقشه مفید است؟', [['It tells the map price', 'قیمت نقشه را می‌گوید'], ['It shows direction', 'جهت را نشان می‌دهد'], ['It changes the scale', 'مقیاس را تغییر می‌دهد'], ['It lists all cities', 'همه شهرها را فهرست می‌کند']], 1, 'A compass rose helps readers orient themselves using north, south, east, and west.', 'قطب‌نما به خواننده کمک می‌کند با استفاده از شمال، جنوب، شرق و غرب جهت‌یابی کند.'),
    explicitQuestion('Which map would be best for planning a road trip between cities?', 'کدام نوع نقشه برای برنامه‌ریزی سفر جاده‌ای بین شهرها مناسب‌تر است؟', [['A political map with roads marked', 'نقشه سیاسی با راه‌ها'], ['A star map', 'نقشه ستارگان'], ['A weather chart only', 'فقط نمودار هوا'], ['A painting of the landscape', 'نقاشی منظره']], 0, 'A road or political map can help show city locations and transportation routes.', 'نقشه راه یا سیاسی می‌تواند موقعیت شهرها و مسیرهای رفت‌وآمد را نشان دهد.'),
    explicitQuestion('If a town is north of the lake and east of the school, where is the lake compared with the town?', 'اگر یک شهر شمال دریاچه و شرق مدرسه باشد، دریاچه نسبت به شهر در کجا قرار دارد؟', [['North', 'شمال'], ['South', 'جنوب'], ['East', 'شرق'], ['Northeast', 'شمال‌شرق']], 1, 'If the town is north of the lake, then the lake is south of the town.', 'اگر شهر شمال دریاچه باشد، دریاچه در جنوب شهر قرار دارد.'),
  ];
}

function buildQuestionSet(skillDef) {
  switch (skillDef.code) {
    case 'MATH_ADD_WITHIN_20':
      return withAdaptiveFields(skillDef, additionQuestions());
    case 'MATH_PLACE_VALUE_3_DIGIT':
      return withAdaptiveFields(skillDef, placeValueQuestions());
    case 'MATH_MULTIPLICATION_FACTS':
      return withAdaptiveFields(skillDef, multiplicationQuestions());
    case 'MATH_EQUIVALENT_FRACTIONS':
      return withAdaptiveFields(skillDef, fractionQuestions());
    case 'MATH_DECIMALS_PLACE_VALUE':
      return withAdaptiveFields(skillDef, decimalQuestions());
    case 'MATH_ONE_STEP_EQUATIONS':
      return withAdaptiveFields(skillDef, oneStepEquationQuestions());
    case 'MATH_PROPORTIONAL_RELATIONSHIPS':
      return withAdaptiveFields(skillDef, proportionalQuestions());
    case 'MATH_QUADRATIC_FACTORING':
      return withAdaptiveFields(skillDef, quadraticQuestions());
    case 'SCI_STATES_OF_MATTER':
      return withAdaptiveFields(skillDef, statesOfMatterQuestions());
    case 'SCI_ECOSYSTEMS':
      return withAdaptiveFields(skillDef, ecosystemQuestions());
    case 'SCI_FORCES_AND_MOTION':
      return withAdaptiveFields(skillDef, forcesQuestions());
    case 'SCI_CHEMICAL_REACTIONS':
      return withAdaptiveFields(skillDef, chemicalReactionQuestions());
    case 'ENG_MAIN_IDEA':
      return withAdaptiveFields(skillDef, mainIdeaQuestions());
    case 'ENG_SUBJECT_VERB_AGREEMENT':
      return withAdaptiveFields(skillDef, subjectVerbAgreementQuestions());
    case 'CS_ALGORITHMS':
      return withAdaptiveFields(skillDef, algorithmQuestions());
    case 'AI_BIAS_FAIRNESS':
      return withAdaptiveFields(skillDef, aiBiasQuestions());
    case 'ROBOT_SENSOR_CONTROL':
      return withAdaptiveFields(skillDef, robotQuestions());
    case 'SOC_CITIZENSHIP':
      return withAdaptiveFields(skillDef, citizenshipQuestions());
    case 'SOC_MAP_SKILLS':
      return withAdaptiveFields(skillDef, mapSkillQuestions());
    default:
      return [];
  }
}

function getBandForGradeCode(gradeCode) {
  const match = GRADE_LEVELS.find((g) => g.code === gradeCode);
  return match ? match.gradeBand : GradeBand.PRIMARY;
}

async function ensureGradeLevels() {
  const map = new Map();
  for (const grade of GRADE_LEVELS) {
    const record = await prisma.gradeLevel.upsert({
      where: { code: grade.code },
      update: {
        name: grade.name,
        nameFA: grade.nameFA,
        order: grade.order,
        gradeBand: grade.gradeBand,
      },
      create: grade,
    });
    map.set(grade.code, record);
  }
  return map;
}

async function ensureSubjects() {
  const map = new Map();
  for (const subject of SUBJECTS) {
    const record = await prisma.subject.upsert({
      where: { code: subject.code },
      update: {
        name: subject.name,
        nameFA: subject.nameFA,
        icon: subject.icon,
        color: subject.color,
        description: subject.description,
      },
      create: subject,
    });
    map.set(subject.code, record);
  }
  return map;
}

async function ensureStrands(subjects) {
  const map = new Map();
  for (const strand of STRANDS) {
    const subject = subjects.get(strand.subjectCode);
    const record = await prisma.strand.upsert({
      where: {
        subjectId_code: {
          subjectId: subject.id,
          code: strand.code,
        },
      },
      update: {
        name: strand.name,
        nameFA: strand.nameFA,
        order: strand.order,
      },
      create: {
        subjectId: subject.id,
        code: strand.code,
        name: strand.name,
        nameFA: strand.nameFA,
        order: strand.order,
      },
    });
    map.set(`${strand.subjectCode}:${strand.code}`, record);
  }
  return map;
}

async function ensureSkills(subjects, strands) {
  const map = new Map();
  for (const skill of SKILL_DEFINITIONS) {
    const subject = subjects.get(skill.subjectCode);
    const strand = strands.get(`${skill.subjectCode}:${skill.strandCode}`);
    const band = getBandForGradeCode(skill.gradeCode);
    const record = await prisma.skill.upsert({
      where: { code: skill.code },
      update: {
        name: skill.name,
        nameFA: skill.nameFA,
        description: skill.description,
        descriptionFA: skill.descriptionFA,
        subjectId: subject.id,
        strandId: strand.id,
        gradeBandMin: band,
        gradeBandMax: band,
        order: skill.order,
        isActive: true,
      },
      create: {
        code: skill.code,
        name: skill.name,
        nameFA: skill.nameFA,
        description: skill.description,
        descriptionFA: skill.descriptionFA,
        subjectId: subject.id,
        strandId: strand.id,
        gradeBandMin: band,
        gradeBandMax: band,
        order: skill.order,
      },
    });
    map.set(skill.code, record);
  }
  return map;
}

async function ensurePrerequisites(skills) {
  const links = [
    ['MATH_PLACE_VALUE_3_DIGIT', 'MATH_ADD_WITHIN_20'],
    ['MATH_MULTIPLICATION_FACTS', 'MATH_PLACE_VALUE_3_DIGIT'],
    ['MATH_EQUIVALENT_FRACTIONS', 'MATH_MULTIPLICATION_FACTS'],
    ['MATH_DECIMALS_PLACE_VALUE', 'MATH_EQUIVALENT_FRACTIONS'],
    ['MATH_PROPORTIONAL_RELATIONSHIPS', 'MATH_EQUIVALENT_FRACTIONS'],
    ['MATH_ONE_STEP_EQUATIONS', 'MATH_PROPORTIONAL_RELATIONSHIPS'],
    ['MATH_QUADRATIC_FACTORING', 'MATH_ONE_STEP_EQUATIONS'],
  ];

  for (const [skillCode, prereqCode] of links) {
    const skill = skills.get(skillCode);
    const prerequisite = skills.get(prereqCode);
    if (!skill || !prerequisite) continue;

    await prisma.skillPrerequisite.upsert({
      where: {
        skillId_prerequisiteId: {
          skillId: skill.id,
          prerequisiteId: prerequisite.id,
        },
      },
      update: { isRequired: true },
      create: {
        skillId: skill.id,
        prerequisiteId: prerequisite.id,
        isRequired: true,
      },
    });
  }
}

async function createQuestionIfMissing(skillDef, skillRecord, gradeLevelRecord, questionData) {
  const existing = await prisma.question.findFirst({
    where: {
      skillId: skillRecord.id,
      stem: questionData.stem,
    },
    select: { id: true },
  });

  if (existing) {
    return { created: false, id: existing.id };
  }

  const question = await prisma.question.create({
    data: {
      type: questionData.type,
      stem: questionData.stem,
      stemFA: questionData.stemFA,
      explanation: questionData.explanation,
      explanationFA: questionData.explanationFA,
      difficulty: questionData.difficulty,
      bloomLevel: questionData.bloomLevel,
      points: questionData.points,
      gradeLevelId: gradeLevelRecord.id,
      skillId: skillRecord.id,
      irtDifficulty: questionData.irtDifficulty,
      irtDiscrimination: questionData.irtDiscrimination,
      irtGuessing: questionData.irtGuessing,
      timeEstimate: questionData.timeEstimate,
      hints: questionData.hints,
      commonMisconceptions: questionData.commonMisconceptions,
      metadata: questionData.metadata,
      options: {
        create: (questionData.options || []).map((option, index) => ({
          text: option.text,
          textFA: option.textFA,
          isCorrect: option.isCorrect,
          feedback: option.feedback,
          feedbackFA: option.feedbackFA,
          order: option.order || index + 1,
        })),
      },
    },
  });

  return { created: true, id: question.id };
}

async function seedQuestions(skills, gradeLevels) {
  let createdQuestions = 0;
  for (const skillDef of SKILL_DEFINITIONS) {
    const skillRecord = skills.get(skillDef.code);
    const gradeLevel = gradeLevels.get(skillDef.gradeCode);
    const questions = buildQuestionSet(skillDef);
    let createdForSkill = 0;

    for (const question of questions) {
      const result = await createQuestionIfMissing(skillDef, skillRecord, gradeLevel, question);
      if (result.created) {
        createdQuestions += 1;
        createdForSkill += 1;
      }
    }

    const totalForSkill = await prisma.question.count({ where: { skillId: skillRecord.id } });
    console.log(`• ${skillDef.code}: +${createdForSkill} created (${totalForSkill} total)`);
  }
  return createdQuestions;
}

async function main() {
  console.log('📚 Filling the question bank with standards-aligned original questions...');
  const gradeLevels = await ensureGradeLevels();
  const subjects = await ensureSubjects();
  const strands = await ensureStrands(subjects);
  const skills = await ensureSkills(subjects, strands);
  await ensurePrerequisites(skills);
  const createdQuestions = await seedQuestions(skills, gradeLevels);

  const totalQuestions = await prisma.question.count();
  const totalSkills = await prisma.skill.count();

  console.log('\n✅ Question bank update completed.');
  console.log(`   New questions created: ${createdQuestions}`);
  console.log(`   Total questions in bank: ${totalQuestions}`);
  console.log(`   Total active skills: ${totalSkills}`);
  console.log('   Coverage: Math, Science, English, CS, AI, Robotics, Social Studies');
  console.log('   Design note: all new items are original, bilingual, skill-linked, and tagged for adaptive use.');
}

main()
  .catch((error) => {
    console.error('❌ Failed to fill the question bank:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
