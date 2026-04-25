'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Trophy, Medal, Star, Crown, Target, Zap, Award, Flame } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

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
    <div className="min-h-screen bg-background">
      <PageHeader 
        locale={locale} 
        title={t('gamification.achievements')}
        backHref={`/${locale}/dashboard`}
        backLabel={isRTL ? 'داشبورد' : 'Dashboard'}
      />
      <div className="space-y-8 p-6">
        <div>
          <p className="text-muted-foreground mt-2">
            {isRTL ? 'دستاوردها و نشان‌های شما' : 'Your achievements and badges'}
          </p>
        </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'دستاورد کسب شده' : 'Achievements Earned'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Medal className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">8</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'نشان کسب شده' : 'Badges Earned'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Zap className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">2,450</p>
              <p className="text-sm text-muted-foreground">{t('gamification.xp')}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">14</p>
              <p className="text-sm text-muted-foreground">{t('gamification.currentStreak')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t('gamification.badges')}</h2>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`rounded-xl border p-4 text-center ${
                badge.earned ? 'bg-card' : 'bg-muted/50 opacity-50'
              }`}
            >
              <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${
                badge.earned ? 'bg-primary/10' : 'bg-muted'
              }`}>
                <badge.icon className={`h-6 w-6 ${badge.earned ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <p className="text-sm font-medium">{badge.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t('gamification.achievements')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`rounded-xl border p-4 ${
                achievement.earned ? 'bg-card' : 'bg-card/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${
                  rarityColors[achievement.rarity as keyof typeof rarityColors]
                } ${!achievement.earned && 'opacity-50'}`}>
                  <achievement.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{achievement.title}</h3>
                    <span className="text-sm text-primary font-medium">+{achievement.xp} XP</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{isRTL ? 'پیشرفت' : 'Progress'}</span>
                      <span className="font-medium">{achievement.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${
                          rarityColors[achievement.rarity as keyof typeof rarityColors]
                        }`}
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
