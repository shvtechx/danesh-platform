'use client';

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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CourseCard } from '@/components/ui/card';
import { XPProgress, StreakProgress, CircularProgress } from '@/components/ui/progress';
import { UserAvatar, AvatarGroup } from '@/components/ui/avatar';

export default function StudentDashboard({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const router = useRouter();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ChevronLeft : ChevronRight;

  // Mock data - replace with actual API calls
  const stats = {
    level: 12,
    currentXP: 2450,
    nextLevelXP: 3000,
    streak: 7,
    coursesInProgress: 4,
    completedLessons: 87,
    badges: 15,
    weeklyGoalProgress: 65,
    todayMinutes: 45,
    weeklyMinutes: 320,
  };

  const recentCourses = [
    {
      id: '1',
      title: isRTL ? 'ریاضی پایه هشتم' : 'Grade 8 Mathematics',
      description: isRTL ? 'معادلات خطی و نامعادلات' : 'Linear equations and inequalities',
      progress: 65,
      grade: 'middle' as const,
      curriculum: isRTL ? 'ایران' : 'Iranian',
      xp: 150,
      lessonsCount: 24,
    },
    {
      id: '2',
      title: isRTL ? 'علوم تجربی' : 'Science',
      description: isRTL ? 'فیزیک، شیمی و زیست‌شناسی' : 'Physics, Chemistry & Biology',
      progress: 40,
      grade: 'middle' as const,
      curriculum: isRTL ? 'ایران' : 'Iranian',
      xp: 200,
      lessonsCount: 32,
    },
    {
      id: '3',
      title: isRTL ? 'زبان انگلیسی' : 'English Language',
      description: isRTL ? 'گرامر و مکالمه' : 'Grammar and Conversation',
      progress: 80,
      grade: 'middle' as const,
      curriculum: 'International',
      xp: 100,
      lessonsCount: 18,
    },
  ];

  const continueLesson = {
    courseTitle: isRTL ? 'ریاضی پایه هشتم' : 'Grade 8 Mathematics',
    lessonTitle: isRTL ? 'حل معادلات دو مجهولی' : 'Solving Two-Variable Equations',
    progress: 45,
    estimatedTime: 15,
  };

  const upcomingQuests = [
    {
      id: '1',
      title: isRTL ? 'تکمیل ۵ درس' : 'Complete 5 Lessons',
      progress: 3,
      total: 5,
      xpReward: 100,
      deadline: '2 days',
    },
    {
      id: '2',
      title: isRTL ? 'پاسخ به ۱۰ سوال' : 'Answer 10 Questions',
      progress: 7,
      total: 10,
      xpReward: 50,
      deadline: '3 days',
    },
  ];

  const recentAchievements = [
    { icon: '🔥', title: isRTL ? '۷ روز پیاپی' : '7 Day Streak', rarity: 'rare' },
    { icon: '📚', title: isRTL ? 'کتاب‌خوان' : 'Bookworm', rarity: 'common' },
    { icon: '⭐', title: isRTL ? 'ستاره درخشان' : 'Rising Star', rarity: 'epic' },
  ];

  const leaderboardPreview = [
    { name: isRTL ? 'سارا م.' : 'Sara M.', xp: 5200, avatar: undefined },
    { name: isRTL ? 'علی ر.' : 'Ali R.', xp: 4800, avatar: undefined },
    { name: isRTL ? 'مریم ک.' : 'Maryam K.', xp: 4500, avatar: undefined },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {isRTL ? 'سلام، علی! 👋' : 'Hi, Ali! 👋'}
          </h1>
          <p className="text-muted-foreground">
            {isRTL 
              ? 'آماده‌ای امروز یادگیری رو ادامه بدی؟'
              : "Ready to continue learning today?"
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            <Flame className="h-4 w-4" />
            <span className="font-semibold">{stats.streak}</span>
            <span className="text-sm">{isRTL ? 'روز' : 'days'}</span>
          </div>
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString(isRTL ? 'fa-IR' : 'en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.level')}</p>
                <p className="text-2xl font-bold">{stats.level}</p>
              </div>
            </div>
            <XPProgress
              currentXP={stats.currentXP}
              nextLevelXP={stats.nextLevelXP}
              level={stats.level}
              showLabel={false}
              className="mt-3"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.coursesInProgress')}</p>
                <p className="text-2xl font-bold">{stats.coursesInProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.completedLessons')}</p>
                <p className="text-2xl font-bold">{stats.completedLessons}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Trophy className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.badges')}</p>
                <p className="text-2xl font-bold">{stats.badges}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Continue Learning Card */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm opacity-90">{t('dashboard.continueLearning')}</p>
                  <h3 className="text-xl font-bold mt-1">{continueLesson.courseTitle}</h3>
                  <p className="text-sm opacity-90 mt-1">{continueLesson.lessonTitle}</p>
                </div>
                <Link
                  href={`/${locale}/courses/1/lessons/l10`}
                  className="flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition"
                >
                  <Play className="h-4 w-4" />
                  {t('common.continue')}
                </Link>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${continueLesson.progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{continueLesson.progress}%</span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm opacity-90">
                <Clock className="h-4 w-4" />
                <span>{continueLesson.estimatedTime} {isRTL ? 'دقیقه باقی‌مانده' : 'min remaining'}</span>
              </div>
            </div>
          </Card>

          {/* Recent Courses */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t('dashboard.recentCourses')}</h2>
              <Link
                href={`/${locale}/courses`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                {t('common.viewAll')}
                <Arrow className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  {...course}
                  onClick={() => router.push(`/${locale}/courses/${course.id}`)}
                />
              ))}
            </div>
          </div>

          {/* Active Quests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">{t('gamification.quests')}</CardTitle>
              <Link
                href={`/${locale}/quests`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                {t('common.viewAll')}
                <Arrow className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingQuests.map((quest) => (
                <div key={quest.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{quest.title}</h4>
                      <span className="text-sm text-amber-600">+{quest.xpReward} XP</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(quest.progress / quest.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {quest.progress}/{quest.total}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ⏰ {quest.deadline} {isRTL ? 'باقی‌مانده' : 'left'}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Weekly Goal */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                {t('dashboard.weeklyGoal')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <CircularProgress value={stats.weeklyGoalProgress} size={120}>
                  <div className="text-center">
                    <span className="text-2xl font-bold">{stats.weeklyGoalProgress}%</span>
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? 'تکمیل‌شده' : 'Complete'}
                    </p>
                  </div>
                </CircularProgress>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.todayMinutes}</p>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'دقیقه امروز' : 'min today'}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.weeklyMinutes}</p>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'دقیقه این هفته' : 'min this week'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Streak Calendar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{isRTL ? 'فعالیت هفتگی' : 'Weekly Activity'}</CardTitle>
            </CardHeader>
            <CardContent>
              <StreakProgress
                currentStreak={stats.streak}
                daysOfWeek={[true, true, true, true, true, true, true]}
              />
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                {t('gamification.recentAchievements')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAchievements.map((achievement, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{achievement.rarity}</p>
                  </div>
                </div>
              ))}
              <Link
                href={`/${locale}/achievements`}
                className="block text-center text-sm text-primary hover:underline mt-2"
              >
                {t('common.viewAll')} →
              </Link>
            </CardContent>
          </Card>

          {/* Leaderboard Preview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t('gamification.leaderboard')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboardPreview.map((user, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-6 text-center font-bold text-muted-foreground">
                    {idx + 1}
                  </span>
                  <UserAvatar name={user.name} size="sm" showLevel={false} />
                  <span className="flex-1 font-medium">{user.name}</span>
                  <span className="text-sm text-amber-600">
                    {user.xp.toLocaleString()} XP
                  </span>
                </div>
              ))}
              <Link
                href={`/${locale}/leaderboard`}
                className="block text-center text-sm text-primary hover:underline mt-2"
              >
                {t('common.viewAll')} →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
