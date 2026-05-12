'use client';

import { useEffect, useMemo, useState } from 'react';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import {
  Award,
  Brain,
  CheckCircle2,
  Loader2,
  MessageSquareText,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';

type GradebookPayload = {
  summary: {
    totalStudents: number;
    pendingReviews: number;
    averageMastery: number;
    averageCriticalThinking: number;
  };
  students: Array<{
    studentId: string;
    displayName: string;
    email: string;
    gradeBand?: string | null;
    averageMastery: number;
    masteryBand: string;
    averageCriticalThinking: number;
    criticalThinkingBand: string;
    pendingReviews: number;
    recentAssessment?: {
      title: string;
      percentage?: number | null;
      status: string;
      submittedAt?: string | null;
    } | null;
  }>;
  pendingReviews: Array<{
    attemptId: string;
    studentId: string;
    assessmentTitle: string;
    submittedAt?: string | null;
    openResponseCount: number;
    suggestedScore: number;
  }>;
};

type ReviewAttemptPayload = {
  attempt: {
    attemptId: string;
    status: string;
    submittedAt?: string | null;
    student: {
      id: string;
      displayName: string;
      email: string;
    };
    assessment: {
      id: string;
      title: string;
      titleFA?: string | null;
      courseTitle?: string | null;
      courseTitleFA?: string | null;
    };
    questions: Array<{
      id: string;
      sequence: number;
      type: string;
      stem: string;
      stemFA?: string | null;
      points: number;
      response?: string | null;
      aiSuggestion?: {
        suggestedScore: number;
        maxScore: number;
        percentage: number;
        confidence: 'LOW' | 'MEDIUM' | 'HIGH';
        rationale: string;
        strengths: string[];
        improvements: string[];
      } | null;
      teacherReview?: {
        score?: number;
        feedback?: string | null;
      } | null;
    }>;
  };
};

export default function TeacherGradebookPage({ params: { locale } }: { params: { locale: string } }) {
  const isRTL = locale === 'fa';
  const [payload, setPayload] = useState<GradebookPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAttemptId, setSelectedAttemptId] = useState('');
  const [reviewDetail, setReviewDetail] = useState<ReviewAttemptPayload['attempt'] | null>(null);
  const [reviewDraft, setReviewDraft] = useState<Record<string, { score: string; feedback: string; approvedAi: boolean }>>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    void loadGradebook();
  }, [locale]);

  useEffect(() => {
    if (payload?.pendingReviews?.[0] && !selectedAttemptId) {
      setSelectedAttemptId(payload.pendingReviews[0].attemptId);
    }
  }, [payload, selectedAttemptId]);

  useEffect(() => {
    if (selectedAttemptId) {
      void loadReviewDetail(selectedAttemptId);
    } else {
      setReviewDetail(null);
      setReviewDraft({});
    }
  }, [selectedAttemptId]);

  const loadGradebook = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/teacher/gradebook?locale=${locale}`, {
        headers: createUserHeaders(getStoredUserId()),
      });
      if (!res.ok) throw new Error('Failed to load gradebook');
      const data = await res.json();
      setPayload(data);
    } catch {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'بارگذاری دفتر نمره ممکن نبود.' : 'Gradebook could not be loaded.',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReviewDetail = async (attemptId: string) => {
    try {
      const res = await fetch(`/api/v1/attempts/${attemptId}/review`, {
        headers: createUserHeaders(getStoredUserId()),
      });
      if (!res.ok) throw new Error('Failed to load review detail');
      const data: ReviewAttemptPayload = await res.json();
      setReviewDetail(data.attempt);
      const draft = Object.fromEntries(
        data.attempt.questions
          .filter((question) => ['SHORT_ANSWER', 'LONG_ANSWER'].includes(question.type))
          .map((question) => [
            question.id,
            {
              score: String(question.teacherReview?.score ?? question.aiSuggestion?.suggestedScore ?? ''),
              feedback: question.teacherReview?.feedback || '',
              approvedAi: question.teacherReview ? false : true,
            },
          ]),
      );
      setReviewDraft(draft);
    } catch {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'جزئیات بررسی بارگذاری نشد.' : 'The review detail could not be loaded.',
      });
    }
  };

  const saveReview = async () => {
    if (!reviewDetail) return;

    try {
      setSaving(true);
      const questionReviews = Object.entries(reviewDraft).map(([questionId, draft]) => ({
        questionId,
        score: Number(draft.score || 0),
        feedback: draft.feedback,
        approvedAi: draft.approvedAi,
      }));

      const res = await fetch(`/api/v1/attempts/${reviewDetail.attemptId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...createUserHeaders(getStoredUserId()),
        },
        body: JSON.stringify({
          questionReviews,
          teacherComment: isRTL ? 'بازخورد نهایی معلم ثبت شد.' : 'Teacher final review saved.',
        }),
      });

      if (!res.ok) throw new Error('Failed to save review');

      setFeedback({
        variant: 'success',
        message: isRTL ? 'بازبینی معلم با موفقیت ذخیره شد.' : 'Teacher review saved successfully.',
      });
      setSelectedAttemptId('');
      await loadGradebook();
    } catch {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'ذخیره بازبینی ممکن نبود.' : 'The review could not be saved.',
      });
    } finally {
      setSaving(false);
    }
  };

  const summaryCards = useMemo(() => {
    const summary = payload?.summary;
    return [
      {
        label: isRTL ? 'دانش‌آموزان' : 'Students',
        value: summary?.totalStudents ?? 0,
        icon: Users,
      },
      {
        label: isRTL ? 'بررسی‌های در انتظار' : 'Pending reviews',
        value: summary?.pendingReviews ?? 0,
        icon: MessageSquareText,
      },
      {
        label: isRTL ? 'میانگین تسلط' : 'Average mastery',
        value: `${summary?.averageMastery ?? 0}%`,
        icon: Target,
      },
      {
        label: isRTL ? 'میانگین تفکر نقاد' : 'Critical thinking',
        value: `${summary?.averageCriticalThinking ?? 0}%`,
        icon: Brain,
      },
    ];
  }, [isRTL, payload]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {feedback ? <FeedbackBanner className="mb-6" variant={feedback.variant} message={feedback.message} /> : null}

      <div className="mb-8 flex flex-col gap-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary">
          <Sparkles className="h-4 w-4" />
          {isRTL ? 'دفتر نمره مهارت‌محور و بررسی هوشمند' : 'Skills-first gradebook and AI-assisted review'}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isRTL ? 'دفتر نمره و صف ارزیابی پاسخ‌های تشریحی' : 'Gradebook and written-response review queue'}
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          {isRTL
            ? 'پاسخ‌های تشریحی به‌صورت پیشنهادی توسط دستیار هوش مصنوعی نمره‌گذاری می‌شوند و پس از تأیید نهایی معلم در کارنامه ثبت خواهند شد.'
            : 'Open responses receive a rubric-constrained AI draft score first, then become official only after teacher approval.'}
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-3xl border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8">
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

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-3xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{isRTL ? 'نمای کلاس' : 'Class overview'}</h2>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'تسلط مهارتی، تفکر نقاد و آخرین وضعیت ارزیابی' : 'Skill mastery, critical thinking, and latest assessment status'}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                  <Award className="h-4 w-4" />
                  {payload?.students.length ?? 0}
                </div>
              </div>

              <div className="space-y-3">
                {(payload?.students || []).map((student) => (
                  <div key={student.studentId} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{student.displayName}</h3>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                          {isRTL ? 'تسلط' : 'Mastery'}: {student.averageMastery}%
                        </span>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          {isRTL ? 'تفکر نقاد' : 'Critical thinking'}: {student.averageCriticalThinking}%
                        </span>
                        {student.pendingReviews > 0 ? (
                          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                            {student.pendingReviews} {isRTL ? 'در انتظار' : 'pending'}
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            {isRTL ? 'به‌روز' : 'Up to date'}
                          </span>
                        )}
                      </div>
                    </div>
                    {student.recentAssessment ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {isRTL ? 'آخرین ارزیابی:' : 'Latest assessment:'} {student.recentAssessment.title}
                        {typeof student.recentAssessment.percentage === 'number' ? ` • ${student.recentAssessment.percentage}%` : ` • ${isRTL ? 'در انتظار نهایی‌سازی' : 'Pending final approval'}`}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{isRTL ? 'صف بررسی تشریحی' : 'Written-response review queue'}</h2>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'پاسخ‌های نیازمند تأیید نهایی معلم' : 'Responses that still need teacher approval'}
                  </p>
                </div>
                <div className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                  {payload?.pendingReviews.length ?? 0}
                </div>
              </div>

              {(payload?.pendingReviews || []).length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                  {isRTL ? 'در حال حاضر موردی برای بررسی وجود ندارد.' : 'There are no written responses waiting for review right now.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {payload?.pendingReviews.map((item) => (
                    <button
                      key={item.attemptId}
                      type="button"
                      onClick={() => setSelectedAttemptId(item.attemptId)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${selectedAttemptId === item.attemptId ? 'border-primary bg-primary/5' : 'hover:border-primary/40'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.assessmentTitle}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.openResponseCount} {isRTL ? 'پاسخ تشریحی' : 'open responses'}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round(item.suggestedScore * 10) / 10}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{isRTL ? 'بررسی مورد انتخاب‌شده' : 'Selected review'}</h2>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'معلم می‌تواند نمره پیشنهادی را تأیید یا اصلاح کند.' : 'The teacher can approve or adjust the AI draft score before release.'}
                </p>
              </div>
              {reviewDetail ? (
                <button
                  type="button"
                  onClick={saveReview}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {isRTL ? 'ثبت تأیید معلم' : 'Save teacher approval'}
                </button>
              ) : null}
            </div>

            {!reviewDetail ? (
              <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
                {isRTL ? 'یک مورد را از صف بررسی انتخاب کنید.' : 'Select an item from the review queue.'}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="font-semibold">{reviewDetail.student.displayName}</p>
                  <p className="text-sm text-muted-foreground">{reviewDetail.assessment.title}</p>
                </div>

                {reviewDetail.questions.filter((question) => ['SHORT_ANSWER', 'LONG_ANSWER'].includes(question.type)).map((question) => (
                  <div key={question.id} className="rounded-2xl border p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">{isRTL ? `سوال ${question.sequence + 1}` : `Question ${question.sequence + 1}`}</p>
                        <h3 className="font-semibold">{isRTL && question.stemFA ? question.stemFA : question.stem}</h3>
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                        {question.points} {isRTL ? 'امتیاز' : 'pts'}
                      </span>
                    </div>

                    <div className="mb-4 rounded-2xl bg-muted/40 p-4 text-sm leading-7">
                      {question.response || (isRTL ? 'بدون پاسخ' : 'No response provided')}
                    </div>

                    {question.aiSuggestion ? (
                      <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                        <div className="mb-2 flex items-center gap-2 text-primary">
                          <Sparkles className="h-4 w-4" />
                          <span className="text-sm font-medium">{isRTL ? 'پیشنهاد دستیار هوش مصنوعی' : 'AI assistant suggestion'}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? 'امتیاز پیشنهادی' : 'Suggested score'}: {question.aiSuggestion.suggestedScore} / {question.aiSuggestion.maxScore}
                          {' • '}
                          {isRTL ? 'اعتماد' : 'Confidence'}: {question.aiSuggestion.confidence}
                        </p>
                        <p className="mt-2 text-sm">{question.aiSuggestion.rationale}</p>
                      </div>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                      <label className="space-y-2 text-sm">
                        <span className="font-medium">{isRTL ? 'امتیاز نهایی' : 'Final score'}</span>
                        <input
                          type="number"
                          min={0}
                          max={question.points}
                          step="0.5"
                          value={reviewDraft[question.id]?.score || ''}
                          onChange={(event) => setReviewDraft((prev) => ({
                            ...prev,
                            [question.id]: {
                              ...(prev[question.id] || { feedback: '', approvedAi: false }),
                              score: event.target.value,
                            },
                          }))}
                          className="w-full rounded-xl border bg-background px-3 py-2"
                        />
                      </label>
                      <label className="space-y-2 text-sm">
                        <span className="font-medium">{isRTL ? 'بازخورد معلم' : 'Teacher feedback'}</span>
                        <textarea
                          rows={3}
                          value={reviewDraft[question.id]?.feedback || ''}
                          onChange={(event) => setReviewDraft((prev) => ({
                            ...prev,
                            [question.id]: {
                              ...(prev[question.id] || { score: '', approvedAi: false }),
                              feedback: event.target.value,
                            },
                          }))}
                          className="w-full rounded-xl border bg-background px-3 py-2"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
