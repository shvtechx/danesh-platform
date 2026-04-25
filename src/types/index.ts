// TypeScript types for the Danesh Learning Platform

// ============================================
// USER & AUTH TYPES
// ============================================

export type Language = 'en' | 'fa';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
export type RoleName = 'STUDENT' | 'PARENT' | 'SUPPORT_TEACHER' | 'TUTOR' | 'COUNSELOR' | 'ADMIN' | 'REVIEWER' | 'CURRICULUM_DESIGNER';
export type GradeBand = 'EARLY_YEARS' | 'PRIMARY' | 'MIDDLE' | 'SECONDARY';
export type ServiceTier = 'FREE' | 'STANDARD' | 'PREMIUM';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  preferredLanguage: Language;
  status: UserStatus;
  createdAt: Date;
  profile?: UserProfile;
  roles: RoleName[];
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatarUrl?: string;
  dateOfBirth?: Date;
  gradeBand?: GradeBand;
  timezone: string;
  
  // Accessibility preferences
  fontScale: number;
  reduceMotion: boolean;
  highContrast: boolean;
  screenReader: boolean;
  adhdMode: boolean;
}

// ============================================
// CURRICULUM & LEARNING TYPES
// ============================================

export type CurriculumFrameworkCode = 'iran' | 'ib' | 'us_common_core' | 'british';
export type LessonPhase = 'ENGAGE' | 'EXPLORE' | 'EXPLAIN' | 'ELABORATE' | 'EVALUATE';
export type BloomLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type ContentType = 'TEXT' | 'VIDEO' | 'INTERACTIVE' | 'SIMULATION' | 'QUIZ' | 'DISCUSSION' | 'PROJECT';
export type ContentModality = 'TEXT' | 'AUDIO' | 'VIDEO' | 'INTERACTIVE' | 'MULTIMODAL';

export interface CurriculumFramework {
  id: string;
  code: CurriculumFrameworkCode;
  name: string;
  nameFA?: string;
  description?: string;
}

export interface GradeLevel {
  id: string;
  code: string;
  name: string;
  nameFA?: string;
  order: number;
  gradeBand: GradeBand;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  nameFA?: string;
  icon?: string;
  color?: string;
}

export interface Course {
  id: string;
  frameworkId: string;
  gradeLevelId: string;
  subjectId: string;
  code: string;
  title: string;
  titleFA?: string;
  description?: string;
  descriptionFA?: string;
  coverImage?: string;
  isPublished: boolean;
  units?: Unit[];
  progress?: number;
}

export interface Unit {
  id: string;
  courseId: string;
  sequence: number;
  title: string;
  titleFA?: string;
  description?: string;
  estimatedTime?: number;
  isPublished: boolean;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  unitId: string;
  sequence: number;
  title: string;
  titleFA?: string;
  phase: LessonPhase;
  estimatedTime?: number;
  isPublished: boolean;
  selCompetency?: SELCompetency;
  contentItems?: ContentItem[];
  isCompleted?: boolean;
  masteryScore?: number;
}

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  titleFA?: string;
  language: Language;
  modality: ContentModality;
  body?: string;
  bodyFA?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// ASSESSMENT TYPES
// ============================================

export type QuestionType = 
  | 'MULTIPLE_CHOICE' 
  | 'MULTIPLE_SELECT' 
  | 'TRUE_FALSE' 
  | 'SHORT_ANSWER' 
  | 'LONG_ANSWER' 
  | 'MATCHING' 
  | 'ORDERING' 
  | 'FILL_BLANK' 
  | 'NUMERIC';

export type AssessmentType = 'FORMATIVE' | 'SUMMATIVE' | 'DIAGNOSTIC' | 'SELF_ASSESSMENT';
export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'REVIEWED';

export interface Assessment {
  id: string;
  type: AssessmentType;
  title: string;
  titleFA?: string;
  description?: string;
  timeLimit?: number;
  passingScore: number;
  maxAttempts?: number;
  shuffleQuestions: boolean;
  showFeedback: boolean;
  questions?: Question[];
}

export interface Question {
  id: string;
  type: QuestionType;
  stem: string;
  stemFA?: string;
  explanation?: string;
  explanationFA?: string;
  difficulty: Difficulty;
  bloomLevel: BloomLevel;
  points: number;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  questionId: string;
  text: string;
  textFA?: string;
  isCorrect: boolean;
  feedback?: string;
  feedbackFA?: string;
}

export interface StudentAttempt {
  id: string;
  userId: string;
  assessmentId: string;
  startedAt: Date;
  submittedAt?: Date;
  score?: number;
  maxScore?: number;
  percentage?: number;
  status: AttemptStatus;
  timeSpent?: number;
  answers?: AttemptAnswer[];
  feedback?: FeedbackRecord;
}

export interface AttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  response: unknown;
  isCorrect?: boolean;
  score?: number;
}

export interface FeedbackRecord {
  id: string;
  attemptId: string;
  strengths?: string;
  strengthsFA?: string;
  weaknesses?: string;
  weaknessesFA?: string;
  nextSteps?: string;
  nextStepsFA?: string;
  aiGenerated: boolean;
}

// ============================================
// GAMIFICATION TYPES
// ============================================

export type XPEventType = 
  | 'LESSON_COMPLETE' 
  | 'QUIZ_PASS' 
  | 'PRACTICE_SET' 
  | 'PROJECT_SUBMIT' 
  | 'PEER_HELP' 
  | 'DAILY_CHECKIN' 
  | 'STREAK_BONUS' 
  | 'BADGE_EARNED' 
  | 'QUEST_STEP' 
  | 'QUEST_COMPLETE' 
  | 'CHALLENGE_WIN';

export type BadgeCategory = 'MASTERY' | 'HELPER' | 'CREATIVITY' | 'PERSEVERANCE' | 'COLLABORATION' | 'WELLBEING' | 'SPECIAL';
export type BadgeRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type QuestCategory = 'PERSIAN_MYTHOLOGY' | 'ISLAMIC_SCHOLARS' | 'GLOBAL_SCIENCE' | 'CITIZENSHIP' | 'SEASONAL';
export type QuestStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';

export interface XPLedgerEntry {
  id: string;
  userId: string;
  eventType: XPEventType;
  points: number;
  sourceId?: string;
  sourceType?: string;
  multiplier: number;
  createdAt: Date;
}

export interface Level {
  levelNo: number;
  name: string;
  nameFA?: string;
  minXP: number;
  icon?: string;
  rewards?: unknown;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  nameFA?: string;
  description?: string;
  descriptionFA?: string;
  icon?: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  xpReward: number;
  criteria: unknown;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: Badge;
  earnedAt: Date;
  progress?: number;
}

export interface Quest {
  id: string;
  code: string;
  title: string;
  titleFA?: string;
  description?: string;
  descriptionFA?: string;
  narrative?: string;
  narrativeFA?: string;
  category: QuestCategory;
  xpReward: number;
  coinReward: number;
  steps?: QuestStep[];
}

export interface QuestStep {
  id: string;
  questId: string;
  sequence: number;
  title: string;
  titleFA?: string;
  description?: string;
  criteria: unknown;
  xpReward: number;
}

export interface UserQuestProgress {
  id: string;
  userId: string;
  questId: string;
  quest: Quest;
  currentStep: number;
  status: QuestStatus;
  startedAt?: Date;
  completedAt?: Date;
}

export interface VirtualWallet {
  id: string;
  userId: string;
  coins: number;
  gems: number;
}

export interface GamificationStats {
  totalXP: number;
  currentLevel: Level;
  nextLevel: Level;
  xpToNextLevel: number;
  xpProgress: number; // 0-100 percentage
  currentStreak: number;
  bestStreak: number;
  badges: UserBadge[];
  activeQuests: UserQuestProgress[];
  wallet: VirtualWallet;
}

// ============================================
// WELLBEING & SEL TYPES
// ============================================

export type SELCompetency = 
  | 'SELF_AWARENESS' 
  | 'SELF_MANAGEMENT' 
  | 'SOCIAL_AWARENESS' 
  | 'RELATIONSHIP_SKILLS' 
  | 'RESPONSIBLE_DECISION_MAKING';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ConcernType = 'BULLYING' | 'HARASSMENT' | 'SELF_HARM' | 'ACADEMIC' | 'TECHNICAL' | 'OTHER';

export interface WellbeingCheckin {
  id: string;
  userId: string;
  moodScore: number; // 1-5
  energyLevel?: number;
  stressLevel?: number;
  belongingScore?: number;
  confidenceScore?: number;
  notes?: string;
  voiceNoteUrl?: string;
  riskFlag: boolean;
  riskLevel?: RiskLevel;
  createdAt: Date;
}

export interface MoodOption {
  value: number;
  label: string;
  labelFA: string;
  emoji: string;
  color: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 5, label: 'Great!', labelFA: 'عالی!', emoji: '😄', color: 'text-green-500' },
  { value: 4, label: 'Good', labelFA: 'خوب', emoji: '🙂', color: 'text-lime-500' },
  { value: 3, label: 'Okay', labelFA: 'معمولی', emoji: '😐', color: 'text-yellow-500' },
  { value: 2, label: 'Not great', labelFA: 'نه‌چندان خوب', emoji: '😕', color: 'text-orange-500' },
  { value: 1, label: 'Struggling', labelFA: 'سخت است', emoji: '😢', color: 'text-red-500' },
];

// ============================================
// FORUM & COLLABORATION TYPES
// ============================================

export type ThreadStatus = 'OPEN' | 'CLOSED' | 'RESOLVED';
export type GroupRole = 'OWNER' | 'MODERATOR' | 'MEMBER';

export interface ForumCategory {
  id: string;
  name: string;
  nameFA?: string;
  description?: string;
  icon?: string;
  threadCount?: number;
}

export interface ForumThread {
  id: string;
  categoryId: string;
  authorId: string;
  author?: User;
  title: string;
  titleFA?: string;
  isPinned: boolean;
  isLocked: boolean;
  status: ThreadStatus;
  viewCount: number;
  replyCount?: number;
  createdAt: Date;
  updatedAt: Date;
  posts?: ForumPost[];
}

export interface ForumPost {
  id: string;
  threadId: string;
  authorId: string;
  author?: User;
  parentId?: string;
  content: string;
  contentFA?: string;
  isAccepted: boolean;
  isFlagged: boolean;
  voteCount?: number;
  userVote?: number;
  createdAt: Date;
  updatedAt: Date;
  replies?: ForumPost[];
}

export interface StudyGroup {
  id: string;
  name: string;
  nameFA?: string;
  description?: string;
  subjectId?: string;
  gradeBand?: GradeBand;
  language: Language;
  maxMembers: number;
  memberCount?: number;
  isPublic: boolean;
  members?: StudyGroupMember[];
}

export interface StudyGroupMember {
  id: string;
  groupId: string;
  userId: string;
  user?: User;
  role: GroupRole;
  joinedAt: Date;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

// ============================================
// COMPONENT PROP TYPES
// ============================================

export interface LocalizedText {
  en: string;
  fa: string;
}

export interface NavigationItem {
  label: string;
  labelFA: string;
  href: string;
  icon?: string;
  badge?: string | number;
  children?: NavigationItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  labelFA?: string;
  icon?: string;
  disabled?: boolean;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  labelFA?: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T) => React.ReactNode;
}

// ============================================
// FORM TYPES
// ============================================

export interface LoginFormData {
  email?: string;
  phone?: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  email?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  preferredLanguage: Language;
  acceptTerms: boolean;
  accountType: 'STUDENT' | 'PARENT';
}

export interface WellbeingCheckinFormData {
  moodScore: number;
  energyLevel?: number;
  stressLevel?: number;
  belongingScore?: number;
  confidenceScore?: number;
  notes?: string;
}

export interface ForumThreadFormData {
  categoryId: string;
  title: string;
  content: string;
}

export interface ForumPostFormData {
  content: string;
  parentId?: string;
}
