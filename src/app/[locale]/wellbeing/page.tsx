'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Heart, Battery, Wind, BookHeart, Coffee, PenLine, AlertCircle, X } from 'lucide-react';
import { StudentShell } from '@/components/layout/StudentShell';
import { StudentPageHeader } from '@/components/layout/StudentPageHeader';
import { FeedbackBanner } from '@/components/ui/feedback-banner';

type WellbeingState = {
  mood: string | null;
  energy: 'high' | 'medium' | 'low' | null;
  stress: 'relaxed' | 'balanced' | 'stressed' | null;
  draftSavedAt: string | null;
};

export default function WellbeingPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const storageKey = 'danesh.wellbeing.checkin.v1';

  const [state, setState] = useState<WellbeingState>({
    mood: null,
    energy: null,
    stress: null,
    draftSavedAt: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  const moodToScore: Record<string, number> = {
    great: 5,
    good: 4,
    okay: 3,
    notGreat: 2,
    struggling: 1,
  };

  const levelToScore: Record<'high' | 'medium' | 'low', number> = {
    high: 5,
    medium: 3,
    low: 1,
  };

  const stressToScore: Record<'relaxed' | 'balanced' | 'stressed', number> = {
    relaxed: 1,
    balanced: 3,
    stressed: 5,
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as WellbeingState;
      setState((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore invalid local data
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // ignore storage errors
    }
  }, [state]);

  const saveSelection = (patch: Partial<WellbeingState>) => {
    setSubmitError(null);
    setSubmitMessage(null);
    setState((prev) => ({
      ...prev,
      ...patch,
      draftSavedAt: new Date().toISOString(),
    }));
  };

  const handleResourceAction = (resourceId: string) => {
    const actions = {
      '1': isRTL ? 'تمرین تنفس باز شد. ۴ ثانیه دم، ۴ ثانیه نگه دارید، ۴ ثانیه بازدم.' : 'Breathing exercise opened. Inhale for 4, hold for 4, exhale for 4.',
      '2': isRTL ? 'زمان استراحت کوتاه شروع شد. پنج دقیقه از صفحه فاصله بگیرید.' : 'Break timer started. Step away from the screen for five minutes.',
      '3': isRTL ? 'دفترچه یادداشت آماده است. احساسات خود را آزادانه بنویسید.' : 'Journaling prompt is ready. Write your thoughts freely.',
      '4': isRTL ? 'فرم ارتباط با مشاور باز شد. می‌توانید گزارش ناشناس هم ثبت کنید.' : 'Counselor support is ready. You can also submit an anonymous report.',
    } as const;

    setSubmitMessage((actions as Record<string, string>)[resourceId] || (isRTL ? 'منبع انتخاب شد.' : 'Resource selected.'));

    if (resourceId === '4') {
      setShowReportModal(true);
      setReportError(null);
    }
  };

  const handleSubmitCheckin = async () => {
    if (!state.mood) {
      setSubmitError(isRTL ? 'ابتدا حال خود را انتخاب کنید.' : 'Please select your mood first.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);

    try {
      const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('danesh.userId') : null;
      const userId = storedUserId || 'dev-super-admin';

      const response = await fetch('/api/v1/wellbeing/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          moodScore: moodToScore[state.mood],
          energyLevel: state.energy ? levelToScore[state.energy] : undefined,
          stressLevel: state.stress ? stressToScore[state.stress] : undefined,
          locale,
        }),
      });

      if (!response.ok) {
        throw new Error('submit_failed');
      }

      setSubmitMessage(isRTL ? 'ثبت روزانه سلامت روان با موفقیت انجام شد ✅' : 'Daily wellbeing check-in submitted successfully ✅');
    } catch {
      setSubmitError(isRTL ? 'ثبت انجام نشد. دوباره تلاش کنید.' : 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnonymousReport = async () => {
    if (!reportText.trim()) {
      setReportError(isRTL ? 'لطفاً متن گزارش را وارد کنید.' : 'Please enter your concern.');
      return;
    }

    setIsSubmittingReport(true);
    setReportError(null);
    setReportSuccess(null);

    try {
      const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('danesh.userId') : null;
      const response = await fetch('/api/v1/wellbeing/concern-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: storedUserId || null,
          concernType: 'OTHER',
          description: reportText.trim(),
          anonymous: true,
        }),
      });

      if (!response.ok) {
        throw new Error('submit_failed');
      }
      
      setShowReportModal(false);
      setReportText('');
      setReportSuccess(
        isRTL
          ? 'گزارش شما با موفقیت ثبت شد. تیم ما به زودی بررسی خواهد کرد.'
          : 'Your report has been submitted successfully. Our team will review it soon.'
      );
    } catch (error) {
      setReportError(isRTL ? 'خطا در ارسال گزارش.' : 'Error submitting report.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const moods = [
    { icon: '😊', label: t('wellbeing.great'), value: 'great', color: 'bg-green-500' },
    { icon: '🙂', label: t('wellbeing.good'), value: 'good', color: 'bg-emerald-500' },
    { icon: '😐', label: t('wellbeing.okay'), value: 'okay', color: 'bg-amber-500' },
    { icon: '😕', label: t('wellbeing.notGreat'), value: 'notGreat', color: 'bg-orange-500' },
    { icon: '😢', label: t('wellbeing.struggling'), value: 'struggling', color: 'bg-red-500' },
  ];

  const resources = [
    {
      id: '1',
      title: t('wellbeing.breathingExercise'),
      description: isRTL ? 'تمرین تنفس عمیق برای آرامش' : 'Deep breathing exercise for relaxation',
      icon: Wind,
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      id: '2',
      title: t('wellbeing.takeABreak'),
      description: isRTL ? 'یک استراحت کوتاه ۵ دقیقه‌ای' : 'A short 5-minute break',
      icon: Coffee,
      color: 'bg-amber-500/10 text-amber-500',
    },
    {
      id: '3',
      title: t('wellbeing.journaling'),
      description: isRTL ? 'افکار و احساسات خود را بنویسید' : 'Write down your thoughts and feelings',
      icon: PenLine,
      color: 'bg-purple-500/10 text-purple-500',
    },
    {
      id: '4',
      title: t('wellbeing.talkToSomeone'),
      description: isRTL ? 'با یک مشاور صحبت کنید' : 'Talk to a counselor',
      icon: Heart,
      color: 'bg-pink-500/10 text-pink-500',
    },
  ];

  return (
    <StudentShell locale={locale}>
      <div className="space-y-6">
        <StudentPageHeader
          locale={locale}
          eyebrow={isRTL ? 'سلامت و حمایت' : 'Wellbeing and support'}
          title={t('wellbeing.title')}
          description={isRTL ? 'ثبت روزانه احساس، انرژی و فشار ذهنی شما به معلمان و تیم پشتیبانی کمک می‌کند حمایت مناسب‌تری ارائه دهند.' : 'Daily check-ins on mood, energy, and stress help teachers and the support team offer better care.'}
          stats={[
            { label: isRTL ? 'حال امروز' : 'Today’s mood', value: state.mood ? moods.find((mood) => mood.value === state.mood)?.icon || '—' : '—', icon: Heart, tone: 'primary', helper: state.mood ? (isRTL ? 'ثبت شده' : 'Selected') : (isRTL ? 'در انتظار انتخاب' : 'Awaiting selection') },
            { label: isRTL ? 'انرژی' : 'Energy', value: state.energy ? t(`wellbeing.${state.energy}`) : '—', icon: Battery, tone: 'warning', helper: isRTL ? 'سطح فعلی' : 'Current level' },
            { label: isRTL ? 'فشار ذهنی' : 'Stress', value: state.stress ? t(`wellbeing.${state.stress}`) : '—', icon: BookHeart, tone: 'accent', helper: state.draftSavedAt ? (isRTL ? 'پیش‌نویس ذخیره شد' : 'Draft saved locally') : (isRTL ? 'بدون پیش‌نویس' : 'No local draft yet') },
          ]}
          actions={
            <button onClick={handleSubmitCheckin} disabled={isSubmitting} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {isSubmitting ? (isRTL ? 'در حال ثبت...' : 'Submitting...') : (isRTL ? 'ثبت سلامت روان امروز' : "Submit today's wellbeing")}
            </button>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
      {/* Mood Check */}
      <div className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-xl font-semibold">{t('wellbeing.howAreYou')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {moods.map((mood) => (
            <button
              key={mood.value}
              onClick={() => saveSelection({ mood: mood.value })}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors ${
                state.mood === mood.value
                  ? 'ring-2 ring-primary bg-primary/10 border-primary'
                  : 'hover:bg-muted'
              }`}
            >
              <span className="text-4xl">{mood.icon}</span>
              <span className="text-sm font-medium">{mood.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Energy & Stress Level */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Battery className="h-5 w-5 text-amber-500" />
            </div>
            <h2 className="text-lg font-semibold">{t('wellbeing.energyLevel')}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              onClick={() => saveSelection({ energy: 'high' })}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                state.energy === 'high'
                  ? 'bg-green-500/10 border-green-500'
                  : 'hover:bg-green-500/10 hover:border-green-500'
              }`}
            >
              {t('wellbeing.high')}
            </button>
            <button
              onClick={() => saveSelection({ energy: 'medium' })}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                state.energy === 'medium'
                  ? 'bg-amber-500/10 border-amber-500'
                  : 'hover:bg-amber-500/10 hover:border-amber-500'
              }`}
            >
              {t('wellbeing.medium')}
            </button>
            <button
              onClick={() => saveSelection({ energy: 'low' })}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                state.energy === 'low'
                  ? 'bg-red-500/10 border-red-500'
                  : 'hover:bg-red-500/10 hover:border-red-500'
              }`}
            >
              {t('wellbeing.low')}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <BookHeart className="h-5 w-5 text-purple-500" />
            </div>
            <h2 className="text-lg font-semibold">{t('wellbeing.stressLevel')}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              onClick={() => saveSelection({ stress: 'relaxed' })}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                state.stress === 'relaxed'
                  ? 'bg-green-500/10 border-green-500'
                  : 'hover:bg-green-500/10 hover:border-green-500'
              }`}
            >
              {t('wellbeing.relaxed')}
            </button>
            <button
              onClick={() => saveSelection({ stress: 'balanced' })}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                state.stress === 'balanced'
                  ? 'bg-amber-500/10 border-amber-500'
                  : 'hover:bg-amber-500/10 hover:border-amber-500'
              }`}
            >
              {t('wellbeing.balanced')}
            </button>
            <button
              onClick={() => saveSelection({ stress: 'stressed' })}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                state.stress === 'stressed'
                  ? 'bg-red-500/10 border-red-500'
                  : 'hover:bg-red-500/10 hover:border-red-500'
              }`}
            >
              {t('wellbeing.stressed')}
            </button>
          </div>
        </div>
      </div>

      {/* Submit Check-in */}
      <div className="space-y-3 rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {isRTL
              ? 'پس از انتخاب موارد بالا، برای ثبت نهایی روی دکمه زیر بزنید.'
              : 'After making your selections above, use the button to submit your daily check-in.'}
          </p>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {state.draftSavedAt ? (isRTL ? 'پیش‌نویس آماده ثبت است' : 'Draft is ready to submit') : (isRTL ? 'پس از انتخاب‌ها ثبت کنید' : 'Submit after making your selections')}
          </span>
        </div>

        {submitMessage && (
          <p className="text-sm text-green-600">{submitMessage}</p>
        )}
        {submitError && (
          <p className="text-sm text-red-600">{submitError}</p>
        )}
      </div>

      {/* Resources */}
      <div className="space-y-4">
        <h2 className="mb-4 text-xl font-semibold">{t('wellbeing.resources')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {resources.map((resource) => (
            <button
              key={resource.id}
              onClick={() => handleResourceAction(resource.id)}
              className="rounded-3xl border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${resource.color}`}>
                <resource.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mt-3">{resource.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Concern Report */}
      <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5 shadow-sm sm:p-6">
        {reportSuccess ? <FeedbackBanner className="mb-4" variant="success" message={reportSuccess} /> : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
            <AlertCircle className="h-6 w-6 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{t('wellbeing.concernReport')}</h3>
            <p className="text-muted-foreground mt-1">
              {isRTL 
                ? 'اگر نگران خود یا یکی از دوستانتان هستید، می‌توانید به صورت ناشناس گزارش دهید.'
                : 'If you are concerned about yourself or a friend, you can report anonymously.'}
            </p>
            <button 
              onClick={() => {
                setShowReportModal(true);
                setReportError(null);
              }}
              className="mt-4 w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-600 sm:w-auto"
            >
              {t('wellbeing.anonymous')}
            </button>
          </div>
        </div>
      </div>

          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">{isRTL ? 'یادآور حمایت' : 'Support reminder'}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {isRTL ? 'اگر چند روز پشت‌سرهم احساس خوبی نداشتید، مربی یا مشاور می‌تواند با رویکردی حمایتی با شما ارتباط بگیرد.' : 'If you have several difficult days in a row, a teacher or counselor can follow up with a supportive approach.'}
              </p>
            </div>

            <div className="rounded-3xl border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">{isRTL ? 'پیشنهاد امروز' : 'Today’s suggestion'}</h2>
              <div className="mt-4 rounded-2xl bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
                {isRTL ? 'پس از ثبت حال، یکی از تمرین‌های تنفس یا نوشتن احساسات را انتخاب کنید تا ذهن شما آرام‌تر شود.' : 'After your check-in, try one breathing or journaling activity to help regulate and reset.'}
              </div>
            </div>
          </aside>
        </div>

      {/* Anonymous Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-2xl border bg-background p-5 shadow-lg max-h-[85vh] overflow-y-auto sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {isRTL ? 'گزارش ناشناس' : 'Anonymous Report'}
              </h3>
              <button 
                onClick={() => setShowReportModal(false)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                {isRTL
                  ? 'این گزارش کاملاً محرمانه و ناشناس است. هیچ‌کس نمی‌تواند هویت شما را ببیند.'
                  : 'This report is completely confidential and anonymous. No one will be able to identify you.'}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                {isRTL ? 'لطفاً نگرانی خود را شرح دهید' : 'Please describe your concern'}
              </label>
              {reportError ? <FeedbackBanner className="mb-3" variant="error" message={reportError} /> : null}
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                rows={6}
                className="w-full p-3 rounded-lg border bg-background resize-none"
                placeholder={isRTL 
                  ? 'چه اتفاقی افتاده? چه کسی درگیر است؟ چه کمکی لازم دارید؟'
                  : 'What happened? Who is involved? What help do you need?'}
              />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportText('');
                }}
                className="flex-1 rounded-lg border px-4 py-2 hover:bg-muted"
              >
                {isRTL ? 'انصراف' : 'Cancel'}
              </button>
              <button
                onClick={handleSubmitAnonymousReport}
                disabled={isSubmittingReport || !reportText.trim()}
                className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {isSubmittingReport ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    {isRTL ? 'در حال ارسال...' : 'Sending...'}
                  </span>
                ) : (
                  isRTL ? 'ارسال گزارش' : 'Submit Report'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </StudentShell>
  );
}
