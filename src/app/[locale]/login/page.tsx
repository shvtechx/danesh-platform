'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Stars,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getHomeRouteForRoles, persistAuthSession } from '@/lib/auth/demo-auth-shared';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const copy = {
  en: {
    brand: 'Danesh',
    title: 'Welcome back',
    subtitle: 'Sign in to continue your learning journey with a calmer, more focused experience.',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'Enter your password',
    invalidCredentials: 'Invalid email or password',
    heroEyebrow: 'Bilingual learning platform',
    heroTitle: 'A brighter learning space for every student',
    heroText: 'Structured lessons, gentle visuals, gamified motivation, and wellbeing-first support in one place.',
    feature1: 'Interactive and distraction-light learning flow',
    feature2: 'Persian and English experience with RTL support',
    feature3: 'Progress, goals, and motivation built in',
    statLabel: 'Active learning paths',
    statValue: '12+',
    login: 'Login',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    signUp: 'Create account',
    continueWith: 'Or continue with',
    secureAccess: 'Secure sign-in',
    language: 'فارسی',
    google: 'Google',
    apple: 'Apple',
  },
  fa: {
    brand: 'دانش',
    title: 'خوش برگشتید',
    subtitle: 'برای ادامه مسیر یادگیری، با تجربه‌ای آرام‌تر و متمرکزتر وارد شوید.',
    emailLabel: 'ایمیل',
    passwordLabel: 'رمز عبور',
    emailPlaceholder: 'example@domain.com',
    passwordPlaceholder: 'رمز عبور خود را وارد کنید',
    invalidCredentials: 'ایمیل یا رمز عبور نادرست است',
    heroEyebrow: 'پلتفرم آموزشی دو زبانه',
    heroTitle: 'فضایی روشن‌تر و جذاب‌تر برای یادگیری',
    heroText: 'درس‌های ساختاریافته، طراحی آرام، انگیزه‌بخشی بازی‌وار و پشتیبانی سلامت روان در یک محیط واحد.',
    feature1: 'مسیر یادگیری تعاملی با حواس‌پرتی کمتر',
    feature2: 'تجربه فارسی و انگلیسی با پشتیبانی کامل RTL',
    feature3: 'پیشرفت، هدف‌گذاری و انگیزه در یک جا',
    statLabel: 'مسیرهای یادگیری فعال',
    statValue: '+۱۲',
    login: 'ورود',
    forgotPassword: 'رمز عبور را فراموش کرده‌اید؟',
    noAccount: 'حساب ندارید؟',
    signUp: 'ایجاد حساب',
    continueWith: 'یا ادامه با',
    secureAccess: 'ورود امن',
    language: 'English',
    google: 'گوگل',
    apple: 'اپل',
  },
} as const;

export default function LoginPage({ params: { locale } }: { params: { locale: string } }) {
  const router = useRouter();
  const isRTL = locale === 'fa';
  const text = copy[isRTL ? 'fa' : 'en'];

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const result = await response.json();
      if (typeof window !== 'undefined' && result?.user?.id) {
        persistAuthSession(result.user);
        localStorage.removeItem('danesh.auth.originalUser');
      }

      router.push(getHomeRouteForRoles(locale, result?.user?.roles || []));
    } catch {
      setError(text.invalidCredentials);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'apple') => {
    setError(
      isRTL
        ? `ورود با ${provider === 'google' ? text.google : text.apple} در این محیط فعال نیست. لطفاً با ایمیل و رمز عبور وارد شوید.`
        : `${provider === 'google' ? text.google : text.apple} sign-in is not configured in this workspace. Please use your email and password.`
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.22),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)]" />
      <div className="absolute left-[-8rem] top-16 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="absolute bottom-0 right-[-6rem] h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <section className="hidden lg:block">
          <div className="max-w-xl space-y-8">
            <Link href={`/${locale}`} className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/30">
                <GraduationCap className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-xs uppercase tracking-[0.35em] text-emerald-300/80">{text.heroEyebrow}</span>
                <span className="block text-2xl font-semibold">{text.brand}</span>
              </span>
            </Link>

            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
                <Sparkles className="h-4 w-4" />
                {text.secureAccess}
              </div>
              <h1 className="text-5xl font-bold leading-tight text-white">{text.heroTitle}</h1>
              <p className="max-w-lg text-lg leading-8 text-slate-300">{text.heroText}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: BookOpen, label: text.feature1 },
                { icon: ShieldCheck, label: text.feature2 },
                { icon: Stars, label: text.feature3 },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <item.icon className="mb-4 h-6 w-6 text-emerald-300" />
                  <p className="text-sm leading-6 text-slate-200">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-emerald-400/20 blur-2xl" />
              <div className="relative flex items-end justify-between gap-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-400">{text.statLabel}</p>
                  <p className="mt-3 text-5xl font-bold text-white">{text.statValue}</p>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-emerald-200">
                  <ArrowRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                  <span className="text-sm font-medium">{text.secureAccess}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full">
          <div className="mx-auto w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-white/95 text-slate-900 shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur-2xl dark:bg-slate-900/90 dark:text-slate-100">
            <div className="border-b border-slate-200/70 bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-6 text-white dark:border-white/10">
              <div className="mb-5 flex items-center justify-between">
                <Link href={`/${locale}`} className="inline-flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                    <GraduationCap className="h-6 w-6" />
                  </span>
                  <span className="text-2xl font-bold">{text.brand}</span>
                </Link>

                <Link
                  href={locale === 'en' ? '/fa/login' : '/en/login'}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white/95 transition hover:bg-white/20"
                >
                  {text.language}
                </Link>
              </div>

              <h2 className="text-3xl font-bold">{text.title}</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/85">{text.subtitle}</p>
            </div>

            <div className="space-y-6 px-6 py-7 sm:px-8 sm:py-8">
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{text.emailLabel}</label>
                  <div className="group relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-emerald-500 rtl:left-auto rtl:right-4" />
                    <input
                      {...register('email')}
                      type="email"
                      placeholder={text.emailPlaceholder}
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-emerald-500/10 rtl:pl-4 rtl:pr-12"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{text.passwordLabel}</label>
                    <Link href={`/${locale}/forgot-password`} className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">
                      {text.forgotPassword}
                    </Link>
                  </div>
                  <div className="group relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-emerald-500 rtl:left-auto rtl:right-4" />
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder={text.passwordPlaceholder}
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-emerald-500/10 rtl:pl-12 rtl:pr-12"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200 rtl:left-4 rtl:right-auto"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="h-14 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-600"
                  loading={isLoading}
                >
                  {text.login}
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 dark:bg-slate-900">
                      {text.continueWith}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button type="button" onClick={() => handleSocialLogin('google')} variant="outline" className="h-12 rounded-2xl border-slate-200 bg-white font-semibold dark:border-slate-700 dark:bg-slate-950" disabled={isLoading}>
                    <svg className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.69z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {text.google}
                  </Button>
                  <Button type="button" onClick={() => handleSocialLogin('apple')} variant="outline" className="h-12 rounded-2xl border-slate-200 bg-white font-semibold dark:border-slate-700 dark:bg-slate-950" disabled={isLoading}>
                    <svg className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15.23 1.75c0 1.32-.48 2.57-1.32 3.53-.9 1.02-2.36 1.8-3.65 1.7-.17-1.26.5-2.57 1.36-3.53.93-1.05 2.48-1.8 3.61-1.7zM19.96 17.2c-.55 1.26-.81 1.82-1.52 2.9-.99 1.52-2.39 3.41-4.12 3.43-1.54.01-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.98-1.72-.02-3.05-1.73-4.05-3.25C-.64 16.28-.7 9.39 2.64 7.34c1.19-.73 2.74-1.17 4.2-1.17 1.57 0 2.56 1 4.05 1 1.45 0 2.34-1 4.03-1 1.31 0 2.69.36 3.86 1.06-3.38 1.85-2.83 6.67 1.18 9.97z" />
                    </svg>
                    {text.apple}
                  </Button>
                </div>
              </form>

              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                {text.noAccount}{' '}
                <Link href={`/${locale}/register`} className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-300">
                  {text.signUp}
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-slate-400 lg:hidden">
            <span>{text.heroText}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
