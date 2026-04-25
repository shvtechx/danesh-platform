# PLATFORM DESIGN SPECIFICATION (سند جامع طراحی پلتفرم)

> **Document role:** Master specification for a bilingual (English/Persian), dual-curriculum, self-paced, gamified, inclusive learning platform for KG–Grade 12.
> 
> **Primary audience:** Product, curriculum, engineering, AI, safeguarding, and operations teams.
> 
> **Companion docs:** [TECH_STACK](TECH_STACK.md) · [DATABASE_SCHEMA](DATABASE_SCHEMA.md) · [API_DESIGN](API_DESIGN.md) · [GAMIFICATION_DESIGN](GAMIFICATION_DESIGN.md) · [CURRICULUM_MAPPING](CURRICULUM_MAPPING.md) · [INCLUSIVE_EDUCATION](INCLUSIVE_EDUCATION.md) · [SEL_WELLBEING](SEL_WELLBEING.md) · [AI_MODULE](AI_MODULE.md) · [USER_JOURNEY](USER_JOURNEY.md) · [PERSIAN_SPEC](PERSIAN_SPEC.md)

---

## 0. Executive Summary | خلاصه اجرایی

This platform serves displaced Iranian learners and global students through two parallel academic streams:
- **Persian stream:** Iranian Ministry curriculum (KG–12)
- **English stream:** IB, US Common Core, British National Curriculum (KG–12)

Design principles:
1. **Access-first:** usable for low digital literacy and low bandwidth
2. **Inclusion-first:** UDL, trauma-informed, neurodiversity support
3. **Learning science-first:** 5E cycle, formative assessment, mastery progression
4. **Human+AI:** AI assistance under educator governance
5. **Safety-first:** child protection, moderation, privacy by design

---

## A. Platform Vision & Mission | چشم‌انداز و مأموریت

### Vision (چشم‌انداز)
Deliver equitable, high-quality learning continuity for displaced Iranian students while offering globally recognized pathways to graduation and higher education.

### Mission (مأموریت)
Provide bilingual, culturally responsive, self-paced, gamified learning across KG–12 with tiered support from community help to private tutoring and wellbeing services.

### Core Outcomes
- Academic continuity during crisis displacement
- Bilingual competency (Persian/English)
- Social-emotional resilience
- Verified credentials and portfolio evidence

---

## B. Curriculum Structure & Grade Levels | ساختار برنامه درسی

### B1. Iranian Curriculum Stream (جریان ایرانی)

| Stage | Persian Name | Grades | Notes |
|---|---|---:|---|
| Early Years | پیش‌دبستانی | KG | Foundational literacy, numeracy, SEL |
| Primary | دبستان | 1–6 | National textbooks, core subjects |
| Lower Secondary | راهنمایی / متوسطه اول | 7–9 | Expanded subject depth |
| Upper Secondary | دبیرستان / متوسطه دوم | 10–12 | Track-based specialization |

**Upper secondary tracks (رشته‌ها):**
- ریاضی فیزیک (Mathematics-Physics)
- تجربی (Experimental Sciences)
- انسانی (Humanities)
- علوم و معارف اسلامی (Islamic Sciences)
- فنی حرفه‌ای (Technical-Vocational)
- کار و دانش (Work & Knowledge)

Full mapping references: [CURRICULUM_MAPPING.md](CURRICULUM_MAPPING.md).

### B2. International Curriculum Stream
- **IB:** PYP → MYP → DP
- **US:** Common Core-aligned outcomes + NGSS/discipline standards where applicable
- **British:** National Curriculum (Key Stages)

### B3. Cross-Framework Alignment
Each course unit stores:
- curriculum framework ID
- standard/learning objective ID
- equivalency tags for Iranian ↔ IB/US/UK

---

## C. Tiered Service Model | مدل خدمات سه‌سطحی

| Capability | Tier 1 Free (رایگان) | Tier 2 Standard (استاندارد) | Tier 3 Premium (ویژه) |
|---|---|---|---|
| Self-paced content | ✅ | ✅ | ✅ |
| Adaptive path | ✅ | ✅ | ✅ |
| Basic gamification | ✅ | ✅ | ✅ |
| Peer Q&A/forum | ✅ | Priority | Priority |
| Automated feedback | Basic | Enhanced | Advanced + tutor notes |
| Wellbeing check-ins | Limited | Weekly bot | Bot + human counselor |
| Group support sessions | ❌ | ✅ | ✅ |
| Detailed parent analytics | ❌ | ✅ | ✅ advanced |
| Offline downloads | Limited | ✅ | ✅ |
| 1:1 tutoring | ❌ | ❌ | ✅ |
| Personalized learning plan | ❌ | Optional lite | ✅ certified educator |
| Exam prep/mock tests | Basic | Enhanced | Personalized |
| Verified certificates | Limited | ✅ | ✅ priority |

---

## D. Pedagogical Framework (5E) | چارچوب آموزشی ۵E

For every lesson template, enforce a 5E structure:

1. **Engage (درگیرسازی)**
   - Curiosity prompts, short scenario clips, mystery challenge
   - Culturally relevant anchors (Iranian context + global context)
2. **Explore (کاوش)**
   - Simulations (PhET), manipulative tasks, collaborative inquiry
3. **Explain (تبیین)**
   - Micro-lesson (<10 min), concept map, worked examples
4. **Elaborate (بسط)**
   - Transfer tasks, project-based extension, team quest
5. **Evaluate (ارزیابی)**
   - Embedded checks, reflection, rubric feedback, portfolio evidence

**Instructional diagram (text):**
`Hook → Inquiry → Direct Clarification → Application Transfer → Evidence + Feedback Loop`.

---

## E. Differentiated & Inclusive Learning | آموزش تفکیکی و فراگیر

Implementation follows [INCLUSIVE_EDUCATION.md](INCLUSIVE_EDUCATION.md):

- **UDL:** multiple means of engagement, representation, expression
- **Gifted (تیزهوشان):** acceleration lanes, enrichment studios, mentorship
- **ADHD:** ≤5-min chunks, timer widgets, reduced-distraction mode, frequent reinforcement
- **Learning disabilities:** TTS/STT, typography controls, simplified-language layer
- **ELL/multilingual:** bilingual glossaries, contextual tooltips
- **Scaffolding:** adaptive hints, step reveal, optional worked examples
- **Flexible pacing:** no punitive timers; mastery-based retries

---

## F. Gamification System | طراحی گیمیفیکیشن

See full mechanics: [GAMIFICATION_DESIGN.md](GAMIFICATION_DESIGN.md).

Core components:
- XP and streak engine
- Badges (mastery, helper, creativity, perseverance)
- Levels with unlockable avatar/space assets
- Narrative quests (Persian mythology, Iranian & Islamic scholars, global missions)
- Team challenges for collaboration and SEL
- Optional leaderboards (growth-oriented views)
- Milestones and certificates (digital + printable)
- Virtual economy with anti-exploit controls

---

## G. SEL & Wellbeing | یادگیری اجتماعی-عاطفی و بهزیستی

Full policy: [SEL_WELLBEING.md](SEL_WELLBEING.md).

- Daily mood check-ins (emoji/simple for younger learners)
- CASEL-aligned SEL competencies embedded in lessons
- Peer buddy system (جفت‌یادگیری)
- AI-moderated forums + human escalation
- Anonymous concern reporting
- Tiered counselor access
- Trauma-informed UX/content standards
- Anti-bullying protocol and digital citizenship curriculum
- Staff wellbeing toolkit

---

## H. Peer Interaction & Collaboration | تعامل همتایان

- Q&A forum with reputation incentives
- Study groups by subject/grade/language
- Structured peer review (Tier 2/3)
- Moderated discussion boards
- Collaborative project spaces with shared artifacts

---

## I. Support Teachers & Tutors | سیستم معلم پشتیبان و مدرس خصوصی

### Support Teacher Capabilities
- Access structured question banks and materials
- Select, modify, and author activities
- Upload files/links (IXL, Khan, YouTube, etc.)
- Monitor analytics and intervene
- Moderate community spaces

### Private Tutor (Tier 3)
- Scheduling + video sessions
- Shared whiteboard and file annotation
- Session notes + next steps
- Matching by subject/language/availability

### AI-Assisted Authoring Governance
- AI-drafted content enters **draft → review → approve → publish** pipeline
- Students cannot directly access generation interfaces
- Full version history and accountability

---

## J. AI & Adaptive Learning | ماژول هوش مصنوعی

Detailed in [AI_MODULE.md](AI_MODULE.md):
- Adaptive difficulty sequencing
- AI question generation with reviewer approval
- Bilingual NLP help (Persian/English)
- At-risk detection and intervention flags
- Recommendation engine for remediation/enrichment
- Meaningful feedback generation
- Educator analytics and explainability notes

---

## K. Assessment & Feedback | ارزیابی و بازخورد

- **Formative:** embedded micro-checks and immediate hints
- **Summative:** end-unit/term assessments with detailed breakdowns
- **Feedback (بازخورد معنادار):** strengths, misconceptions, next actions
- **Portfolio:** best work artifacts + reflection statements
- **Self-assessment:** confidence ratings + goal setting
- **Question banks:** tagged by curriculum, grade, topic, Bloom level, difficulty

---

## L. External Integrations | یکپارچه‌سازی سامانه‌های بیرونی

| Tool | Purpose | Method |
|---|---|---|
| IXL | Practice engine (international stream) | LTI/API/deep links |
| Khan Academy | Videos/exercises | Embed/deep link |
| GeoGebra | Math visualization | Embedded activities |
| PhET | Science virtual labs | Embedded simulation blocks |
| YouTube | Curated explainers | Safe embed with curation |
| Google Workspace | Collaborative docs | OAuth + shared links |
| Zoom/Jitsi | Live tutoring sessions | Scheduling + launch APIs |
| LTI | Standard integration framework | LTI 1.3 compliant |

---

## M. UX & Interface Design | تجربه کاربری و رابط

- Bilingual language toggle with full RTL/LTR mirroring
- WCAG 2.2 AA accessibility compliance goals
- Low-literacy onboarding wizard + icon-led navigation
- Mobile-first responsive design
- Offline mode for downloadable content bundles
- Age-banded visual themes (KG-2, 3-6, 7-9, 10-12)
- Simple sign-up/login: email/phone, Google, parent-managed child accounts, account recovery, guest mode

**UI flow diagram (text):**
`Landing → Language Select → Stream Select → Grade Placement → Guided Tour → First Lesson`.

---

## N. Milestones & Certification | نقاط عطف و گواهینامه‌ها

Trigger examples:
- Unit completion ≥80% with mastery ≥70%
- Consistent streak + portfolio submission
- Peer helper thresholds

Outputs:
- Digital certificates with verification code/URL
- Printable PDFs
- Milestone celebration animations and unlockables
- Grade-level completion credentials
- Achievement export pack for school records

---

## O. Technical Architecture | معماری فنی

Reference: [TECH_STACK.md](TECH_STACK.md), [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md), [API_DESIGN.md](API_DESIGN.md)

Recommended architecture:
- Frontend: React/Next.js
- Backend: Node.js (API gateway/services) + Python (AI services)
- Data: PostgreSQL + Redis + S3-compatible object storage
- Real-time: WebSocket gateway
- Delivery: CDN + edge caching
- Design: API-first and microservices-ready
- Security: RBAC, encryption in transit/at rest, audit logs, privacy controls
- Observability: logs, metrics, traces, product analytics

**Architecture diagram (text):**
`Client Apps → API Gateway → Domain Services (Learning, Assessment, Gamification, Forum, Billing, AI) → Data Layer (Postgres/Redis/Object Storage) + Integrations (IXL/Khan/Video)`.

---

## P. Content Management System | سامانه مدیریت محتوا

Roles: admin, curriculum designer, support teacher, reviewer

Capabilities:
- Draft/review/approve/publish workflow
- Rich text + LaTeX/MathJax
- Media upload and link embedding previews
- Deep tagging (framework/grade/subject/topic/Bloom/difficulty/modality)
- Version history, rollback, and change audit
- Bulk import/export for migration and partner content

---

## Q. Analytics & Reporting | تحلیل و گزارش

- **Student:** progress, strengths, growth gaps, time-on-task, streaks
- **Parent:** summary progress, wellbeing flags, action recommendations
- **Teacher:** cohort + individual diagnostics, content effectiveness
- **Admin:** adoption, engagement, retention, conversion, revenue
- Export formats: PDF/CSV/API access for approved stakeholders

---

## R. Localization & Cultural Considerations | بومی‌سازی و ملاحظات فرهنگی

- Complete Persian localization with RTL quality checks
- Culturally appropriate examples, narratives, and imagery
- Jalali + Gregorian date support
- Local holiday and academic calendar handling
- Religious/cultural sensitivity review in content governance
- Persian typography best practice (e.g., Vazirmatn, IRANSans)

---

## Implementation Phasing (Recommended)

1. **Phase 1 (MVP):** Tier 1, core curriculum delivery, assessments, basic gamification, forum, bilingual UI
2. **Phase 2:** Tier 2 support sessions, advanced analytics, expanded integrations, enhanced wellbeing bot
3. **Phase 3:** Tier 3 tutoring/counseling, full certification, advanced AI recommendations, enterprise reporting

---

## Research Foundation Snapshot

This specification operationalizes practices supported by current educational research themes:
- Retrieval practice + spaced practice
- Formative assessment and feedback timing
- UDL and inclusive differentiation
- SEL integration and trauma-informed schooling
- Motivation design via mastery-oriented gamification
- Multilingual scaffolding and cognitive load management

(See supporting documents for applied implementation details.)
