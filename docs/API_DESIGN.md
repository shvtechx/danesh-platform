# API DESIGN (REST Architecture Overview)

Base URL: `/api/v1`

## 1. Authentication & Authorization
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/password/recover`
- `POST /auth/parent/link-child`

**Example request**
```json
{ "email": "student@example.com", "password": "***", "language": "fa" }
```

**Example response**
```json
{ "accessToken": "...", "refreshToken": "...", "user": { "id": "u_1", "roles": ["student"] } }
```

## 2. User & Profile APIs
- `GET /users/me`
- `PATCH /users/me`
- `GET /users/:id/progress` (RBAC)
- `GET /parents/:id/children`

## 3. Curriculum & Content Delivery
- `GET /curriculum/frameworks`
- `GET /courses?framework=iran&grade=7&subject=math`
- `GET /courses/:courseId/units`
- `GET /units/:unitId/lessons`
- `GET /lessons/:lessonId/content`
- `POST /content/:id/download-token`

## 4. Assessments
- `GET /assessments/:id`
- `POST /assessments/:id/start`
- `POST /attempts/:attemptId/answer`
- `POST /attempts/:attemptId/submit`
- `GET /attempts/:attemptId/feedback`

## 5. Gamification
- `GET /gamification/me`
- `GET /gamification/badges`
- `GET /gamification/quests`
- `POST /gamification/quests/:questId/claim`
- `GET /certificates/:certificateId/verify`

## 6. Forum & Collaboration
- `GET /forum/categories`
- `POST /forum/threads`
- `POST /forum/threads/:id/posts`
- `POST /forum/posts/:id/vote`
- `POST /study-groups`
- `POST /projects/:id/peer-reviews`

## 7. Wellbeing
- `POST /wellbeing/checkins`
- `GET /wellbeing/me/history`
- `POST /wellbeing/concerns` (anonymous allowed)
- `POST /counseling/sessions` (tier+role guarded)

## 8. AI Module (staff-governed)
- `POST /ai/content-drafts` (staff only)
- `POST /ai/content-drafts/:id/submit-review`
- `POST /ai/content-drafts/:id/approve`
- `POST /ai/recommendations/generate`
- `GET /ai/at-risk/alerts` (authorized educators)

## 9. Payments & Subscription
- `GET /plans`
- `POST /subscriptions`
- `PATCH /subscriptions/:id`
- `GET /billing/invoices`

## 10. Analytics
- `GET /analytics/student/:id`
- `GET /analytics/parent/:id`
- `GET /analytics/teacher/:id/class`
- `GET /analytics/admin/platform`
- `GET /reports/export?format=pdf|csv`

## 11. API Standards
- Versioned endpoints
- Idempotency keys for payments and critical writes
- Cursor pagination for lists
- RFC7807-like error schema
- Request tracing headers (`x-request-id`)
