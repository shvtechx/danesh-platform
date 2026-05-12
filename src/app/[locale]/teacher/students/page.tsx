'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import { 
  Users, ArrowLeft, ArrowRight, Search, Filter, Mail, MessageSquare,
  TrendingUp, Award, Clock, BarChart, Eye, ChevronRight, ChevronLeft, Heart, AlertTriangle
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  progress: number;
  xp: number;
  lastActive: string;
  courses: number;
  avgScore: number;
  wellbeing: {
    status: 'stable' | 'watch' | 'support' | 'urgent';
    score: number;
    lastCheckinAt: string | null;
    averageMood: number | null;
    averageStress: number | null;
    openConcernReports: number;
  };
}

function formatLastActive(value: string | undefined, locale: string) {
  if (!value) return locale === 'fa' ? 'بدون فعالیت' : 'No activity';
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getWellbeingBadge(status: Student['wellbeing']['status'], isRTL: boolean) {
  switch (status) {
    case 'urgent':
      return {
        label: isRTL ? 'نیاز فوری به پیگیری' : 'Urgent follow-up',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      };
    case 'support':
      return {
        label: isRTL ? 'نیازمند حمایت' : 'Needs support',
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      };
    case 'watch':
      return {
        label: isRTL ? 'نیازمند پایش' : 'Watch list',
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      };
    default:
      return {
        label: isRTL ? 'پایدار' : 'Stable',
        className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      };
  }
}

function formatWellbeingCheckin(value: string | null, locale: string) {
  if (!value) {
    return locale === 'fa' ? 'ثبت نشده' : 'No recent check-in';
  }

  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export default function TeacherStudents({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;
  const NavArrow = isRTL ? ChevronLeft : ChevronRight;

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    void loadStudents();
  }, [locale]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const response = await fetch(`/api/v1/teacher/student-progress?locale=${locale}`, {
        headers: createUserHeaders(getStoredUserId()),
      });

      if (!response.ok) {
        throw new Error('Failed to load students');
      }

      const data = await response.json();
      const mappedStudents: Student[] = (data.students || []).map((student: any) => {
        const lastSession = student.recentSessions?.[0];
        const avgScore = student.totalAttempts > 0 && student.skills.length > 0
          ? Math.round(
              student.skills.reduce((sum: number, skill: any) => {
                const total = skill.totalAttempts || 0;
                const correct = skill.correctAttempts || 0;
                return sum + (total > 0 ? (correct / total) * 100 : 0);
              }, 0) / Math.max(1, student.skills.length),
            )
          : 0;

        return {
          id: student.studentId,
          name: student.studentName,
          email: student.email || '—',
          progress: student.averageMastery || 0,
          xp: (student.totalAttempts || 0) * 10,
          lastActive: formatLastActive(lastSession?.startedAt, locale),
          courses: Array.from(new Set((student.skills || []).map((skill: any) => skill.subject))).length,
          avgScore,
          wellbeing: {
            status: student.wellbeing?.status || 'stable',
            score: student.wellbeing?.score || 0,
            lastCheckinAt: student.wellbeing?.lastCheckinAt || null,
            averageMood: student.wellbeing?.averageMood ?? null,
            averageStress: student.wellbeing?.averageStress ?? null,
            openConcernReports: student.wellbeing?.openConcernReports || 0,
          },
        };
      });

      setStudents(mappedStudents);
    } catch {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'بارگذاری فهرست دانش‌آموزان ممکن نبود.' : 'Student list could not be loaded.',
      });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const isActive = student.lastActive !== (isRTL ? 'بدون فعالیت' : 'No activity');
    const matchesStatus = filterStatus === 'all' ? true : filterStatus === 'active' ? isActive : !isActive;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/${locale}/teacher`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Arrow className="h-5 w-5" />
              <span>{isRTL ? 'بازگشت' : 'Back'}</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">{isRTL ? 'دانش‌آموزان من' : 'My Students'}</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {feedback ? <FeedbackBanner className="mb-6" variant={feedback.variant} message={feedback.message} /> : null}

        {/* Stats Overview */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-blue-600" />
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{students.length}</p>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">{isRTL ? 'کل دانش‌آموزان' : 'Total Students'}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-8 w-8 text-emerald-600" />
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {students.length > 0 ? Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length) : 0}%
              </p>
            </div>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-2">{isRTL ? 'میانگین پیشرفت' : 'Avg Progress'}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <Award className="h-8 w-8 text-purple-600" />
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {students.length > 0 ? Math.round(students.reduce((acc, s) => acc + s.xp, 0) / students.length) : 0}
              </p>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">{isRTL ? 'میانگین XP' : 'Avg XP'}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <BarChart className="h-8 w-8 text-amber-600" />
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                {students.length > 0 ? Math.round(students.reduce((acc, s) => acc + s.avgScore, 0) / students.length) : 0}%
              </p>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">{isRTL ? 'میانگین نمرات' : 'Avg Score'}</p>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/20 dark:to-orange-950/20 border-2 border-rose-200 dark:border-rose-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <AlertTriangle className="h-8 w-8 text-rose-600" />
              <p className="text-2xl font-bold text-rose-900 dark:text-rose-100">
                {students.filter((student) => student.wellbeing.status === 'support' || student.wellbeing.status === 'urgent').length}
              </p>
            </div>
            <p className="text-sm text-rose-700 dark:text-rose-300 mt-2">{isRTL ? 'نیازمند حمایت' : 'Need Support'}</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-card border rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isRTL ? 'جستجو دانش‌آموز...' : 'Search students...'}
                className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background"
              />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')} className="rounded-lg border bg-background px-4 py-2">
              <option value="all">{isRTL ? 'همه' : 'All'}</option>
              <option value="active">{isRTL ? 'فعال' : 'Active'}</option>
              <option value="inactive">{isRTL ? 'بدون فعالیت' : 'Inactive'}</option>
            </select>
          </div>
        </div>

        {/* Students List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStudents.length > 0 ? filteredStudents.map((student) => {
              const wellbeingBadge = getWellbeingBadge(student.wellbeing.status, isRTL);

              return (
                <Link
                  key={student.id}
                  href={`/${locale}/teacher/students/${student.id}`}
                  className="block bg-card border rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-lg">
                        {student.name[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{student.name}</h3>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${wellbeingBadge.className}`}>
                            <Heart className="h-3.5 w-3.5" />
                            {wellbeingBadge.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {isRTL ? 'آخرین پایش:' : 'Last check-in:'} {formatWellbeingCheckin(student.wellbeing.lastCheckinAt, locale)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <NavArrow className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'پیشرفت' : 'Progress'}</p>
                      <p className="text-lg font-semibold text-emerald-600">{student.progress}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">XP</p>
                      <p className="text-lg font-semibold text-purple-600">{student.xp}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'میانگین نمره' : 'Avg Score'}</p>
                      <p className="text-lg font-semibold text-blue-600">{student.avgScore}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'دوره‌ها' : 'Courses'}</p>
                      <p className="text-lg font-semibold">{student.courses}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'بهزیستی' : 'Wellbeing'}</p>
                      <p className="text-lg font-semibold text-rose-600">{student.wellbeing.score}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'آخرین فعالیت' : 'Last Active'}</p>
                      <p className="text-sm font-medium">{student.lastActive}</p>
                    </div>
                  </div>
                </Link>
              );
            }) : (
              <div className="rounded-xl border border-dashed bg-card p-10 text-center text-muted-foreground">
                <Users className="mx-auto mb-3 h-10 w-10 opacity-60" />
                <p>{isRTL ? 'هیچ دانش‌آموز واقعی با این فیلترها پیدا نشد.' : 'No real students matched these filters.'}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
