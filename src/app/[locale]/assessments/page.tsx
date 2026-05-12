'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FileQuestion, Clock, CheckCircle, XCircle, PlayCircle, Trophy, Target, BarChart } from 'lucide-react';
import { StudentShell } from '@/components/layout/StudentShell';
import { StudentPageHeader } from '@/components/layout/StudentPageHeader';

export default function AssessmentsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const [activeFilter, setActiveFilter] = useState<'all' | 'quiz' | 'exam' | 'practice'>('all');

  const assessments = [
    {
      id: '1',
      title: isRTL ? 'آزمون ریاضی - فصل ۳' : 'Math Quiz - Chapter 3',
      subject: isRTL ? 'ریاضی' : 'Mathematics',
      type: 'quiz',
      questions: 15,
      duration: 20,
      status: 'completed',
      score: 85,
      dueDate: '2026-04-20',
    },
    {
      id: '2',
      title: isRTL ? 'امتحان علوم تجربی' : 'Science Exam',
      subject: isRTL ? 'علوم' : 'Science',
      type: 'exam',
      questions: 30,
      duration: 45,
      status: 'available',
      score: null,
      dueDate: '2026-04-25',
    },
    {
      id: '3',
      title: isRTL ? 'تمرین گرامر انگلیسی' : 'English Grammar Practice',
      subject: isRTL ? 'انگلیسی' : 'English',
      type: 'practice',
      questions: 20,
      duration: 30,
      status: 'in-progress',
      score: null,
      dueDate: '2026-04-18',
    },
    {
      id: '4',
      title: isRTL ? 'آزمونک ادبیات فارسی' : 'Persian Literature Quiz',
      subject: isRTL ? 'ادبیات' : 'Literature',
      type: 'quiz',
      questions: 10,
      duration: 15,
      status: 'missed',
      score: null,
      dueDate: '2026-04-10',
    },
  ];

  const statusIcons = {
    completed: CheckCircle,
    available: PlayCircle,
    'in-progress': Clock,
    missed: XCircle,
  };

  const statusColors = {
    completed: 'text-green-500',
    available: 'text-blue-500',
    'in-progress': 'text-amber-500',
    missed: 'text-red-500',
  };

  const statusLabels = {
    completed: isRTL ? 'تکمیل شده' : 'Completed',
    available: isRTL ? 'آماده' : 'Available',
    'in-progress': isRTL ? 'در حال انجام' : 'In Progress',
    missed: isRTL ? 'از دست رفته' : 'Missed',
  };

  const filteredAssessments = assessments.filter((assessment) =>
    activeFilter === 'all' ? true : assessment.type === activeFilter
  );

  return (
    <StudentShell locale={locale}>
      <div className="space-y-6">
        <StudentPageHeader
          locale={locale}
          eyebrow={isRTL ? 'مرکز ارزیابی' : 'Assessment hub'}
          title={t('assessments.title')}
          description={isRTL ? 'آزمون‌ها، تمرین‌ها و بازخوردهای رشدگرا را در یک فضای یکپارچه دنبال کنید.' : 'Track quizzes, practice sessions, and growth-focused feedback in one cohesive learning space.'}
          stats={[
            { label: isRTL ? 'تکمیل شده' : 'Completed', value: '24', icon: CheckCircle, tone: 'success', helper: isRTL ? 'در این ترم' : 'This term' },
            { label: isRTL ? 'در انتظار' : 'Pending', value: '3', icon: PlayCircle, tone: 'primary', helper: isRTL ? 'آماده شروع' : 'Ready to start' },
            { label: isRTL ? 'میانگین نمره' : 'Average score', value: '87%', icon: Trophy, tone: 'warning', helper: isRTL ? 'روند رو به رشد' : 'Upward trend' },
            { label: isRTL ? 'نمره کامل' : 'Perfect scores', value: '5', icon: Target, tone: 'accent', helper: isRTL ? 'نقطه قوت این ماه' : 'Strongest this month' },
          ]}
          actions={
            <Link href={`/${locale}/assessments/2`} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {isRTL ? 'شروع آزمون بعدی' : 'Start next assessment'}
            </Link>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-6">
            <section className="rounded-3xl border bg-card/95 p-3 shadow-sm">
              <div className="flex flex-wrap gap-2 rounded-2xl bg-muted/60 p-1.5">
                {([
                  ['all', isRTL ? 'همه' : 'All'],
                  ['quiz', t('assessments.quiz')],
                  ['exam', t('assessments.exam')],
                  ['practice', t('assessments.practice')],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveFilter(id)}
                    className={`rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${activeFilter === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              {filteredAssessments.map((assessment) => {
                const StatusIcon = statusIcons[assessment.status as keyof typeof statusIcons];
                const isActionable = assessment.status === 'available' || assessment.status === 'in-progress';

                return (
                  <div key={assessment.id} className="rounded-3xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <FileQuestion className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold">{assessment.title}</h3>
                            <span className="rounded-full border bg-muted/70 px-2.5 py-1 text-xs font-medium">{assessment.subject}</span>
                          </div>
                          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                            <span className="flex items-center gap-2 rounded-2xl bg-muted/40 px-3 py-2">
                              <BarChart className="h-4 w-4" />
                              {assessment.questions} {isRTL ? 'سوال' : 'questions'}
                            </span>
                            <span className="flex items-center gap-2 rounded-2xl bg-muted/40 px-3 py-2">
                              <Clock className="h-4 w-4" />
                              {assessment.duration} {isRTL ? 'دقیقه' : 'min'}
                            </span>
                            <span className={`flex items-center gap-2 rounded-2xl px-3 py-2 ${assessment.status === 'completed' ? 'bg-green-500/10' : assessment.status === 'missed' ? 'bg-red-500/10' : 'bg-primary/10'} ${statusColors[assessment.status as keyof typeof statusColors]}`}>
                              <StatusIcon className="h-4 w-4" />
                              {statusLabels[assessment.status as keyof typeof statusLabels]}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={`flex shrink-0 flex-col gap-3 ${isRTL ? 'lg:items-start' : 'lg:items-end'}`}>
                        {assessment.score !== null ? (
                          <div className={`rounded-2xl bg-primary/5 px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                            <p className="text-2xl font-bold text-primary">{assessment.score}%</p>
                            <p className="text-sm text-muted-foreground">{t('assessments.score')}</p>
                          </div>
                        ) : null}
                        <Link
                          href={`/${locale}/assessments/${assessment.id}`}
                          className={`inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors ${isActionable ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'cursor-not-allowed bg-muted text-muted-foreground'}`}
                        >
                          {assessment.status === 'in-progress' ? t('assessments.continueAssessment') : t('assessments.startAssessment')}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-3xl border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">{isRTL ? 'برنامه امروز' : 'Today at a glance'}</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-2xl bg-muted/50 p-3">
                  <p className="font-medium">{isRTL ? 'تمرین انگلیسی' : 'English practice'}</p>
                  <p className="mt-1 text-muted-foreground">{isRTL ? 'آماده ادامه از آخرین سوال' : 'Ready to resume from the last question'}</p>
                </div>
                <div className="rounded-2xl bg-muted/50 p-3">
                  <p className="font-medium">{isRTL ? 'آزمون علوم' : 'Science exam'}</p>
                  <p className="mt-1 text-muted-foreground">{isRTL ? 'مهلت تا ۲۵ آوریل' : 'Due by April 25'}</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">{isRTL ? 'راهنمای عملکرد' : 'Performance guide'}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {isRTL ? 'بعد از هر ارزیابی، بازخوردهای دقیق را مرور کنید و روی مهارت‌هایی که نیاز به تمرین بیشتر دارند تمرکز کنید.' : 'After each assessment, review the detailed feedback and focus on the skills that still need deliberate practice.'}
              </p>
            </section>
          </aside>
        </div>
      </div>
    </StudentShell>
  );
}
