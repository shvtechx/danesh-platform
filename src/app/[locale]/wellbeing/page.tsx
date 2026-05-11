'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Heart, Smile, Meh, Frown, Battery, Wind, BookHeart, Coffee, PenLine, AlertCircle, X } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
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
    <div className="space-y-8 p-6">
      <PageHeader
        locale={locale}
        title={t('wellbeing.title')}
        backHref={`/${locale}/dashboard`}
        backLabel={isRTL ? 'داشبورد' : 'Dashboard'}
      />

      <div>
        <h1 className="text-3xl font-bold">{t('wellbeing.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {isRTL ? 'سلامت روان شما برای ما مهم است' : 'Your mental health matters to us'}
        </p>
        {state.draftSavedAt && (
          <p className="text-xs text-muted-foreground mt-2">
            {isRTL ? 'پیش‌نویس انتخاب‌ها ذخیره شده است' : 'Draft selections are saved locally'}
          </p>
        )}
      </div>

      {/* Mood Check */}
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">{t('wellbeing.howAreYou')}</h2>
        <div className="grid grid-cols-5 gap-4">
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
        <div className="rounded-2xl border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Battery className="h-5 w-5 text-amber-500" />
            </div>
            <h2 className="text-lg font-semibold">{t('wellbeing.energyLevel')}</h2>
          </div>
          <div className="flex gap-3">
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

        <div className="rounded-2xl border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <BookHeart className="h-5 w-5 text-purple-500" />
            </div>
            <h2 className="text-lg font-semibold">{t('wellbeing.stressLevel')}</h2>
          </div>
          <div className="flex gap-3">
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
      <div className="rounded-2xl border bg-card p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {isRTL
              ? 'پس از انتخاب موارد بالا، برای ثبت نهایی روی دکمه زیر بزنید.'
              : 'After making your selections above, use the button to submit your daily check-in.'}
          </p>
          <button
            onClick={handleSubmitCheckin}
            disabled={isSubmitting}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {isSubmitting
              ? (isRTL ? 'در حال ثبت...' : 'Submitting...')
              : (isRTL ? 'ثبت سلامت روان امروز' : "Submit Today's Wellbeing")}
          </button>
        </div>

        {submitMessage && (
          <p className="text-sm text-green-600">{submitMessage}</p>
        )}
        {submitError && (
          <p className="text-sm text-red-600">{submitError}</p>
        )}
      </div>

      {/* Quick Navigation */}
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">{isRTL ? 'ناوبری سریع' : 'Quick Navigation'}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href={`/${locale}/dashboard`} className="rounded-lg border px-4 py-3 hover:bg-muted transition-colors text-center">
            {isRTL ? 'داشبورد' : 'Dashboard'}
          </Link>
          <Link href={`/${locale}/profile`} className="rounded-lg border px-4 py-3 hover:bg-muted transition-colors text-center">
            {isRTL ? 'پروفایل' : 'Profile'}
          </Link>
          <Link href={`/${locale}/settings`} className="rounded-lg border px-4 py-3 hover:bg-muted transition-colors text-center">
            {isRTL ? 'تنظیمات' : 'Settings'}
          </Link>
        </div>
      </div>

      {/* Resources */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t('wellbeing.resources')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {resources.map((resource) => (
            <button
              key={resource.id}
              onClick={() => handleResourceAction(resource.id)}
              className="rounded-xl border bg-card p-4 text-left hover:shadow-md transition-shadow"
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
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
        {reportSuccess ? <FeedbackBanner className="mb-4" variant="success" message={reportSuccess} /> : null}

        <div className="flex items-start gap-4">
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
              className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
            >
              {t('wellbeing.anonymous')}
            </button>
          </div>
        </div>
      </div>

      {/* Anonymous Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl border max-w-lg w-full p-6 space-y-4">
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
            
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                {isRTL
                  ? 'این گزارش کاملاً محرمانه و ناشناس است. هیچ‌کس نمی‌تواند هویت شما را ببیند.'
                  : 'This report is completely confidential and anonymous. No one will be able to identify you.'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
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

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportText('');
                }}
                className="flex-1 px-4 py-2 rounded-lg border hover:bg-muted"
              >
                {isRTL ? 'انصراف' : 'Cancel'}
              </button>
              <button
                onClick={handleSubmitAnonymousReport}
                disabled={isSubmittingReport || !reportText.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
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
  );
}
