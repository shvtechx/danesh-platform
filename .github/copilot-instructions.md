# Copilot Custom Instructions — Danesh Online Learning Platform

## Project Overview
This is a bilingual (Persian/English) gamified online learning platform for displaced Iranian students and global learners. It supports the Iranian national curriculum (KG–Grade 12) and international curricula (IB, US Common Core, British National Curriculum).

## Key Specifications
Always refer to the documentation in the `/docs` directory when generating code, answering questions, or making architectural decisions:

- **Master Specification**: `docs/PLATFORM_DESIGN_SPECIFICATION.md` — The authoritative reference for all platform design decisions, covering vision, curriculum structure, tiered services, pedagogy (5E/5ت cycle), inclusive education, gamification, SEL/wellbeing, peer interaction, teacher/tutor systems, AI module, assessments, integrations, UX design, milestones, architecture, CMS, analytics, and localization.
- **Technology Stack**: `docs/TECH_STACK.md` — Use these technology choices (React/Next.js, Node.js/Python, PostgreSQL, Redis, etc.) when generating code.
- **Database Schema**: `docs/DATABASE_SCHEMA.md` — Follow this entity-relationship design for all data models, migrations, and ORM schemas.
- **API Design**: `docs/API_DESIGN.md` — Follow these RESTful API patterns, endpoint naming conventions, and request/response shapes.
- **Gamification**: `docs/GAMIFICATION_DESIGN.md` — Reference XP formulas, badge criteria, quest mechanics, and virtual economy rules.
- **Curriculum Mapping**: `docs/CURRICULUM_MAPPING.md` — Reference Iranian and international curriculum structures and subject alignments.
- **Inclusive Education**: `docs/INCLUSIVE_EDUCATION.md` — Follow UDL principles, ADHD accommodations, gifted acceleration paths, and LD support patterns.
- **SEL & Wellbeing**: `docs/SEL_WELLBEING.md` — Implement trauma-informed design, mood check-ins, peer mentoring, and counselor integration as specified.
- **AI Module**: `docs/AI_MODULE.md` — Follow the adaptive learning engine design, content generation pipeline with approval workflow, and NLP specifications.
- **User Journeys**: `docs/USER_JOURNEY.md` — Reference user flows for students, parents, teachers, tutors, and admins.
- **Persian Specification**: `docs/PERSIAN_SPEC.md` — Reference for Persian-language UI text, terminology, and RTL layout requirements.

## Code Generation Rules

### Architecture
- Follow microservices architecture as defined in the tech stack documentation.
- Use API-first design patterns from the API design document.
- All database models must align with the schema in DATABASE_SCHEMA.md.

### Bilingual Support
- All user-facing strings must support both Persian (RTL) and English (LTR).
- Use i18n libraries (e.g., next-intl or react-intl) for all text.
- Support Jalali (Shamsi) calendar alongside Gregorian.
- Use IRANSans or Vazirmatn font for Persian text.

### Inclusive Design
- All UI components must meet WCAG 2.2 AA accessibility standards.
- Support screen readers, keyboard navigation, and adjustable text size/contrast.
- Implement UDL principles: multiple means of engagement, representation, and action/expression.

### Tiered Service Model
- Features must respect the 3-tier model (Free, Standard, Premium).
- Use feature flags or middleware to gate tier-specific functionality.
- Never hard-code tier logic; use a centralized authorization service.

### 5E / 5ت Learning Cycle (چرخه یادگیری ۵ت)
The Persian equivalent of the 5E Learning Cycle is the **5ت (panj-tā)** framework. Every lesson component must map to one of these phases:

| English (5E) | Persian (5ت) | Description |
|---|---|---|
| **Engage** | **تأثیر** (Ta'sir) | Hook learners through curiosity, real-world relevance, and gamified challenges |
| **Explore** | **تحقیق** (Tahqiq) | Investigate through virtual labs, simulations, collaborative inquiry |
| **Explain** | **توضیح** (Towzih) | Clarify concepts through micro-lessons, interactive reading, concept mapping |
| **Elaborate** | **تعمیم** (Ta'mim) | Extend and generalize knowledge through cross-disciplinary and project-based tasks |
| **Evaluate** | **تعیین** (Ta'yin) | Determine mastery through formative/summative assessment, self-checks, peer review |

- Structure lesson data models and UI components around this 5-phase cycle.
- In Persian UI, always use the 5ت terms (تأثیر، تحقیق، توضیح، تعمیم، تعیین).
- In English UI, use the 5E terms (Engage, Explore, Explain, Elaborate, Evaluate).
- Internal code identifiers should use the English 5E names (e.g., `phase: 'engage'`), with the Persian 5ت names handled via i18n.

### AI Module
- AI-generated content must always go through a review/approval workflow before being visible to students.
- Students must never have direct access to AI content generation tools.
- Support both Persian and English in NLP features.

### Gamification
- Follow the XP and badge formulas defined in GAMIFICATION_DESIGN.md.
- Emphasize personal growth over competition in leaderboard implementations.
- Milestone celebrations should trigger certificate generation.

### Assessment & Feedback
- Feedback must be specific, actionable, and growth-oriented — never just "correct" or "incorrect".
- Embed formative assessments throughout lessons, not only at the end.
- Support portfolio-based assessment and self-reflection tools.

### Security & Privacy
- Implement role-based access control (RBAC) for all endpoints.
- Encrypt sensitive data at rest and in transit.
- Follow GDPR-like privacy principles, especially for minors' data.
- Parent-managed accounts required for students under 13.