# Critical Thinking, AI-Assisted Grading, and Skills-Based Gradebook

## Why this should be added
Yes — this fits the platform well and can be added without changing the core direction.

The current platform already supports most of the foundation:
- assessment objects with rubrics
- open response via flexible answer payloads
- feedback records
- project submissions and peer review
- bilingual feedback patterns

What is missing is a **deliberate critical-thinking layer** and a **skills-based gradebook/marksheet experience**.

---

## 1. Critical thinking as the base layer
Critical thinking should not be a separate subject. It should be embedded into every lesson, assessment, and teacher report.

### Core critical-thinking dimensions
Each assessed task should tag one or more of these dimensions:
1. **Interpretation** — identify the meaning of data, text, visuals, or scenarios
2. **Analysis** — break apart a problem and identify relationships
3. **Reasoning** — justify a claim using evidence and logic
4. **Evaluation** — compare alternatives, detect weaknesses, judge credibility
5. **Problem solving / design thinking** — propose, test, revise, and improve a solution
6. **Communication** — explain thinking clearly in writing or orally
7. **Metacognition** — reflect on confidence, strategy, and next improvement step

### How to apply it in lessons
For each 5E/5ت phase, require a critical-thinking move:
- **Engage / تأثیر**: prediction, curiosity question, noticing/wondering
- **Explore / تحقیق**: compare evidence, identify patterns, ask better questions
- **Explain / توضیح**: claim-evidence-reasoning response
- **Elaborate / تعمیم**: transfer task in a new context, design challenge, PISA-style scenario
- **Evaluate / تعیین**: reflection, rubric-based justification, revision after feedback

### Recommended task patterns
1. **Claim-Evidence-Reasoning (CER)**
2. **See-Think-Wonder**
3. **Compare-Contrast-Justify**
4. **Error analysis**: explain what is wrong and fix it
5. **Scenario-based decision task**: choose the best option and justify trade-offs
6. **Design brief**: propose a solution under constraints
7. **Data interpretation**: analyze chart/table/text and defend conclusions
8. **Reflection prompt**: what strategy worked, what would you change next

---

## 2. PISA-style written problems
The platform should add a new family of open-response and extended-response items.

### Recommended item families
- **Constructed response**: short explanation with evidence
- **Extended response**: multi-paragraph analysis or design answer
- **Document-based question**: respond using a text, graph, map, or image
- **Multi-step real-world task**: solve a practical problem with reasoning
- **Design challenge**: produce a plan, model, or recommendation
- **Argumentation task**: defend a position and address counterarguments

### Required metadata for each item
Each item should be tagged with:
- grade band / grade level
- subject and strand
- standards alignment
- 5E phase
- Bloom level
- critical-thinking dimensions
- scoring rubric
- exemplar answers
- misconception patterns
- language demand level

### Rubric structure
Each open-response item should use an analytic rubric with 4 levels:
- **Beginning**
- **Developing**
- **Proficient**
- **Advanced**

Recommended rubric criteria:
- understanding of the problem
- use of evidence
- quality of reasoning
- completeness/accuracy
- communication clarity
- originality or design quality where relevant

---

## 3. AI assistant for grading
Yes — but only as **AI-assisted grading**, never fully autonomous final grading for high-stakes work.

### Correct governance model
1. Student submits written response
2. AI reads the response, rubric, exemplar answers, and tagged misconceptions
3. AI produces:
   - provisional criterion scores
   - overall suggested score
   - evidence-based rationale
   - cited text spans from the student response
   - confidence level
   - suggested feedback and next step
4. Teacher reviews the AI suggestion
5. Teacher approves or edits
6. Only teacher-approved grades become official
7. All edits are stored for audit and future model calibration

### What the AI should do well
- first-pass rubric scoring
- highlight missing evidence
- suggest misconception labels
- draft bilingual formative feedback
- recommend next lesson, support skill, or extension task

### What the AI should not do alone
- publish final grades without teacher approval
- make special education or placement decisions
- infer intent or effort without evidence
- grade unsafe or flagged content without escalation

### Required safety features
- rubric-constrained grading only
- teacher override required for official release
- confidence threshold: low-confidence responses are flagged for manual review
- audit log of AI suggestion vs teacher final decision
- bilingual support for Persian and English
- bias monitoring by grade, language, and subgroup

---

## 4. Skills-based gradebook instead of obsolete averages
A traditional gradebook based only on average percentages is not ideal for this platform.

Use a **skills-based mastery gradebook** with evidence over time.

### Gradebook principles
- report by **skill/competency**, not only by assignment
- emphasize **most recent and most consistent evidence**, not simple averaging
- separate **academic mastery** from **habits/participation**
- include **critical-thinking indicators**
- show **teacher judgment** supported by evidence
- include **next instructional steps**

### Gradebook views
#### Teacher gradebook
Teacher sees:
- class roster
- standards/skills columns
- latest mastery level
- trend over time
- critical-thinking rubric indicators
- flagged misconceptions
- AI draft grading queue
- recommended interventions and enrichment

#### Student marksheet
Student sees:
- current mastery by skill
- critical-thinking profile
- recent evidence used
- teacher comments
- next recommended steps
- confidence/reflection history
- portfolio evidence

### Recommended reporting bands
Instead of raw marks alone, show:
- **Beginning**
- **Approaching**
- **Secure**
- **Advanced**

Optionally also show a numeric conversion for export where needed.

---

## 5. Measuring critical thinking for the marksheet
Yes — this can be added if it is based on repeated rubric evidence, not a single score.

### Critical-thinking profile for each student
Track a profile across subjects using these strands:
- interpretation
- analysis
- evidence use
- reasoning
- evaluation
- problem solving/design
- communication
- reflection/self-correction

### How to calculate it
Do **not** calculate from one test.
Use a weighted evidence model:
- open-response rubric scores
- project rubric scores
- transfer tasks
- revision quality
- self-explanation quality
- peer review quality where teacher-approved

### Reporting format
In the marksheet, show:
- current level per critical-thinking strand
- trend: improving / stable / needs support
- strongest evidence samples
- next recommended practice

This makes the marksheet informative and actionable instead of static.

---

## 6. Recommended product flow
### Student experience
1. Student completes mixed-format assessment
2. Includes MCQ + short response + extended response + reflection
3. Student receives immediate feedback where safe
4. Open-response items show status: **Under teacher review**
5. After approval, marksheet updates with:
   - skill mastery changes
   - critical-thinking indicators
   - next steps

### Teacher experience
1. Teacher opens grading queue
2. AI groups similar answers and misconceptions
3. Teacher sees rubric, response, AI suggestion, and evidence highlights
4. Teacher approves/adjusts quickly
5. Teacher can send whole-class, small-group, or individual next steps

### Parent-facing summary
Parents should see:
- strengths
- current support area
- recommended home support actions
- growth trend
Not raw AI detail.

---

## 7. What can be reused immediately from the current system
The current data model already supports much of phase 1:
- `Question.type` and `AttemptAnswer.response` support open-ended answers
- `Rubric` can store analytic criteria
- `StudentAttempt` and `FeedbackRecord` support assessment feedback
- `ProjectSubmission` and `PeerReview` support richer performance tasks

This means phase 1 can start without redesigning the whole platform.

---

## 8. Recommended implementation phases
### Phase 1 — Add open-response critical-thinking assessments
- add critical-thinking metadata to question `metadata`
- add rubric templates for CER, design challenge, and data analysis
- support `LONG_ANSWER` rendering and submission in student assessment UI
- add teacher grading queue with AI provisional scoring
- add teacher approval workflow

### Phase 2 — Add skills-based gradebook
- introduce teacher gradebook page
- introduce student marksheet page
- aggregate evidence by skill and critical-thinking dimension
- show trends, misconceptions, and next steps

### Phase 3 — Add calibration and reliability tools
- compare AI suggestions with teacher final decisions
- improve prompt/rubric calibration
- add moderation sampling for fairness and consistency

---

## 9. Data model additions recommended next
Add new models or fields for:
- `AssessmentCriterionScore`
- `AIGradingSuggestion`
- `TeacherGradeDecision`
- `SkillEvidenceRecord`
- `StudentCompetencyProfile`
- `GradebookSnapshot`

Minimum fields should capture:
- rubric criterion
- suggested score
- teacher final score
- confidence
- rationale
- approved/rejected state
- evidence links to attempt answers or project submissions

---

## 10. API additions recommended next
- `POST /assessments/:id/submit-written-response`
- `POST /attempts/:attemptId/ai-grade-suggestion`
- `POST /attempts/:attemptId/review-grade`
- `GET /teachers/:id/gradebook`
- `GET /students/:id/marksheet`
- `GET /students/:id/competency-profile`

---

## 11. What makes this unique
This becomes distinctive if the platform combines:
- grade-level curriculum coherence
- prerequisite support
- critical-thinking tasks in every subject
- AI-assisted but teacher-approved grading
- marksheets that explain growth, evidence, and next steps

That is more practical and future-ready than a conventional exam-only system.
