import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Globe,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
} from 'lucide-react';

const copy = {
  en: {
    brand: 'Danesh',
    eyebrow: 'Bilingual K-12 learning platform',
    title: 'Learning that feels modern, calm, and motivating.',
    subtitle:
      'A polished online school experience with adaptive learning, wellbeing support, Persian and English content, and game-inspired progress.',
    primaryCta: 'Get started',
    secondaryCta: 'Login',
    stat1: '12+ learning paths',
    stat2: 'EN / FA experience',
    stat3: 'Wellbeing-first design',
    feature1Title: 'Adaptive learning',
    feature1Text: 'Structured lessons and progression built for different grade bands and learner needs.',
    feature2Title: 'Bilingual by design',
    feature2Text: 'A clean English and Persian experience with RTL support and culturally aware presentation.',
    feature3Title: 'Motivation built in',
    feature3Text: 'Rewards, streaks, progress tracking, and encouraging feedback that keep students engaged.',
    feature4Title: 'Safe and supportive',
    feature4Text: 'Trauma-aware, student-friendly experience with wellbeing check-ins and accessible layouts.',
    panelTitle: 'Why families choose Danesh',
    panelText:
      'Balanced visuals, strong structure, and learner-friendly flows make the platform feel credible and enjoyable from the first screen.',
    cardA: 'Interactive lessons',
    cardB: 'Progress dashboards',
    cardC: 'Community + support',
  },
  fa: {
    brand: 'دانش',
    eyebrow: 'پلتفرم آموزشی دوزبانه K-12',
    title: 'یادگیری مدرن، آرام و انگیزه‌بخش.',
    subtitle:
      'یک تجربه آموزشی آنلاین حرفه‌ای با یادگیری تطبیقی، پشتیبانی سلامت روان، محتوای فارسی و انگلیسی و مسیر پیشرفت بازی‌وار.',
    primaryCta: 'شروع کنید',
    secondaryCta: 'ورود',
    stat1: 'بیش از ۱۲ مسیر یادگیری',
    stat2: 'تجربه فارسی / انگلیسی',
    stat3: 'طراحی مبتنی بر آرامش ذهنی',
    feature1Title: 'یادگیری تطبیقی',
    feature1Text: 'درس‌ها و مسیرهای پیشرفت متناسب با پایه‌های مختلف و نیازهای متنوع یادگیرندگان.',
    feature2Title: 'دوزبانه از پایه',
    feature2Text: 'تجربه‌ای تمیز و حرفه‌ای در فارسی و انگلیسی با پشتیبانی کامل RTL.',
    feature3Title: 'انگیزه‌سازی درون‌ساخت',
    feature3Text: 'پاداش، استریک، پیگیری پیشرفت و بازخوردهای دلگرم‌کننده برای حفظ مشارکت دانش‌آموز.',
    feature4Title: 'ایمن و حمایت‌گر',
    feature4Text: 'تجربه‌ای دانش‌آموزمحور با توجه به سلامت روان، دسترس‌پذیری و آرامش ذهنی.',
    panelTitle: 'چرا خانواده‌ها دانش را انتخاب می‌کنند',
    panelText:
      'ترکیب تعادل بصری، ساختار قوی و جریان‌های کاربرپسند باعث می‌شود پلتفرم از همان نگاه اول حرفه‌ای و دلنشین باشد.',
    cardA: 'درس‌های تعاملی',
    cardB: 'داشبورد پیشرفت',
    cardC: 'جامعه و پشتیبانی',
  },
} as const;

export default function HomePage({ params: { locale } }: { params: { locale: string } }) {
  const isRTL = locale === 'fa';
  const text = copy[isRTL ? 'fa' : 'en'];

  const features = [
    { icon: Brain, title: text.feature1Title, text: text.feature1Text },
    { icon: Globe, title: text.feature2Title, text: text.feature2Text },
    { icon: Trophy, title: text.feature3Title, text: text.feature3Text },
    { icon: ShieldCheck, title: text.feature4Title, text: text.feature4Text },
  ];

  const cards = [
    { icon: BookOpen, label: text.cardA },
    { icon: Star, label: text.cardB },
    { icon: Users, label: text.cardC },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.25),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#0f172a_48%,_#111827_100%)]" />
      <div className="absolute left-[-8rem] top-12 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="absolute bottom-[-4rem] right-[-3rem] h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 lg:px-8">
        <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
          <Link href={`/${locale}`} className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/30">
              <GraduationCap className="h-6 w-6" />
            </span>
            <div>
              <span className="block text-xs uppercase tracking-[0.3em] text-emerald-300/80">{text.eyebrow}</span>
              <span className="block text-xl font-semibold">{text.brand}</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={locale === 'en' ? '/fa' : '/en'}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              {locale === 'en' ? 'فارسی' : 'English'}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              {text.secondaryCta}
            </Link>
          </div>
        </header>

        <main className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
          <section className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
              <Sparkles className="h-4 w-4" />
              {text.eyebrow}
            </div>

            <h1 className="mt-6 text-5xl font-bold leading-tight text-white md:text-6xl">
              {text.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
              {text.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`/${locale}/register`}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-600 hover:to-teal-600"
              >
                {text.primaryCta}
                <ArrowRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
              <Link
                href={`/${locale}/login`}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-base font-semibold text-slate-100 backdrop-blur-md transition hover:bg-white/10"
              >
                {text.secondaryCta}
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[text.stat1, text.stat2, text.stat3].map((item) => (
                <div key={item} className="rounded-3xl border border-white/10 bg-white/5 px-4 py-5 text-sm font-medium text-slate-200 backdrop-blur-md">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/8 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />
              <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-sky-400/15 blur-2xl" />

              <div className="relative rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-400">{text.panelTitle}</p>
                    <h2 className="mt-2 text-2xl font-bold text-white">{text.brand}</h2>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/25">
                    <HeartHandshake className="h-7 w-7" />
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-300">{text.panelText}</p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {cards.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm">
                      <item.icon className="mx-auto mb-3 h-5 w-5 text-emerald-300" />
                      <p className="text-sm text-slate-200">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {features.map((feature) => (
                  <div key={feature.title} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                    <feature.icon className="mb-4 h-6 w-6 text-emerald-300" />
                    <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{feature.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
