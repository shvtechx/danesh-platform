'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Flame, Star, TrendingUp, BookOpen, Heart, Lock, ChevronRight } from 'lucide-react';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';

interface GamificationData {
  totalXP: number;
  levelInfo: {
    level: number;
    pct: number;
    progressXP: number;
    neededXP: number;
  };
  publishedLessons: number;
  streak: number;
  avgRating: number;
  totalRatings: number;
  loveCount: number;
  earnedBadges: Array<{ icon: string; code: string; name: string; nameFA: string; rarity: string }>;
  progressBadges: Array<{ icon: string; code: string; name: string; nameFA: string; progress: number; current: number; threshold: number; rarity: string }>;
  nextMilestone: { xp: number; label: string; labelFA: string; icon: string };
}

const RARITY_COLORS: Record<string, string> = {
  COMMON: 'border-gray-300 bg-gray-50 dark:bg-gray-800/50',
  UNCOMMON: 'border-green-400 bg-green-50 dark:bg-green-900/20',
  RARE: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20',
  EPIC: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20',
  LEGENDARY: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20',
};

const LEVEL_TITLES: Record<number, { en: string; fa: string }> = {
  1: { en: 'Beginner', fa: 'مبتدی' },
  2: { en: 'Learner', fa: 'یادگیرنده' },
  3: { en: 'Creator', fa: 'سازنده' },
  4: { en: 'Builder', fa: 'معمار' },
  5: { en: 'Expert', fa: 'متخصص' },
  6: { en: 'Master', fa: 'استاد' },
  7: { en: 'Champion', fa: 'قهرمان' },
  8: { en: 'Legend', fa: 'افسانه' },
};

const XP_PER_ACTION: Record<string, number> = {
  lesson_published: 50,
  high_rating: 30,
  streak_bonus: 20,
};

interface Props {
  locale: string;
  newXPGained?: number; // non-zero triggers flash animation
  refreshTrigger?: number;
}

export default function TeacherGamificationPanel({ locale, newXPGained = 0, refreshTrigger = 0 }: Props) {
  const isRTL = locale === 'fa';
  const [data, setData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [xpFlash, setXpFlash] = useState(false);

  const userId = getStoredUserId();

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/v1/teacher/gamification?userId=${userId}`, {
      headers: createUserHeaders(userId),
    })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, refreshTrigger]);

  useEffect(() => {
    if (newXPGained > 0) {
      setXpFlash(true);
      const t = setTimeout(() => setXpFlash(false), 2000);
      return () => clearTimeout(t);
    }
  }, [newXPGained]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-card p-4 space-y-3 animate-pulse">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
      </div>
    );
  }

  if (!data) return null;

  const { levelInfo, totalXP, publishedLessons, streak, avgRating, totalRatings, loveCount, earnedBadges, progressBadges, nextMilestone } = data;
  const levelTitle = LEVEL_TITLES[Math.min(levelInfo.level, 8)] || LEVEL_TITLES[8];
  const xpToMilestone = Math.max(0, nextMilestone.xp - totalXP);
  const milestonePct = Math.min(100, Math.round((totalXP / nextMilestone.xp) * 100));

  return (
    <div className="space-y-3">
      {/* Level & XP Card */}
      <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 p-4 transition-all duration-500 ${xpFlash ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/20' : ''}`}>
        {xpFlash && (
          <div className="absolute inset-0 pointer-events-none animate-ping-once opacity-0 bg-yellow-400/10 rounded-2xl" />
        )}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-violet-700 dark:text-violet-300">Lv {levelInfo.level}</span>
              <span className="rounded-full bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                {isRTL ? levelTitle.fa : levelTitle.en}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalXP.toLocaleString()} XP
              {xpFlash && newXPGained > 0 && (
                <span className="ms-2 font-bold text-yellow-500 animate-bounce inline-block">+{newXPGained} XP!</span>
              )}
            </p>
          </div>
          <TrendingUp className="h-5 w-5 text-violet-500" />
        </div>

        {/* XP bar */}
        <div className="mb-1.5">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{levelInfo.progressXP} / {levelInfo.neededXP} XP</span>
            <span>Lv {levelInfo.level + 1}</span>
          </div>
          <div className="h-2.5 rounded-full bg-violet-100 dark:bg-violet-900/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-1000"
              style={{ width: `${levelInfo.pct}%` }}
            />
          </div>
        </div>

        {/* Milestone progress */}
        <div className="mt-3 rounded-xl bg-white/50 dark:bg-black/20 p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">{nextMilestone.icon} {isRTL ? nextMilestone.labelFA : nextMilestone.label}</span>
            <span className="text-xs text-muted-foreground">{xpToMilestone > 0 ? `${xpToMilestone.toLocaleString()} XP ${isRTL ? 'باقی‌مانده' : 'to go'}` : (isRTL ? '✅ رسیدید!' : '✅ Reached!')}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000" style={{ width: `${milestonePct}%` }} />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border bg-card p-3 text-center">
          <div className="flex justify-center mb-1"><Flame className="h-4 w-4 text-orange-500" /></div>
          <p className="text-lg font-bold">{streak}</p>
          <p className="text-xs text-muted-foreground">{isRTL ? 'روز متوالی' : 'day streak'}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <div className="flex justify-center mb-1"><BookOpen className="h-4 w-4 text-blue-500" /></div>
          <p className="text-lg font-bold">{publishedLessons}</p>
          <p className="text-xs text-muted-foreground">{isRTL ? 'درس منتشر' : 'lessons'}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <div className="flex justify-center mb-1"><Heart className="h-4 w-4 text-red-500" /></div>
          <p className="text-lg font-bold">{loveCount}</p>
          <p className="text-xs text-muted-foreground">{isRTL ? 'قلب' : 'loves'}</p>
        </div>
      </div>

      {/* Rating */}
      {totalRatings > 0 && (
        <div className="rounded-xl border bg-card p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">/ 5.0</span>
            </div>
            <span className="text-xs text-muted-foreground">{totalRatings} {isRTL ? 'امتیاز' : 'ratings'}</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500" style={{ width: `${(avgRating / 5) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Earned badges */}
      {earnedBadges.length > 0 && (
        <div className="rounded-2xl border bg-card p-4">
          <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            {isRTL ? 'باج‌های کسب‌شده' : 'Badges Earned'}
            <span className="ms-auto rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">{earnedBadges.length}</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((b) => (
              <div
                key={b.code}
                title={isRTL ? b.nameFA : b.name}
                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-sm ${RARITY_COLORS[b.rarity] || RARITY_COLORS.COMMON}`}
              >
                <span className="text-base">{b.icon}</span>
                <span className="text-xs font-medium">{isRTL ? b.nameFA : b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress badges */}
      {progressBadges.length > 0 && (
        <div className="rounded-2xl border bg-card p-4">
          <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            {isRTL ? 'باج‌های در راه' : 'Badges in Progress'}
          </h4>
          <div className="space-y-3">
            {progressBadges.map((b) => (
              <div key={b.code}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base opacity-60">{b.icon}</span>
                    <span className="text-xs font-medium">{isRTL ? b.nameFA : b.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{b.current}/{b.threshold}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-indigo-500 transition-all duration-700" style={{ width: `${b.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* XP rewards hint */}
      <div className="rounded-2xl border border-dashed border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10 p-3">
        <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-2">{isRTL ? '💡 چگونه XP کسب کنیم؟' : '💡 How to earn XP?'}</p>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex justify-between"><span>📖 {isRTL ? 'انتشار درس' : 'Publish a lesson'}</span><span className="text-violet-600 font-medium">+50 XP</span></div>
          <div className="flex justify-between"><span>⭐ {isRTL ? 'امتیاز بالا از دانش‌آموز' : 'High student rating'}</span><span className="text-violet-600 font-medium">+30 XP</span></div>
          <div className="flex justify-between"><span>🔥 {isRTL ? 'پاداش استریک' : 'Streak bonus'}</span><span className="text-violet-600 font-medium">+20 XP</span></div>
        </div>
      </div>

      {/* Leaderboard link */}
      <Link
        href={`/${locale}/teacher/leaderboard`}
        className="flex items-center justify-between rounded-xl border bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-3 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">{isRTL ? 'تابلوی افتخار معلمان' : "Teachers' Leaderboard"}</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </div>
  );
}
