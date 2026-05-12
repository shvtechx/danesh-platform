'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Trophy, Medal, Star, Crown, Target, Zap, Award, Flame } from 'lucide-react';
import { StudentShell } from '@/components/layout/StudentShell';
import { StudentPageHeader } from '@/components/layout/StudentPageHeader';

export default function AchievementsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';

  const achievements = [
    {
      id: '1',
      title: isRTL ? 'اولین قدم' : 'First Steps',
      description: isRTL ? 'اولین درس خود را تکمیل کنید' : 'Complete your first lesson',
      icon: Star,
      progress: 100,
      earned: true,
      xp: 50,
      rarity: 'common',
    },
    {
      id: '2',
      title: isRTL ? 'دانش‌آموز پرتلاش' : 'Dedicated Learner',
      description: isRTL ? '۷ روز متوالی یادگیری' : '7-day learning streak',
      icon: Flame,
      progress: 100,
      earned: true,
      xp: 100,
      rarity: 'uncommon',
    },
    {
      id: '3',
      title: isRTL ? 'استاد ریاضی' : 'Math Master',
      description: isRTL ? 'همه دروس ریاضی را تکمیل کنید' : 'Complete all math lessons',
      icon: Target,
      progress: 65,
      earned: false,
      xp: 200,
      rarity: 'rare',
    },
    {
      id: '4',
      title: isRTL ? 'نابغه' : 'Genius',
      description: isRTL ? 'در ۱۰ آزمون نمره کامل بگیرید' : 'Get perfect score in 10 quizzes',
      icon: Crown,
      progress: 30,
      earned: false,
      xp: 500,
      rarity: 'legendary',
    },
  ];

  const badges = [
    { id: '1', name: isRTL ? 'ستاره' : 'Star', icon: Star, earned: true },
    { id: '2', name: isRTL ? 'مدال' : 'Medal', icon: Medal, earned: true },
    { id: '3', name: isRTL ? 'جایزه' : 'Award', icon: Award, earned: false },
    { id: '4', name: isRTL ? 'تاج' : 'Crown', icon: Crown, earned: false },
  ];

  const rarityColors = {
    common: 'from-slate-400 to-slate-500',
    uncommon: 'from-green-400 to-emerald-500',
    rare: 'from-blue-400 to-indigo-500',
    legendary: 'from-amber-400 to-orange-500',
  };

  return (
    <StudentShell locale={locale}>
      <div className="space-y-6">
        <StudentPageHeader
          locale={locale}
          eyebrow={isRTL ? 'پیشرفت بازی‌وار' : 'Gamified progress'}
          title={t('gamification.achievements')}
          description={isRTL ? 'نشان‌ها، XP و دستاوردهای شما در یک نمای الهام‌بخش برای پیگیری رشد فردی نمایش داده می‌شوند.' : 'Badges, XP, and milestone achievements are gathered in one inspiring view for personal growth.'}
          stats={[
            { label: isRTL ? 'دستاورد کسب شده' : 'Achievements earned', value: '12', icon: Trophy, tone: 'primary', helper: isRTL ? 'از شروع ترم' : 'Since the start of term' },
            { label: isRTL ? 'نشان کسب شده' : 'Badges earned', value: '8', icon: Medal, tone: 'warning', helper: isRTL ? 'باز شده در این ماه' : 'Unlocked this month' },
            { label: t('gamification.xp'), value: '2,450', icon: Zap, tone: 'accent', helper: isRTL ? 'نزدیک به سطح بعدی' : 'Close to the next level' },
            { label: t('gamification.currentStreak'), value: '14', icon: Flame, tone: 'success', helper: isRTL ? 'تداوم یادگیری' : 'Consistent learning' },
          ]}
          actions={
            <Link href={`/${locale}/leaderboard`} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {isRTL ? 'مشاهده جدول رتبه‌بندی' : 'View leaderboard'}
            </Link>
          }
        />

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t('gamification.badges')}</h2>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {isRTL ? 'کلکسیون شما' : 'Your collection'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                {badges.map((badge) => (
                  <div key={badge.id} className={`rounded-3xl border p-4 text-center shadow-sm transition-transform hover:-translate-y-0.5 ${badge.earned ? 'bg-background' : 'bg-muted/40 opacity-70'}`}>
                    <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${badge.earned ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <badge.icon className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium">{badge.name}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{t('gamification.achievements')}</h2>
                <span className="text-sm text-muted-foreground">{isRTL ? 'اهداف فعال و تکمیل‌شده' : 'Active and completed milestones'}</span>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className={`rounded-3xl border p-5 ${achievement.earned ? 'bg-background' : 'bg-muted/30'}`}>
                    <div className="flex items-start gap-4">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${rarityColors[achievement.rarity as keyof typeof rarityColors]} ${achievement.earned ? '' : 'opacity-60'}`}>
                        <achievement.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-semibold">{achievement.title}</h3>
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">+{achievement.xp} XP</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{achievement.description}</p>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{isRTL ? 'پیشرفت' : 'Progress'}</span>
                            <span className="font-medium">{achievement.progress}%</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-muted">
                            <div className={`h-full rounded-full bg-gradient-to-r ${rarityColors[achievement.rarity as keyof typeof rarityColors]}`} style={{ width: `${achievement.progress}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4 xl:w-[320px]">
            <section className="rounded-3xl border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">{isRTL ? 'تمرکز این هفته' : 'Focus this week'}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {isRTL ? 'برای باز کردن نشان‌های جدید، روی تمرین‌های ریاضی و حفظ تداوم مطالعه روزانه تمرکز کنید.' : 'To unlock new badges, focus on math practice and sustaining your daily learning streak.'}
              </p>
            </section>

            <section className="rounded-3xl border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">{isRTL ? 'گام بعدی' : 'Next milestone'}</h2>
              <div className="mt-4 rounded-2xl bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{isRTL ? 'نابغه' : 'Genius'}</p>
                    <p className="text-sm text-muted-foreground">{isRTL ? '۷ آزمون دیگر تا امتیاز کامل' : '7 more perfect scores to unlock'}</p>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </StudentShell>
  );
}
