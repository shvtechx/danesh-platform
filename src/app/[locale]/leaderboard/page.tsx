'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Crown, Flame, Medal, Star, Trophy } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';

type LeaderboardEntry = {
  id: string;
  name: string;
  xp: number;
  totalXP: number;
  level: number;
  streak: number;
  change: number;
  mastery: number;
  avatar: string;
  rank: number;
  rankLabel: string;
};

type LeaderboardResponse = {
  range: 'week' | 'month' | 'all';
  rankings: LeaderboardEntry[];
  summary: {
    totalParticipants: number;
    maxXP: number;
  };
};

const EMPTY_RESPONSE: LeaderboardResponse = {
  range: 'week',
  rankings: [],
  summary: {
    totalParticipants: 0,
    maxXP: 0,
  },
};

export default function LeaderboardPage({ params: { locale } }: { params: { locale: string } }) {
  const isRTL = locale === 'fa';
  const [activeRange, setActiveRange] = useState<'week' | 'month' | 'all'>('week');
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse>(EMPTY_RESPONSE);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ variant: 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    setCurrentUserId(getStoredUserId());
  }, []);

  useEffect(() => {
    let active = true;

    const loadLeaderboard = async () => {
      try {
        setIsLoading(true);
        setFeedback(null);

        const response = await fetch(`/api/v1/leaderboard?locale=${locale}&range=${activeRange}`, {
          cache: 'no-store',
          headers: createUserHeaders(getStoredUserId()),
        });

        if (!response.ok) {
          throw new Error('Failed to load leaderboard');
        }

        const data = (await response.json()) as LeaderboardResponse;
        if (active) {
          setLeaderboard(data);
        }
      } catch {
        if (active) {
          setLeaderboard(EMPTY_RESPONSE);
          setFeedback({
            variant: 'error',
            message: isRTL ? 'بارگذاری جدول رتبه‌بندی انجام نشد.' : 'Leaderboard data could not be loaded.',
          });
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadLeaderboard();

    return () => {
      active = false;
    };
  }, [activeRange, isRTL, locale]);

  const topUsers = useMemo(() => leaderboard.rankings.slice(0, 3), [leaderboard.rankings]);
  const remainingUsers = useMemo(() => leaderboard.rankings.slice(3), [leaderboard.rankings]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-amber-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-slate-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-700" />;
      default:
        return <span className="font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-amber-400 to-orange-500';
      case 2:
        return 'bg-gradient-to-br from-slate-300 to-slate-400';
      case 3:
        return 'bg-gradient-to-br from-amber-600 to-amber-800';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        locale={locale}
        title={isRTL ? 'جدول رتبه‌بندی' : 'Leaderboard'}
        backHref={`/${locale}/dashboard`}
        backLabel={isRTL ? 'داشبورد' : 'Dashboard'}
      />

      <div className="mx-auto max-w-7xl space-y-8 p-6">
        <div>
          <p className="mt-2 text-muted-foreground">
            {isRTL ? 'رتبه‌بندی دانش‌آموزان بر پایه XP، تداوم فعالیت و تسلط مهارتی' : 'Student rankings based on XP, learning streaks, and mastery signals'}
          </p>
        </div>

        {feedback ? <FeedbackBanner variant={feedback.variant} message={feedback.message} /> : null}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{isRTL ? 'شرکت‌کنندگان فعال' : 'Active participants'}</p>
            <p className="mt-2 text-3xl font-bold">{isLoading ? '—' : leaderboard.summary.totalParticipants.toLocaleString(isRTL ? 'fa-IR' : 'en-US')}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{isRTL ? 'بیشترین XP در بازه' : 'Highest XP in range'}</p>
            <p className="mt-2 text-3xl font-bold">{isLoading ? '—' : leaderboard.summary.maxXP.toLocaleString(isRTL ? 'fa-IR' : 'en-US')}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{isRTL ? 'بازه فعال' : 'Selected range'}</p>
            <p className="mt-2 text-lg font-semibold">{activeRange === 'week' ? (isRTL ? 'این هفته' : 'This Week') : activeRange === 'month' ? (isRTL ? 'این ماه' : 'This Month') : (isRTL ? 'همه زمان‌ها' : 'All Time')}</p>
          </div>
        </div>

        <div className="flex gap-2 border-b">
          <button
            type="button"
            onClick={() => setActiveRange('week')}
            className={`border-b-2 px-4 py-2 font-medium ${activeRange === 'week' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {isRTL ? 'این هفته' : 'This Week'}
          </button>
          <button
            type="button"
            onClick={() => setActiveRange('month')}
            className={`border-b-2 px-4 py-2 ${activeRange === 'month' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {isRTL ? 'این ماه' : 'This Month'}
          </button>
          <button
            type="button"
            onClick={() => setActiveRange('all')}
            className={`border-b-2 px-4 py-2 ${activeRange === 'all' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {isRTL ? 'همه زمان‌ها' : 'All Time'}
          </button>
        </div>

        {topUsers.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {topUsers.map((user) => (
              <div
                key={user.id}
                className={`rounded-2xl border bg-card p-6 text-center ${
                  user.rank === 1 ? 'sm:order-2 sm:-mt-4' : user.rank === 2 ? 'sm:order-1' : 'sm:order-3'
                }`}
              >
                <div className="relative inline-block">
                  <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${getRankBg(user.rank)} text-3xl font-bold text-white`}>
                    {user.avatar}
                  </div>
                  <div className="absolute -bottom-2 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border bg-card shadow-sm">
                    {getRankIcon(user.rank)}
                  </div>
                </div>
                <h3 className="mt-4 font-semibold">{user.name}</h3>
                <div className="mt-2 flex items-center justify-center gap-2 text-primary">
                  <Star className="h-4 w-4" />
                  <span className="font-bold">{user.xp.toLocaleString(isRTL ? 'fa-IR' : 'en-US')} XP</span>
                </div>
                <div className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span>{user.streak} {isRTL ? 'روز' : 'days'}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{isRTL ? `سطح ${user.level}` : `Level ${user.level}`}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
            {isLoading ? (isRTL ? 'در حال بارگذاری رتبه‌بندی...' : 'Loading leaderboard...') : (isRTL ? 'هنوز داده‌ای برای رتبه‌بندی ثبت نشده است.' : 'No ranking data is available yet.')}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="grid grid-cols-12 gap-4 border-b bg-muted/50 p-4 text-sm font-medium text-muted-foreground">
            <div className="col-span-1">{isRTL ? 'رتبه' : 'Rank'}</div>
            <div className="col-span-4">{isRTL ? 'کاربر' : 'User'}</div>
            <div className="col-span-2 text-center">XP</div>
            <div className="col-span-2 text-center">{isRTL ? 'سطح' : 'Level'}</div>
            <div className="col-span-1 text-center">{isRTL ? 'تداوم' : 'Streak'}</div>
            <div className="col-span-1 text-center">{isRTL ? 'تسلط' : 'Mastery'}</div>
            <div className="col-span-1 text-center">{isRTL ? 'تغییر' : 'Change'}</div>
          </div>

          {remainingUsers.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {isLoading ? (isRTL ? 'در حال بارگذاری...' : 'Loading...') : (isRTL ? 'هنوز فهرست رتبه‌بندی کامل نشده است.' : 'The leaderboard list is not populated yet.')}
            </div>
          ) : (
            remainingUsers.map((user) => {
              const isCurrentUser = currentUserId === user.id;

              return (
                <div
                  key={user.id}
                  className={`grid grid-cols-12 items-center gap-4 border-b p-4 last:border-0 ${isCurrentUser ? 'bg-primary/5' : ''}`}
                >
                  <div className="col-span-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {getRankIcon(user.rank)}
                    </div>
                  </div>
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 font-semibold text-primary">
                      {user.avatar}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      {isCurrentUser ? <span className="text-xs text-primary">{isRTL ? 'شما' : 'You'}</span> : null}
                    </div>
                  </div>
                  <div className="col-span-2 text-center font-semibold">{user.xp.toLocaleString(isRTL ? 'fa-IR' : 'en-US')}</div>
                  <div className="col-span-2 text-center">{user.level}</div>
                  <div className="col-span-1 flex items-center justify-center gap-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span>{user.streak}</span>
                  </div>
                  <div className="col-span-1 text-center">{user.mastery}%</div>
                  <div className="col-span-1 text-center">
                    {user.change > 0 ? (
                      <span className="inline-flex items-center gap-1 text-green-500">
                        <ChevronUp className="h-4 w-4" />
                        {user.change}
                      </span>
                    ) : user.change < 0 ? (
                      <span className="inline-flex items-center gap-1 text-red-500">
                        <ChevronDown className="h-4 w-4" />
                        {Math.abs(user.change)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {topUsers.length > 0 ? (
          <div className="rounded-2xl border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">{isRTL ? 'جمع‌بندی رقابت سالم' : 'Growth-focused summary'}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {isRTL
                ? 'رتبه‌بندی برای تشویق رشد فردی نمایش داده می‌شود. تمرکز اصلی بر تداوم یادگیری، کسب XP و تقویت مهارت‌ها است.'
                : 'Rankings are shown to encourage personal growth. The main focus remains consistent learning, earned XP, and mastery development.'}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
