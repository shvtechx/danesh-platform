'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  Download,
  Filter,
  GraduationCap,
  RefreshCw,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import { FeedbackBanner } from '@/components/ui/feedback-banner';

type AdminReportSummary = {
  stats: {
    totalTeachers: number;
    totalStudents: number;
    totalCourses: number;
    teachingHours: number;
  };
  topTeachers: Array<{
    id: string;
    name: string;
    subject: string;
    students: number;
    courses: number;
    completionRate: number;
    status: string;
  }>;
  departmentStats: Array<{
    id: string;
    name: string;
    teachers: number;
    students: number;
    courses: number;
    completion: number;
  }>;
  recentActivities: Array<{
    type: 'course' | 'student' | 'teacher';
    action: string;
    detail: string;
    time: string;
  }>;
  enrollmentsBySubject: Array<{
    id: string;
    name: string;
    enrollments: number;
    courses: number;
  }>;
  enrollmentTrend: Array<{
    id: string;
    name: string;
    students: number;
    completion: number;
  }>;
};

const EMPTY_DATA: AdminReportSummary = {
  stats: {
    totalTeachers: 0,
    totalStudents: 0,
    totalCourses: 0,
    teachingHours: 0,
  },
  topTeachers: [],
  departmentStats: [],
  recentActivities: [],
  enrollmentsBySubject: [],
  enrollmentTrend: [],
};

export default function AdminReportsPage({ params: { locale } }: { params: { locale: string } }) {
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [dateRange, setDateRange] = useState('month');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => new Date());
  const [report, setReport] = useState<AdminReportSummary>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ variant: 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    let active = true;

    const loadReport = async () => {
      try {
        setIsLoading(true);
        setFeedback(null);

        const response = await fetch(`/api/v1/admin/reports/summary?locale=${locale}`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load admin reports');
        }

        const data = (await response.json()) as AdminReportSummary;
        if (active) {
          setReport(data);
          setLastRefreshedAt(new Date());
        }
      } catch {
        if (active) {
          setReport(EMPTY_DATA);
          setFeedback({
            variant: 'error',
            message: isRTL ? 'بارگذاری گزارش‌های مدیریتی با مشکل روبه‌رو شد.' : 'Admin analytics could not be loaded.',
          });
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      active = false;
    };
  }, [isRTL, locale]);

  const filteredDepartmentStats = useMemo(() => {
    if (selectedDepartment === 'all') {
      return report.departmentStats;
    }

    return report.departmentStats.filter((department) => department.id === selectedDepartment);
  }, [report.departmentStats, selectedDepartment]);

  const visibleEnrollmentTrend = useMemo(() => {
    if (selectedDepartment === 'all') {
      return report.enrollmentTrend;
    }

    return report.enrollmentTrend.filter((department) => department.id === selectedDepartment);
  }, [report.enrollmentTrend, selectedDepartment]);

  const maxDepartmentStudents = Math.max(1, ...visibleEnrollmentTrend.map((item) => item.students));
  const maxSubjectEnrollments = Math.max(1, ...report.enrollmentsBySubject.map((item) => item.enrollments));

  const statCards = [
    {
      label: isRTL ? 'کل معلمان' : 'Total Teachers',
      value: report.stats.totalTeachers,
      helper: isRTL ? 'کاربران دارای نقش آموزشی' : 'Users with teaching roles',
      icon: Users,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: isRTL ? 'کل دانش‌آموزان' : 'Total Students',
      value: report.stats.totalStudents,
      helper: isRTL ? 'یادگیرندگان ثبت‌شده' : 'Registered learners',
      icon: GraduationCap,
      color: 'bg-green-500/10 text-green-600',
    },
    {
      label: isRTL ? 'کل دوره‌ها' : 'Total Courses',
      value: report.stats.totalCourses,
      helper: isRTL ? 'دوره‌های موجود در پایگاه داده' : 'Courses currently stored',
      icon: BookOpen,
      color: 'bg-purple-500/10 text-purple-600',
    },
    {
      label: isRTL ? 'ساعت آموزشی' : 'Teaching Hours',
      value: report.stats.teachingHours,
      helper: isRTL ? 'برآورد زمان درس‌ها' : 'Estimated lesson duration',
      icon: Clock,
      color: 'bg-orange-500/10 text-orange-600',
    },
  ];

  const handleRefresh = async () => {
    setFeedback({
      variant: 'info',
      message: isRTL ? 'در حال همگام‌سازی تازه‌ترین داده‌ها...' : 'Refreshing the latest analytics snapshot...',
    });

    try {
      const response = await fetch(`/api/v1/admin/reports/summary?locale=${locale}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('refresh-failed');
      }

      const data = (await response.json()) as AdminReportSummary;
      setReport(data);
      setLastRefreshedAt(new Date());
      setFeedback({
        variant: 'info',
        message: isRTL ? 'گزارش مدیریتی به‌روزرسانی شد.' : 'Admin report refreshed.',
      });
    } catch {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'به‌روزرسانی گزارش انجام نشد.' : 'Report refresh failed.',
      });
    }
  };

  const handleExport = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      locale,
      dateRange,
      selectedDepartment,
      report,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-report-${dateRange}-${selectedDepartment}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/admin`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Arrow className="h-5 w-5" />
              <span>{isRTL ? 'بازگشت' : 'Back'}</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h1 className="font-semibold">{isRTL ? 'گزارشات و آمار' : 'Reports & Analytics'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleRefresh} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'بروزرسانی' : 'Refresh'}</span>
            </button>
            <button type="button" onClick={handleExport} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'دانلود گزارش' : 'Export'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div>
          <p className="text-sm text-muted-foreground">
            {isRTL ? 'آخرین بروزرسانی:' : 'Last refreshed:'} {lastRefreshedAt.toLocaleString(isRTL ? 'fa-IR' : 'en-US')}
          </p>
          <p className="text-sm text-muted-foreground">
            {isRTL ? 'نمای مدیریتی با داده‌های واقعی کاربران، دوره‌ها و ثبت‌نام‌ها' : 'Administrative view backed by live users, courses, and enrollment data'}
          </p>
        </div>

        {feedback ? <FeedbackBanner variant={feedback.variant} message={feedback.message} /> : null}

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select value={dateRange} onChange={(event) => setDateRange(event.target.value)} className="bg-transparent text-sm outline-none">
              <option value="week">{isRTL ? 'هفته جاری' : 'This Week'}</option>
              <option value="month">{isRTL ? 'ماه جاری' : 'This Month'}</option>
              <option value="quarter">{isRTL ? 'سه ماهه' : 'This Quarter'}</option>
              <option value="year">{isRTL ? 'سال جاری' : 'This Year'}</option>
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select value={selectedDepartment} onChange={(event) => setSelectedDepartment(event.target.value)} className="bg-transparent text-sm outline-none">
              <option value="all">{isRTL ? 'همه گروه‌ها' : 'All Departments'}</option>
              {report.departmentStats.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-xl border bg-card p-4">
                <div className={`mb-3 inline-flex rounded-lg p-2 ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold">{isLoading ? '—' : stat.value.toLocaleString(isRTL ? 'fa-IR' : 'en-US')}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.helper}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <Trophy className="h-5 w-5 text-yellow-500" />
                {isRTL ? 'برترین معلمان' : 'Top Teachers'}
              </h2>
              <Link href={`/${locale}/admin/teachers`} className="text-sm text-primary hover:underline">
                {isRTL ? 'مشاهده همه' : 'View All'}
              </Link>
            </div>
            <div className="space-y-3">
              {report.topTeachers.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  {isRTL ? 'هنوز داده‌ای برای نمایش معلمان برتر وجود ندارد.' : 'No teacher activity is available yet.'}
                </p>
              ) : (
                report.topTeachers.map((teacher, index) => (
                  <div key={teacher.id} className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{index + 1}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{teacher.name}</p>
                      <p className="text-xs text-muted-foreground">{teacher.subject}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{teacher.students} {isRTL ? 'دانش‌آموز' : 'students'}</p>
                      <p>{teacher.courses} {isRTL ? 'دوره' : 'courses'}</p>
                    </div>
                    <div className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">{teacher.completionRate}%</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <Target className="h-5 w-5 text-primary" />
              {isRTL ? 'عملکرد گروه‌ها' : 'Department Performance'}
            </h2>
            <div className="space-y-4">
              {filteredDepartmentStats.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  {isRTL ? 'داده‌ای برای این گروه در دسترس نیست.' : 'No department data is available for this filter.'}
                </p>
              ) : (
                filteredDepartmentStats.map((department) => (
                  <div key={department.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{department.name}</span>
                      <span className="text-muted-foreground">{department.completion}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${department.completion}%` }} />
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{department.teachers} {isRTL ? 'معلم' : 'teachers'}</span>
                      <span>{department.students} {isRTL ? 'دانش‌آموز' : 'students'}</span>
                      <span>{department.courses} {isRTL ? 'دوره' : 'courses'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Clock className="h-5 w-5 text-primary" />
            {isRTL ? 'فعالیت‌های اخیر' : 'Recent Activities'}
          </h2>
          <div className="space-y-3">
            {report.recentActivities.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                {isRTL ? 'فعلاً فعالیت مدیریتی تازه‌ای ثبت نشده است.' : 'No recent admin activity has been recorded yet.'}
              </p>
            ) : (
              report.recentActivities.map((activity, index) => (
                <div key={`${activity.type}-${index}`} className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50">
                  <div className={`rounded-lg p-2 ${activity.type === 'course' ? 'bg-purple-500/10 text-purple-600' : activity.type === 'student' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'}`}>
                    {activity.type === 'course' ? <BookOpen className="h-4 w-4" /> : activity.type === 'student' ? <GraduationCap className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.detail}</p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 font-semibold">{isRTL ? 'روند ثبت‌نام بر اساس گروه' : 'Enrollment Trend by Department'}</h2>
            <div className="space-y-4">
              {visibleEnrollmentTrend.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  {isRTL ? 'روندی برای نمایش موجود نیست.' : 'No trend data is available yet.'}
                </p>
              ) : (
                visibleEnrollmentTrend.map((department) => (
                  <div key={department.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{department.name}</span>
                      <span className="text-muted-foreground">{department.students.toLocaleString(isRTL ? 'fa-IR' : 'en-US')}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${(department.students / maxDepartmentStudents) * 100}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{department.completion}% {isRTL ? 'میانگین پیشرفت' : 'average completion'}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 font-semibold">{isRTL ? 'توزیع ثبت‌نام بر اساس موضوع' : 'Subject Distribution'}</h2>
            <div className="space-y-4">
              {report.enrollmentsBySubject.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  {isRTL ? 'هنوز ثبت‌نام فعالی برای موضوعات ثبت نشده است.' : 'There are no subject enrollment signals yet.'}
                </p>
              ) : (
                report.enrollmentsBySubject.map((subject) => (
                  <div key={subject.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{subject.name}</span>
                      <span className="text-muted-foreground">{subject.enrollments.toLocaleString(isRTL ? 'fa-IR' : 'en-US')}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(subject.enrollments / maxSubjectEnrollments) * 100}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{subject.courses} {isRTL ? 'دوره مرتبط' : 'related courses'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
