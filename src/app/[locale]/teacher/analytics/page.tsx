'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import { 
  BarChart, TrendingUp, Users, BookOpen, Clock, Award,
  ArrowLeft, ArrowRight, Download, Filter, Calendar,
  Target, CheckCircle, Brain, Eye, MessageSquare
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalStudents: number;
    activeStudents: number;
    totalLessons: number;
    completedLessons: number;
    avgEngagementTime: number;
    avgCompletionRate: number;
  };
  engagement: {
    week: string;
    activeStudents: number;
    lessonsCompleted: number;
    avgTimeSpent: number;
  }[];
  topPerformers: {
    studentName: string;
    progress: number;
    xp: number;
    masteryScore: number;
  }[];
  skillProgress: {
    skillName: string;
    studentsWorking: number;
    avgMastery: number;
    completed: number;
  }[];
}

function buildEngagementSeries(students: any[], locale: string, isRTL: boolean) {
  const buckets = new Map<string, { week: string; activeStudents: Set<string>; lessonsCompleted: number; totalTime: number; sessions: number }>();

  students.forEach((student) => {
    (student.recentSessions || []).forEach((session: any) => {
      const date = new Date(session.startedAt);
      const key = `${date.getFullYear()}-${date.getMonth()}-${Math.floor((date.getDate() - 1) / 7)}`;
      const label = new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
        month: 'short',
        day: 'numeric',
      }).format(date);

      const bucket = buckets.get(key) ?? {
        week: isRTL ? `هفته ${label}` : `Week of ${label}`,
        activeStudents: new Set<string>(),
        lessonsCompleted: 0,
        totalTime: 0,
        sessions: 0,
      };

      bucket.activeStudents.add(student.studentId);
      bucket.lessonsCompleted += session.questionsAnswered || 0;
      bucket.totalTime += session.totalTime || 0;
      bucket.sessions += 1;
      buckets.set(key, bucket);
    });
  });

  return Array.from(buckets.values())
    .slice(-4)
    .map((bucket) => ({
      week: bucket.week,
      activeStudents: bucket.activeStudents.size,
      lessonsCompleted: bucket.lessonsCompleted,
      avgTimeSpent: bucket.sessions > 0 ? Math.round(bucket.totalTime / bucket.sessions / 60) : 0,
    }));
}

function downloadFile(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function TeacherAnalytics({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'term'>('week');
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    void loadAnalytics();
  }, [locale, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const response = await fetch(`/api/v1/teacher/student-progress?locale=${locale}`, {
        headers: createUserHeaders(getStoredUserId()),
      });

      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }

      const data = await response.json();
      const students = data.students || [];
      const activeStudents = students.filter((student: any) => (student.recentSessions || []).length > 0).length;
      const allSkills = students.flatMap((student: any) => student.skills || []);
      const skillMap = new Map<string, { skillName: string; studentsWorking: Set<string>; totalMastery: number; completed: number }>();

      students.forEach((student: any) => {
        (student.skills || []).forEach((skill: any) => {
          const key = skill.skillId;
          const bucket = skillMap.get(key) ?? {
            skillName: skill.skillName,
            studentsWorking: new Set<string>(),
            totalMastery: 0,
            completed: 0,
          };

          bucket.studentsWorking.add(student.studentId);
          bucket.totalMastery += skill.masteryScore || 0;
          if ((skill.masteryScore || 0) >= 80) bucket.completed += 1;
          skillMap.set(key, bucket);
        });
      });

      setAnalytics({
        overview: {
          totalStudents: students.length,
          activeStudents,
          totalLessons: data.summary?.totalPracticeSessions || 0,
          completedLessons: students.reduce((sum: number, student: any) => sum + (student.totalAttempts || 0), 0),
          avgEngagementTime: students.length > 0
            ? Math.round(students.reduce((sum: number, student: any) => sum + (student.totalPracticeTime || 0), 0) / students.length / 60)
            : 0,
          avgCompletionRate: data.summary?.averageMastery || 0,
        },
        engagement: buildEngagementSeries(students, locale, isRTL),
        topPerformers: students
          .slice()
          .sort((a: any, b: any) => (b.averageMastery || 0) - (a.averageMastery || 0))
          .slice(0, 5)
          .map((student: any) => ({
            studentName: student.studentName,
            progress: student.averageMastery || 0,
            xp: (student.totalAttempts || 0) * 10,
            masteryScore: student.averageMastery || 0,
          })),
        skillProgress: Array.from(skillMap.values())
          .map((skill) => ({
            skillName: skill.skillName,
            studentsWorking: skill.studentsWorking.size,
            avgMastery: skill.studentsWorking.size > 0 ? Math.round(skill.totalMastery / skill.studentsWorking.size) : 0,
            completed: skill.completed,
          }))
          .sort((a, b) => a.avgMastery - b.avgMastery)
          .slice(0, 6),
      });
    } catch {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'بارگذاری تحلیل‌ها ممکن نبود.' : 'Analytics could not be loaded.',
      });
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!analytics) {
      return;
    }

    const rows = [
      ['metric', 'value'],
      ['time_range', timeRange],
      ['total_students', String(analytics.overview.totalStudents)],
      ['active_students', String(analytics.overview.activeStudents)],
      ['total_lessons', String(analytics.overview.totalLessons)],
      ['completed_lessons', String(analytics.overview.completedLessons)],
      ['avg_engagement_minutes', String(analytics.overview.avgEngagementTime)],
      ['avg_completion_rate', String(analytics.overview.avgCompletionRate)],
      [],
      ['top_performer', 'progress', 'xp', 'mastery_score'],
      ...analytics.topPerformers.map((student) => [
        student.studentName,
        String(student.progress),
        String(student.xp),
        String(student.masteryScore),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    downloadFile(`teacher-analytics-${timeRange}.csv`, csv, 'text/csv;charset=utf-8');
    setFeedback({
      variant: 'success',
      message: isRTL ? 'گزارش با موفقیت دانلود شد.' : 'Report exported successfully.',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              <BarChart className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">{isRTL ? 'تحلیل‌ها و گزارش‌ها' : 'Analytics & Reports'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 rounded-lg border bg-background"
            >
              <option value="week">{isRTL ? 'هفته گذشته' : 'Past Week'}</option>
              <option value="month">{isRTL ? 'ماه گذشته' : 'Past Month'}</option>
              <option value="term">{isRTL ? 'ترم جاری' : 'Current Term'}</option>
            </select>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'دانلود گزارش' : 'Export'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {feedback ? <FeedbackBanner className="mb-6" variant={feedback.variant} message={feedback.message} /> : null}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-blue-500 text-white">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {analytics.overview.activeStudents}/{analytics.overview.totalStudents}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {isRTL ? 'دانش‌آموز فعال' : 'Active Students'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <TrendingUp className="h-4 w-4" />
                  <span>{Math.round((analytics.overview.activeStudents / analytics.overview.totalStudents) * 100)}% {isRTL ? 'نرخ فعالیت' : 'engagement rate'}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-emerald-500 text-white">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                      {analytics.overview.completedLessons}
                    </p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      {isRTL ? 'درس تکمیل‌شده' : 'Lessons Completed'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>{analytics.overview.avgCompletionRate}% {isRTL ? 'نرخ تکمیل' : 'completion rate'}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-purple-500 text-white">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                      {analytics.overview.avgEngagementTime}<span className="text-xl">m</span>
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      {isRTL ? 'میانگین زمان یادگیری' : 'Avg Study Time'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                  <Target className="h-4 w-4" />
                  <span>{isRTL ? 'به ازای هر دانش‌آموز' : 'per student daily'}</span>
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-card border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Award className="h-6 w-6 text-amber-500" />
                  <h2 className="text-xl font-semibold">{isRTL ? 'دانش‌آموزان برتر' : 'Top Performers'}</h2>
                </div>
              </div>
              <div className="space-y-3">
                {analytics.topPerformers.map((student, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${
                      index === 0 ? 'bg-amber-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-amber-700' :
                      'bg-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.progress}% {isRTL ? 'پیشرفت' : 'progress'} • {student.xp} XP
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-emerald-600">{student.masteryScore}%</p>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'تسلط' : 'Mastery'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Progress */}
            <div className="bg-card border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Brain className="h-6 w-6 text-purple-500" />
                  <h2 className="text-xl font-semibold">{isRTL ? 'پیشرفت مهارت‌ها' : 'Skills Progress'}</h2>
                </div>
              </div>
              <div className="space-y-4">
                {analytics.skillProgress.map((skill, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{skill.skillName}</p>
                        <p className="text-sm text-muted-foreground">
                          {skill.studentsWorking} {isRTL ? 'دانش‌آموز در حال تمرین' : 'students practicing'} •{' '}
                          {skill.completed} {isRTL ? 'تکمیل کرده' : 'completed'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-teal-600">{skill.avgMastery}%</p>
                        <p className="text-xs text-muted-foreground">{isRTL ? 'میانگین تسلط' : 'Avg Mastery'}</p>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all"
                        style={{ width: `${skill.avgMastery}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement Trend */}
            <div className="bg-card border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                  <h2 className="text-xl font-semibold">{isRTL ? 'روند فعالیت' : 'Engagement Trend'}</h2>
                </div>
              </div>
              <div className="space-y-3">
                {analytics.engagement.map((week, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 p-4 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm text-muted-foreground">{isRTL ? 'هفته' : 'Week'}</p>
                      <p className="font-semibold">{week.week}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{isRTL ? 'دانش‌آموز فعال' : 'Active Students'}</p>
                      <p className="font-semibold">{week.activeStudents}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{isRTL ? 'درس تکمیل‌شده' : 'Lessons Completed'}</p>
                      <p className="font-semibold">{week.lessonsCompleted}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{isRTL ? 'زمان متوسط' : 'Avg Time'}</p>
                      <p className="font-semibold">{week.avgTimeSpent}m</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{isRTL ? 'خطا در بارگذاری داده‌ها' : 'Error loading data'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
