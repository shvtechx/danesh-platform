'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, BookOpen, GraduationCap, BarChart3, Settings, Bell,
  TrendingUp, Award, Calendar, ChevronRight, ChevronLeft,
  UserPlus, FileText, Shield, Activity, Clock, CheckCircle,
  User, LogOut, ChevronDown, Layers
} from 'lucide-react';
import { ImpersonationBanner } from '@/components/auth/ImpersonationBanner';
import {
  AUTH_STORAGE_KEY,
  clearAuthSession,
  ORIGINAL_USER_STORAGE_KEY,
  getHomeRouteForRoles,
  getPrimaryRole,
  hasPermission,
  persistAuthSession,
} from '@/lib/auth/demo-auth-shared';
import { isDemoDataEnabled } from '@/lib/demo/demo-mode';

export default function AdminDashboard({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const router = useRouter();
  const isRTL = locale === 'fa';
  const demoDataEnabled = isDemoDataEnabled();
  const Arrow = isRTL ? ChevronLeft : ChevronRight;

  const [authUser, setAuthUser] = useState<any>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [switchableAccounts, setSwitchableAccounts] = useState<any[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<{ stats?: any; recentTeachers?: any[] } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        setAuthUser(JSON.parse(raw));
      }
    } catch {
      setAuthUser(null);
    }
  }, []);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    const currentRole = getPrimaryRole(authUser.roles || []);
    if (currentRole !== 'SUPER_ADMIN' && currentRole !== 'SUBJECT_ADMIN') {
      router.replace(getHomeRouteForRoles(locale, authUser.roles || []));
    }
  }, [authUser, locale, router]);

  useEffect(() => {
    const loadDashboardSummary = async () => {
      try {
        const response = await fetch(`/api/v1/admin/dashboard-summary?locale=${locale}`);
        if (!response.ok) {
          throw new Error('failed_to_load_dashboard_summary');
        }

        const data = await response.json();
        setDashboardSummary(data);
      } catch {
        setDashboardSummary(null);
      }
    };

    loadDashboardSummary();
  }, [locale]);

  useEffect(() => {
    const loadSwitchableAccounts = async () => {
      try {
        const response = await fetch('/api/v1/admin/users');
        if (!response.ok) {
          throw new Error('failed_to_load_accounts');
        }

        const data = await response.json();
        setSwitchableAccounts((data.users || []).filter((user: any) => user.roles?.[0] !== 'SUPER_ADMIN'));
      } catch {
        setSwitchableAccounts([]);
      }
    };

    loadSwitchableAccounts();
  }, []);

  useEffect(() => {
    if (!demoDataEnabled) {
      setApprovals([]);
      return;
    }

    const initialApprovals = [
      {
        id: 'approval-1',
        type: 'teacher',
        name: isRTL ? 'علی کریمی' : 'Ali Karimi',
        action: isRTL ? 'درخواست ثبت‌نام معلم' : 'Teacher registration request',
        time: isRTL ? '۲ ساعت پیش' : '2 hours ago',
      },
      {
        id: 'approval-2',
        type: 'course',
        name: isRTL ? 'دوره جبر پیشرفته' : 'Advanced Algebra Course',
        action: isRTL ? 'در انتظار تأیید' : 'Pending approval',
        time: isRTL ? '۵ ساعت پیش' : '5 hours ago',
      },
    ];
    setApprovals(initialApprovals);
  }, [demoDataEnabled, isRTL]);

  const handleApprove = (id: string) => {
    setApprovals((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReject = (id: string) => {
    setApprovals((prev) => prev.filter((item) => item.id !== id));
  };

  const currentRole = getPrimaryRole(authUser?.roles || []);
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';
  const stats = !demoDataEnabled
    ? {
        totalTeachers: dashboardSummary?.stats?.totalTeachers || 0,
        totalStudents: dashboardSummary?.stats?.totalStudents || 0,
        totalCourses: dashboardSummary?.stats?.totalCourses || 0,
        activeClasses: dashboardSummary?.stats?.activeClasses || 0,
        pendingApprovals: dashboardSummary?.stats?.pendingApprovals || approvals.length,
        newRegistrations: dashboardSummary?.stats?.newRegistrations || 0,
      }
    : isSuperAdmin
    ? {
        totalTeachers: 24,
        totalStudents: 856,
        totalCourses: 48,
        activeClasses: 32,
        pendingApprovals: approvals.length,
        newRegistrations: 12,
      }
    : {
        totalTeachers: 8,
        totalStudents: 214,
        totalCourses: 16,
        activeClasses: 12,
        pendingApprovals: approvals.length,
        newRegistrations: 4,
      };

  const recentTeachers = demoDataEnabled ? [
    {
      id: 't1',
      name: isRTL ? 'دکتر احمدی' : 'Dr. Ahmadi',
      subject: isRTL ? 'ریاضی' : 'Mathematics',
      students: 45,
      courses: 3,
      status: 'active',
      avatar: 'A',
    },
    {
      id: 't2',
      name: isRTL ? 'استاد محمدی' : 'Prof. Mohammadi',
      subject: isRTL ? 'فیزیک' : 'Physics',
      students: 38,
      courses: 2,
      status: 'active',
      avatar: 'M',
    },
    {
      id: 't3',
      name: isRTL ? 'خانم رضایی' : 'Ms. Rezaei',
      subject: isRTL ? 'زبان انگلیسی' : 'English',
      students: 52,
      courses: 4,
      status: 'active',
      avatar: 'R',
    },
  ] : (dashboardSummary?.recentTeachers || []);

  const quickActions = useMemo(
    () => [
      isSuperAdmin && {
        href: `/${locale}/admin/users`,
        icon: UserPlus,
        label: isRTL ? 'مدیریت کاربران' : 'Manage Users',
        color: 'bg-blue-100 text-blue-600',
      },
      isSuperAdmin && {
        href: `/${locale}/admin/subjects`,
        icon: FileText,
        label: isRTL ? 'مدیریت موضوعات' : 'Manage Subjects',
        color: 'bg-sky-100 text-sky-600',
      },
      hasPermission(authUser, 'students.assign') && {
        href: `/${locale}/admin/assignments`,
        icon: Users,
        label: isRTL ? 'تخصیص دانش‌آموزان' : 'Assign Students',
        color: 'bg-green-100 text-green-600',
      },
      hasPermission(authUser, 'teachers.assignSubjects') && {
        href: `/${locale}/admin/courses`,
        icon: BookOpen,
        label: isRTL ? 'تخصیص موضوع و دوره' : 'Assign Subjects & Courses',
        color: 'bg-purple-100 text-purple-600',
      },
      {
        href: `/${locale}/admin/course-management`,
        icon: Layers,
        label: isRTL ? 'مدیریت دوره‌ها (جدید)' : 'Course Management',
        color: 'bg-indigo-100 text-indigo-600',
      },
      isSuperAdmin && {
        href: `/${locale}/admin/reports`,
        icon: BarChart3,
        label: isRTL ? 'گزارش‌های کل سیستم' : 'System Reports',
        color: 'bg-amber-100 text-amber-600',
      },
    ].filter(Boolean) as Array<{ href: string; icon: any; label: string; color: string }>,
    [authUser, isRTL, isSuperAdmin, locale],
  );

  const handleViewAs = (user: any) => {
    if (!isSuperAdmin) return;
    try {
      const currentRawUser = localStorage.getItem(AUTH_STORAGE_KEY);
      const currentUser = authUser || (currentRawUser ? JSON.parse(currentRawUser) : null);
      if (!localStorage.getItem(ORIGINAL_USER_STORAGE_KEY) && currentUser) {
        localStorage.setItem(ORIGINAL_USER_STORAGE_KEY, JSON.stringify(currentUser));
      }
      persistAuthSession(user);
      window.location.assign(getHomeRouteForRoles(locale, user.roles || []));
    } catch {
      // ignore local storage errors
    }
  };

  const notifications = demoDataEnabled ? [
    {
      id: 'n1',
      title: isRTL ? 'درخواست جدید برای نقش معلم' : 'New teacher-role request',
      time: isRTL ? '۱۰ دقیقه پیش' : '10 min ago',
    },
    {
      id: 'n2',
      title: isRTL ? 'موضوع جدید ایجاد شد' : 'A new subject was created',
      time: isRTL ? '۴۵ دقیقه پیش' : '45 min ago',
    },
    {
      id: 'n3',
      title: isRTL ? 'یک تخصیص دانش‌آموز نیاز به بررسی دارد' : 'A student assignment needs review',
      time: isRTL ? 'دیروز' : 'Yesterday',
    },
  ] : [];

  const handleLogout = () => {
    clearAuthSession();
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
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-primary">{t('common.appName')}</span>
            </Link>
            <span className="text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-3 py-1 rounded-full font-medium">
              {isSuperAdmin ? (isRTL ? 'پنل سوپر ادمین' : 'Super Admin Panel') : (isRTL ? 'پنل مدیر دروس' : 'Subject Admin Panel')}
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
                      {notifications.map((item) => (
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
            <Link href={`/${locale}/admin/settings`} className="p-2 rounded-lg hover:bg-muted">
              <Settings className="h-5 w-5" />
            </Link>
            <div className="relative">
              <button
                onClick={() => {
                  setUserMenuOpen((prev) => !prev);
                  setNotificationsOpen(false);
                }}
                className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center font-semibold text-white"
              >
                {(authUser?.profile?.displayName?.[0] || (isRTL ? 'م' : 'A')).toUpperCase()}
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className={`absolute top-full mt-2 w-56 rounded-lg border bg-card shadow-lg z-[80] ${
                    isRTL ? 'left-0' : 'right-0'
                  }`}>
                    <div className="p-3 border-b">
                      <p className="font-medium">{authUser?.profile?.displayName || 'Admin'}</p>
                      <p className="text-sm text-muted-foreground">{authUser?.email || 'admin@danesh.app'}</p>
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
                        href={`/${locale}/admin/settings`}
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
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            {isSuperAdmin ? (isRTL ? 'مدیریت کامل سیستم 🛡️' : 'Full System Administration 🛡️') : (isRTL ? 'مدیریت موضوعات و تخصیص‌ها 📚' : 'Subject Operations & Assignment Management 📚')}
          </h1>
          <p className="text-muted-foreground">
            {isSuperAdmin
              ? (isRTL ? 'ایجاد و حذف همه کاربران و موضوعات، مدیریت نقش‌ها و مشاهده همه حساب‌ها' : 'Create/remove all users and subjects, manage roles, and access every account')
              : (isRTL ? 'تخصیص دانش‌آموزان و موضوعات به معلمان و مدیریت دروس تحت پوشش' : 'Assign students and subjects to teachers and manage covered subjects')}
          </p>
        </div>

        <ImpersonationBanner locale={locale} />

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalTeachers}</p>
                <p className="text-xs text-muted-foreground">{isRTL ? 'معلمان' : 'Teachers'}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
                <p className="text-xs text-muted-foreground">{isRTL ? 'دانش‌آموزان' : 'Students'}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCourses}</p>
                <p className="text-xs text-muted-foreground">{isRTL ? 'دوره‌ها' : 'Courses'}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Activity className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeClasses}</p>
                <p className="text-xs text-muted-foreground">{isRTL ? 'کلاس فعال' : 'Active Classes'}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
                <p className="text-xs text-muted-foreground">{isRTL ? 'در انتظار' : 'Pending'}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                <UserPlus className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.newRegistrations}</p>
                <p className="text-xs text-muted-foreground">{isRTL ? 'ثبت‌نام جدید' : 'New Signups'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {quickActions.map((action, idx) => (
            <Link
              key={idx}
              href={action.href}
              className="flex items-center gap-3 p-4 bg-card border rounded-xl hover:shadow-md transition-shadow"
            >
              <div className={`p-3 rounded-xl ${action.color}`}>
                <action.icon className="h-6 w-6" />
              </div>
              <span className="font-medium">{action.label}</span>
              <Arrow className="h-5 w-5 ms-auto text-muted-foreground" />
            </Link>
          ))}
        </div>

        {isSuperAdmin && (
          <div className="mb-8 rounded-2xl border bg-card p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold">{isRTL ? 'ورود سریع به حساب نقش‌ها' : 'Quick access to role accounts'}</h2>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'برای بررسی سطح دسترسی، بدون ورود مجدد نقش‌ها را مشاهده کنید.' : 'Review privileges without logging out and back in.'}
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {switchableAccounts.map((user) => (
                <div key={user.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{user.profile.displayName}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="mt-2 text-xs uppercase tracking-wide text-primary">{user.roles.join(', ')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewAs(user)}
                    className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {isRTL ? 'مشاهده این حساب' : 'View this account'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Teachers List */}
          <div className="lg:col-span-2 bg-card border rounded-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                {isRTL ? 'معلمان فعال' : 'Active Teachers'}
              </h2>
              <Link 
                href={`/${locale}/admin/teachers`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                {isRTL ? 'مشاهده همه' : 'View All'}
                <Arrow className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y">
              {recentTeachers.map((teacher) => (
                <Link
                  key={teacher.id}
                  href={`/${locale}/admin/teachers/${teacher.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-lg">
                    {teacher.avatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{teacher.name}</h3>
                    <p className="text-sm text-muted-foreground">{teacher.subject}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-medium">{teacher.students} {isRTL ? 'دانش‌آموز' : 'students'}</p>
                    <p className="text-xs text-muted-foreground">{teacher.courses} {isRTL ? 'دوره' : 'courses'}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                    {isRTL ? 'فعال' : 'Active'}
                  </span>
                </Link>
              ))}
            </div>
            <div className="p-4 border-t">
              <Link
                href={`/${locale}/admin/teachers/new`}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed hover:border-primary/50 text-muted-foreground hover:text-foreground"
              >
                <UserPlus className="h-5 w-5" />
                {isRTL ? 'افزودن معلم جدید' : 'Add New Teacher'}
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending Approvals */}
            <div className="bg-card border rounded-xl">
              <div className="p-4 border-b">
                <h2 className="font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  {isRTL ? 'در انتظار تأیید' : 'Pending Approvals'}
                </h2>
              </div>
              <div className="divide-y">
                {approvals.length > 0 ? (
                  approvals.map((item) => (
                    <div key={item.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${item.type === 'teacher' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                          {item.type === 'teacher' ? (
                            <GraduationCap className="h-4 w-4 text-blue-600" />
                          ) : (
                            <BookOpen className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.action}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button 
                          onClick={() => handleApprove(item.id)}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 transition-colors"
                        >
                          {isRTL ? 'تأیید' : 'Approve'}
                        </button>
                        <button 
                          onClick={() => handleReject(item.id)}
                          className="flex-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-muted transition-colors"
                        >
                          {isRTL ? 'رد' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p className="text-sm">{isRTL ? 'همه موارد بررسی شده‌اند' : 'All items reviewed'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-card border rounded-xl p-4">
              <h2 className="font-semibold mb-3">{isRTL ? 'دسترسی سریع' : 'Quick Access'}</h2>
              <div className="space-y-2">
                {isSuperAdmin && (
                  <Link 
                    href={`/${locale}/admin/users`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                  >
                    <span className="text-sm">{isRTL ? 'مدیریت کاربران' : 'Manage Users'}</span>
                    <Arrow className="h-4 w-4" />
                  </Link>
                )}
                <Link 
                  href={`/${locale}/admin/teachers`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                >
                  <span className="text-sm">{isRTL ? 'مدیریت معلمان' : 'Manage Teachers'}</span>
                  <Arrow className="h-4 w-4" />
                </Link>
                {isSuperAdmin && (
                  <Link 
                    href={`/${locale}/admin/subjects`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                  >
                    <span className="text-sm">{isRTL ? 'مدیریت موضوعات' : 'Manage Subjects'}</span>
                    <Arrow className="h-4 w-4" />
                  </Link>
                )}
                <Link 
                  href={`/${locale}/admin/assignments`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                >
                  <span className="text-sm">{isRTL ? 'تخصیص دانش‌آموز' : 'Assign Students'}</span>
                  <Arrow className="h-4 w-4" />
                </Link>
                <Link 
                  href={`/${locale}/admin/courses`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                >
                  <span className="text-sm">{isRTL ? 'تخصیص دوره‌ها' : 'Assign Courses'}</span>
                  <Arrow className="h-4 w-4" />
                </Link>
                <Link 
                  href={`/${locale}/admin/reports`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                >
                  <span className="text-sm">{isRTL ? 'گزارش‌گیری' : 'Generate Reports'}</span>
                  <Arrow className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">{isRTL ? 'وضعیت سیستم' : 'System Status'}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {isRTL ? 'تمام سرویس‌ها فعال و در حال اجرا هستند' : 'All services are running normally'}
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{isRTL ? 'سرور' : 'Server'}</span>
                  <span className="text-green-600">● {isRTL ? 'فعال' : 'Online'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>{isRTL ? 'دیتابیس' : 'Database'}</span>
                  <span className="text-green-600">● {isRTL ? 'فعال' : 'Online'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
