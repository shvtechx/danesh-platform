'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Play,
  CheckCircle2,
  Flame,
  Brain,
  Zap,
  Video,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CourseCard } from '@/components/ui/card';
import { XPProgress, StreakProgress, CircularProgress } from '@/components/ui/progress';
import { UserAvatar } from '@/components/ui/avatar';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { AUTH_STORAGE_KEY, createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';

type StudentCourse = {
  id: string;
  title: string;
  titleFA: string | null;
  description: string | null;
  descriptionFA: string | null;
  subject: {
    code: string;
    name: string;
    nameFA: string | null;
  } | null;
  enrollment: {
    progress: number;
  };
  units: Array<{
    id: string;
    lessons: Array<{
      id: string;
      title: string;
      titleFA: string | null;
      estimatedTime: number | null;
      completion: {
        completedAt: string | null;
      } | null;
    }>;
  }>;
};

type StudentProgress = {
  xp: {
    total: number;
    currentLevel: number;
    xpInCurrentLevel: number;
    xpNeededForNextLevel: number;
    progressPercentage: number;
  };
  badges: {
    total: number;
    recent: Array<{
      id: string;
      name: string;
      nameFA?: string | null;
      icon?: string | null;
      category?: string | null;
      earnedAt: string;
    }>;
  };
  quests: {
    active: Array<{
      id: string;
      title: string;
      titleFA?: string | null;
      completedSteps: number;
      totalSteps: number;
      progress: number;
      xpReward: number;
    }>;
  };
  recentActivity: Array<{
    points: number;
    eventType: string;
    sourceType: string | null;
    createdAt: string;
  }>;
};

type LeaderboardPreview = {
  rankings: Array<{
    id: string;
    name: string;
    xp: number;
    level: number;
  }>;
};

type StoredUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
  };
};

type SkillPreview = {
  id: string;
  name: string;
  nameFA?: string | null;
  masteryStatus?: string;
  mastery?: {
    masteryScore?: number;
  } | null;
};

type LiveAnnouncement = {
  id: string;
  title: string;
  teacherName?: string | null;
  startedAt: string;
  joinPath: string;
  lessonId?: string | null;
};

const LIVE_ANNOUNCEMENT_POLL_INTERVAL_MS = 10000;

const EMPTY_PROGRESS: StudentProgress = {
  xp: {
    total: 0,
    currentLevel: 0,
    xpInCurrentLevel: 0,
    xpNeededForNextLevel: 100,
    progressPercentage: 0,
  },
  badges: {
    total: 0,
    recent: [],
  },
  quests: {
    active: [],
  },
  recentActivity: [],
};

function getDayKey(date: Date | string) {
  return new Date(date).toISOString().slice(0, 10);
}

function calculateStreak(activityDates: string[]) {
  if (activityDates.length === 0) return 0;

  const uniqueDates = Array.from(new Set(activityDates)).sort((a, b) => b.localeCompare(a));
  let streak = 0;
  const cursor = new Date();

  for (let index = 0; index < uniqueDates.length; index += 1) {
    const expectedDate = getDayKey(cursor);
    if (uniqueDates[index] !== expectedDate) {
      if (index === 0) {
        cursor.setDate(cursor.getDate() - 1);
        if (uniqueDates[index] !== getDayKey(cursor)) {
          break;
        }
      } else {
        break;
      }
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function formatLiveSessionTime(startedAt: string, locale: string) {
  const isRTL = locale === 'fa';
  const diffMinutes = Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 60000));

  if (diffMinutes < 1) {
    return isRTL ? 'همین حالا شروع شد' : 'Started just now';
  }

  return isRTL ? `${diffMinutes} دقیقه پیش شروع شد` : `Started ${diffMinutes} min ago`;
}

export default function StudentDashboard({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const router = useRouter();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ChevronLeft : ChevronRight;
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [progress, setProgress] = useState<StudentProgress>(EMPTY_PROGRESS);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPreview>({ rankings: [] });
  const [skills, setSkills] = useState<SkillPreview[]>([]);
  const [authUser, setAuthUser] = useState<StoredUser | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [todayLabel, setTodayLabel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ variant: 'error' | 'info'; message: string } | null>(null);
  const [liveSessions, setLiveSessions] = useState<LiveAnnouncement[]>([]);

  useEffect(() => {
    setHasMounted(true);
    setTodayLabel(
      new Date().toLocaleDateString(isRTL ? 'fa-IR' : 'en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    );

    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        setAuthUser(JSON.parse(raw) as StoredUser);
      }
    } catch {
      setAuthUser(null);
    }
  }, [isRTL]);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setFeedback(null);

        const headers = createUserHeaders(getStoredUserId());
        const liveSessionsPromise = fetch(`/api/v1/live/announcements?locale=${locale}`, { cache: 'no-store', headers })
          .then(async (response) => {
            if (!response.ok) {
              return [] as LiveAnnouncement[];
            }

            const payload = (await response.json()) as { announcements?: LiveAnnouncement[] };
            return payload.announcements || [];
          })
          .catch(() => [] as LiveAnnouncement[]);

        const [coursesResponse, progressResponse, leaderboardResponse, liveAnnouncements] = await Promise.all([
          fetch('/api/v1/student/courses', { cache: 'no-store', headers }),
          fetch('/api/v1/student/progress', { cache: 'no-store', headers }),
          fetch('/api/v1/leaderboard?locale=' + locale + '&range=week', { cache: 'no-store', headers }),
          liveSessionsPromise,
        ]);

        if (!coursesResponse.ok || !progressResponse.ok || !leaderboardResponse.ok) {
          throw new Error('dashboard-load-failed');
        }

        const coursesPayload = (await coursesResponse.json()) as { courses: StudentCourse[] };
        const progressPayload = (await progressResponse.json()) as StudentProgress;
        const leaderboardPayload = (await leaderboardResponse.json()) as LeaderboardPreview;

        if (active) {
          setCourses(coursesPayload.courses || []);
          setProgress(progressPayload);
          setLeaderboard({ rankings: leaderboardPayload.rankings?.slice(0, 3) || [] });
          setLiveSessions(liveAnnouncements);
        }

        fetch('/api/v1/skills', { cache: 'no-store', headers })
          .then(async (response) => {
            if (!response.ok) {
              return;
            }

            const payload = (await response.json()) as { skills?: SkillPreview[] };
            if (active) {
              setSkills(payload.skills || []);
            }
          })
          .catch(() => {
            if (active) {
              setSkills([]);
            }
          });
      } catch {
        if (active) {
          setCourses([]);
          setProgress(EMPTY_PROGRESS);
          setLeaderboard({ rankings: [] });
          setSkills([]);
          setLiveSessions([]);
          setFeedback({
            variant: 'error',
            message: isRTL ? 'بارگذاری داشبورد دانش‌آموز با مشکل روبه‌رو شد.' : 'Student dashboard data could not be loaded.',
          });
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [isRTL, locale]);

  useEffect(() => {
    let active = true;

    const loadLiveAnnouncements = async () => {
      try {
        const headers = createUserHeaders(getStoredUserId());
        const response = await fetch(`/api/v1/live/announcements?locale=${locale}`, {
          cache: 'no-store',
          headers,
        });

        if (!response.ok) {
          throw new Error('live-announcements-failed');
        }

        const payload = (await response.json()) as { announcements?: LiveAnnouncement[] };
        if (active) {
          setLiveSessions(payload.announcements || []);
        }
      } catch {
        if (active) {
          setLiveSessions([]);
        }
      }
    };

    loadLiveAnnouncements();
    const interval = window.setInterval(loadLiveAnnouncements, LIVE_ANNOUNCEMENT_POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [locale]);

  const displayName = useMemo(() => {
    const fromProfile = authUser?.profile?.displayName;
    const fullName = [authUser?.profile?.firstName || authUser?.firstName, authUser?.profile?.lastName || authUser?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    return fromProfile || fullName || (isRTL ? 'دانش‌آموز' : 'Student');
  }, [authUser, isRTL]);

  const completedLessons = useMemo(
    () => courses.reduce((sum, course) => sum + course.units.reduce((unitSum, unit) => unitSum + unit.lessons.filter((lesson) => lesson.completion?.completedAt).length, 0), 0),
    [courses],
  );

  const totalLessons = useMemo(
    () => courses.reduce((sum, course) => sum + course.units.reduce((unitSum, unit) => unitSum + unit.lessons.length, 0), 0),
    [courses],
  );

  const courseCards = useMemo(
    () => courses.slice(0, 3).map((course) => {
      const nextLesson = course.units
        .flatMap((unit) => unit.lessons)
        .find((lesson) => !lesson.completion?.completedAt) || course.units.flatMap((unit) => unit.lessons)[0] || null;

      return {
        id: course.id,
        title: isRTL ? course.titleFA || course.title : course.title,
        description: isRTL ? course.descriptionFA || course.description || (course.subject?.nameFA || course.subject?.name || '') : course.description || course.descriptionFA || course.subject?.name || '',
        progress: course.enrollment.progress || 0,
        grade: 'middle' as const,
        curriculum: isRTL ? 'واقعی' : 'Live',
        lessonsCount: course.units.reduce((sum, unit) => sum + unit.lessons.length, 0),
        nextLessonId: nextLesson?.id || null,
      };
    }),
    [courses, isRTL],
  );

  const masteryStats = useMemo(() => ({
    total: skills.length,
    mastered: skills.filter((skill) => skill.masteryStatus === 'MASTERED' || skill.masteryStatus === 'EXPERT').length,
    proficient: skills.filter((skill) => skill.masteryStatus === 'PROFICIENT').length,
    developing: skills.filter((skill) => skill.masteryStatus === 'DEVELOPING' || skill.masteryStatus === 'STRUGGLING' || skill.masteryStatus === 'NOT_STARTED').length,
  }), [skills]);

  const continueLesson = useMemo(() => {
    for (const course of courses) {
      for (const unit of course.units) {
        for (const lesson of unit.lessons) {
          if (!lesson.completion?.completedAt) {
            return {
              courseId: course.id,
              lessonId: lesson.id,
              courseTitle: isRTL ? course.titleFA || course.title : course.title,
              lessonTitle: isRTL ? lesson.titleFA || lesson.title : lesson.title,
              progress: course.enrollment.progress || 0,
              estimatedTime: lesson.estimatedTime || 15,
            };
          }
        }
      }
    }

    return null;
  }, [courses, isRTL]);

  const activeLiveSession = liveSessions[0] || null;

  const weeklyMinutes = useMemo(() => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    return courses.reduce(
      (sum, course) =>
        sum +
        course.units.reduce(
          (unitSum, unit) =>
            unitSum +
            unit.lessons.reduce((lessonSum, lesson) => {
              const completedAt = lesson.completion?.completedAt;
              if (!completedAt || new Date(completedAt) < weekStart) {
                return lessonSum;
              }
              return lessonSum + (lesson.estimatedTime || 0);
            }, 0),
          0,
        ),
      0,
    );
  }, [courses]);

  const todayMinutes = useMemo(() => {
    const today = getDayKey(new Date());

    return courses.reduce(
      (sum, course) =>
        sum +
        course.units.reduce(
          (unitSum, unit) =>
            unitSum +
            unit.lessons.reduce((lessonSum, lesson) => {
              const completedAt = lesson.completion?.completedAt;
              if (!completedAt || getDayKey(completedAt) !== today) {
                return lessonSum;
              }
              return lessonSum + (lesson.estimatedTime || 0);
            }, 0),
          0,
        ),
      0,
    );
  }, [courses]);

  const streak = useMemo(
    () => calculateStreak(progress.recentActivity.map((activity) => getDayKey(activity.createdAt))),
    [progress.recentActivity],
  );

  const daysOfWeek = useMemo(() => {
    const activitySet = new Set(progress.recentActivity.map((activity) => getDayKey(activity.createdAt)));
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());

    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return activitySet.has(getDayKey(day));
    });
  }, [progress.recentActivity]);

  const weeklyGoalProgress = Math.min(Math.round((weeklyMinutes / 300) * 100), 100);

  const statCards = [
    {
      label: t('dashboard.level'),
      value: progress.xp.currentLevel,
      icon: TrendingUp,
      tone: 'bg-primary/10 text-primary',
    },
    {
      label: t('dashboard.coursesInProgress'),
      value: courses.length,
      icon: BookOpen,
      tone: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
    },
    {
      label: t('dashboard.completedLessons'),
      value: completedLessons,
      icon: CheckCircle2,
      tone: 'bg-green-100 text-green-600 dark:bg-green-900/30',
    },
    {
      label: t('dashboard.badges'),
      value: progress.badges.total,
      icon: Trophy,
      tone: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isRTL ? `سلام، ${displayName}! 👋` : `Hi, ${displayName}! 👋`}
          </h1>
          <p className="text-muted-foreground">
            {isRTL ? 'نمای زنده‌ای از مسیر یادگیری، XP و مأموریت‌های فعال شما' : 'A live view of your learning journey, XP, and active quests'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1.5 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            <Flame className="h-4 w-4" />
            <span className="font-semibold">{streak}</span>
            <span className="text-sm">{isRTL ? 'روز' : 'days'}</span>
          </div>
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {todayLabel || (isRTL ? '—' : '—')}
          </span>
        </div>
      </div>

      {feedback ? <FeedbackBanner variant={feedback.variant} message={feedback.message} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${stat.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{isLoading ? '—' : stat.value.toLocaleString(isRTL ? 'fa-IR' : 'en-US')}</p>
                  </div>
                </div>
                {stat.label === t('dashboard.level') ? (
                  <XPProgress
                    currentXP={progress.xp.xpInCurrentLevel}
                    nextLevelXP={Math.max(progress.xp.xpNeededForNextLevel, 1)}
                    level={progress.xp.currentLevel}
                    showLabel={false}
                    className="mt-3"
                  />
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
              {continueLesson ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm opacity-90">{t('dashboard.continueLearning')}</p>
                      <h3 className="mt-1 text-xl font-bold">{continueLesson.courseTitle}</h3>
                      <p className="mt-1 text-sm opacity-90">{continueLesson.lessonTitle}</p>
                    </div>
                    <Link
                      href={`/${locale}/student/lessons/${continueLesson.lessonId}/learn`}
                      className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-medium text-primary transition hover:bg-white/90"
                    >
                      <Play className="h-4 w-4" />
                      {t('common.continue')}
                    </Link>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/30">
                      <div className="h-full rounded-full bg-white" style={{ width: `${continueLesson.progress}%` }} />
                    </div>
                    <span className="text-sm font-medium">{continueLesson.progress}%</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-sm opacity-90">
                    <Clock className="h-4 w-4" />
                    <span>{continueLesson.estimatedTime} {isRTL ? 'دقیقه باقی‌مانده' : 'min remaining'}</span>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm opacity-90">{t('dashboard.continueLearning')}</p>
                  <h3 className="text-xl font-bold">{isRTL ? 'همه درس‌های فعلی تکمیل شده‌اند' : 'All current lessons are completed'}</h3>
                  <p className="text-sm opacity-90">{isRTL ? 'برای ادامه، یک دوره جدید انتخاب کنید.' : 'Pick a new course to continue learning.'}</p>
                  <Link href={`/${locale}/courses`} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-medium text-primary transition hover:bg-white/90">
                    <BookOpen className="h-4 w-4" />
                    {isRTL ? 'مشاهده دوره‌ها' : 'Browse Courses'}
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {activeLiveSession ? (
            <Card className="overflow-hidden border-emerald-200/70 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      <Video className="h-3.5 w-3.5" />
                      {isRTL ? 'کلاس زنده در حال برگزاری' : 'Live class happening now'}
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-foreground">{activeLiveSession.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activeLiveSession.teacherName
                        ? isRTL
                          ? `با ${activeLiveSession.teacherName}`
                          : `with ${activeLiveSession.teacherName}`
                        : isRTL
                          ? 'معلم اکنون آنلاین است'
                          : 'Your teacher is live right now'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatLiveSessionTime(activeLiveSession.startedAt, locale)}</p>
                  </div>
                  <Link
                    href={activeLiveSession.joinPath}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-700"
                  >
                    <Video className="h-4 w-4" />
                    {isRTL ? 'پیوستن به کلاس زنده' : 'Join live class'}
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 shadow-sm">
            <div className="p-6 text-white">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{isRTL ? 'سیستم ارزیابی تطبیقی' : 'Adaptive Assessment System'}</h2>
                    <p className="mt-1 text-sm text-white/80">
                      {isRTL ? 'تمرین هوشمند برای پیشرفت سریع‌تر و هدف‌گذاری دقیق‌تر' : 'Smart practice for faster progress and sharper mastery goals'}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/${locale}/student/skills`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-white/90"
                >
                  {isRTL ? 'مشاهده مهارت‌ها' : 'View Skills'}
                  <Arrow className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <Target className="h-5 w-5 text-white/80" />
                    <span className="text-2xl font-bold">{masteryStats.total}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/75">{isRTL ? 'مهارت‌های فعال' : 'Active Skills'}</p>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <Trophy className="h-5 w-5 text-white/80" />
                    <span className="text-2xl font-bold">{masteryStats.mastered}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/75">{isRTL ? 'تسلط‌یافته' : 'Mastered'}</p>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <CheckCircle2 className="h-5 w-5 text-white/80" />
                    <span className="text-2xl font-bold">{masteryStats.proficient}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/75">{isRTL ? 'ماهر' : 'Proficient'}</p>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <TrendingUp className="h-5 w-5 text-white/80" />
                    <span className="text-2xl font-bold">{masteryStats.developing}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/75">{isRTL ? 'نیازمند تمرین' : 'Need Practice'}</p>
                </div>
              </div>

              {skills.length > 0 ? (
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {skills.slice(0, 4).map((skill) => (
                    <Link
                      key={skill.id}
                      href={`/${locale}/student/practice/${skill.id}`}
                      className="group rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm transition hover:bg-white/20"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-white group-hover:underline">
                            {isRTL ? skill.nameFA || skill.name : skill.name}
                          </h3>
                          <p className="mt-1 text-sm text-white/75">
                            {isRTL ? 'سطح تسلط' : 'Mastery'}: {Math.round(skill.mastery?.masteryScore || 0)}%
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-white/80">
                          <Zap className="h-5 w-5 text-yellow-300" />
                          <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('dashboard.recentCourses')}</h2>
              <Link href={`/${locale}/courses`} className="flex items-center gap-1 text-sm text-primary hover:underline">
                {t('common.viewAll')}
                <Arrow className="h-4 w-4" />
              </Link>
            </div>
            {courseCards.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  {isRTL ? 'هنوز در دوره‌ای ثبت‌نام نشده است.' : 'No enrolled courses found yet.'}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courseCards.map((course) => (
                  <CourseCard key={course.id} {...course} onClick={() => router.push(course.nextLessonId ? `/${locale}/student/lessons/${course.nextLessonId}/learn` : `/${locale}/courses/${course.id}`)} />
                ))}
              </div>
            )}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">{t('gamification.quests')}</CardTitle>
              <Link href={`/${locale}/student/quests`} className="flex items-center gap-1 text-sm text-primary hover:underline">
                {t('common.viewAll')}
                <Arrow className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {progress.quests.active.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'در حال حاضر مأموریت فعالی وجود ندارد.' : 'There are no active quests right now.'}
                </p>
              ) : (
                progress.quests.active.slice(0, 3).map((quest) => (
                  <div key={quest.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{isRTL ? quest.titleFA || quest.title : quest.title}</h4>
                        <span className="text-sm text-amber-600">+{quest.xpReward} XP</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${quest.progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{quest.completedSteps}/{quest.totalSteps}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                {t('dashboard.weeklyGoal')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                {hasMounted ? (
                  <CircularProgress value={weeklyGoalProgress} size={120}>
                    <div className="text-center">
                      <span className="text-2xl font-bold">{weeklyGoalProgress}%</span>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'تکمیل‌شده' : 'Complete'}</p>
                    </div>
                  </CircularProgress>
                ) : (
                  <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full border-8 border-muted bg-card">
                    <div className="text-center">
                      <span className="text-2xl font-bold">0%</span>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'تکمیل‌شده' : 'Complete'}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{todayMinutes}</p>
                  <p className="text-xs text-muted-foreground">{isRTL ? 'دقیقه امروز' : 'min today'}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{weeklyMinutes}</p>
                  <p className="text-xs text-muted-foreground">{isRTL ? 'دقیقه این هفته' : 'min this week'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{isRTL ? 'فعالیت هفتگی' : 'Weekly Activity'}</CardTitle>
            </CardHeader>
            <CardContent>
              <StreakProgress currentStreak={streak} daysOfWeek={daysOfWeek} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-amber-500" />
                {t('gamification.recentAchievements')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {progress.badges.recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'هنوز دستاوردی ثبت نشده است.' : 'No achievements have been earned yet.'}
                </p>
              ) : (
                progress.badges.recent.map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3">
                    <span className="text-2xl">{achievement.icon || '🏅'}</span>
                    <div className="flex-1">
                      <p className="font-medium">{isRTL ? achievement.nameFA || achievement.name : achievement.name}</p>
                      <p className="text-xs capitalize text-muted-foreground">{achievement.category || (isRTL ? 'دستاورد' : 'achievement')}</p>
                    </div>
                  </div>
                ))
              )}
              <Link href={`/${locale}/achievements`} className="mt-2 block text-center text-sm text-primary hover:underline">
                {t('common.viewAll')} →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t('gamification.leaderboard')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboard.rankings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'هنوز داده‌ای برای رتبه‌بندی وجود ندارد.' : 'No leaderboard data is available yet.'}
                </p>
              ) : (
                leaderboard.rankings.map((user, idx) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <span className="w-6 text-center font-bold text-muted-foreground">{idx + 1}</span>
                    <UserAvatar name={user.name} size="sm" showLevel={false} />
                    <span className="flex-1 font-medium">{user.name}</span>
                    <span className="text-sm text-amber-600">{user.xp.toLocaleString(isRTL ? 'fa-IR' : 'en-US')} XP</span>
                  </div>
                ))
              )}
              <Link href={`/${locale}/leaderboard`} className="mt-2 block text-center text-sm text-primary hover:underline">
                {t('common.viewAll')} →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{isRTL ? 'کل XP' : 'Total XP'}</p>
                  <p className="text-2xl font-bold">{progress.xp.total.toLocaleString(isRTL ? 'fa-IR' : 'en-US')}</p>
                </div>
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {isRTL ? `${completedLessons} از ${totalLessons} درس کامل شده است.` : `${completedLessons} of ${totalLessons} lessons are completed.`}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
