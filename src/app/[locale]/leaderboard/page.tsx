'use client';

import { useTranslations } from 'next-intl';
import { Trophy, Medal, Crown, Flame, Star, TrendingUp, ChevronUp, ChevronDown } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

export default function LeaderboardPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';

  const topUsers = [
    { rank: 1, name: isRTL ? 'سارا کریمی' : 'Sara Karimi', xp: 12450, streak: 45, avatar: 'S', change: 0 },
    { rank: 2, name: isRTL ? 'محمد رضایی' : 'Mohammad Rezaei', xp: 11200, streak: 38, avatar: 'M', change: 1 },
    { rank: 3, name: isRTL ? 'زهرا محمدی' : 'Zahra Mohammadi', xp: 10850, streak: 32, avatar: 'Z', change: -1 },
  ];

  const leaderboard = [
    { rank: 4, name: isRTL ? 'علی احمدی' : 'Ali Ahmadi', xp: 9500, streak: 28, avatar: 'A', change: 2, isCurrentUser: true },
    { rank: 5, name: isRTL ? 'مریم حسینی' : 'Maryam Hosseini', xp: 9200, streak: 25, avatar: 'M', change: -1 },
    { rank: 6, name: isRTL ? 'امیر نوری' : 'Amir Noori', xp: 8900, streak: 22, avatar: 'A', change: 0 },
    { rank: 7, name: isRTL ? 'فاطمه جعفری' : 'Fatemeh Jafari', xp: 8600, streak: 20, avatar: 'F', change: 3 },
    { rank: 8, name: isRTL ? 'رضا موسوی' : 'Reza Mousavi', xp: 8300, streak: 18, avatar: 'R', change: -2 },
    { rank: 9, name: isRTL ? 'نیلوفر صادقی' : 'Niloofar Sadeghi', xp: 8000, streak: 15, avatar: 'N', change: 1 },
    { rank: 10, name: isRTL ? 'حسین قاسمی' : 'Hossein Ghasemi', xp: 7800, streak: 14, avatar: 'H', change: 0 },
  ];

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
        title={t('gamification.leaderboard')}
        backHref={`/${locale}/dashboard`}
        backLabel={isRTL ? 'داشبورد' : 'Dashboard'}
      />
      <div className="space-y-8 p-6">
        <div>
          <p className="text-muted-foreground mt-2">
            {isRTL ? 'رتبه‌بندی دانش‌آموزان برتر' : 'Top students ranking'}
          </p>
        </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button className="px-4 py-2 border-b-2 border-primary text-primary font-medium">
          {isRTL ? 'این هفته' : 'This Week'}
        </button>
        <button className="px-4 py-2 text-muted-foreground hover:text-foreground">
          {isRTL ? 'این ماه' : 'This Month'}
        </button>
        <button className="px-4 py-2 text-muted-foreground hover:text-foreground">
          {isRTL ? 'همه زمان‌ها' : 'All Time'}
        </button>
      </div>

      {/* Top 3 */}
      <div className="grid gap-4 sm:grid-cols-3">
        {topUsers.map((user, index) => (
          <div
            key={user.rank}
            className={`rounded-2xl border bg-card p-6 text-center ${
              user.rank === 1 ? 'sm:order-2 sm:-mt-4' : user.rank === 2 ? 'sm:order-1' : 'sm:order-3'
            }`}
          >
            <div className="relative inline-block">
              <div className={`h-20 w-20 rounded-full ${getRankBg(user.rank)} flex items-center justify-center text-3xl text-white font-bold mx-auto`}>
                {user.avatar}
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-card border shadow-sm">
                {getRankIcon(user.rank)}
              </div>
            </div>
            <h3 className="font-semibold mt-4">{user.name}</h3>
            <div className="flex items-center justify-center gap-2 mt-2 text-primary">
              <Star className="h-4 w-4" />
              <span className="font-bold">{user.xp.toLocaleString()} XP</span>
            </div>
            <div className="flex items-center justify-center gap-1 mt-1 text-sm text-muted-foreground">
              <Flame className="h-4 w-4 text-orange-500" />
              <span>{user.streak} {isRTL ? 'روز' : 'days'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
          <div className="col-span-1">{isRTL ? 'رتبه' : 'Rank'}</div>
          <div className="col-span-5">{isRTL ? 'کاربر' : 'User'}</div>
          <div className="col-span-2 text-center">{t('gamification.xp')}</div>
          <div className="col-span-2 text-center">{t('gamification.streak')}</div>
          <div className="col-span-2 text-center">{isRTL ? 'تغییر' : 'Change'}</div>
        </div>
        {leaderboard.map((user) => (
          <div
            key={user.rank}
            className={`grid grid-cols-12 gap-4 p-4 items-center border-b last:border-0 ${
              user.isCurrentUser ? 'bg-primary/5' : ''
            }`}
          >
            <div className="col-span-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                {getRankIcon(user.rank)}
              </div>
            </div>
            <div className="col-span-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary">
                {user.avatar}
              </div>
              <div>
                <p className="font-medium">{user.name}</p>
                {user.isCurrentUser && (
                  <span className="text-xs text-primary">{isRTL ? 'شما' : 'You'}</span>
                )}
              </div>
            </div>
            <div className="col-span-2 text-center">
              <span className="font-semibold">{user.xp.toLocaleString()}</span>
            </div>
            <div className="col-span-2 text-center flex items-center justify-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span>{user.streak}</span>
            </div>
            <div className="col-span-2 text-center">
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
        ))}
      </div>
      </div>
    </div>
  );
}
