# DATABASE SCHEMA (Initial High-Level Design)

## 1. Core Entities

### 1.1 Identity & Roles
- `users` (id, email, phone, password_hash, preferred_language, status)
- `user_profiles` (user_id, first_name, last_name, dob, grade_band, timezone)
- `roles` (student, parent, support_teacher, tutor, counselor, admin, reviewer)
- `user_roles` (user_id, role_id, scope)
- `parent_student_links` (parent_user_id, student_user_id, relationship)

### 1.2 Curriculum & Learning Structure
- `curriculum_frameworks` (iran, ib, us_common_core, british)
- `grade_levels` (kg..12 with stream metadata)
- `subjects`
- `strands` / `standards`
- `courses` (framework, grade, subject)
- `units` (course_id, sequence)
- `lessons` (unit_id, 5E metadata)
- `curriculum_mappings` (source_standard_id, target_standard_id, alignment_strength)

### 1.3 Content & CMS
- `content_items` (type, title, language, modality)
- `content_versions` (content_item_id, version_no, status: draft/review/approved/published)
- `content_tags` (curriculum, topic, bloom_level, difficulty, learning_style)
- `content_assets` (file/link/video references)
- `content_reviews` (reviewer, decision, notes)

### 1.4 Assessments
- `assessments` (type formative/summative, rubric_id)
- `questions` (stem, type, difficulty, bloom_level)
- `question_options`
- `question_bank_collections`
- `assessment_question_map`
- `student_attempts`
- `attempt_answers`
- `feedback_records`

### 1.5 Gamification
- `xp_ledger` (user_id, event_type, points, source_id)
- `levels` (level_no, min_xp)
- `badges` (criteria_json)
- `user_badges`
- `quests`
- `quest_steps`
- `user_quest_progress`
- `virtual_wallets`
- `virtual_transactions`
- `milestones`
- `certificates`

### 1.6 Community & Collaboration
- `forum_categories`
- `forum_threads`
- `forum_posts`
- `post_votes`
- `study_groups`
- `study_group_members`
- `collaborative_projects`
- `project_submissions`
- `peer_reviews`

### 1.7 Wellbeing & SEL
- `wellbeing_checkins` (mood_score, notes, risk_flag)
- `sel_activities`
- `concern_reports` (anonymous_allowed)
- `counselor_sessions`

### 1.8 Tutoring & Scheduling
- `tutor_profiles`
- `availability_slots`
- `bookings`
- `session_notes`

### 1.9 Subscription & Payments
- `plans` (free/standard/premium)
- `subscriptions`
- `invoices`
- `payment_transactions`

### 1.10 Analytics
- `event_log` (event_name, actor_id, entity_type, entity_id, payload_json, timestamp)
- `daily_learning_metrics` (materialized summaries)

## 2. Key Relationships (ER text diagram)
`User <-user_roles-> Role`
`Parent -< parent_student_links >- Student`
`Course -> Unit -> Lesson -> Content/Assessment`
`Student -> Attempts/XP/Checkins/ForumPosts/Bookings`
`ContentItem -> ContentVersions -> Reviews`
`Milestone -> Certificate -> Verification`

## 3. Indexing Priorities
- user lookup: email, phone
- course discovery: framework+grade+subject
- question bank: tags+difficulty+bloom
- event analytics: timestamp+event_name+actor
- forum moderation: thread/status/created_at

## 4. Data Retention Notes
- Minors’ data minimization and retention policies
- Separate handling for counseling and safeguarding records
- Soft-delete with audit trail for moderation/legal needs
