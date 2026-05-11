# Question Bank Development Guide

## Overview
This guide provides instructions for building a comprehensive K-12 question bank covering all subjects and grade levels while following the 5E/5ت learning cycle pedagogy and respecting copyright.

## Table of Contents
1. [Current Status](#current-status)
2. [Question Bank Structure](#question-bank-structure)
3. [5E/5ت Learning Cycle](#5e5ت-learning-cycle)
4. [Adding Questions](#adding-questions)
5. [Open Educational Resources](#open-educational-resources)
6. [Curriculum Alignment](#curriculum-alignment)
7. [Quality Standards](#quality-standards)

---

## Current Status

### ✅ Completed
- **14 Core Subjects** seeded in database:
  - Mathematics (MATH) - ریاضیات
  - Science (SCI) - علوم
  - English Language (ENG) - زبان انگلیسی
  - Persian Literature (PER_LIT) - ادبیات فارسی
  - Social Studies (SOC) - مطالعات اجتماعی
  - Computer Science (CS) - علوم کامپیوتر
  - **Robotics (ROBOT)** - رباتیک ✨
  - **Artificial Intelligence (AI)** - هوش مصنوعی ✨
  - **Entrepreneurship (ENTREP)** - کارآفرینی ✨
  - Visual Arts (ART) - هنرهای تجسمی
  - Music (MUS) - موسیقی
  - Physical Education (PE) - تربیت بدنی
  - Social-Emotional Learning (SEL) - یادگیری اجتماعی-عاطفی
  - Ethics & Philosophy (ETHICS) - اخلاق و فلسفه

- **13 Grade Levels**: KG through Grade 12
- **Sample Questions**: 6 questions across 5 subjects demonstrating 5E phases
- **Database Integration**: Subjects now persist in PostgreSQL (no longer in-memory)

### 🚧 Needs Expansion
- Questions for remaining 9 subjects
- Full K-12 coverage for each subject (currently only 1-2 grades per subject)
- Multiple questions per grade/phase combination
- Difficulty levels: EASY, MEDIUM, HARD, EXPERT
- Bloom's Taxonomy levels: REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE

---

## Question Bank Structure

### Database Schema
Questions are stored with the following structure:

```typescript
model Question {
  id            String        @id @default(cuid())
  type          QuestionType  // MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY, MATCHING
  stem          String        // Question text in English
  stemFA        String?       // Question text in Persian
  explanation   String?       // Answer explanation (English)
  explanationFA String?       // Answer explanation (Persian)
  difficulty    Difficulty    // EASY, MEDIUM, HARD, EXPERT
  bloomLevel    BloomLevel    // REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE
  points        Int           // Default: 1
  gradeLevelId  String?       // Links to GradeLevel (e.g., "G5", "G10")
  standardId    String?       // Links to curriculum Standard
  metadata      Json?         // Additional data including phase5E, subjectCode
  
  options       QuestionOption[]  // For multiple choice questions
}
```

### Question Types
- **MULTIPLE_CHOICE**: Single or multi-select with options
- **TRUE_FALSE**: Binary choice
- **SHORT_ANSWER**: Brief text response
- **ESSAY**: Extended written response
- **MATCHING**: Pair items from two lists

---

## 5E/5ت Learning Cycle

Every question MUST be tagged with one of the five phases:

### English (5E) → Persian (5ت)

| Phase | Code | English | Persian | Purpose | Question Examples |
|-------|------|---------|---------|---------|-------------------|
| **Engage** | `5E_ENGAGE` | Engage | **تأثیر** (Ta'sir) | Hook learners, spark curiosity | "What happens to ice on a hot day?", "Have you ever seen a robot?" |
| **Explore** | `5E_EXPLORE` | Explore | **تحقیق** (Tahqiq) | Investigate, experiment | "Use blocks to make groups of 5", "Try sorting shapes by size" |
| **Explain** | `5E_EXPLAIN` | Explain | **توضیح** (Towzih) | Clarify concepts | "What is photosynthesis?", "Define entrepreneurship" |
| **Elaborate** | `5E_ELABORATE` | Elaborate | **تعمیم** (Ta'mim) | Apply, extend knowledge | "Design a robot to solve X problem", "Compare two business models" |
| **Evaluate** | `5E_EVALUATE` | Evaluate | **تعیین** (Ta'yin) | Assess understanding | "Explain why AI needs ethics", "Critique this solution" |

### Distribution Guidelines
For comprehensive coverage, each grade level should have:
- **20% Engage**: Hook questions to start lessons
- **30% Explore**: Hands-on investigation questions
- **20% Explain**: Concept clarification questions
- **20% Elaborate**: Application and extension questions
- **10% Evaluate**: Assessment and reflection questions

---

## Adding Questions

### Step 1: Choose Subject, Grade, and Phase
```typescript
Subject: ROBOT (Robotics)
Grade: G7 (Grade 7)
Phase: 5E_EXPLORE
```

### Step 2: Create Question Object
```typescript
{
  stem: 'Build a simple robot that moves forward using two motors. What happens when you reverse one motor?',
  stemFA: 'یک ربات ساده که با دو موتور به جلو حرکت می‌کند بسازید. اگر یک موتور را معکوس کنید چه اتفاقی می‌افتد؟',
  type: QuestionType.MULTIPLE_CHOICE,
  options: [
    { 
      text: 'The robot turns', 
      textFA: 'ربات می‌چرخد', 
      isCorrect: true, 
      feedback: 'Correct! Differential drive causes rotation.', 
      feedbackFA: 'درست! درایو دیفرانسیل باعث چرخش می‌شود.' 
    },
    { 
      text: 'The robot stops', 
      textFA: 'ربات متوقف می‌شود', 
      isCorrect: false, 
      feedback: 'No, both motors are still powered.', 
      feedbackFA: 'نه، هر دو موتور هنوز روشن هستند.' 
    },
    { 
      text: 'The robot goes faster', 
      textFA: 'ربات سریع‌تر می‌رود', 
      isCorrect: false, 
      feedback: 'Speed is determined by motor power, not direction.', 
      feedbackFA: 'سرعت با قدرت موتور تعیین می‌شود، نه جهت.' 
    }
  ],
  explanation: 'When one motor reverses while the other goes forward, the robot pivots around its center—this is called differential drive steering.',
  explanationFA: 'وقتی یک موتور معکوس می‌شود و دیگری به جلو می‌رود، ربات حول مرکز خود می‌چرخد—به این فرمان دیفرانسیل درایو گفته می‌شود.',
  difficulty: Difficulty.MEDIUM,
  bloomLevel: BloomLevel.APPLY,
  phase5E: '5E_EXPLORE'
}
```

### Step 3: Add to Seed File
Add the question to `prisma/seed-curriculum-v2.ts`:

1. Create a new array for your subject/grade:
```typescript
const ROBOT_G7_QUESTIONS: SampleQuestion[] = [
  // Your question object here
];
```

2. Call `createQuestionsForSubject` in `seedQuestions()`:
```typescript
await createQuestionsForSubject('ROBOT', 'G7', ROBOT_G7_QUESTIONS);
```

3. Run the seed script:
```bash
npx ts-node prisma/seed-curriculum-v2.ts
```

---

## Open Educational Resources

### ✅ Recommended Sources (Open License)

#### 1. **Khan Academy**
- URL: https://www.khanacademy.org
- License: Creative Commons (CC BY-NC-SA)
- Coverage: Math, Science, Computing (K-12)
- **How to Use**:
  - Content is freely available for non-commercial educational use
  - You may adapt questions, but must provide attribution
  - Attribution format: "Adapted from Khan Academy (khanacademy.org)"
  - Persian translation is your own derivative work

#### 2. **OpenStax**
- URL: https://openstax.org
- License: Creative Commons (CC BY 4.0)
- Coverage: Science, Math, Social Studies (High School & College)
- **How to Use**:
  - Fully open textbooks
  - You can copy, remix, and redistribute with attribution
  - Attribution: "Source: OpenStax [Book Title]"

#### 3. **CK-12 Foundation**
- URL: https://www.ck12.org
- License: Creative Commons (CC BY-NC-SA)
- Coverage: STEM subjects (K-12)
- **How to Use**:
  - FlexBooks are customizable
  - You may adapt content for educational use
  - Must credit CK-12 Foundation

#### 4. **OER Commons**
- URL: https://www.oercommons.org
- License: Various CC licenses (check each resource)
- Coverage: All subjects, all levels
- **How to Use**:
  - Search by subject, grade, and standard
  - Check individual license before using
  - Most allow adaptation with attribution

#### 5. **PhET Interactive Simulations (University of Colorado)**
- URL: https://phet.colorado.edu
- License: Creative Commons
- Coverage: Physics, Chemistry, Biology, Math
- **How to Use**:
  - Simulations can inspire questions
  - You can reference simulations in questions
  - Create questions that use PhET as an explore phase

#### 6. **Project Gutenberg** (for Literature)
- URL: https://www.gutenberg.org
- License: Public Domain
- Coverage: Classic literature
- **How to Use**:
  - Full texts of public domain books
  - Create reading comprehension questions
  - No attribution required (public domain)

### ❌ DO NOT USE (Copyrighted)

- **IXL**: Proprietary, subscription-based (© IXL Learning)
- **Pearson, McGraw-Hill, Houghton Mifflin**: Commercial publishers
- **SAT/ACT/AP Test Prep**: Copyrighted by testing organizations
- **Most textbook publishers**: Unless explicitly open license

### Copyright-Safe Practices

✅ **DO**:
- Use OER (Open Educational Resources) with proper attribution
- Create original questions inspired by curriculum standards
- Adapt OER content and translate to Persian
- Reference public domain works
- Use Creative Commons licensed materials per their terms

❌ **DON'T**:
- Copy questions from IXL, commercial textbooks, or test prep sites
- Use copyrighted images without permission
- Remove attribution from CC-licensed content
- Use "fair use" as a blanket excuse (fair use is limited)

---

## Curriculum Alignment

### Iranian National Curriculum
- Follow Ministry of Education grade-level standards
- Persian Literature questions should include classical poets (Hafez, Saadi, Rumi)
- Math and Science aligned with national textbooks (Ketab-e Darsi)

### International Baccalaureate (IB)
- MYP (Middle Years Programme): Grades 6-10
- DP (Diploma Programme): Grades 11-12
- Focus on inquiry-based learning and global contexts

### US Common Core
- English Language Arts (ELA) standards
- Math standards by grade level
- Next Generation Science Standards (NGSS)

### British National Curriculum
- Key Stages: KS1 (Grades 1-2), KS2 (Grades 3-6), KS3 (Grades 7-9), KS4 (Grades 10-11)
- GCSEs and A-Levels for secondary

### Cross-Curriculum Questions
Create questions that bridge multiple subjects:
- **Math + Science**: "Calculate the speed of a falling object"
- **AI + Ethics**: "Should self-driving cars prioritize passenger or pedestrian safety?"
- **Entrepreneurship + Math**: "Calculate break-even point for a startup"

---

## Quality Standards

### All Questions Must Have:
1. ✅ **Bilingual Support**: English (`stem`) and Persian (`stemFA`)
2. ✅ **Clear Wording**: Age-appropriate language
3. ✅ **Correct Answers**: Thoroughly vetted
4. ✅ **Explanations**: Why the answer is correct (teach, don't just test)
5. ✅ **5E Phase**: Tagged with appropriate learning cycle phase
6. ✅ **Difficulty Level**: EASY → EXPERT progression
7. ✅ **Bloom's Level**: Cognitive skill being assessed
8. ✅ **No Bias**: Culturally sensitive, inclusive of all backgrounds

### Question Writing Best Practices

#### Multiple Choice
- 3-4 options (not more than 5)
- Plausible distractors (not obviously wrong)
- Feedback for each option explaining why it's right or wrong

#### Short Answer
- Clear success criteria in explanation
- Example acceptable answers in metadata

#### Essay
- Rubric guidelines in metadata
- Expected length and key points

#### Avoid Common Pitfalls
- ❌ Trick questions
- ❌ Ambiguous wording
- ❌ Cultural assumptions (e.g., "What do you do on Thanksgiving?")
- ❌ Overly complex grammar
- ❌ Double negatives

---

## Expansion Roadmap

### Priority 1: Core Subjects (All Grades)
- [ ] Mathematics: K-12 (focus on each grade's key standards)
- [ ] Science: K-12 (physics, chemistry, biology, earth science)
- [ ] English: K-12 (reading, writing, grammar, literature)
- [ ] Persian Literature: K-12 (poetry, prose, language arts)

### Priority 2: STEM Extensions
- [ ] Computer Science: Grades 5-12 (coding, algorithms, data structures)
- [ ] Robotics: Grades 6-12 (sensors, actuators, programming, design)
- [ ] AI: Grades 9-12 (machine learning, ethics, applications)

### Priority 3: Practical Skills
- [ ] Entrepreneurship: Grades 9-12 (business planning, finance, marketing)
- [ ] SEL: K-12 (emotion regulation, empathy, conflict resolution)

### Priority 4: Arts & Wellness
- [ ] Visual Arts: K-12
- [ ] Music: K-12
- [ ] Physical Education: K-12
- [ ] Ethics & Philosophy: Grades 6-12

### Question Volume Targets

| Grade Band | Target Questions Per Subject | Total (14 subjects) |
|------------|------------------------------|---------------------|
| EARLY_YEARS (KG-3) | 50 per grade × 4 grades = 200 | 2,800 |
| PRIMARY (4-6) | 75 per grade × 3 grades = 225 | 3,150 |
| MIDDLE (7-9) | 100 per grade × 3 grades = 300 | 4,200 |
| SECONDARY (10-12) | 125 per grade × 3 grades = 375 | 5,250 |
| **TOTAL** | | **15,400 questions** |

This is a significant undertaking! Start with:
1. **50 questions per subject** across all grades (700 total) → **MVP**
2. Expand gradually based on usage data and teacher feedback
3. Crowdsource from teachers (with review/approval workflow per AI_MODULE.md)

---

## Next Steps

### Immediate Actions
1. ✅ Run `npx ts-node prisma/seed-curriculum-v2.ts` to populate database with 14 subjects
2. ✅ Verify subjects appear in Admin → Subject Management
3. 🔄 Add 50-100 more sample questions covering remaining subjects
4. 🔄 Create API endpoint `/api/v1/questions?subject=X&grade=Y&phase=Z` for teachers
5. 🔄 Build teacher UI for browsing and selecting questions for assessments
6. 🔄 Implement AI-assisted question generation (with human approval per AI_MODULE.md)

### Long-Term Strategy
- **Month 1-2**: MVP with 700 questions (50 per subject)
- **Month 3-6**: Expand to 3,000 questions based on teacher feedback
- **Month 6-12**: Reach 10,000+ questions through crowdsourcing + AI generation
- **Ongoing**: Community contributions, quality reviews, curriculum updates

---

## Contact & Contributions

Questions or want to contribute question sets?
- Create issues in the project repository
- Follow the question schema and 5E/5ت pedagogy
- All contributions must use OER sources or be original work
- Provide attribution for adapted content

---

**Last Updated**: February 2025  
**Version**: 1.0  
**Maintained By**: Danesh Platform Development Team
