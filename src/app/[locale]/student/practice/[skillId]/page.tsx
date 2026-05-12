'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { StudentShell } from '@/components/layout/StudentShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import { ArrowLeft, CheckCircle, Clock, Lightbulb, ListChecks, Sparkles, Target, Trophy, XCircle } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  textFA?: string;
  options: { id: string; text: string; textFA?: string; isCorrect: boolean }[];
  hints: string[];
  irtDifficulty?: number;
}

interface PracticeResponseQuestion {
  id: string;
  text?: string;
  textFA?: string;
  stem?: string;
  stemFA?: string;
  options?: { id: string; text: string; textFA?: string; isCorrect: boolean }[];
  hints?: unknown;
  irtDifficulty?: number;
}

interface SessionState {
  sessionId: string;
  currentQuestion: Question | null;
  currentMastery: number;
  currentAbility: number;
  questionsAnswered: number;
  questionsCorrect: number;
  timeStarted: number;
  hintsUsed: number;
}

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('practice');
  const tCommon = useTranslations('common');
  const locale = params.locale as string;
  const skillId = params.skillId as string;

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionState | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [showHint, setShowHint] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [pageFeedback, setPageFeedback] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);

  const normalizeHints = (raw: unknown): string[] => {
    if (!raw) {
      return [];
    }

    if (Array.isArray(raw)) {
      return raw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }

    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
        }
      } catch {
        return raw.trim() ? [raw.trim()] : [];
      }
    }

    return [];
  };

  const normalizeQuestion = (question: PracticeResponseQuestion | null | undefined): Question | null => {
    if (!question) {
      return null;
    }

    const options = Array.isArray(question.options)
      ? question.options.filter((option) => option?.id && (option.text || option.textFA))
      : [];
    const text = question.text || question.stem || '';
    const textFA = question.textFA || question.stemFA || '';

    if (!text && !textFA) {
      return null;
    }

    return {
      id: question.id,
      text,
      textFA,
      options,
      hints: normalizeHints(question.hints),
      irtDifficulty: question.irtDifficulty,
    };
  };

  // Timer
  useEffect(() => {
    if (session && !showFeedback) {
      const interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - session.timeStarted) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [session, showFeedback]);

  // Start practice session
  useEffect(() => {
    startSession();
  }, [skillId]);

  const startSession = async () => {
    try {
      setLoading(true);
      setPageFeedback(null);
      const userId = getStoredUserId();
      const res = await fetch('/api/v1/practice/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...createUserHeaders(userId),
        },
        body: JSON.stringify({ skillId, sessionType: 'PRACTICE' }),
      });

      if (!res.ok) {
        const errorPayload = await res.json().catch(() => null);
        throw new Error(errorPayload?.error || 'Failed to start session');
      }

      const data = await res.json();
      const normalizedQuestion = normalizeQuestion(data.firstQuestion);
      if (!normalizedQuestion) {
        throw new Error('No renderable questions available for this skill');
      }

      setSession({
        sessionId: data.sessionId,
        currentQuestion: normalizedQuestion,
        currentMastery: data.currentMastery,
        currentAbility: data.currentAbility,
        questionsAnswered: 0,
        questionsCorrect: 0,
        timeStarted: Date.now(),
        hintsUsed: 0,
      });
    } catch (error) {
      console.error('Error starting session:', error);
      setPageFeedback({
        variant: 'error',
        message: locale === 'fa' ? 'شروع جلسه تمرین ناموفق بود.' : 'Failed to start practice session.',
      });
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !session) return;

    try {
      setPageFeedback(null);
      const userId = getStoredUserId();
      const res = await fetch('/api/v1/practice/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...createUserHeaders(userId),
        },
        body: JSON.stringify({
          sessionId: session.sessionId,
          questionId: session.currentQuestion?.id,
          answer: selectedAnswer,
          timeSpentSeconds: timeSpent,
          hintsUsed: showHint ? 1 : 0,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit answer');

      const data = await res.json();
      setFeedback({
        ...data,
        nextQuestion: normalizeQuestion(data.nextQuestion),
      });
      setShowFeedback(true);

      // Update session state
      setSession({
        ...session,
        questionsAnswered: session.questionsAnswered + 1,
        questionsCorrect: data.isCorrect
          ? session.questionsCorrect + 1
          : session.questionsCorrect,
        currentMastery: data.newMastery,
        currentAbility: data.newAbility,
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
      setPageFeedback({
        variant: 'error',
        message: locale === 'fa' ? 'ارسال پاسخ ناموفق بود.' : 'Failed to submit answer.',
      });
    }
  };

  const nextQuestion = () => {
    if (!feedback) return;

    if (feedback.sessionComplete) {
      endSession('COMPLETED');
    } else {
      setSession({
        ...session!,
        currentQuestion: feedback.nextQuestion,
        timeStarted: Date.now(),
        hintsUsed: 0,
      });
      setSelectedAnswer(null);
      setShowFeedback(false);
      setFeedback(null);
      setShowHint(false);
      setTimeSpent(0);
    }
  };

  const endSession = async (reason: string = 'QUIT') => {
    if (!session) return;

    try {
      setPageFeedback(null);
      const userId = getStoredUserId();
      const res = await fetch('/api/v1/practice/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...createUserHeaders(userId),
        },
        body: JSON.stringify({
          sessionId: session.sessionId,
          exitReason: reason,
        }),
      });

      if (!res.ok) throw new Error('Failed to end session');

      const result = await res.json();
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          `practice-result:${session.sessionId}`,
          JSON.stringify({
            ...result,
            skillId,
          }),
        );
      }

      router.push(
        `/${locale}/student/practice/results?sessionId=${session.sessionId}`
      );
    } catch (error) {
      console.error('Error ending session:', error);
      setPageFeedback({
        variant: 'error',
        message: locale === 'fa' ? 'پایان جلسه ناموفق بود.' : 'Failed to end session.',
      });
    }
  };

  if (loading) {
    return (
      <StudentShell locale={locale}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="text-gray-600">{tCommon('loading')}...</p>
          </div>
        </div>
      </StudentShell>
    );
  }

  if (!session) {
    return (
      <StudentShell locale={locale}>
        <div className="mx-auto max-w-2xl p-4 sm:p-6">
          <Card className="rounded-3xl p-8 text-center shadow-sm">
            {pageFeedback ? <FeedbackBanner className="mb-4" variant={pageFeedback.variant} message={pageFeedback.message} /> : null}
            <p className="text-lg font-semibold text-gray-900">
              {locale === 'fa' ? 'جلسه تمرین آماده نشد' : 'Practice session could not be prepared'}
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {locale === 'fa'
                ? 'صفحه حالا فقط پرسش‌های قابل‌نمایش را می‌پذیرد. اگر هنوز این مهارت ناقص باشد، مهارت دیگری را انتخاب کن یا دوباره تلاش کن.'
                : 'This page now accepts only renderable practice sets. If this skill is still incomplete, pick another skill or try again.'}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => startSession()}>{locale === 'fa' ? 'تلاش دوباره' : 'Try again'}</Button>
              <Button variant="outline" onClick={() => router.push(`/${locale}/student/skills`)}>
                {locale === 'fa' ? 'بازگشت به مهارت‌ها' : 'Back to skills'}
              </Button>
            </div>
          </Card>
        </div>
      </StudentShell>
    );
  }

  const question = session.currentQuestion;
  if (!question) {
    return (
      <StudentShell locale={locale}>
        <div className="mx-auto max-w-2xl p-4 sm:p-6">
          <Card className="rounded-3xl p-8 text-center">
            <p className="text-lg">{t('noQuestionsAvailable')}</p>
            <Button onClick={() => router.push(`/${locale}/student/skills`)} className="mt-4">
              {locale === 'fa' ? 'بازگشت به مهارت‌ها' : 'Back to skills'}
            </Button>
          </Card>
        </div>
      </StudentShell>
    );
  }

  const accuracy = session.questionsAnswered > 0
    ? Math.round((session.questionsCorrect / session.questionsAnswered) * 100)
    : 0;
  const questionNumber = session.questionsAnswered + 1;

  return (
    <StudentShell locale={locale}>
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-fuchsia-600 via-violet-600 to-indigo-700 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <Button variant="secondary" size="sm" className="w-fit bg-white/15 text-white hover:bg-white/20" onClick={() => router.push(`/${locale}/student/skills`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {locale === 'fa' ? 'بازگشت به مهارت‌ها' : 'Back to skills'}
              </Button>
              <div>
                <p className="text-sm font-medium text-white/75">{locale === 'fa' ? 'تمرین تعاملی' : 'Interactive practice'}</p>
                <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{locale === 'fa' ? 'جلسه تمرین هوشمند' : 'Smart practice session'}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
                  {locale === 'fa'
                    ? 'این صفحه بازطراحی شده تا بدون متن‌های خالی و بدون شکست چیدمان، تمرین را با خوانایی بهتر، ناوبری کامل و بازخورد روشن پیش ببرد.'
                    : 'This practice flow has been redesigned for cleaner question presentation, better navigation, and stronger moment-by-moment feedback.'}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
              <Card className="border-white/15 bg-white/10 p-4 text-white shadow-none backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/65">{locale === 'fa' ? 'سوال' : 'Question'}</p>
                <p className="mt-2 text-2xl font-bold">{questionNumber}</p>
              </Card>
              <Card className="border-white/15 bg-white/10 p-4 text-white shadow-none backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/65">{locale === 'fa' ? 'دقت' : 'Accuracy'}</p>
                <p className="mt-2 text-2xl font-bold">{accuracy}%</p>
              </Card>
              <Card className="border-white/15 bg-white/10 p-4 text-white shadow-none backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/65">{locale === 'fa' ? 'زمان' : 'Timer'}</p>
                <p className="mt-2 text-2xl font-bold font-mono">{Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</p>
              </Card>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-white/10 p-4 backdrop-blur">
            <div className="mb-2 flex items-center justify-between text-sm text-white/85">
              <span>{t('mastery')}</span>
              <span className="font-bold">{session.currentMastery}%</span>
            </div>
            <Progress value={session.currentMastery} className="h-2.5 bg-white/20" />
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-white/75">
              <span>{t('accuracy')}: {accuracy}%</span>
              <span>{session.questionsCorrect}/{Math.max(session.questionsAnswered, 1)} {t('correct')}</span>
              <span>{locale === 'fa' ? 'توانایی' : 'Ability'}: {session.currentAbility.toFixed(2)}</span>
            </div>
          </div>
        </section>

        {pageFeedback ? <FeedbackBanner className="mb-1" variant={pageFeedback.variant} message={pageFeedback.message} /> : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="rounded-[2rem] border-slate-200 p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                <ListChecks className="h-4 w-4" />
                {t('question')} {questionNumber}
              </div>
              {question.irtDifficulty !== undefined ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                  <Target className="h-4 w-4" />
                  {t('difficulty')}: {Math.round(((question.irtDifficulty + 3) / 6) * 100)}%
                </div>
              ) : null}
            </div>

            <p className="text-xl font-semibold leading-9 text-slate-900">
              {locale === 'fa' ? question.textFA || question.text : question.text || question.textFA}
            </p>

            <div className="mt-8 space-y-3">
              {question.options.map((option) => {
                const isSelected = selectedAnswer === option.id;
                const showCorrect = showFeedback && option.isCorrect;
                const showWrong = showFeedback && isSelected && !option.isCorrect;

                return (
                  <button
                    key={option.id}
                    onClick={() => !showFeedback && setSelectedAnswer(option.id)}
                    disabled={showFeedback}
                    className={`w-full rounded-2xl border-2 p-4 text-start transition-all sm:p-5 ${
                      isSelected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    } ${showCorrect ? 'border-green-500 bg-green-50' : ''} ${showWrong ? 'border-red-500 bg-red-50' : ''} ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-medium leading-6 text-slate-800 sm:text-base">
                        {locale === 'fa' ? option.textFA || option.text : option.text || option.textFA}
                      </span>
                      {showCorrect ? <CheckCircle className="h-5 w-5 shrink-0 text-green-600" /> : null}
                      {showWrong ? <XCircle className="h-5 w-5 shrink-0 text-red-600" /> : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {question.hints.length > 0 ? (
              <div className="mt-6">
                {!showHint ? (
                  <Button variant="outline" size="sm" onClick={() => setShowHint(true)} className="w-full sm:w-auto">
                    <Lightbulb className="mr-2 h-4 w-4" />
                    {t('showHint')}
                  </Button>
                ) : (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="mt-0.5 h-5 w-5 text-amber-600" />
                      <p className="text-sm leading-6 text-amber-900">{question.hints[0]}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {showFeedback && feedback ? (
              <div className={`mt-6 rounded-2xl border-2 p-4 ${feedback.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center gap-2">
                  {feedback.isCorrect ? (
                    <>
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <span className="font-bold text-green-900">{t('correct')}!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-red-600" />
                      <span className="font-bold text-red-900">{t('incorrect')}</span>
                    </>
                  )}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {locale === 'fa' ? feedback.explanationFA || feedback.explanation : feedback.explanation || feedback.explanationFA}
                </p>
                {feedback.xpEarned > 0 ? (
                  <div className="mt-3 flex items-center gap-2 text-blue-600">
                    <Trophy className="h-5 w-5" />
                    <span className="font-bold">+{feedback.xpEarned} XP</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {!showFeedback ? (
                <Button onClick={submitAnswer} disabled={!selectedAnswer} className="flex-1" size="lg">
                  {t('submitAnswer')}
                </Button>
              ) : (
                <Button onClick={nextQuestion} className="flex-1" size="lg">
                  {feedback.sessionComplete ? t('viewResults') : t('nextQuestion')}
                </Button>
              )}
              <Button variant="outline" size="lg" onClick={() => endSession('QUIT')}>
                {t('quit')}
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-violet-600" />
                <div>
                  <h2 className="font-semibold text-slate-900">{locale === 'fa' ? 'نقشه جلسه' : 'Session snapshot'}</h2>
                  <p className="text-sm text-slate-500">{locale === 'fa' ? 'نمای سریع از عملکرد فعلی' : 'Quick view of your live performance'}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{locale === 'fa' ? 'زمان فعال' : 'Active time'}</p>
                  <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <Clock className="h-4 w-4 text-slate-500" />
                    {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{locale === 'fa' ? 'پاسخ‌های درست' : 'Correct answers'}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{session.questionsCorrect} / {session.questionsAnswered}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{locale === 'fa' ? 'سطح توانایی' : 'Ability estimate'}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{session.currentAbility.toFixed(2)}</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Lightbulb className="h-5 w-5 text-amber-600" />
                <div>
                  <h2 className="font-semibold text-slate-900">{locale === 'fa' ? 'راهنمای کوتاه' : 'Quick coach'}</h2>
                  <p className="text-sm text-slate-500">{locale === 'fa' ? 'برای بهتر پیش رفتن در همین جلسه' : 'To stay in flow during this set'}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>• {locale === 'fa' ? 'قبل از انتخاب پاسخ، همه گزینه‌ها را کامل بخوان.' : 'Read every option fully before selecting an answer.'}</li>
                <li>• {locale === 'fa' ? 'اگر نیاز بود، از راهنمایی استفاده کن اما اول خودت تحلیل کن.' : 'Use the hint when needed, but try your own reasoning first.'}</li>
                <li>• {locale === 'fa' ? 'بعد از بازخورد، توضیح را سریع مرور کن تا الگو را به خاطر بسپاری.' : 'After feedback appears, scan the explanation to lock in the pattern.'}</li>
              </ul>
            </Card>

            <Card className="rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-sky-600" />
                <div>
                  <h2 className="font-semibold text-slate-900">{locale === 'fa' ? 'ناوبری سریع' : 'Quick navigation'}</h2>
                  <p className="text-sm text-slate-500">{locale === 'fa' ? 'بدون گم شدن بین صفحه‌ها' : 'Jump where you need without losing context'}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/${locale}/student/skills`)}>
                  {locale === 'fa' ? 'بازگشت به فهرست مهارت‌ها' : 'Back to skill library'}
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/${locale}/dashboard`)}>
                  {locale === 'fa' ? 'بازگشت به داشبورد' : 'Return to dashboard'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </StudentShell>
  );
}
