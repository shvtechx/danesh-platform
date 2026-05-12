'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  User,
  Phone,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { persistAuthSession } from '@/lib/auth/demo-auth-shared';

// Registration steps
type Step = 'type' | 'stream' | 'grade' | 'info';

// Schemas
const userTypeSchema = z.enum(['student', 'parent', 'teacher']);
const streamSchema = z.enum(['iranian', 'international']);
const gradeSchema = z.object({
  band: z.enum(['early-years', 'primary', 'middle', 'secondary']),
  grade: z.string(),
});

const infoSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type InfoFormData = z.infer<typeof infoSchema>;

const GRADE_OPTIONS = {
  'early-years': ['KG1', 'KG2', 'KG3'],
  primary: ['1', '2', '3', '4', '5', '6'],
  middle: ['7', '8', '9'],
  secondary: ['10', '11', '12'],
};

const GRADE_OPTIONS_FA = {
  'early-years': ['پیش‌دبستان ۱', 'پیش‌دبستان ۲', 'پیش‌دبستان ۳'],
  primary: ['اول', 'دوم', 'سوم', 'چهارم', 'پنجم', 'ششم'],
  middle: ['هفتم', 'هشتم', 'نهم'],
  secondary: ['دهم', 'یازدهم', 'دوازدهم'],
};

export default function RegisterPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const router = useRouter();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ChevronLeft : ChevronRight;
  const BackArrow = isRTL ? ChevronRight : ChevronLeft;

  const [step, setStep] = useState<Step>('type');
  const [userType, setUserType] = useState<'student' | 'parent' | 'teacher' | null>(null);
  const [stream, setStream] = useState<'iranian' | 'international' | null>(null);
  const [gradeBand, setGradeBand] = useState<'early-years' | 'primary' | 'middle' | 'secondary' | null>(null);
  const [grade, setGrade] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InfoFormData>({
    resolver: zodResolver(infoSchema),
  });

  const handleTypeSelect = (type: 'student' | 'parent' | 'teacher') => {
    setUserType(type);
    if (type === 'teacher') {
      setStep('info'); // Teachers skip grade selection
    } else {
      setStep('stream');
    }
  };

  const handleStreamSelect = (selected: 'iranian' | 'international') => {
    setStream(selected);
    if (userType === 'parent') {
      setStep('info'); // Parents skip grade selection
    } else {
      setStep('grade');
    }
  };

  const handleGradeSelect = (band: typeof gradeBand, selectedGrade: string) => {
    setGradeBand(band);
    setGrade(selectedGrade);
    setStep('info');
  };

  const onSubmit = async (data: InfoFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          userType,
          stream,
          gradeBand,
          grade,
          locale,
        }),
      });

      if (!response.ok) throw new Error('Registration failed');

      const result = await response.json();
      if (typeof window !== 'undefined' && result?.user?.id) {
        persistAuthSession(result.user);
      }

      router.push(`/${locale}/onboarding`);
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'stream') setStep('type');
    else if (step === 'grade') setStep('stream');
    else if (step === 'info') {
      if (userType === 'teacher') setStep('type');
      else if (userType === 'parent') setStep('stream');
      else setStep('grade');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center justify-center gap-2 mb-6">
          <GraduationCap className="h-10 w-10 text-primary" />
          <span className="text-3xl font-bold text-primary">{t('common.appName')}</span>
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="text-center relative">
            {step !== 'type' && (
              <button
                onClick={goBack}
                className="absolute left-4 top-4 p-2 rounded-lg hover:bg-muted transition rtl:left-auto rtl:right-4"
              >
                <BackArrow className="h-5 w-5" />
              </button>
            )}
            <CardTitle className="text-2xl">{t('auth.signUp')}</CardTitle>
            <CardDescription>
              {step === 'type' && t('onboarding.selectRole')}
              {step === 'stream' && t('onboarding.selectStream')}
              {step === 'grade' && t('onboarding.selectGrade')}
              {step === 'info' && (isRTL ? 'اطلاعات حساب کاربری' : 'Account Information')}
            </CardDescription>
            
            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {['type', 'stream', 'grade', 'info'].map((s, i) => (
                <div
                  key={s}
                  className={`h-2 w-2 rounded-full transition-all ${
                    step === s ? 'bg-primary w-4' : 
                    ['type', 'stream', 'grade', 'info'].indexOf(step) > i ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </CardHeader>

          <CardContent>
            {/* Step 1: User Type Selection */}
            {step === 'type' && (
              <div className="grid gap-4">
                <button
                  onClick={() => handleTypeSelect('student')}
                  className="flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-muted/50 hover:border-primary hover:bg-primary/5 transition text-start rtl:text-end"
                >
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                    🎓
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('onboarding.student')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? 'می‌خواهم یاد بگیرم و مهارت‌هایم را تقویت کنم' : 'I want to learn and improve my skills'}
                    </p>
                  </div>
                  <Arrow className="h-5 w-5 mr-auto rtl:ml-auto rtl:mr-0 text-muted-foreground" />
                </button>

                <button
                  onClick={() => handleTypeSelect('parent')}
                  className="flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-muted/50 hover:border-primary hover:bg-primary/5 transition text-start rtl:text-end"
                >
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">
                    👨‍👩‍👧
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('onboarding.parent')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? 'می‌خواهم پیشرفت فرزندم را دنبال کنم' : 'I want to track my child\'s progress'}
                    </p>
                  </div>
                  <Arrow className="h-5 w-5 mr-auto rtl:ml-auto rtl:mr-0 text-muted-foreground" />
                </button>

                <button
                  onClick={() => handleTypeSelect('teacher')}
                  className="flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-muted/50 hover:border-primary hover:bg-primary/5 transition text-start rtl:text-end"
                >
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl">
                    👩‍🏫
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('onboarding.teacher')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? 'می‌خواهم دانش‌آموزان را آموزش دهم' : 'I want to teach and mentor students'}
                    </p>
                  </div>
                  <Arrow className="h-5 w-5 mr-auto rtl:ml-auto rtl:mr-0 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Step 2: Stream Selection */}
            {step === 'stream' && (
              <div className="grid gap-4">
                <button
                  onClick={() => handleStreamSelect('iranian')}
                  className="p-6 rounded-xl border-2 border-transparent bg-gradient-to-br from-green-50 to-emerald-100 hover:border-green-500 transition text-start rtl:text-end"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🇮🇷</span>
                    <h3 className="text-xl font-bold">{t('onboarding.iranianStream')}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('onboarding.iranianStreamDesc')}
                  </p>
                </button>

                <button
                  onClick={() => handleStreamSelect('international')}
                  className="p-6 rounded-xl border-2 border-transparent bg-gradient-to-br from-blue-50 to-indigo-100 hover:border-blue-500 transition text-start rtl:text-end"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🌍</span>
                    <h3 className="text-xl font-bold">{t('onboarding.internationalStream')}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('onboarding.internationalStreamDesc')}
                  </p>
                </button>
              </div>
            )}

            {/* Step 3: Grade Selection */}
            {step === 'grade' && (
              <div className="space-y-6">
                {(Object.keys(GRADE_OPTIONS) as Array<keyof typeof GRADE_OPTIONS>).map((band) => (
                  <div key={band} className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      {band === 'early-years' && (isRTL ? 'پیش‌دبستان' : 'Early Years (KG)')}
                      {band === 'primary' && (isRTL ? 'دبستان' : 'Primary (1-6)')}
                      {band === 'middle' && (isRTL ? 'متوسطه اول' : 'Middle (7-9)')}
                      {band === 'secondary' && (isRTL ? 'متوسطه دوم' : 'Secondary (10-12)')}
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {(isRTL ? GRADE_OPTIONS_FA : GRADE_OPTIONS)[band].map((g, idx) => (
                        <button
                          key={g}
                          onClick={() => handleGradeSelect(band, GRADE_OPTIONS[band][idx])}
                          className={`p-3 rounded-lg border-2 font-medium transition hover:border-primary hover:bg-primary/5 ${
                            band === 'early-years' ? 'bg-pink-50 border-pink-200' :
                            band === 'primary' ? 'bg-blue-50 border-blue-200' :
                            band === 'middle' ? 'bg-purple-50 border-purple-200' :
                            'bg-green-50 border-green-200'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 4: Account Information */}
            {step === 'info' && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('auth.firstName')}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
                      <input
                        {...register('firstName')}
                        placeholder={isRTL ? 'نام' : 'First'}
                        className="w-full h-10 pl-10 pr-4 rtl:pl-4 rtl:pr-10 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-xs text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('auth.lastName')}</label>
                    <input
                      {...register('lastName')}
                      placeholder={isRTL ? 'نام خانوادگی' : 'Last'}
                      className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    {errors.lastName && (
                      <p className="text-xs text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('auth.email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
                    <input
                      {...register('email')}
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      className="w-full h-10 pl-10 pr-4 rtl:pl-4 rtl:pr-10 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone (Optional) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {isRTL ? 'شماره تلفن (اختیاری)' : 'Phone (Optional)'}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
                    <input
                      {...register('phone')}
                      type="tel"
                      placeholder={isRTL ? '+۹۸ ۹۱۲ ۱۲۳ ۴۵۶۷' : '+1 234 567 8900'}
                      className="w-full h-10 pl-10 pr-4 rtl:pl-4 rtl:pr-10 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('auth.password')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.passwordPlaceholder')}
                      className="w-full h-10 pl-10 pr-10 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rtl:left-3 rtl:right-auto"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('auth.confirmPassword')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
                    <input
                      {...register('confirmPassword')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isRTL ? 'تکرار رمز عبور' : 'Confirm password'}
                      className="w-full h-10 pl-10 pr-4 rtl:pl-4 rtl:pr-10 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Terms */}
                <p className="text-xs text-muted-foreground">
                  {isRTL ? (
                    <>با ثبت‌نام، <Link href={`/${locale}/terms`} className="text-primary hover:underline">شرایط استفاده</Link> و <Link href={`/${locale}/privacy`} className="text-primary hover:underline">سیاست حفظ حریم خصوصی</Link> را می‌پذیرید.</>
                  ) : (
                    <>By signing up, you agree to our <Link href={`/${locale}/terms`} className="text-primary hover:underline">Terms</Link> and <Link href={`/${locale}/privacy`} className="text-primary hover:underline">Privacy Policy</Link>.</>
                  )}
                </p>

                {/* Submit */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />
                      {t('common.loading')}
                    </>
                  ) : (
                    t('auth.signUp')
                  )}
                </Button>
              </form>
            )}

            {/* Login Link */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t('auth.haveAccount')}{' '}
              <Link href={`/${locale}/login`} className="text-primary font-medium hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Language Toggle */}
        <div className="mt-6 text-center">
          <Link
            href={locale === 'en' ? '/fa/register' : '/en/register'}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {locale === 'en' ? 'فارسی' : 'English'}
          </Link>
        </div>
      </div>
    </div>
  );
}
