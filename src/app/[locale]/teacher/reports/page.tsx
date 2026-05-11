'use client';

import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';

type ReportType = 'progress' | 'attendance' | 'grades' | 'engagement';
type TimeRange = 'week' | 'month' | 'term';

interface StudentSkill {
  skillId: string;
  skillName: string;
  skillNameFA?: string | null;
  subject: string;
  subjectCode: string;
  masteryScore: number;
  masteryStatus: string;
  totalAttempts: number;
  correctAttempts: number;
  practicePath?: string;
}

interface StudentSession {
  id: string;
  skillName: string;
  subject: string;
  questionsAnswered: number;
  correctAnswers: number;
  startedAt: string;
  totalTime: number;
}

interface StudentReport {
  studentId: string;
  studentName: string;
  email?: string | null;
  gradeBand?: string | null;
  skills: StudentSkill[];
  recommendedSkills: StudentSkill[];
  strengths: StudentSkill[];
  totalSkills: number;
  masteredSkills: number;
  proficientSkills: number;
  averageMastery: number;
  totalPracticeTime: number;
  totalAttempts: number;
  recentSessions: StudentSession[];
}

interface ProgressPayload {
  success: boolean;
  generatedAt: string;
  students: StudentReport[];
  summary: {
    totalStudents: number;
    averageMastery: number;
    totalPracticeSessions: number;
    studentsWithProgress: number;
  };
}

function formatMinutes(seconds: number, locale: string) {
  const minutes = Math.max(1, Math.round((seconds || 0) / 60));
  return locale === 'fa' ? `${minutes} دقیقه` : `${minutes} min`;
}

function formatDateTime(value: string | undefined, locale: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function TeacherReports({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [reportType, setReportType] = useState<ReportType>('progress');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [reportData, setReportData] = useState<ProgressPayload | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const reports = [
    {
      id: '1',
      title: isRTL ? 'گزارش پیشرفت دانش‌آموزان' : 'Student Progress Report',
      description: isRTL ? 'پیشرفت تحصیلی، تسلط مهارت‌ها و گام‌های بعدی یادگیری' : 'Academic progress, skill mastery, and next learning steps',
      icon: TrendingUp,
      color: 'emerald',
      type: 'progress' as const,
    },
    {
      id: '2',
      title: isRTL ? 'گزارش حضور و غیاب' : 'Attendance Report',
      description: isRTL ? 'مشارکت و تداوم حضور دانش‌آموزان در تمرین' : 'Practice participation and attendance continuity',
      icon: Users,
      color: 'blue',
      type: 'attendance' as const,
    },
    {
      id: '3',
      title: isRTL ? 'گزارش نمرات' : 'Grades Report',
      description: isRTL ? 'کیفیت پاسخ‌ها و تسلط مهارتی در سطح کلاس' : 'Answer quality and class-wide mastery levels',
      icon: Award,
      color: 'purple',
      type: 'grades' as const,
    },
    {
      id: '4',
      title: isRTL ? 'گزارش مشارکت' : 'Engagement Report',
      description: isRTL ? 'زمان تمرین، دفعات تلاش و فعالیت اخیر' : 'Practice time, attempts, and recent activity',
      icon: Brain,
      color: 'amber',
      type: 'engagement' as const,
    },
  ];

  useEffect(() => {
    void loadReport();
  }, [locale]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const response = await fetch(`/api/v1/teacher/student-progress?locale=${locale}`, {
        headers: createUserHeaders(getStoredUserId()),
      });

      if (!response.ok) {
        throw new Error('Failed to load report data');
      }

      const data: ProgressPayload = await response.json();
      setReportData(data);
      setSelectedStudentId((prev) => prev || data.students[0]?.studentId || '');
    } catch {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'بارگذاری گزارش پیشرفت ممکن نبود.' : 'Student progress report could not be loaded.',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = useMemo(
    () => reportData?.students.find((student) => student.studentId === selectedStudentId) ?? reportData?.students[0] ?? null,
    [reportData, selectedStudentId],
  );

  const subjectBreakdown = useMemo(() => {
    if (!selectedStudent) return [];

    const map = new Map<string, { subject: string; count: number; totalMastery: number }>();
    for (const skill of selectedStudent.skills) {
      const current = map.get(skill.subject) ?? { subject: skill.subject, count: 0, totalMastery: 0 };
      current.count += 1;
      current.totalMastery += skill.masteryScore;
      map.set(skill.subject, current);
    }

    return Array.from(map.values())
      .map((item) => ({
        subject: item.subject,
        skills: item.count,
        averageMastery: Math.round(item.totalMastery / Math.max(1, item.count)),
      }))
      .sort((a, b) => a.averageMastery - b.averageMastery);
  }, [selectedStudent]);

  const classOverviewCards = useMemo(() => {
    const summary = reportData?.summary;
    return [
      {
        label: isRTL ? 'دانش‌آموزان دارای داده' : 'Students with data',
        value: summary?.studentsWithProgress ?? 0,
        detail: isRTL ? 'دانش‌آموز با سابقه تمرین' : 'students with recorded progress',
        icon: Users,
        classes: 'from-blue-50 to-cyan-50 border-blue-200 text-blue-700 dark:from-blue-950/20 dark:to-cyan-950/20 dark:border-blue-800',
      },
      {
        label: isRTL ? 'میانگین تسلط کلاس' : 'Average mastery',
        value: `${summary?.averageMastery ?? 0}%`,
        detail: isRTL ? 'میانگین عملکرد مهارتی' : 'average class mastery level',
        icon: Target,
        classes: 'from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700 dark:from-emerald-950/20 dark:to-teal-950/20 dark:border-emerald-800',
      },
      {
        label: isRTL ? 'جلسات تمرین' : 'Practice sessions',
        value: summary?.totalPracticeSessions ?? 0,
        detail: isRTL ? 'جلسه ثبت‌شده در بازه اخیر' : 'sessions recorded recently',
        icon: Brain,
        classes: 'from-violet-50 to-fuchsia-50 border-violet-200 text-violet-700 dark:from-violet-950/20 dark:to-fuchsia-950/20 dark:border-violet-800',
      },
    ];
  }, [isRTL, reportData]);

  const handleGenerate = async () => {
    await loadReport();
    setFeedback({
      variant: 'success',
      message: isRTL ? 'گزارش پیشرفت به‌روزرسانی شد.' : 'Student progress report refreshed.',
    });
  };

  const downloadTextFile = (fileName: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    if (!selectedStudent) {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'ابتدا یک دانش‌آموز را انتخاب کنید.' : 'Select a student first.',
      });
      return;
    }

    if (format === 'pdf') {
      void handleExportPdf();
      return;
    }

    const rows = [
      ['student', selectedStudent.studentName],
      ['email', selectedStudent.email || '—'],
      ['average_mastery', `${selectedStudent.averageMastery}%`],
      ['mastered_skills', String(selectedStudent.masteredSkills)],
      ['proficient_skills', String(selectedStudent.proficientSkills)],
      ['practice_time_minutes', String(Math.round(selectedStudent.totalPracticeTime / 60))],
    ];

    if (format === 'csv') {
      const csv = ['metric,value', ...rows.map(([label, value]) => `${label},"${value}"`)].join('\n');
      downloadTextFile(`student-progress-${selectedStudent.studentId}.csv`, csv, 'text/csv;charset=utf-8');
    } else {
      const tableRows = rows
        .map(([label, value]) => `<tr><td>${label}</td><td>${String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>`)
        .join('');
      const excelDocument = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
      downloadTextFile(`student-progress-${selectedStudent.studentId}.xls`, excelDocument, 'application/vnd.ms-excel;charset=utf-8');
    }

    setFeedback({
      variant: 'success',
      message: isRTL ? `خروجی ${format.toUpperCase()} دانلود شد.` : `${format.toUpperCase()} export downloaded.`,
    });
  };

  const handleExportPdf = async () => {
    if (!selectedStudent) return;

    try {
      setExportingPdf(true);
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const primary = { r: 14, g: 116, b: 144 };
      const accent = { r: 16, g: 185, b: 129 };
      let y = 18;

      const ensureSpace = (needed = 12) => {
        if (y + needed > pageHeight - 16) {
          doc.addPage();
          y = 18;
        }
      };

      doc.setFillColor(primary.r, primary.g, primary.b);
      doc.rect(0, 0, pageWidth, 34, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('Danesh Student Progress Report', 14, 14);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated ${new Date().toLocaleString('en-US')}`, 14, 21);
      doc.text(`Time range: ${timeRange}`, 14, 27);

      y = 46;
      doc.setTextColor(17, 24, 39);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('Student Snapshot', 14, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Student: ${selectedStudent.studentName}`, 14, y);
      y += 6;
      doc.text(`Email: ${selectedStudent.email || '—'}`, 14, y);
      y += 6;
      doc.text(`Average mastery: ${selectedStudent.averageMastery}%`, 14, y);
      y += 6;
      doc.text(`Mastered skills: ${selectedStudent.masteredSkills}/${selectedStudent.totalSkills}`, 14, y);
      y += 6;
      doc.text(`Practice time: ${Math.round(selectedStudent.totalPracticeTime / 60)} minutes`, 14, y);
      y += 10;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Next Skills to Build', 14, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      for (const skill of selectedStudent.recommendedSkills) {
        ensureSpace(18);
        doc.setFillColor(240, 249, 255);
        doc.roundedRect(14, y - 4, pageWidth - 28, 15, 2, 2, 'F');
        doc.setTextColor(17, 24, 39);
        doc.text(`${skill.skillName} • ${skill.subject} • ${skill.masteryScore}% mastery`, 18, y + 2);
        doc.setTextColor(accent.r, accent.g, accent.b);
        const practiceUrl = `${window.location.origin}/${locale}${skill.practicePath || `/student/practice/${skill.skillId}`}`;
        doc.textWithLink('Open practice path', 18, y + 8, { url: practiceUrl });
        y += 18;
      }

      ensureSpace(18);
      doc.setTextColor(17, 24, 39);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Skill Strengths', 14, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      for (const skill of selectedStudent.strengths) {
        ensureSpace(8);
        doc.text(`• ${skill.skillName} (${skill.masteryScore}%)`, 18, y);
        y += 6;
      }

      ensureSpace(18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Recent Practice Activity', 14, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      for (const session of selectedStudent.recentSessions.slice(0, 5)) {
        ensureSpace(8);
        doc.text(`• ${session.skillName} — ${session.correctAnswers}/${session.questionsAnswered} correct`, 18, y);
        y += 6;
      }

      doc.save(`student-progress-${selectedStudent.studentId}.pdf`);
      setFeedback({
        variant: 'success',
        message: isRTL ? 'گزارش PDF با موفقیت دانلود شد.' : 'PDF report downloaded successfully.',
      });
    } catch {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'تولید فایل PDF ناموفق بود.' : 'Failed to generate the PDF report.',
      });
    } finally {
      setExportingPdf(false);
    }
  };

  const getColorClasses = (color: string) => {
    const classes = {
      emerald: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-600',
      blue: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800 text-blue-600',
      purple: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800 text-purple-600',
      amber: 'from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800 text-amber-600',
    };

    return classes[color as keyof typeof classes] || classes.emerald;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/teacher`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Arrow className="h-5 w-5" />
              <span>{isRTL ? 'بازگشت' : 'Back'}</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">{isRTL ? 'گزارش‌های آموزشی' : 'Learning Reports'}</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {feedback ? <FeedbackBanner className="mb-6" variant={feedback.variant} message={feedback.message} /> : null}

        <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => setReportType(report.type)}
              className={`rounded-2xl border-2 bg-gradient-to-br p-6 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg ${getColorClasses(report.color)} ${reportType === report.type ? 'ring-2 ring-primary' : ''}`}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-800">
                  <report.icon className={`h-7 w-7 ${getColorClasses(report.color).split(' ').pop()}`} />
                </div>
                {reportType === report.type ? <CheckCircle className="h-6 w-6 text-primary" /> : null}
              </div>
              <h2 className="mb-2 text-lg font-semibold">{report.title}</h2>
              <p className="text-sm opacity-80">{report.description}</p>
            </button>
          ))}
        </div>

        <div className="mb-6 rounded-3xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">{isRTL ? 'پیکربندی گزارش' : 'Report Setup'}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{isRTL ? 'دانش‌آموز، بازه زمانی و نوع خروجی را انتخاب کنید.' : 'Choose the student, time range, and export format.'}</p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>{isRTL ? 'به‌روزرسانی گزارش' : 'Refresh Report'}</span>
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr,1fr,1fr]">
            <div>
              <label className="mb-2 block text-sm font-medium">{isRTL ? 'دانش‌آموز' : 'Student'}</label>
              <select value={selectedStudent?.studentId || ''} onChange={(event) => setSelectedStudentId(event.target.value)} className="w-full rounded-xl border bg-background px-3 py-2.5">
                {reportData?.students.map((student) => (
                  <option key={student.studentId} value={student.studentId}>
                    {student.studentName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">{isRTL ? 'بازه زمانی' : 'Time Range'}</label>
              <select value={timeRange} onChange={(event) => setTimeRange(event.target.value as TimeRange)} className="w-full rounded-xl border bg-background px-3 py-2.5">
                <option value="week">{isRTL ? 'هفته گذشته' : 'Past Week'}</option>
                <option value="month">{isRTL ? 'ماه گذشته' : 'Past Month'}</option>
                <option value="term">{isRTL ? 'ترم جاری' : 'Current Term'}</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">{isRTL ? 'خروجی' : 'Export'}</label>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => handleExport('pdf')} disabled={exportingPdf || !selectedStudent} className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 hover:bg-muted disabled:opacity-50">
                  {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} PDF
                </button>
                <button onClick={() => handleExport('csv')} disabled={!selectedStudent} className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 hover:bg-muted disabled:opacity-50">
                  <Download className="h-4 w-4" /> CSV
                </button>
                <button onClick={() => handleExport('excel')} disabled={!selectedStudent} className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 hover:bg-muted disabled:opacity-50">
                  <Download className="h-4 w-4" /> Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : !reportData || !selectedStudent ? (
          <div className="rounded-3xl border border-dashed bg-card p-12 text-center text-muted-foreground">
            <Users className="mx-auto mb-4 h-12 w-12 opacity-60" />
            <p>{isRTL ? 'هنوز داده‌ای برای گزارش پیشرفت دانش‌آموزان ثبت نشده است.' : 'No student progress data has been recorded yet.'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              {classOverviewCards.map((card) => (
                <div key={card.label} className={`rounded-3xl border bg-gradient-to-br p-6 ${card.classes}`}>
                  <div className="mb-4 flex items-start justify-between">
                    <div className="rounded-2xl bg-white/80 p-3 shadow-sm dark:bg-slate-900/60">
                      <card.icon className="h-6 w-6" />
                    </div>
                    <span className="text-3xl font-bold">{card.value}</span>
                  </div>
                  <p className="font-semibold">{card.label}</p>
                  <p className="mt-1 text-sm opacity-80">{card.detail}</p>
                </div>
              ))}
            </div>

            {reportType === 'progress' ? (
              <>
                <section className="overflow-hidden rounded-[28px] border bg-card shadow-sm">
                  <div className="grid gap-6 bg-gradient-to-r from-primary via-primary/90 to-cyan-600 p-8 text-white lg:grid-cols-[1.4fr,0.9fr]">
                    <div>
                      <p className="mb-2 text-sm uppercase tracking-[0.18em] text-white/80">{isRTL ? 'گزارش رشد مهارتی' : 'Skill Growth Report'}</p>
                      <h2 className="text-3xl font-bold">{selectedStudent.studentName}</h2>
                      <p className="mt-2 max-w-2xl text-sm text-white/80">{selectedStudent.email || (isRTL ? 'ایمیل ثبت نشده است.' : 'No email recorded.')}</p>
                      <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                          <p className="text-xs text-white/70">{isRTL ? 'میانگین تسلط' : 'Average mastery'}</p>
                          <p className="mt-2 text-3xl font-bold">{selectedStudent.averageMastery}%</p>
                        </div>
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                          <p className="text-xs text-white/70">{isRTL ? 'مهارت‌های مسلط‌شده' : 'Mastered skills'}</p>
                          <p className="mt-2 text-3xl font-bold">{selectedStudent.masteredSkills}</p>
                        </div>
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                          <p className="text-xs text-white/70">{isRTL ? 'زمان تمرین' : 'Practice time'}</p>
                          <p className="mt-2 text-3xl font-bold">{Math.round(selectedStudent.totalPracticeTime / 60)}</p>
                          <p className="text-xs text-white/70">{isRTL ? 'دقیقه' : 'minutes'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/15 bg-slate-950/15 p-6 backdrop-blur-sm">
                      <div className="mb-4 flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        <h3 className="font-semibold">{isRTL ? 'گام‌های بعدی پیشنهادی' : 'Recommended next steps'}</h3>
                      </div>
                      <div className="space-y-3">
                        {selectedStudent.recommendedSkills.length > 0 ? (
                          selectedStudent.recommendedSkills.map((skill) => (
                            <div key={skill.skillId} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <p className="font-medium">{skill.skillName}</p>
                                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs">{skill.masteryScore}%</span>
                              </div>
                              <p className="mb-3 text-xs text-white/75">{skill.subject}</p>
                              <Link href={`/${locale}${skill.practicePath || `/student/practice/${skill.skillId}`}`} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-white/90">
                                <BookOpen className="h-4 w-4" />
                                {isRTL ? 'مشاهده تمرین پیشنهادی' : 'Open recommended practice'}
                              </Link>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-white/80">{isRTL ? 'هنوز مهارتی برای تقویت بیشتر ثبت نشده است.' : 'No additional priority skill has been identified yet.'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
                  <section className="rounded-3xl border bg-card p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{isRTL ? 'نقشه مهارت‌ها بر اساس موضوع' : 'Skill map by subject'}</h3>
                    </div>
                    <div className="space-y-4">
                      {subjectBreakdown.map((subject) => (
                        <div key={subject.subject} className="rounded-2xl border bg-muted/20 p-4">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{subject.subject}</p>
                              <p className="text-xs text-muted-foreground">{subject.skills} {isRTL ? 'مهارت' : 'skills'}</p>
                            </div>
                            <span className="text-lg font-semibold text-primary">{subject.averageMastery}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted">
                            <div className="h-2 rounded-full bg-gradient-to-r from-primary to-cyan-500" style={{ width: `${subject.averageMastery}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-3xl border bg-card p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-2">
                      <Award className="h-5 w-5 text-amber-500" />
                      <h3 className="text-lg font-semibold">{isRTL ? 'مهارت‌های قوی' : 'Current strengths'}</h3>
                    </div>
                    <div className="space-y-3">
                      {selectedStudent.strengths.length > 0 ? (
                        selectedStudent.strengths.map((skill) => (
                          <div key={skill.skillId} className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <p className="font-medium">{skill.skillName}</p>
                              <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs text-white">{skill.masteryScore}%</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{skill.subject}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">{isRTL ? 'هنوز مهارتی در سطح قدرت مشخص نشده است.' : 'No standout strengths recorded yet.'}</p>
                      )}
                    </div>
                  </section>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
                  <section className="rounded-3xl border bg-card p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-violet-500" />
                      <h3 className="text-lg font-semibold">{isRTL ? 'فعالیت تمرینی اخیر' : 'Recent practice activity'}</h3>
                    </div>
                    <div className="space-y-3">
                      {selectedStudent.recentSessions.length > 0 ? (
                        selectedStudent.recentSessions.map((session) => {
                          const accuracy = session.questionsAnswered > 0 ? Math.round((session.correctAnswers / session.questionsAnswered) * 100) : 0;

                          return (
                            <div key={session.id} className="rounded-2xl border bg-muted/20 p-4">
                              <div className="mb-2 flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium">{session.skillName}</p>
                                  <p className="text-sm text-muted-foreground">{session.subject}</p>
                                </div>
                                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{accuracy}%</span>
                              </div>
                              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                                <p>{session.correctAnswers}/{session.questionsAnswered} {isRTL ? 'پاسخ درست' : 'correct answers'}</p>
                                <p>{formatMinutes(session.totalTime, locale)}</p>
                                <p>{formatDateTime(session.startedAt, locale)}</p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">{isRTL ? 'هنوز جلسه تمرینی ثبت نشده است.' : 'No practice sessions recorded yet.'}</p>
                      )}
                    </div>
                  </section>

                  <section className="rounded-3xl border bg-card p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{isRTL ? 'تمرین‌های پیشنهادی برای ادامه مسیر' : 'Suggested practice links'}</h3>
                    </div>
                    <div className="space-y-3">
                      {selectedStudent.recommendedSkills.map((skill) => (
                        <Link key={skill.skillId} href={`/${locale}${skill.practicePath || `/student/practice/${skill.skillId}`}`} className="block rounded-2xl border p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="font-medium">{skill.skillName}</p>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground">{skill.subject}</p>
                          <p className="mt-2 text-xs text-primary">{isRTL ? 'باز کردن مجموعه تمرین مرتبط با این مهارت' : 'Open practice set for this skill'}</p>
                        </Link>
                      ))}
                    </div>
                  </section>
                </div>
              </>
            ) : (
              <section className="rounded-3xl border bg-card p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{isRTL ? 'خلاصه تحلیلی کلاس' : 'Class insight summary'}</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {reportData.students.slice(0, 6).map((student) => (
                    <div key={student.studentId} className="rounded-2xl border bg-muted/20 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{student.studentName}</p>
                          <p className="text-xs text-muted-foreground">{student.email || '—'}</p>
                        </div>
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{student.averageMastery}%</span>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>{isRTL ? 'تعداد مهارت‌ها' : 'Skills tracked'}: {student.totalSkills}</p>
                        <p>{isRTL ? 'مهارت‌های مسلط' : 'Mastered skills'}: {student.masteredSkills}</p>
                        <p>{isRTL ? 'زمان تمرین' : 'Practice time'}: {formatMinutes(student.totalPracticeTime, locale)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
