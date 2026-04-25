# AI MODULE & ADAPTIVE LEARNING SPECIFICATION

## 1. Scope
AI supports educators and learners while preserving human oversight.

## 2. Content Generation Workflow (Staff Only)
1. Staff submits generation prompt with curriculum tags
2. AI drafts activity/question/explanation
3. Draft enters review queue
4. Reviewer approves/edits/rejects
5. Approved version publishes to students
6. Full audit trail retained

Students do **not** have direct access to raw generation tools.

## 3. Adaptive Learning Engine
Inputs:
- mastery signals (attempt quality, latency, hints)
- engagement signals (time-on-task, streaks, abandonment)
- wellbeing and confidence signals (with strict privacy controls)

Policy:
- Route learner to remediation, core, or enrichment path
- Adjust difficulty and scaffolding level
- Trigger intervention suggestions for staff/parents where allowed

## 4. NLP Features (Persian + English)
- Q&A semantic retrieval from approved content
- Bilingual intent detection
- Safe response templates with citation to course materials
- Moderation classifier for forums

## 5. Predictive Analytics (At-Risk Detection)
Risk indicators may include:
- prolonged inactivity
- repeated low mastery despite high effort
- adverse wellbeing trend

Outputs:
- risk tier + explanation factors
- recommended intervention playbook

## 6. Recommendation Engine
- Next-best lesson/activity recommendation
- Cross-platform recommendations (IXL/Khan/GeoGebra/PhET)
- Diversity controls to avoid repetitive narrow paths

## 7. Automated Feedback Generation
Feedback includes:
- what was done well
- misconception diagnosis
- concrete next action
- confidence-calibrated tone

## 8. Safety & Governance
- Prompt/response filtering
- PII redaction checks
- Human-in-the-loop for high-impact actions
- Model quality dashboard (accuracy, harmful output rate, bias checks)
