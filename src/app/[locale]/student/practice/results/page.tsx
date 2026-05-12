'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { StudentShell } from '@/components/layout/StudentShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Target, TrendingUp, Clock, ArrowLeft, RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react';

interface PracticeResultPayload {
  skillId?: string;
  summary?: {
    questionsAttempted: number;
    questionsCorrect: number;
    accuracy: number;
    masteryGain: number;
    xpEarned: number;
    timeSpent: number;
  };
  recommendations?: {
    shouldContinue: boolean;
    nextSkill: string | null;
    message: string;
    messageFA: string;
  };
}

export default function PracticeResultsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const sessionId = searchParams.get('sessionId');
  const [result, setResult] = useState<PracticeResultPayload | null>(null);

  useEffect(() => {
    if (!sessionId || typeof window === 'undefined') {
      return;
    }

    const stored = window.sessionStorage.getItem(`practice-result:${sessionId}`);
    if (stored) {
      try {
        setResult(JSON.parse(stored) as PracticeResultPayload);
      } catch {
        setResult(null);
      }
    }
  }, [sessionId]);

  const summary = result?.summary;
  const recommendation = result?.recommendations;

  if (!sessionId || !summary) {
    return (
      <StudentShell locale={locale}>
        <div className="mx-auto max-w-2xl p-4 sm:p-6">
          <Card className="rounded-3xl p-8 text-center">
            <h1 className="text-2xl font-bold">
              {locale === 'fa' ? 'نتیجه تمرین در دسترس نیست' : 'Practice result is unavailable'}
            </h1>
            <p className="mt-3 text-sm text-gray-600">
              {locale === 'fa'
                ? 'خلاصه این جلسه پیدا نشد. می‌توانید به فهرست مهارت‌ها برگردید و دوباره تمرین را شروع کنید.'
                : 'This session summary could not be found. You can return to the skills list and start again.'}
            </p>
            <Button className="mt-6" onClick={() => router.push(`/${locale}/student/skills`)}>
              {locale === 'fa' ? 'بازگشت به مهارت‌ها' : 'Back to skills'}
            </Button>
          </Card>
        </div>
      </StudentShell>
    );
  }

  const minutes = Math.floor(summary.timeSpent / 60);
  const seconds = summary.timeSpent % 60;

  return (
    <StudentShell locale={locale}>
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Button variant="secondary" size="sm" className="mb-4 bg-white/15 text-white hover:bg-white/20" onClick={() => router.push(`/${locale}/student/skills`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {locale === 'fa' ? 'بازگشت به مهارت‌ها' : 'Back to skills'}
              </Button>
              <h1 className="text-3xl font-bold sm:text-4xl">{locale === 'fa' ? 'خلاصه تمرین' : 'Practice summary'}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
                {locale === 'fa'
                  ? 'خروجی این صفحه بازطراحی شده تا نتیجه تمرین فقط یک گزارش خشک نباشد؛ حالا مسیر بعدی، انرژی جلسه و دستاورد تو را روشن‌تر نشان می‌دهد.'
                  : 'This redesigned summary makes the end of practice feel motivating, with clearer insight into momentum, growth, and what to do next.'}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm text-white/90 backdrop-blur">
              <Sparkles className="h-4 w-4" />
              {recommendation ? (locale === 'fa' ? recommendation.messageFA : recommendation.message) : (locale === 'fa' ? 'جلسه با موفقیت ثبت شد' : 'Session saved successfully')}
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">{locale === 'fa' ? 'دقت' : 'Accuracy'}</p>
                <p className="text-2xl font-bold">{summary.accuracy}%</p>
              </div>
            </div>
          </Card>
          <Card className="rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">{locale === 'fa' ? 'رشد تسلط' : 'Mastery gain'}</p>
                <p className="text-2xl font-bold">{summary.masteryGain}%</p>
              </div>
            </div>
          </Card>
          <Card className="rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">XP</p>
                <p className="text-2xl font-bold">{summary.xpEarned}</p>
              </div>
            </div>
          </Card>
          <Card className="rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-violet-600" />
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">{locale === 'fa' ? 'زمان' : 'Time spent'}</p>
                <p className="text-2xl font-bold">{minutes}:{seconds.toString().padStart(2, '0')}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="rounded-[2rem] p-6 shadow-sm">
            <h2 className="text-xl font-semibold">{locale === 'fa' ? 'جمع‌بندی جلسه' : 'Session overview'}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-gray-500">{locale === 'fa' ? 'سوال‌های پاسخ داده شده' : 'Questions answered'}</p>
                <p className="mt-1 text-2xl font-bold">{summary.questionsAttempted}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-gray-500">{locale === 'fa' ? 'پاسخ‌های درست' : 'Correct answers'}</p>
                <p className="mt-1 text-2xl font-bold">{summary.questionsCorrect}</p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">{locale === 'fa' ? 'برداشت از این جلسه' : 'What this session says'}</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-900/90">
                    {summary.accuracy >= 80
                      ? locale === 'fa'
                        ? 'پاسخ‌های تو نشان می‌دهد که روی این مهارت در مسیر درستی هستی؛ حالا یک مرور هدفمند می‌تواند تسلط را محکم‌تر کند.'
                        : 'Your answers show strong momentum on this skill; a focused follow-up set can turn that into lasting mastery.'
                      : locale === 'fa'
                        ? 'هنوز جا برای تثبیت وجود دارد، اما داده‌های این جلسه دقیقاً نشان می‌دهند که باید روی چه نوع سوال‌هایی بیشتر تمرکز کنی.'
                        : 'There is still room to stabilize the skill, but this session gives a clear signal about where more deliberate practice will help most.'}
                  </p>
                </div>
              </div>
            </div>

            {recommendation ? (
              <div className="mt-6 rounded-3xl border border-primary/20 bg-primary/5 p-5">
                <p className="text-sm font-medium text-primary">{locale === 'fa' ? 'پیشنهاد گام بعدی' : 'Recommended next step'}</p>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {locale === 'fa' ? recommendation.messageFA : recommendation.message}
                </p>
              </div>
            ) : null}
          </Card>

          <Card className="rounded-[2rem] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <div>
                <h2 className="font-semibold text-slate-900">{locale === 'fa' ? 'اقدام بعدی' : 'Next actions'}</h2>
                <p className="text-sm text-slate-500">{locale === 'fa' ? 'همین حالا مسیرت را ادامه بده' : 'Keep the momentum going right now'}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {result?.skillId ? (
                <Button className="w-full" onClick={() => router.push(`/${locale}/student/practice/${result.skillId}`)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {locale === 'fa' ? 'تمرین دوباره همین مهارت' : 'Practice this skill again'}
                </Button>
              ) : null}
              <Button variant="outline" className="w-full" onClick={() => router.push(`/${locale}/student/skills`)}>
                {locale === 'fa' ? 'بازگشت به مهارت‌ها' : 'Back to skills'}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push(`/${locale}/dashboard`)}>
                {locale === 'fa' ? 'بازگشت به داشبورد' : 'Return to dashboard'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </StudentShell>
  );
}
