-- Sample test data for scraper system
-- Run this in your PostgreSQL database

BEGIN;

-- 1. Create Khan Academy source (if not exists)
INSERT INTO "ContentSource" (id, name, "nameFA", url, description, "isActive", "respectsRobotsTxt", "rateLimit", "totalItemsScraped", "successRate", "createdAt", "updatedAt")
VALUES (
  'source-khan-academy',
  'Khan Academy',
  'خان آکادمی',
  'https://www.khanacademy.org',
  'Free educational platform with comprehensive K-12 content',
  true,
  true,
  1000,
  3,
  100.0,
  NOW(),
  NOW()
)
ON CONFLICT (url) DO NOTHING;

-- 2. Ensure we have a Math subject
INSERT INTO "Subject" (id, code, name, "nameFA", icon, color, description)
VALUES (
  'subject-math',
  'MATH',
  'Mathematics',
  'ریاضیات',
  '🔢',
  '#3B82F6',
  'Mathematics curriculum K-12'
)
ON CONFLICT (code) DO UPDATE SET name = 'Mathematics';

-- 3. Create Arithmetic strand
INSERT INTO "Strand" (id, "subjectId", code, name, "nameFA", "order")
VALUES (
  'strand-arithmetic',
  'subject-math',
  'ARITHMETIC',
  'Arithmetic',
  'حساب',
  1
)
ON CONFLICT ("subjectId", code) DO NOTHING;

-- 4. Create Addition skill
INSERT INTO "Skill" (id, "subjectId", "strandId", code, name, "nameFA", description, "gradeBandMin", "gradeBandMax", "order", "isActive", "createdAt", "updatedAt")
VALUES (
  'skill-add-single-digit',
  'subject-math',
  'strand-arithmetic',
  'ADD_1D',
  'Single-Digit Addition',
  'جمع اعداد تک رقمی',
  'Add two single-digit numbers',
  'EARLY_YEARS',
  'PRIMARY',
  1,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (code) DO NOTHING;

-- 5. Create sample scraped content (PENDING status)
INSERT INTO "ScrapedContent" (
  id,
  "sourceId",
  "sourceUrl",
  "contentType",
  "questionText",
  "questionTextFA",
  "questionType",
  options,
  "correctAnswer",
  explanation,
  "explanationFA",
  hints,
  "difficultyEstimate",
  "subjectCode",
  "strandCode",
  "skillCode",
  "gradeLevel",
  "reviewStatus",
  "originalAuthor",
  license,
  "attributionRequired",
  "scrapedAt",
  "createdAt",
  "updatedAt"
)
VALUES
-- Question 1: 3 + 4 = ?
(
  'scraped-q1-' || gen_random_uuid()::text,
  'source-khan-academy',
  'https://www.khanacademy.org/math/grade-1/addition',
  'QUESTION',
  'What is 3 + 4?',
  '۳ + ۴ چند است؟',
  'MULTIPLE_CHOICE',
  '[
    {"text": "5", "textFA": "۵", "isCorrect": false},
    {"text": "6", "textFA": "۶", "isCorrect": false},
    {"text": "7", "textFA": "۷", "isCorrect": true},
    {"text": "8", "textFA": "۸", "isCorrect": false}
  ]'::jsonb,
  '7',
  '3 plus 4 equals 7. You can count on your fingers: 3... 4, 5, 6, 7',
  'سه به علاوه چهار مساوی هفت است. می‌توانید روی انگشتانتان بشمارید',
  '["Start with 3", "Count up 4 more: 4, 5, 6, 7"]'::jsonb,
  -1.5,
  'MATH',
  'ARITHMETIC',
  'ADD_1D',
  1,
  'PENDING',
  'Khan Academy',
  'CC BY-NC-SA',
  true,
  NOW(),
  NOW(),
  NOW()
),
-- Question 2: 5 + 6 = ?
(
  'scraped-q2-' || gen_random_uuid()::text,
  'source-khan-academy',
  'https://www.khanacademy.org/math/grade-1/addition',
  'QUESTION',
  'What is 5 + 6?',
  '۵ + ۶ چند است؟',
  'MULTIPLE_CHOICE',
  '[
    {"text": "10", "textFA": "۱۰", "isCorrect": false},
    {"text": "11", "textFA": "۱۱", "isCorrect": true},
    {"text": "12", "textFA": "۱۲", "isCorrect": false},
    {"text": "13", "textFA": "۱۳", "isCorrect": false}
  ]'::jsonb,
  '11',
  '5 plus 6 equals 11. This is one more than 10!',
  'پنج به علاوه شش مساوی یازده است',
  '["Think of 5 + 5 = 10", "Then add 1 more"]'::jsonb,
  -1.0,
  'MATH',
  'ARITHMETIC',
  'ADD_1D',
  1,
  'PENDING',
  'Khan Academy',
  'CC BY-NC-SA',
  true,
  NOW(),
  NOW(),
  NOW()
),
-- Question 3: 8 + 7 = ?
(
  'scraped-q3-' || gen_random_uuid()::text,
  'source-khan-academy',
  'https://www.khanacademy.org/math/grade-1/addition',
  'QUESTION',
  'What is 8 + 7?',
  '۸ + ۷ چند است؟',
  'MULTIPLE_CHOICE',
  '[
    {"text": "14", "textFA": "۱۴", "isCorrect": false},
    {"text": "15", "textFA": "۱۵", "isCorrect": true},
    {"text": "16", "textFA": "۱۶", "isCorrect": false},
    {"text": "17", "textFA": "۱۷", "isCorrect": false}
  ]'::jsonb,
  '15',
  '8 plus 7 equals 15. Try breaking it down: 8 + 2 = 10, then 10 + 5 = 15',
  'هشت به علاوه هفت مساوی پانزده است',
  '["Break 7 into 2 + 5", "First add 8 + 2 = 10", "Then add 10 + 5 = 15"]'::jsonb,
  -0.5,
  'MATH',
  'ARITHMETIC',
  'ADD_1D',
  2,
  'PENDING',
  'Khan Academy',
  'CC BY-NC-SA',
  true,
  NOW(),
  NOW(),
  NOW()
);

COMMIT;

-- Show results
SELECT 
  'Sample data created successfully!' as message,
  COUNT(*) as pending_count 
FROM "ScrapedContent" 
WHERE "reviewStatus" = 'PENDING';

-- Instructions
SELECT 
  '✅ Next steps:' as step,
  '1. Login: superadmin@danesh.app / SuperAdmin@123' as instruction
UNION ALL
SELECT '', '2. Go to: http://localhost:3000/en/admin/scraped-content'
UNION ALL
SELECT '', '3. Approve questions using skillId: skill-add-single-digit'
UNION ALL
SELECT '', '4. Check: http://localhost:3000/en/student/skills';
