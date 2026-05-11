# 🎓 Danesh Learning Platform - Setup Complete!

## ✅ What's Installed

### 1. Node.js & npm
- **Node.js**: v24.15.0
- **npm**: v11.12.1
- ✅ Successfully installed and working

### 2. Project Dependencies
- ✅ All 913 npm packages installed
- Framework: Next.js 14.1.3
- Database ORM: Prisma 5.10.2
- UI Components: Radix UI + Tailwind CSS
- Auth: NextAuth.js
- i18n: next-intl (Persian + English)

### 3. Development Server
- ✅ **Running at**: http://localhost:3000
- Server started successfully with hot reload enabled

## ⚠️ What Still Needs Setup

### PostgreSQL Database
The database is configured but PostgreSQL needs to be manually installed and initialized.

**To complete database setup:**

1. **Download & Install PostgreSQL**:
   - Visit: https://www.postgresql.org/download/windows/
   - Download PostgreSQL 16 or 17 installer
   - Install with these settings:
     - Username: `postgres`
     - Password: `postgres` (or update `.env` file)
     - Port: `5432`

2. **Create Database**:
   ```powershell
   # After PostgreSQL installation, refresh your terminal
   createdb -U postgres danesh
   ```

3. **Initialize Database Schema**:
   ```powershell
   npm run db:generate
   npm run db:push
   ```

4. **Optional - Seed Demo Data**:
   ```powershell
   npm run db:seed
   ```

## 📂 Project Structure Overview

```
Onlinelearning-main/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/          # Internationalized routes (en, fa)
│   │   ├── api/v1/            # REST API endpoints
│   │   └── (auth)/            # Authentication routes
│   ├── components/            # React components
│   │   ├── auth/              # Auth components
│   │   ├── gamification/      # XP, badges, quests
│   │   ├── wellbeing/         # SEL & mood check-ins
│   │   └── ui/                # Reusable UI components
│   ├── lib/                   # Utilities & business logic
│   │   ├── auth/              # NextAuth config
│   │   ├── db/                # Prisma client
│   │   ├── gamification/      # XP calculations
│   │   └── i18n/              # Internationalization
│   └── styles/                # Global CSS (Tailwind)
├── prisma/
│   └── schema.prisma          # Database schema (50+ models)
├── docs/                      # Comprehensive documentation
│   ├── PLATFORM_DESIGN_SPECIFICATION.md
│   ├── TECH_STACK.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_DESIGN.md
│   ├── GAMIFICATION_DESIGN.md
│   └── ...
├── messages/                  # i18n translations
│   ├── en.json               # English
│   └── fa.json               # Persian (Farsi)
└── .env                      # Environment variables

## 🚀 Available Commands

```powershell
# Development
npm run dev              # Start dev server (currently running)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed demo data

# Testing (when setup)
npm test                 # Run Jest tests
npm run test:watch       # Watch mode
npm run test:e2e         # Playwright E2E tests
```

## 🌍 Key Features Implemented

### Bilingual Support (Persian/English)
- ✅ Full RTL/LTR layout support
- ✅ next-intl for translations
- ✅ Jalali calendar support (date-fns-jalali)
- ✅ IRANSans font configured

### Role-Based Access Control
- Student
- Parent
- Teacher (Support Teacher)
- Tutor
- Counselor
- Admin
- Super Admin
- Curriculum Designer
- Content Reviewer

### 5E/5ت Learning Cycle
Every lesson follows the pedagogical framework:
- **Engage (تأثیر)** - Hook & curiosity
- **Explore (تحقیق)** - Investigation
- **Explain (توضیح)** - Clarification
- **Elaborate (تعمیم)** - Generalization
- **Evaluate (تعیین)** - Mastery determination

### Gamification System
- XP (Experience Points) with level progression
- Badges (7 categories, 5 rarity levels)
- Quests (multi-step missions with stories)
- Leaderboards (personal growth focused)
- Virtual economy (coins & gems)
- Milestone celebrations

### Inclusive Education (UDL)
- Screen reader support
- High contrast mode
- Font scaling
- ADHD mode (reduced distractions)
- Reduce motion option
- Multiple learning styles support

### SEL & Wellbeing
- Mood check-ins
- Risk level tracking
- Counselor sessions (video/chat/phone)
- Concern reporting system
- Trauma-informed design

### Assessment System
- 9 question types (MCQ, fill-blank, matching, etc.)
- Formative & summative assessments
- Adaptive difficulty
- Rubric-based grading
- Portfolio assessment
- Peer review system

### Collaborative Learning
- Forum (Q&A threads)
- Study groups
- Peer mentoring
- Post voting system

### Curriculum Support
- Iranian Ministry of Education curriculum
- International: IB, US Common Core, British National
- Grades: KG through 12
- Subject strands & standards mapping
- Bloom's taxonomy alignment

## 🔐 Security & Privacy

- NextAuth.js for authentication
- JWT tokens with refresh
- Role-based permissions
- Parental consent for minors (<13)
- Encrypted sensitive data
- WCAG 2.2 AA compliance

## 📊 Tech Stack Details

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS, Radix UI, Framer Motion |
| **Database** | PostgreSQL (planned) + Prisma ORM |
| **Auth** | NextAuth.js |
| **i18n** | next-intl |
| **State** | Zustand, React Query |
| **Forms** | React Hook Form + Zod validation |
| **Charts** | Recharts |
| **AI** | OpenAI API (adaptive learning) |
| **Payments** | Stripe (planned) |

## 🎯 Service Tiers

| Tier | Features |
|------|----------|
| **Free (رایگان)** | Self-paced content, basic gamification, forums |
| **Standard (استاندارد)** | Group sessions, advanced gamification, integrations |
| **Premium (ویژه)** | 1-on-1 tutoring, personalized plans, full counselor access |

## 📝 Next Steps for Development

### Immediate Tasks:
1. ✅ Install PostgreSQL
2. ✅ Run database migrations
3. ✅ Seed initial data (subjects, curricula, demo users)
4. ✅ Test authentication flow
5. ✅ Explore admin dashboard

### Future Enhancements:
- Connect OpenAI API for adaptive learning
- Set up Stripe for payments
- Configure email (SMTP) for notifications
- Add OAuth providers (Google, Apple)
- Deploy to production (Vercel recommended)
- Set up analytics (PostHog/Google Analytics)
- Configure CDN for media assets

## 🐛 Known Issues

### Security Vulnerabilities
The npm audit shows 15 vulnerabilities (4 low, 4 moderate, 6 high, 1 critical).
These are mostly from dependencies and should be addressed:

```powershell
# To see details:
npm audit

# To auto-fix non-breaking issues:
npm audit fix

# To fix all (may cause breaking changes):
npm audit fix --force
```

## 📚 Documentation

All comprehensive documentation is in the `/docs` directory:
- [PLATFORM_DESIGN_SPECIFICATION.md](docs/PLATFORM_DESIGN_SPECIFICATION.md) - Master specification
- [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) - Complete ER diagram & schema
- [API_DESIGN.md](docs/API_DESIGN.md) - REST API patterns
- [GAMIFICATION_DESIGN.md](docs/GAMIFICATION_DESIGN.md) - XP formulas, badges
- [INCLUSIVE_EDUCATION.md](docs/INCLUSIVE_EDUCATION.md) - UDL & accessibility
- [USER_JOURNEY.md](docs/USER_JOURNEY.md) - User flows

## 💡 Tips

- The project uses **App Router** (not Pages Router)
- All routes are internationalized under `[locale]` directory
- Components use **Radix UI primitives** for accessibility
- Database models follow the **comprehensive schema** in Prisma
- Persian translations should use **5ت terminology** for learning phases
- Always test in both **LTR and RTL** modes

## 🌐 Access the Application

**Local Development**: http://localhost:3000

The server is currently running and ready for development!

## 📞 Support

For questions about the codebase, refer to the comprehensive documentation in `/docs` or the inline comments throughout the code.

---

**Status**: ✅ Ready for Development!
**Created**: May 4, 2026
**Node.js**: v24.15.0
**Next.js**: 14.1.3
