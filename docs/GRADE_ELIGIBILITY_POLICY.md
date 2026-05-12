# Grade Eligibility Policy

## Goal
Make the platform practical and research-based by combining:
- **grade-first placement** for curriculum coherence
- **evidence-based prerequisite support** for unfinished learning
- **controlled exceptions** for remediation and acceleration

## Core Model

### 1. Default visibility
Students should primarily see content aligned to their enrolled grade placement.

This includes:
- courses
- subjects
- lessons
- assessments
- skill practice

### 2. Evidence-based support
If a student shows weak mastery on an on-grade skill, the platform may expose **required prerequisite support** from the immediately previous grade band.

Rules:
- only prerequisite-linked content should appear
- support is triggered by low mastery evidence
- support is temporary and instructional, not a permanent change in placement
- students should return to on-grade learning as readiness improves

### 3. Assignment restrictions
Teachers and admins should not be able to assign unrelated off-grade content to students by default.

Default rule:
- student-course enrollment must match the student's current grade band

### 4. Future exceptions
The platform should support audited overrides for:
- intervention plans
- formal remediation placement
- gifted acceleration
- counselor/admin decisions

These exceptions should be explicit and role-controlled.

## Phase 1 implementation
Current schema stores `UserProfile.gradeBand`, so phase 1 uses **grade band** as the main placement scope.

Current rules introduced in this phase:
- student skill visibility is grade-first
- prerequisite support can surface from the immediately previous grade band when required mastery is weak
- self-enrollment and admin course enrollment for students are restricted to grade-matched courses
- teacher student/course assignment combinations must remain grade-coherent by default

## Future evolution
To become more precise, the model should later add an exact learner placement field such as:
- `gradeLevelId`
- optional intervention override state
- optional acceleration override state

That will allow exact grade placement while keeping the same instructional policy.
