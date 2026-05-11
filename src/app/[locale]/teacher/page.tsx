'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, Users, FileText, BarChart, MessageSquare, 
  Plus, Edit, Eye, Clock, TrendingUp, Award, Calendar,
  ChevronRight, ChevronLeft, Settings, Bell, User, LogOut,
  Brain, Target, CheckCircle
} from 'lucide-react';
import { ImpersonationBanner } from '@/components/auth/ImpersonationBanner';
import { getLocalizedSubjectName } from '@/lib/admin/teacher-metadata';
import { AUTH_STORAGE_KEY, ORIGINAL_USER_STORAGE_KEY, USER_ID_STORAGE_KEY, createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import { isDemoDataEnabled } from '@/lib/demo/demo-mode';

function formatDashboardDate(value: string | Date | null | undefined, locale: string) {
  if (!value) {
    return locale === 'fa' ? '—' : '—';
  }

  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export default function TeacherDashboard({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const router = useRouter();
  const isRTL = locale === 'fa';
  const demoDataEnabled = isDemoDataEnabled();
  const Arrow = isRTL ? ChevronLeft : ChevronRight;
  const [authUser, setAuthUser] = useState<any>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [studentProgress, setStudentProgress] = useState<any>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const shouldUseDemoFallback = useMemo(
    () => demoDataEnabled && String(authUser?.id || '').startsWith('demo-'),
    [authUser?.id, demoDataEnabled],
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        setAuthUser(JSON.parse(raw));
      }
    } catch {
      setAuthUser(null);
    }
    
    loadStudentProgress();
  }, []);

  const loadStudentProgress = async () => {
    try {
      const res = await fetch(`/api/v1/teacher/student-progress?locale=${locale}`, {
        headers: createUserHeaders(getStoredUserId()),
      });
      if (res.ok) {
        const data = await res.json();
        setStudentProgress(data);
      }
    } catch (error) {
      console.error('Error loading student progress:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  const teacherName = useMemo(
    () => authUser?.profile?.displayName || (shouldUseDemoFallback ? (isRTL ? 'دکتر احمدی' : 'Dr. Ahmadi') : (isRTL ? 'معلم' : 'Teacher')),
    [authUser, isRTL, shouldUseDemoFallback],
  );

  const assignedSubject = useMemo(
    () => {
      const subjectCode = authUser?.assignedSubjectCodes?.[0];
      if (subjectCode) {
        return getLocalizedSubjectName(subjectCode, locale);
      }

      if (authUser?.assignedSubjects?.[0]) {
        return authUser.assignedSubjects[0];
      }

      return shouldUseDemoFallback ? (isRTL ? 'ریاضی' : 'Mathematics') : (isRTL ? 'بدون تخصیص' : 'Unassigned');
    },
    [authUser, isRTL, locale, shouldUseDemoFallback],
  );

  const stats = shouldUseDemoFallback ? {
    totalStudents: 156,
    activeCourses: 4,
    totalLessons: 48,
    pendingReviews: 12,
    avgProgress: 67,
    thisWeekXP: 2450,
  } : {
    totalStudents: studentProgress?.summary?.totalStudents || 0,
    activeCourses: studentProgress?.courseSummaries?.length || 0,
    totalLessons: studentProgress?.courseSummaries?.reduce((sum: number, course: any) => sum + (course.lessons || 0), 0) || 0,
    pendingReviews: 0,
    avgProgress: studentProgress?.summary?.averageMastery || 0,
    thisWeekXP: 0,
  };

  const myCourses = shouldUseDemoFallback ? [
    {
      id: '1',
      title: isRTL ? 'ریاضی پایه هشتم' : 'Grade 8 Mathematics',
      students: 45,
      lessons: 24,
      progress: 65,
      lastUpdated: isRTL ? 'دیروز' : 'Yesterday',
    },
    {
      id: '2',
      title: isRTL ? 'ریاضی پایه نهم' : 'Grade 9 Mathematics',
      students: 38,
      lessons: 20,
      progress: 40,
      lastUpdated: isRTL ? '۳ روز پیش' : '3 days ago',
    },
    {
      id: '3',
      title: isRTL ? 'هندسه پایه دهم' : 'Grade 10 Geometry',
      students: 52,
      lessons: 18,
      progress: 85,
      lastUpdated: isRTL ? 'امروز' : 'Today',
    },
  ] : (studentProgress?.courseSummaries || []).map((course: any) => ({
    id: course.id,
    title: course.title,
    students: course.students,
    lessons: course.lessons,
    progress: course.progress,
    lastUpdated: formatDashboardDate(course.updatedAt, locale),
  }));

  const recentActivity = shouldUseDemoFallback ? [
    {
      type: 'submission',
      student: isRTL ? 'علی احمدی' : 'Ali Ahmadi',
      action: isRTL ? 'آزمون فصل ۳ را تکمیل کرد' : 'completed Chapter 3 quiz',
      time: isRTL ? '۵ دقیقه پیش' : '5 min ago',
      score: 92,
    },
    {
      type: 'question',
      student: isRTL ? 'سارا محمدی' : 'Sara Mohammadi',
      action: isRTL ? 'سوالی در درس معادلات پرسید' : 'asked a question in Equations lesson',
      time: isRTL ? '۱۵ دقیقه پیش' : '15 min ago',
    },
    {
      type: 'completion',
      student: isRTL ? 'مریم کریمی' : 'Maryam Karimi',
      action: isRTL ? 'درس هندسه را تکمیل کرد' : 'completed Geometry lesson',
      time: isRTL ? '۳۰ دقیقه پیش' : '30 min ago',
    },
  ] : (studentProgress?.recentSessions || []).slice(0, 5).map((session: any) => ({
    type: 'practice',
    student: session.studentName,
    action: isRTL ? `تمرین ${session.skillName} در ${session.subject}` : `practiced ${session.skillName} in ${session.subject}`,
    time: formatDashboardDate(session.startedAt, locale),
    score: session.accuracy,
  }));

  const topStudents = shouldUseDemoFallback ? [
    { name: isRTL ? 'علی احمدی' : 'Ali Ahmadi', xp: 2450, progress: 92 },
    { name: isRTL ? 'سارا محمدی' : 'Sara Mohammadi', xp: 2280, progress: 88 },
    { name: isRTL ? 'محمد رضایی' : 'Mohammad Rezaei', xp: 2100, progress: 85 },
  ] : (studentProgress?.students || [])
    .slice()
    .sort((a: any, b: any) => b.averageMastery - a.averageMastery)
    .slice(0, 3)
    .map((student: any) => ({
      name: student.studentName,
      xp: student.totalAttempts * 10,
      progress: student.averageMastery,
    }));

  const notifications = shouldUseDemoFallback ? [
    {
      id: 'n1',
      title: isRTL ? 'پاسخ جدید برای سوال دانش‌آموز' : 'New reply on student question',
      time: isRTL ? '۸ دقیقه پیش' : '8 min ago',
    },
    {
      id: 'n2',
      title: isRTL ? 'تکلیف جدید برای بررسی ارسال شد' : 'A new assignment was submitted for review',
      time: isRTL ? '۳۵ دقیقه پیش' : '35 min ago',
    },
    {
      id: 'n3',
      title: isRTL ? 'برنامه هفتگی به‌روزرسانی شد' : 'Weekly schedule updated',
      time: isRTL ? 'دیروز' : 'Yesterday',
    },
  ] : (studentProgress?.recentSessions || []).slice(0, 3).map((session: any) => ({
    id: session.id,
    title: isRTL
      ? `${session.studentName} تمرین ${session.skillName} را تکمیل کرد`
      : `${session.studentName} completed ${session.skillName} practice`,
    time: formatDashboardDate(session.startedAt, locale),
  }));

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(USER_ID_STORAGE_KEY);
    localStorage.removeItem(ORIGINAL_USER_STORAGE_KEY);
    router.push(`/${locale}/login`);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-primary">{t('common.appName')}</span>
            </Link>
            <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
              {isRTL ? 'پنل معلم' : 'Teacher Panel'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen((prev) => !prev);
                  setUserMenuOpen(false);
                }}
                className="relative p-2 rounded-lg hover:bg-muted"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
              </button>
              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className={`absolute top-full mt-2 w-80 rounded-lg border bg-card shadow-lg z-[80] ${
                    isRTL ? 'left-0' : 'right-0'
                  }`}>
                    <div className="p-3 border-b">
                      <p className="font-semibold">{isRTL ? 'اعلان‌ها' : 'Notifications'}</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((item: any) => (
                        <button
                          key={item.id}
                          className="w-full px-3 py-3 text-start hover:bg-muted transition-colors border-b last:border-0"
                          onClick={() => setNotificationsOpen(false)}
                        >
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <Link href={`/${locale}/teacher/settings`} className="p-2 rounded-lg hover:bg-muted">
              <Settings className="h-5 w-5" />
            </Link>
            <div className="relative">
              <button
                onClick={() => {
                  setUserMenuOpen((prev) => !prev);
                  setNotificationsOpen(false);
                }}
                className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary"
              >
                {(authUser?.profile?.displayName?.[0] || (isRTL ? 'م' : 'T')).toUpperCase()}
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className={`absolute top-full mt-2 w-56 rounded-lg border bg-card shadow-lg z-[80] ${
                    isRTL ? 'left-0' : 'right-0'
                  }`}>
                    <div className="p-3 border-b">
                      <p className="font-medium">{authUser?.profile?.displayName || teacherName}</p>
                      <p className="text-sm text-muted-foreground">{authUser?.email || 'teacher.math@danesh.app'}</p>
                    </div>
                    <div className="p-1">
                      <Link
                        href={`/${locale}/profile`}
                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        {isRTL ? 'پروفایل' : 'Profile'}
                      </Link>
                      <Link
                        href={`/${locale}/teacher/settings`}
                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        {isRTL ? 'تنظیمات' : 'Settings'}
                      </Link>
                      <hr className="my-1" />
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-destructive"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                        {isRTL ? 'خروج' : 'Logout'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <ImpersonationBanner locale={locale} />
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            {isRTL ? `سلام، ${teacherName}! 👋` : `Hello, ${teacherName}! 👋`}
          </h1>
          <p className="text-muted-foreground">
            {isRTL ? `شما مسئول ویرایش و مدیریت درس‌های ${assignedSubject} هستید` : `You can edit and manage your assigned ${assignedSubject} subjects and courses`}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'کل دانش‌آموزان' : 'Total Students'}</p>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'دوره‌های فعال' : 'Active Courses'}</p>
                <p className="text-2xl font-bold">{stats.activeCourses}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'در انتظار بررسی' : 'Pending Reviews'}</p>
                <p className="text-2xl font-bold">{stats.pendingReviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'میانگین پیشرفت' : 'Avg Progress'}</p>
                <p className="text-2xl font-bold">{stats.avgProgress}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Link
                href={`/${locale}/teacher/courses/new`}
                className="flex items-center gap-3 p-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-6 w-6" />
                <span className="font-medium">{isRTL ? 'دوره جدید' : 'New Course'}</span>
              </Link>
              <Link
                href={`/${locale}/teacher/content`}
                className="flex items-center gap-3 p-4 bg-card border rounded-xl hover:bg-muted transition-colors"
              >
                <Edit className="h-6 w-6 text-primary" />
                <span className="font-medium">{isRTL ? 'ایجاد محتوا' : 'Create Content'}</span>
              </Link>
              <Link
                href={`/${locale}/teacher/analytics`}
                className="flex items-center gap-3 p-4 bg-card border rounded-xl hover:bg-muted transition-colors"
              >
                <BarChart className="h-6 w-6 text-primary" />
                <span className="font-medium">{isRTL ? 'تحلیل‌ها' : 'Analytics'}</span>
              </Link>
            </div>

            {/* Teacher Leaderboard CTA */}
            <Link
              href={`/${locale}/teacher/leaderboard`}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <Award className="h-6 w-6" />
                <div>
                  <p className="font-semibold">{isRTL ? 'تابلوی افتخار معلمان 🏆' : "Teachers' Leaderboard 🏆"}</p>
                  <p className="text-xs text-white/70">{isRTL ? 'ببینید در بین همکاران کجا قرار دارید' : 'See how you rank among your peers'}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-white/70" />
            </Link>

            {/* Adaptive Assessment Student Progress */}
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <Brain className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {isRTL ? 'گزارش ارزیابی تطبیقی' : 'Adaptive Assessment Reports'}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {isRTL ? 'پیشرفت دانش‌آموزان در سیستم تمرین هوشمند' : 'Student progress in smart practice system'}
                    </p>
                  </div>
                </div>
              </div>

              {loadingProgress ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : studentProgress?.students?.length > 0 ? (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-800/50">
                      <div className="flex items-center justify-between mb-2">
                        <Users className="h-5 w-5 text-emerald-600" />
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">
                          {studentProgress.summary.studentsWithProgress}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {isRTL ? 'دانش‌آموز فعال' : 'Active Students'}
                      </p>
                    </div>

                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-800/50">
                      <div className="flex items-center justify-between mb-2">
                        <Target className="h-5 w-5 text-teal-600" />
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">
                          {studentProgress.summary.averageMastery}%
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {isRTL ? 'میانگین تسلط' : 'Avg Mastery'}
                      </p>
                    </div>

                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-800/50">
                      <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">
                          {studentProgress.students.reduce((sum: number, s: any) => sum + s.masteredSkills, 0)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {isRTL ? 'مهارت‌های تسلط‌یافته' : 'Skills Mastered'}
                      </p>
                    </div>

                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-800/50">
                      <div className="flex items-center justify-between mb-2">
                        <BarChart className="h-5 w-5 text-cyan-600" />
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">
                          {studentProgress.summary.totalPracticeSessions}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {isRTL ? 'جلسات تمرین' : 'Practice Sessions'}
                      </p>
                    </div>
                  </div>

                  {/* Top Students */}
                  <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-800/50">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                      {isRTL ? 'برترین دانش‌آموزان' : 'Top Performing Students'}
                    </h3>
                    <div className="space-y-2">
                      {studentProgress.students
                        .sort((a: any, b: any) => b.averageMastery - a.averageMastery)
                        .slice(0, 5)
                        .map((student: any, index: number) => (
                          <div
                            key={student.studentId}
                            className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-sm">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {student.studentName}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {student.totalSkills} {isRTL ? 'مهارت' : 'skills'} • {student.masteredSkills} {isRTL ? 'تسلط‌یافته' : 'mastered'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-emerald-600">
                                {student.averageMastery}%
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {student.totalAttempts} {isRTL ? 'تلاش' : 'attempts'}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Recent Practice Sessions */}
                  {studentProgress.recentSessions?.length > 0 && (
                    <div className="mt-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-800/50">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                        {isRTL ? 'فعالیت‌های اخیر' : 'Recent Activity'}
                      </h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {studentProgress.recentSessions.slice(0, 10).map((session: any) => (
                          <div
                            key={session.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-sm"
                          >
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {session.studentName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {session.skillName} • {session.subject}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-emerald-600">
                                {session.accuracy}% {isRTL ? 'دقت' : 'accuracy'}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {session.questionsAnswered} {isRTL ? 'سوال' : 'questions'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">
                    {isRTL ? 'هنوز داده‌ای وجود ندارد' : 'No student activity yet'}
                  </p>
                </div>
              )}
            </div>

            {/* My Courses */}
            <div className="bg-card border rounded-xl">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold">{isRTL ? 'دوره‌های من' : 'My Courses'}</h2>
                <Link 
                  href={`/${locale}/teacher/courses`}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {isRTL ? 'مشاهده همه' : 'View All'}
                  <Arrow className="h-4 w-4" />
                </Link>
              </div>
              <div className="divide-y">
                {myCourses.map((course: any) => (
                  <Link
                    key={course.id}
                    href={`/${locale}/teacher/courses/${course.id}`}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{course.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {course.students}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {course.lessons} {isRTL ? 'درس' : 'lessons'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-muted">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{course.progress}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isRTL ? 'آخرین بروزرسانی:' : 'Updated:'} {course.lastUpdated}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border rounded-xl">
              <div className="p-4 border-b">
                <h2 className="font-semibold">{isRTL ? 'فعالیت‌های اخیر' : 'Recent Activity'}</h2>
              </div>
              <div className="divide-y">
                {recentActivity.map((activity: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-4 p-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      activity.type === 'submission' ? 'bg-green-100 text-green-600' :
                      activity.type === 'question' ? 'bg-blue-100 text-blue-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {activity.type === 'submission' ? <FileText className="h-5 w-5" /> :
                       activity.type === 'question' ? <MessageSquare className="h-5 w-5" /> :
                       <Award className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <p>
                        <span className="font-medium">{activity.student}</span>{' '}
                        <span className="text-muted-foreground">{activity.action}</span>
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                        {activity.score && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            {activity.score}%
                          </span>
                        )}
                      </div>
                    </div>
                    {activity.type === 'question' && (
                      <button type="button" onClick={() => router.push(`/${locale}/forum`)} className="text-sm text-primary hover:underline">
                        {isRTL ? 'پاسخ' : 'Reply'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - 1/3 */}
          <div className="space-y-6">
            {/* Top Students */}
            <div className="bg-card border rounded-xl">
              <div className="p-4 border-b">
                <h2 className="font-semibold flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  {isRTL ? 'دانش‌آموزان برتر' : 'Top Students'}
                </h2>
              </div>
              <div className="p-4 space-y-4">
                {topStudents.map((student: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className={`h-6 w-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      idx === 0 ? 'bg-amber-100 text-amber-700' :
                      idx === 1 ? 'bg-gray-100 text-gray-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.xp} XP</p>
                    </div>
                    <span className="text-sm text-green-600">{student.progress}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-card border rounded-xl p-4 space-y-2">
              <h2 className="font-semibold mb-3">{isRTL ? 'دسترسی سریع' : 'Quick Links'}</h2>
              <Link 
                href={`/${locale}/teacher/questions`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
              >
                <span className="text-sm">{isRTL ? 'بانک سوالات' : 'Question Bank'}</span>
                <Arrow className="h-4 w-4" />
              </Link>
              <Link 
                href={`/${locale}/teacher/students`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
              >
                <span className="text-sm">{isRTL ? 'مدیریت دانش‌آموزان' : 'Manage Students'}</span>
                <Arrow className="h-4 w-4" />
              </Link>
              <Link 
                href={`/${locale}/teacher/reports`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
              >
                <span className="text-sm">{isRTL ? 'گزارش‌ها' : 'Reports'}</span>
                <Arrow className="h-4 w-4" />
              </Link>
            </div>

            {/* Calendar */}
            <div className="bg-card border rounded-xl p-4">
              <h2 className="font-semibold flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-primary" />
                {isRTL ? 'برنامه هفتگی' : 'Weekly Schedule'}
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{isRTL ? 'کلاس آنلاین ریاضی' : 'Math Online Class'}</span>
                  <span className="text-muted-foreground">{isRTL ? 'شنبه ۱۰:۰۰' : 'Sat 10:00'}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isRTL ? 'جلسه رفع اشکال' : 'Q&A Session'}</span>
                  <span className="text-muted-foreground">{isRTL ? 'دوشنبه ۱۴:۰۰' : 'Mon 14:00'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
