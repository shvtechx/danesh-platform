'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, BookOpen, Heart, Sparkles, Target } from 'lucide-react';
import { getHomeRouteForRoles } from '@/lib/auth/demo-auth-shared';

type AuthUser = {
  id?: string;
  email?: string;
  roles?: string[];
  profile?: {
    displayName?: string;
    firstName?: string;
  };
};

export default function OnboardingPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const router = useRouter();
  const isRTL = locale === 'fa';
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const rawUser = window.localStorage.getItem('danesh.auth.user');
      if (!rawUser) {
        return;
      }

      setAuthUser(JSON.parse(rawUser) as AuthUser);
    } catch {
      setAuthUser(null);
    }
  }, []);

  const destination = useMemo(
    () => getHomeRouteForRoles(locale, authUser?.roles || []),
    [authUser?.roles, locale],
  );

  const displayName = authUser?.profile?.displayName || authUser?.profile?.firstName || (isRTL ? 'دوست عزیز' : 'Learner');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-sky-50 dark:from-slate-950 dark:via-background dark:to-slate-900">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-4 py-12">
        <div className="rounded-3xl border bg-card/95 p-8 shadow-xl backdrop-blur sm:p-10">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
            <Sparkles className="h-4 w-4" />
            <span>{isRTL ? 'حساب شما آماده است' : 'Your account is ready'}</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {isRTL ? `خوش آمدید، ${displayName}` : `Welcome, ${displayName}`}
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              {isRTL
                ? 'حساب شما با موفقیت ایجاد شد. اکنون می‌توانید یادگیری را شروع کنید، دوره‌ها را مرور کنید و تنظیمات شخصی خود را کامل کنید.'
                : 'Your account has been created successfully. You can now start learning, review your courses, and complete your personal setup.'}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: isRTL ? 'مسیر یادگیری' : 'Learning path',
                description: isRTL ? 'دوره‌ها و فعالیت‌های مناسب خود را مرور کنید.' : 'Review the courses and activities prepared for you.',
              },
              {
                icon: Target,
                title: isRTL ? 'گام بعدی' : 'Next step',
                description: isRTL ? 'پروفایل و تنظیمات دسترسی‌پذیری خود را کامل کنید.' : 'Complete your profile and accessibility preferences.',
              },
              {
                icon: Heart,
                title: isRTL ? 'سلامت و انگیزه' : 'Wellbeing and motivation',
                description: isRTL ? 'از ابزارهای سلامت روان و بازی‌وارسازی استفاده کنید.' : 'Use wellbeing and gamified support tools from day one.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border bg-background/80 p-5">
                <item.icon className="mb-3 h-5 w-5 text-primary" />
                <h2 className="font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push(destination)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
            >
              <span>{isRTL ? 'ورود به داشبورد' : 'Go to dashboard'}</span>
              <ArrowRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
            <Link href={`/${locale}/courses`} className="inline-flex items-center justify-center rounded-xl border px-6 py-3 hover:bg-muted">
              {isRTL ? 'مرور دوره‌ها' : 'Browse courses'}
            </Link>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            {t('common.appName')} · {authUser?.email || (isRTL ? 'کاربر جدید' : 'New account')}
          </p>
        </div>
      </div>
    </div>
  );
}