# Adaptive Assessment Framework for Danesh Learning Platform

## Executive Summary
This framework implements a comprehensive, research-backed adaptive assessment system that measures student attainment and progress through continuous practice and formative assessment. The system provides real-time mastery tracking, personalized remediation, and enrichment opportunities for all K-12 learners in both English and Persian.

---

## Educational Foundation

### Core Pedagogical Models

#### 1. **Item Response Theory (IRT)**
- Measures both question difficulty and student ability on the same scale
- Provides precise ability estimates with fewer questions
- Enables adaptive question selection based on current performance

#### 2. **Mastery Learning (Bloom, 1968)**
- Students must demonstrate 80%+ proficiency before advancing
- Immediate corrective feedback with alternative learning approaches
- Continuous formative assessment until mastery achieved

#### 3. **Zone of Proximal Development (Vygotsky)**
- Questions targeted at student's current ability ± 0.5 standard deviations
- Scaffolded support for challenging content
- Progressive difficulty increase as mastery improves

#### 4. **Spaced Repetition & Interleaving**
- Previously mastered skills reviewed at increasing intervals
- Mixed practice of related skills to strengthen retention
- Prevents "false mastery" from massed practice

---

## System Architecture

### Mastery Levels (0-100 Scale)

| Level | Score Range | Status | Color | Description |
|-------|-------------|--------|-------|-------------|
| **Not Started** | 0 | 🔒 | Gray | No attempts yet |
| **Struggling** | 1-49 | 📉 | Red | Requires immediate intervention |
| **Developing** | 50-69 | 📊 | Orange | Progressing but needs more practice |
| **Proficient** | 70-84 | ✅ | Yellow | Solid understanding, nearing mastery |
| **Mastered** | 85-94 | 🌟 | Green | Strong mastery, ready for advancement |
| **Expert** | 95-100 | 🏆 | Gold | Exceptional mastery, ready for enrichment |

### Ability Estimation Algorithm

```
θ (theta) = Student ability parameter (-3 to +3 scale)
b = Question difficulty parameter (-3 to +3 scale)
P(θ) = Probability of correct response

P(θ) = 1 / (1 + e^(-(θ - b)))

Initial θ₀ = 0 (neutral starting point)

After each response:
θₙ₊₁ = θₙ + α × (response - P(θₙ))

where α = learning rate (0.1-0.3 based on question confidence)
```

### Question Selection Strategy

1. **Initial Assessment (First 5 Questions)**
   - Wide difficulty range: [-1.5, -0.5, 0, 0.5, 1.5]
   - Rapid ability calibration
   - Covers entire skill spectrum

2. **Adaptive Selection (Questions 6+)**
   - Target difficulty: θ ± 0.3
   - Maximum information gain
   - Ensures appropriate challenge level

3. **Mastery Verification (Final 5 Questions)**
   - All questions at target mastery level (θ + 0.5)
   - Confirms sustained performance
   - Prevents lucky streaks from inflating scores

---

## Question Bank Requirements

### Metadata for Each Question

```json
{
  "id": "uuid",
  "skillId": "uuid",
  "difficulty": -1.5 to +3.0,
  "bloomLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
  "phase5E": "ENGAGE|EXPLORE|EXPLAIN|ELABORATE|EVALUATE",
  "discriminationIndex": 0.5-2.5,
  "guessingParameter": 0.0-0.25,
  "timeEstimate": 30-300,
  "stem": "English text",
  "stemFA": "Persian text",
  "type": "MULTIPLE_CHOICE|FILL_BLANK|TRUE_FALSE|MATCHING|ORDERING",
  "options": [...],
  "correctAnswer": "...",
  "hints": ["hint1", "hint2"],
  "explanation": "...",
  "commonMisconceptions": [...]
}
```

### Difficulty Calibration

- **Easy (-1.5 to -0.5)**: 85-95% of grade-level students answer correctly
- **Medium (-0.5 to +0.5)**: 50-75% answer correctly
- **Hard (+0.5 to +1.5)**: 25-50% answer correctly
- **Very Hard (+1.5 to +3.0)**: <25% answer correctly (gifted challenge)

---

## Skill Progression Model

### Skill Hierarchy

```
Subject → Strand → Skill → Sub-Skill → Micro-Skill
```

Example:
```
Math → Fractions → Adding Fractions → Same Denominators → Visual Models
                                    → Different Denominators → LCM Method
                                                             → Cross-Multiply
```

### Prerequisite Mapping

Each skill defines:
- **Required Prerequisites**: Must be mastered (85+) before access
- **Recommended Prerequisites**: Should be proficient (70+) for optimal learning
- **Related Skills**: Reviewed concurrently for interleaved practice

---

## Adaptive Pathways

### For Struggling Students (0-49%)

**Intervention Protocol:**
1. **Diagnostic Assessment**: Identify specific misconceptions
2. **Prerequisite Check**: Verify foundational skills (if <70%, redirect)
3. **Scaffolded Practice**:
   - Easier questions (θ - 1.0)
   - Visual/concrete representations
   - Step-by-step guided solutions
   - Immediate corrective feedback
4. **Micro-Skill Decomposition**: Break skill into smaller components
5. **Frequent Check-ins**: Every 5 questions, assess readiness to progress

**Support Features:**
- Video tutorials (English + Persian)
- Worked examples with annotations
- Interactive manipulatives
- Peer support prompts
- Teacher notification for intervention

### For Developing Students (50-69%)

**Standard Practice Protocol:**
1. Questions at current ability level (θ ± 0.2)
2. Mixed practice of current and prerequisite skills
3. Hints available after 2nd attempt
4. Explanation after incorrect response
5. 15-20 questions to reach mastery

### For Proficient Students (70-84%)

**Consolidation Protocol:**
1. Questions slightly above ability (θ + 0.3)
2. Timed challenges for fluency
3. Multi-step problems requiring integration
4. Spaced review of related skills
5. 10-15 questions to reach mastery

### For Mastered/Expert Students (85-100%)

**Enrichment Protocol:**
1. **Challenge Problems**: θ + 1.0 to +1.5 difficulty
2. **Cross-Curricular Applications**: Real-world scenarios
3. **Open-Ended Tasks**: Multiple solution strategies
4. **Extension Topics**: Beyond grade-level standards
5. **Peer Teaching Opportunities**: Explain concepts to others
6. **Project-Based Assessments**: Apply skills in novel contexts

---

## Progress Tracking Metrics

### Individual Student Dashboard

**Skill-Level Metrics:**
- Current mastery percentage (0-100)
- Ability estimate (θ) with confidence interval
- Questions attempted / correct / incorrect
- Average time per question
- Streak (consecutive correct)
- Last practiced date
- Predicted mastery date

**Global Progress:**
- Skills mastered this week/month/year
- Total XP earned from practice
- Accuracy trend (7/30/90 day moving average)
- Persistence score (questions attempted per session)
- Growth mindset indicators (improvement after mistakes)

### Teacher Analytics

**Class-Level View:**
- Heatmap: Student × Skill mastery matrix
- Struggling students list (auto-flagged)
- Skills requiring whole-class reteaching (>50% below 70%)
- Gifted students ready for acceleration
- Average time to mastery by skill
- Question difficulty distribution

**Intervention Recommendations:**
- Small group suggestions (students with shared gaps)
- Skill re-sequencing recommendations
- Question quality alerts (too easy/hard/ambiguous)

### Parent View

**Simplified Metrics:**
- Overall progress percentage
- Skills mastered vs. grade-level expectations
- Strengths (top 5 skills)
- Growth areas (skills needing practice)
- Weekly practice time
- Effort and persistence indicators

---

## Implementation Specifications

### Database Schema Additions

```sql
-- Skill mastery tracking
CREATE TABLE SkillMastery (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  skillId UUID NOT NULL,
  abilityEstimate FLOAT DEFAULT 0.0,
  masteryScore INT DEFAULT 0,
  questionsAttempted INT DEFAULT 0,
  questionsCorrect INT DEFAULT 0,
  averageTimeSeconds INT,
  lastPracticedAt TIMESTAMP,
  firstMasteredAt TIMESTAMP,
  status VARCHAR(20), -- NOT_STARTED, STRUGGLING, DEVELOPING, PROFICIENT, MASTERED, EXPERT
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(userId, skillId)
);

-- Question attempt history
CREATE TABLE QuestionAttempt (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  questionId UUID NOT NULL,
  skillId UUID NOT NULL,
  isCorrect BOOLEAN NOT NULL,
  timeSpentSeconds INT NOT NULL,
  attemptNumber INT DEFAULT 1,
  hintsUsed INT DEFAULT 0,
  studentAnswer TEXT,
  abilityBeforeAttempt FLOAT,
  abilityAfterAttempt FLOAT,
  questionDifficulty FLOAT,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Practice sessions
CREATE TABLE PracticeSession (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  skillId UUID NOT NULL,
  questionsAttempted INT NOT NULL,
  questionsCorrect INT NOT NULL,
  durationSeconds INT NOT NULL,
  startedAt TIMESTAMP NOT NULL,
  completedAt TIMESTAMP,
  sessionType VARCHAR(20), -- INITIAL, PRACTICE, REMEDIATION, ENRICHMENT
  exitReason VARCHAR(20) -- COMPLETED, TIMEOUT, QUIT, MASTERED
);

-- Spaced repetition schedule
CREATE TABLE ReviewSchedule (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  skillId UUID NOT NULL,
  nextReviewDate DATE NOT NULL,
  intervalDays INT NOT NULL,
  easeFactor FLOAT DEFAULT 2.5,
  reviewCount INT DEFAULT 0
);
```

### API Endpoints

```
POST   /api/v1/practice/start
  Request: { skillId, sessionType }
  Response: { sessionId, initialQuestions[5] }

POST   /api/v1/practice/answer
  Request: { sessionId, questionId, answer, timeSpent }
  Response: { 
    isCorrect, 
    feedback, 
    explanation, 
    nextQuestion, 
    currentMastery, 
    abilityEstimate 
  }

GET    /api/v1/practice/mastery/:skillId
  Response: { 
    masteryScore, 
    status, 
    questionsToMastery, 
    recommendedSessionLength 
  }

GET    /api/v1/practice/skills/recommended
  Response: { 
    reviewDue[],
    nextInSequence[],
    needsReteaching[],
    readyForChallenge[]
  }

POST   /api/v1/practice/session/end
  Request: { sessionId, exitReason }
  Response: { 
    summary: { correct, total, masteryGain, xpEarned },
    nextSteps
  }
```

### UI Components

**1. Practice Session Interface**
- Progress bar (questions completed / total)
- Current streak indicator
- Timer (optional, for fluency practice)
- Question display with bilingual support
- Answer input (adaptive to question type)
- Hint button (limited uses)
- Skip button (penalty: -5 mastery points)
- Confidence slider (self-assessment)

**2. Skill Mastery Dashboard**
- Subject → Strand → Skill tree view
- Color-coded mastery indicators
- Recommended next skill highlighted
- "Quick Practice" buttons (10 questions)
- Spaced review notifications
- Progress charts (line graph over time)

**3. Feedback & Explanation Modal**
- Immediate feedback (✅ Correct / ❌ Incorrect)
- Detailed explanation (bilingual)
- Common misconception addressed
- Related video tutorial link
- "Try Similar" button

---

## Differentiation Strategies

### Learning Preferences

**Visual Learners:**
- Diagrams, charts, color-coding
- Video demonstrations
- Virtual manipulatives

**Auditory Learners:**
- Text-to-speech for questions
- Audio explanations
- Pronunciation guides (for language arts)

**Kinesthetic Learners:**
- Interactive simulations
- Drag-and-drop activities
- Physical activity breaks

### Accessibility Features

- Text size adjustment
- High contrast mode
- Screen reader compatibility
- Keyboard navigation
- Extended time option (IEP/504)
- Simplified language toggle

### Cultural Responsiveness

- Persian calendar integration (Jalali dates)
- Culturally relevant contexts in word problems
- Iranian historical examples
- Islamic scholarly references (when appropriate)
- Western and Eastern perspectives balanced

---

## Quality Assurance

### Question Review Cycle

1. **Author**: Teacher/content creator writes question
2. **Peer Review**: 2+ educators verify accuracy
3. **Pilot Testing**: 30+ students attempt
4. **Statistical Analysis**: 
   - Item difficulty calibration
   - Discrimination index calculation
   - Distractor analysis (for multiple choice)
5. **Bias Review**: Cultural sensitivity check
6. **Approval**: Content lead signs off
7. **Live Deployment**: Monitored for 90 days
8. **Continuous Improvement**: Quarterly data review

### Performance Indicators (Per Question)

- **Discrimination Index**: 0.3+ (higher = better)
- **P-value (difficulty)**: 0.2-0.8 ideal range
- **Time Variation**: <50% coefficient of variation
- **Hint Usage**: <30% of attempts
- **Skip Rate**: <10%

---

## Gamification Integration

### XP Rewards for Practice

- **Correct Answer**: 10 XP × difficulty multiplier (1.0-2.5x)
- **First Attempt Correct**: +50% bonus
- **Streak Bonus**: +5 XP per question after 5-question streak
- **Mastery Achievement**: 500 XP + badge
- **Challenge Problem Solved**: 100 XP

### Badges

- **Persistent Practitioner**: 100 questions in a week
- **Mastery Master**: 10 skills mastered
- **Perfect Streak**: 20 consecutive correct
- **Speed Demon**: Answer in top 10% time (with accuracy)
- **Growth Mindset**: Improve from <50% to 85%+ on a skill

### Leaderboards

- **Class Leaderboard**: Most skills mastered this month
- **Grade-Level Leaderboard**: Top accuracy (min. 500 questions)
- **Subject Champions**: Highest mastery in Math/Science/etc.
- **Effort Award**: Most practice time invested

---

## Research Citations

1. **Item Response Theory**: Lord, F. M. (1980). *Applications of Item Response Theory to Practical Testing Problems*. Routledge.

2. **Mastery Learning**: Bloom, B. S. (1968). Learning for Mastery. *Evaluation Comment, 1*(2), 1-12.

3. **Adaptive Testing**: Wainer, H. (2000). *Computerized Adaptive Testing: A Primer*. Routledge.

4. **Spaced Repetition**: Cepeda, N. J., et al. (2006). Distributed practice in verbal recall tasks. *Psychological Bulletin, 132*(3), 354-380.

5. **Formative Assessment**: Black, P., & Wiliam, D. (1998). Assessment and classroom learning. *Assessment in Education, 5*(1), 7-74.

6. **Growth Mindset**: Dweck, C. S. (2006). *Mindset: The New Psychology of Success*. Random House.

---

## Implementation Phases

### Phase 1: Foundation (Months 1-2)
- Database schema implementation
- Question bank structure with IRT parameters
- Basic practice session API
- Simple UI for question delivery

### Phase 2: Adaptive Engine (Months 3-4)
- Ability estimation algorithm
- Adaptive question selection
- Mastery calculation
- Progress tracking dashboard

### Phase 3: Differentiation (Months 5-6)
- Remediation pathways
- Enrichment content
- Prerequisite checking
- Intervention alerts

### Phase 4: Analytics & Reporting (Months 7-8)
- Teacher analytics dashboard
- Parent progress reports
- Data visualization
- Predictive modeling

### Phase 5: Optimization (Months 9-12)
- A/B testing of algorithms
- Question bank expansion (target: 50,000+ questions)
- Spaced repetition system
- AI-powered question generation

---

## Success Metrics

**Student Outcomes:**
- 90%+ of students reach mastery on grade-level skills
- Average time to mastery: <30 minutes per skill
- Student engagement: 80%+ complete 3+ sessions per week
- Growth mindset: 70%+ persist after 3+ mistakes

**System Performance:**
- Question accuracy: 95%+ (validated difficulty levels)
- Ability estimate precision: ±0.3 standard error
- Session completion rate: 75%+
- Parent satisfaction: 85%+ "very satisfied"

---

## Bilingual Considerations

### English Interface
- Left-to-right layout
- Western numerals (0-9)
- Gregorian date system
- "You" form in explanations

### Persian (Farsi) Interface
- Right-to-left layout
- Persian numerals (۰-۹) or Western (user preference)
- Jalali calendar alongside Gregorian
- Formal "شما" form in explanations
- Arabic script for Islamic references
- Persian mathematical terminology (e.g., کسر for fraction)

### Translation Quality
- Professional translators (native speakers)
- Educational terminology specialists
- Mathematical/scientific notation standards
- Cultural adaptation (not just translation)
- Student testing with Persian-dominant speakers

---

## Ethical Considerations

**Data Privacy:**
- COPPA compliance (children under 13)
- FERPA compliance (educational records)
- Parent consent for data collection
- Anonymized data for research
- Right to be forgotten

**Algorithmic Fairness:**
- Regular bias audits (by demographic)
- Avoid stereotype threat in question contexts
- Culturally responsive content
- Accessibility for students with disabilities
- No punitive consequences for low performance

**Growth-Oriented Design:**
- Emphasize effort and improvement
- Avoid fixed ability labels
- Celebrate mistakes as learning opportunities
- Provide unlimited practice attempts
- Focus on mastery, not speed

---

*This framework is designed as a living document and should be updated quarterly based on student outcomes data, teacher feedback, and emerging educational research.*
