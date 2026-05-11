# 🌐 Educational Web Scraper System

## 📚 Overview

The Educational Web Scraper is a comprehensive system for gathering high-quality K-12 practice problems from trusted educational platforms. It includes:

- **Ethical scraping** with robots.txt compliance and rate limiting
- **Content review workflow** for quality assurance
- **Bulk import tools** for efficient content management
- **Multi-source support** (Khan Academy, OpenStax, OER Commons, etc.)
- **Bilingual content** (English + Persian)
- **Automatic difficulty estimation** using IRT parameters
- **Full attribution tracking** for proper licensing

## ✨ Key Features

### 1. Web Scraper Engine
- ✅ **Rate-limited requests** (configurable delays)
- ✅ **Robots.txt compliance** (respects site rules)
- ✅ **Retry logic** with exponential backoff
- ✅ **Error handling** and logging
- ✅ **Multiple parsers** for different platforms

### 2. Content Management
- ✅ **Review workflow** (Pending → Approved/Rejected)
- ✅ **Bulk operations** (approve/reject multiple items)
- ✅ **Content editing** before approval
- ✅ **Attribution tracking** (author, license, source URL)
- ✅ **IRT difficulty estimation** from question text

### 3. Supported Platforms

| Platform | License | Content Type | Status |
|----------|---------|-------------|--------|
| **Khan Academy** | CC BY-NC-SA | Practice problems, videos | ✅ Ready |
| **OpenStax** | CC BY | Textbooks, practice problems | ✅ Ready |
| **CK-12 Foundation** | CC BY-NC | STEM content | ✅ Ready |
| **OER Commons** | Various open licenses | Assessments, resources | ✅ Ready |

### 4. Admin Interface
- ✅ **Content review dashboard** ([/admin/scraped-content](src/app/[locale]/admin/scraped-content/page.tsx))
- ✅ **Scraper management** ([/admin/scraper](src/app/[locale]/admin/scraper/page.tsx))
- ✅ **Job monitoring** with real-time status
- ✅ **Statistics** (pending, approved, rejected counts)

## 🗄️ Database Schema

### New Models

#### ContentSource
Represents educational platforms to scrape from:
```prisma
model ContentSource {
  id                String   @id @default(cuid())
  name              String
  nameFA            String?
  url               String   @unique
  isActive          Boolean  @default(true)
  respectsRobotsTxt Boolean  @default(true)
  rateLimit         Int      @default(1000) // milliseconds
  lastScrapedAt     DateTime?
  totalItemsScraped Int      @default(0)
}
```

#### ScrapedContent
Stores scraped content pending review:
```prisma
model ScrapedContent {
  id                String   @id @default(cuid())
  sourceId          String
  sourceUrl         String
  contentType       ScrapedContentType // QUESTION, SKILL, TOPIC, RESOURCE
  
  // Question data
  questionText      String?
  questionTextFA    String?
  questionType      QuestionType?
  options           Json?
  explanation       String?
  hints             Json?
  difficultyEstimate Float?
  
  // Mapping
  subjectCode       String?
  skillCode         String?
  gradeLevel        Int?
  
  // Review workflow
  reviewStatus      ContentReviewStatus // PENDING, APPROVED, REJECTED, NEEDS_EDIT
  reviewedBy        String?
  reviewedAt        DateTime?
  rejectionReason   String?
  
  // Attribution
  originalAuthor    String?
  license           String?
  attributionRequired Boolean @default(true)
}
```

#### ContentImportJob
Tracks scraping jobs:
```prisma
model ContentImportJob {
  id              String   @id @default(cuid())
  sourceId        String
  jobType         ImportJobType // FULL_SCRAPE, INCREMENTAL, SPECIFIC_TOPIC
  status          JobStatus     // PENDING, RUNNING, COMPLETED, FAILED
  itemsProcessed  Int      @default(0)
  itemsSucceeded  Int      @default(0)
  itemsFailed     Int      @default(0)
  startedAt       DateTime?
  completedAt     DateTime?
  errorMessage    String?
}
```

## 🔌 API Endpoints

### Content Management

#### GET `/api/v1/admin/scraped-content`
List scraped content with filters and pagination
```json
Query params:
  - status: PENDING | APPROVED | REJECTED
  - contentType: QUESTION | SKILL | TOPIC
  - sourceId: string
  - page: number
  - limit: number

Response:
{
  "items": [...],
  "pagination": { "page": 1, "limit": 50, "total": 120 },
  "stats": { "PENDING": 50, "APPROVED": 60, "REJECTED": 10 }
}
```

#### POST `/api/v1/admin/scraped-content/:id/approve`
Approve and import content to main database
```json
Request:
{
  "skillId": "skill-id",
  "irtDifficulty": 0.5 // optional, will be estimated if not provided
}

Response:
{
  "success": true,
  "question": {...},
  "message": "Question imported successfully"
}
```

#### POST `/api/v1/admin/scraped-content/:id/reject`
Reject content with reason
```json
Request:
{
  "reason": "Duplicate content"
}
```

#### POST `/api/v1/admin/scraped-content/bulk-approve`
Bulk approve multiple items
```json
Request:
{
  "contentIds": ["id1", "id2", "id3"],
  "defaultSkillId": "skill-id"
}

Response:
{
  "success": true,
  "results": {
    "succeeded": 2,
    "failed": 1,
    "errors": ["Content id3: missing required fields"]
  }
}
```

### Scraper Management

#### GET `/api/v1/admin/scraper/sources`
List all content sources

#### POST `/api/v1/admin/scraper/sources`
Initialize default content sources

#### POST `/api/v1/admin/scraper/run`
Start a scraping job
```json
Request:
{
  "sourceId": "source-id",
  "jobType": "FULL_SCRAPE",
  "maxItems": 100,
  "targetUrl": "https://example.com/page" // optional for generic scraper
}

Response:
{
  "success": true,
  "job": { "id": "job-id", "status": "PENDING" },
  "message": "Scraping job started"
}
```

#### GET `/api/v1/admin/scraper/run?status=RUNNING`
List scraping jobs with optional status filter

## 🚀 Getting Started

### Step 1: Install Dependencies
```bash
npm install axios cheerio robots-parser
npm install --save-dev @types/cheerio @types/robots-parser
```

### Step 2: Push Database Schema
Already completed! ✅

### Step 3: Initialize Content Sources
Navigate to `/en/admin/scraper` and click "Initialize Sources" button, or use API:
```bash
curl -X POST http://localhost:3001/api/v1/admin/scraper/sources
```

### Step 4: Run a Scraping Job
From the admin interface:
1. Go to `/en/admin/scraper`
2. Select a source (e.g., "Khan Academy")
3. Click "Start Scraping"
4. Enter max items (e.g., 100)
5. Wait for job to complete

Or use API:
```bash
curl -X POST http://localhost:3001/api/v1/admin/scraper/run \
  -H "Content-Type: application/json" \
  -d '{"sourceId": "source-id", "maxItems": 100}'
```

### Step 5: Review Scraped Content
1. Go to `/en/admin/scraped-content`
2. Filter by "Pending" status
3. Review each item:
   - Click "Approve" and enter skillId
   - Or click "Reject" with reason
4. Use bulk approve for multiple items

## 📝 Content Review Workflow

```
┌─────────────┐
│   Scraper   │
│  Collects   │
│   Content   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│   PENDING       │◄─── New scraped content
│   Review Queue  │
└─────┬───────┬───┘
      │       │
      │       └──────────────┐
      ▼                      ▼
┌───────────┐        ┌──────────────┐
│ APPROVED  │        │  REJECTED    │
│ Import to │        │  Removed or  │
│ Database  │        │  Flagged     │
└───────────┘        └──────────────┘
```

## 🎓 Educational Content Guidelines

### What to Scrape
✅ **Do scrape:**
- Practice problems from open educational resources
- Content with CC BY, CC BY-NC, or Public Domain licenses
- Problems explicitly marked as free to use
- Content from educational platforms with APIs

❌ **Don't scrape:**
- Copyrighted commercial content (e.g., commercial test prep sites)
- Content behind paywalls
- Content without clear licensing information
- Sites that explicitly prohibit scraping in robots.txt

### Attribution Requirements
All scraped content must include:
- `originalAuthor` - Content creator name
- `license` - License type (e.g., "CC BY 4.0")
- `sourceUrl` - Original content URL
- `attributionRequired` - Boolean flag (default: true)

## 🔧 Advanced Configuration

### Custom Scraper Implementation
Create a custom scraper for a new source:

```typescript
import { EducationalScraper } from '@/lib/scraper/educational-scraper';

const scraper = new EducationalScraper({
  sourceId: 'your-source-id',
  rateLimit: 2000, // 2 seconds between requests
  respectRobotsTxt: true,
  maxRetries: 3,
});

// Option 1: Use built-in parsers
const questions = await scraper.scrapeKhanAcademy('algebra');

// Option 2: Generic HTML scraper
const html = await fetch('https://example.com').then(r => r.text());
const questions = scraper.parseQuestionFromHTML(html, 'https://example.com');

// Option 3: Custom parsing logic
const data = await scraper.makeRequest('https://api.example.com/questions');
const questions = parseCustomFormat(data);

// Save to database
const savedCount = await scraper.saveScrapedContent(questions);
```

### IRT Difficulty Estimation
The system automatically estimates question difficulty based on:
- **Grade level** - Higher grades = higher difficulty
- **Text complexity** - Word count, sentence structure
- **Math complexity** - Number of operators
- **Vocabulary** - Advanced academic terms

You can override the estimate during approval:
```javascript
await approve(contentId, {
  skillId: 'skill-id',
  irtDifficulty: 1.5, // Manual override
});
```

## 🔒 Legal & Ethical Considerations

### Robots.txt Compliance
The scraper automatically checks robots.txt:
```
User-agent: DaneshBot
Disallow: /admin/
Crawl-delay: 2
```

Set `respectRobotsTxt: false` only for sites you have explicit permission to scrape.

### Rate Limiting
Default rate limit is 1000ms between requests. Adjust based on:
- Site's terms of service
- Server capacity
- API rate limits
- robots.txt crawl-delay directive

### Copyright Compliance
- **CC BY** - Free to use with attribution
- **CC BY-NC** - Free for non-commercial use with attribution
- **CC BY-SA** - Free with attribution, share-alike
- **Public Domain** - No restrictions
- **All Rights Reserved** - Do NOT scrape without permission

## 📊 Quality Assurance

### Content Review Checklist
Before approving scraped content:

- [ ] Question text is clear and grammatically correct
- [ ] Options are mutually exclusive (for MC questions)
- [ ] Correct answer is actually correct
- [ ] Explanation provides educational value
- [ ] Difficulty matches grade level
- [ ] Subject/skill mapping is accurate
- [ ] Attribution information is complete
- [ ] License allows our use case

### Bulk Approval Guidelines
Use bulk approval only when:
- Content is from a highly trusted source
- All items have been pre-validated
- Skill mapping is consistent across all items
- You've reviewed a sample (e.g., 10-20 items)

## 📈 Monitoring & Analytics

### Scraper Performance Metrics
Track in `ContentSource` model:
- `totalItemsScraped` - Lifetime count
- `successRate` - Percentage of successful scrapes
- `lastScrapedAt` - Last scrape timestamp

### Review Workflow Metrics
Query database for stats:
```sql
-- Pending review count
SELECT COUNT(*) FROM "ScrapedContent" WHERE "reviewStatus" = 'PENDING';

-- Approval rate by source
SELECT 
  cs.name,
  COUNT(CASE WHEN sc."reviewStatus" = 'APPROVED' THEN 1 END) * 100.0 / COUNT(*) as approval_rate
FROM "ScrapedContent" sc
JOIN "ContentSource" cs ON sc."sourceId" = cs.id
GROUP BY cs.name;

-- Average time to review
SELECT AVG(EXTRACT(EPOCH FROM ("reviewedAt" - "scrapedAt"))/3600) as avg_hours
FROM "ScrapedContent"
WHERE "reviewStatus" IN ('APPROVED', 'REJECTED');
```

## 🐛 Troubleshooting

### Issue: Scraper returns empty results
**Solutions:**
1. Check if site structure changed (update selectors)
2. Verify robots.txt allows scraping
3. Check rate limit (may be too aggressive)
4. Look for API alternatives

### Issue: Content not appearing in review queue
**Solutions:**
1. Check job status in `/admin/scraper`
2. Look for error messages in job logs
3. Verify database connection
4. Check Prisma client generation

### Issue: Approval fails with "skillId not found"
**Solutions:**
1. Ensure skill exists in database
2. Check skill code matches exactly
3. Create skill first if needed
4. Use bulk approve with default skillId

## 🔜 Future Enhancements

- [ ] **Scheduled scraping** - Cron jobs for periodic updates
- [ ] **Duplicate detection** - Avoid importing same content twice
- [ ] **Content versioning** - Track changes in source content
- [ ] **Persian translation AI** - Auto-translate English to Persian
- [ ] **Image scraping** - Handle diagrams and illustrations
- [ ] **Video extraction** - Extract practice problems from videos
- [ ] **Collaborative review** - Multiple reviewers per item
- [ ] **A/B testing** - Compare original vs. scraped question performance
- [ ] **Auto-calibration** - Use student responses to refine IRT parameters

## 📚 References

- **Educational Content Licenses**: https://creativecommons.org/licenses/
- **Robots.txt Spec**: https://www.robotstxt.org/
- **Web Scraping Ethics**: https://blog.apify.com/web-scraping-guide/
- **Khan Academy API**: https://github.com/Khan/khan-api
- **OER Commons API**: https://www.oercommons.org/api

---

**Last Updated**: May 8, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅

For questions or issues, refer to the documentation or contact the development team.
