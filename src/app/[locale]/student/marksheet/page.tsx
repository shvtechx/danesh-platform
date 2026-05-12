'use client';

import { useEffect, useMemo, useState } from 'react';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { StudentShell } from '@/components/layout/StudentShell';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import { Award, Brain, Clock3, Compass, Target } from 'lucide-react';

type MarksheetPayload = {
  summary: {
    studentName: string;
    gradeBand?: string | null;
    averageMastery: number;
    masteryBand: string;
    criticalThinkingAverage: number;
    pendingReviews: number;
    completedAssessments: number;
  };
  skills: Array<{
    skillId: string;
    skillName: string;
    subject: string;
    subjectCode: string;
    masteryScore: number;
    status: string;
    questionsAttempted: number;
    lastPracticedAt?: string | null;
    band: string;
  }>;
  criticalThinkingProfile: Array<{
    dimension: string;
    label: string;
    average: number;
    band: string;
    trend: string;
    evidenceCount: number;
  }>;
  recentAssessments: Array<{
    id: string;
    title: string;
    submittedAt?: string | null;
    percentage?: number | null;
    status: string;
    nextSteps?: string | null;
  }>;
  nextSteps: string[];
};

export default function StudentMarksheetPage({ params: { locale } }: { params: { locale: string } }) {
  const isRTL = locale === 'fa';
  const [payload, setPayload] = useState<MarksheetPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    void loadMarksheet();
  }, [locale]);

  const loadMarksheet = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/student/marksheet?locale=${locale}`, {
        headers: createUserHeaders(getStoredUserId()),
      });
      if (!res.ok) throw new Error('Failed to load marksheet');
      const data = await res.json();
      setPayload(data);
    } catch {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'کارنامه مهارتی بارگذاری نشد.' : 'The marksheet could not be loaded.',
      });
    } finally {
      setLoading(false);
    }
  };

  const summaryCards = useMemo(() => {
    const summary = payload?.summary;
    return [
      { label: isRTL ? 'میانگین تسلط' : 'Average mastery', value: `${summary?.averageMastery ?? 0}%`, icon: Target },
      { label: isRTL ? 'تفکر نقاد' : 'Critical thinking', value: `${summary?.criticalThinkingAverage ?? 0}%`, icon: Brain },
      { label: isRTL ? 'ارزیابی‌های تکمیل‌شده' : 'Completed assessments', value: summary?.completedAssessments ?? 0, icon: Award },
      { label: isRTL ? 'در انتظار بررسی' : 'Pending reviews', value: summary?.pendingReviews ?? 0, icon: Clock3 },
    ];
  }, [isRTL, payload]);

  return (
    <StudentShell locale={locale}>
      <div className="mx-auto max-w-7xl px-4 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
        {feedback ? <FeedbackBanner className="mb-6" variant={feedback.variant} message={feedback.message} /> : null}

        <div className="mb-8 flex flex-col gap-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary">
            <Compass className="h-4 w-4" />
            {isRTL ? 'کارنامه مهارت‌محور و مسیر رشد' : 'Skills-first marksheet and growth pathway'}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isRTL ? 'کارنامه و نمای رشد یادگیری' : 'Marksheet and learning growth view'}
          </h1>
          <p className="max-w-3xl text-muted-foreground">
            {isRTL
              ? 'این کارنامه فقط نمره خام نیست؛ بلکه تسلط مهارتی، تفکر نقاد، شواهد اخیر و گام‌های بعدی پیشنهادی را نشان می‌دهد.'
              : 'This marksheet goes beyond raw grades by showing skill mastery, critical thinking evidence, recent performance, and suggested next steps.'}
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border bg-card p-12 text-center text-muted-foreground">
            {isRTL ? 'در حال بارگذاری...' : 'Loading...'}
          </div>
        ) : payload ? (
          <div className="space-y-8">
            <div className="rounded-3xl border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold">{payload.summary.studentName}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isRTL ? 'پایه تحصیلی' : 'Grade band'}: {payload.summary.gradeBand || (isRTL ? 'نامشخص' : 'Not set')}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <div key={card.label} className="rounded-3xl border bg-card p-5 shadow-sm">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-3xl font-bold">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <section className="rounded-3xl border bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold">{isRTL ? 'مهارت‌ها و تسلط' : 'Skills and mastery'}</h2>
                <div className="space-y-3">
                  {payload.skills.map((skill) => (
                    <div key={skill.skillId} className="rounded-2xl border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{skill.skillName}</h3>
                          <p className="text-sm text-muted-foreground">{skill.subject}</p>
                        </div>
                        <div className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                          {skill.masteryScore}%
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {isRTL ? 'تلاش‌ها' : 'Attempts'}: {skill.questionsAttempted}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold">{isRTL ? 'پروفایل تفکر نقاد' : 'Critical thinking profile'}</h2>
                <div className="space-y-3">
                  {payload.criticalThinkingProfile.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                      {isRTL ? 'هنوز شواهد کافی برای این بخش ثبت نشده است.' : 'There is not enough evidence yet to report this area.'}
                    </div>
                  ) : payload.criticalThinkingProfile.map((item) => (
                    <div key={item.dimension} className="rounded-2xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold">{item.label}</h3>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          {item.average}%
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {isRTL ? 'شواهد ثبت‌شده' : 'Evidence points'}: {item.evidenceCount}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <section className="rounded-3xl border bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold">{isRTL ? 'ارزیابی‌های اخیر' : 'Recent assessments'}</h2>
                <div className="space-y-3">
                  {payload.recentAssessments.map((assessment) => (
                    <div key={assessment.id} className="rounded-2xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{assessment.title}</h3>
                          <p className="text-sm text-muted-foreground">{assessment.status}</p>
                        </div>
                        <div className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                          {typeof assessment.percentage === 'number'
                            ? `${assessment.percentage}%`
                            : isRTL ? 'در انتظار' : 'Pending'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold">{isRTL ? 'گام‌های بعدی پیشنهادی' : 'Recommended next steps'}</h2>
                <div className="space-y-3">
                  {payload.nextSteps.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                      {isRTL ? 'به‌زودی گام‌های بعدی در اینجا نمایش داده می‌شود.' : 'Recommended next steps will appear here soon.'}
                    </div>
                  ) : payload.nextSteps.map((step, index) => (
                    <div key={`${step}-${index}`} className="rounded-2xl border p-4 text-sm leading-7">
                      {step}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </StudentShell>
  );
}
