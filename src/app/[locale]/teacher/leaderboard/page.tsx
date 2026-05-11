'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Trophy, Star, Flame, Crown, Medal, BookOpen, Heart, TrendingUp } from 'lucide-react';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';

const DEMO_DATA_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === 'true';

interface TeacherEntry {
  id: string;
  name: string;
  avatar: string;
  publishedLessons: number;
  avgRating: number;
  totalRatings: number;
  totalXP: number;
  streak: number;
  level: number;
  earnedBadges: Array<{ icon: string; code: string; name: string }>;
}

const MOCK_LEADERBOARD: TeacherEntry[] = [
  { id: 'demo-teacher-1', name: 'Ms. Farida Azizi', avatar: '👩‍🏫', publishedLessons: 24, avgRating: 4.8, totalRatings: 142, totalXP: 3600, streak: 14, level: 8, earnedBadges: [{ icon: '⭐', code: 'five_star', name: 'Five-Star' }, { icon: '🔥', code: 'streak_7', name: 'On Fire' }, { icon: '📚', code: 'five_lessons', name: 'Bookworm' }] },
  { id: 'demo-teacher-2', name: 'Mr. Dariush Khalili', avatar: '👨‍🏫', publishedLessons: 18, avgRating: 4.6, totalRatings: 98, totalXP: 2800, streak: 9, level: 7, earnedBadges: [{ icon: '🏛️', code: 'twenty_lessons', name: 'Knowledge Pillar' }, { icon: '❤️', code: 'loved_teacher', name: 'Beloved' }] },
  { id: 'TEST_TEACHER', name: 'Test Teacher', avatar: '🎓', publishedLessons: 7, avgRating: 4.2, totalRatings: 31, totalXP: 780, streak: 3, level: 4, earnedBadges: [{ icon: '🌱', code: 'first_lesson', name: 'First Bloom' }, { icon: '📚', code: 'five_lessons', name: 'Bookworm' }] },
  { id: 'demo-teacher-3', name: 'Dr. Nasrin Mohammadi', avatar: '👩‍🔬', publishedLessons: 5, avgRating: 4.0, totalRatings: 22, totalXP: 420, streak: 2, level: 3, earnedBadges: [{ icon: '🌱', code: 'first_lesson', name: 'First Bloom' }] },
  { id: 'demo-teacher-4', name: 'Mr. Kamran Shirazi', avatar: '👨‍💻', publishedLessons: 2, avgRating: 3.8, totalRatings: 9, totalXP: 160, streak: 1, level: 2, earnedBadges: [{ icon: '🌱', code: 'first_lesson', name: 'First Bloom' }] },
];

const RARITY_COLORS: Record<string, string> = {
  COMMON: 'bg-gray-100 text-gray-700',
  UNCOMMON: 'bg-green-100 text-green-700',
  RARE: 'bg-blue-100 text-blue-700',
  EPIC: 'bg-purple-100 text-purple-700',
  LEGENDARY: 'bg-amber-100 text-amber-700',
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-6 w-6 text-amber-500" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-slate-400" />;
  if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
  return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
}

export default function TeacherLeaderboardPage({ params: { locale } }: { params: { locale: string } }) {
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;
  const [entries, setEntries] = useState<TeacherEntry[]>([]);
  const [currentUserId] = useState(() => getStoredUserId());
  const [sortBy, setSortBy] = useState<'xp' | 'lessons' | 'rating'>('xp');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = getStoredUserId();
    fetch('/api/v1/teacher/leaderboard', { headers: createUserHeaders(userId || '') })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data) => {
        if (data.entries?.length > 0) {
          setEntries(data.entries);
        } else if (DEMO_DATA_ENABLED) {
          setEntries(MOCK_LEADERBOARD);
        }
      })
      .catch(() => {
        if (DEMO_DATA_ENABLED) setEntries(MOCK_LEADERBOARD);
      })
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...entries].sort((a, b) => {
    if (sortBy === 'lessons') return b.publishedLessons - a.publishedLessons;
    if (sortBy === 'rating') return b.avgRating - a.avgRating;
    return b.totalXP - a.totalXP;
  });

  const podium = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const SORT_OPTS = [
    { key: 'xp', label: isRTL ? 'امتیاز XP' : 'XP Score', icon: Trophy },
    { key: 'lessons', label: isRTL ? 'دروس منتشرشده' : 'Lessons', icon: BookOpen },
    { key: 'rating', label: isRTL ? 'امتیاز دانش‌آموزان' : 'Student Rating', icon: Star },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href={`/${locale}/teacher`} className="flex items-center gap-2 text-white/60 hover:text-white">
            <Arrow className="h-5 w-5" />
            <span>{isRTL ? 'بازگشت' : 'Back'}</span>
          </Link>
          <h1 className="flex items-center gap-2 font-bold text-lg">
            <Trophy className="h-5 w-5 text-amber-400" />
            {isRTL ? 'تابلوی افتخار معلمان' : "Teachers' Hall of Fame"}
          </h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Hero */}
        <div className="mb-8 text-center">
          <p className="text-4xl mb-2">🏆</p>
          <h2 className="text-2xl font-bold mb-1">{isRTL ? 'بهترین سازندگان محتوا' : 'Top Content Creators'}</h2>
          <p className="text-white/50 text-sm">
            {isRTL ? 'معلمانی که با محتوای خود دانش‌آموزان را شگفت‌زده می‌کنند' : 'Teachers inspiring students with their amazing content'}
          </p>
        </div>

        {/* Sort tabs */}
        <div className="mb-8 flex justify-center gap-2">
          {SORT_OPTS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                sortBy === key
                  ? 'bg-white text-purple-900 shadow-lg'
                  : 'border border-white/20 text-white/70 hover:border-white/40 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-white/50">
            <Trophy className="h-16 w-16 opacity-30" />
            <p className="text-xl font-semibold">{isRTL ? 'هنوز داده‌ای ثبت نشده' : 'No teachers yet'}</p>
            <p className="text-sm">{isRTL ? 'اولین درس خود را منتشر کنید تا اینجا نمایش داده شوید!' : 'Publish your first lesson to appear here!'}</p>
          </div>
        ) : (
          <>
            {/* Podium — top 3 */}
            <div className="mb-8 grid grid-cols-3 gap-4 items-end">
              {/* 2nd place */}
              {podium[1] && (
                <div className={`order-1 flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 ${podium[1].id === currentUserId ? 'ring-2 ring-purple-400' : ''}`}>
                  <span className="text-3xl">{podium[1].avatar}</span>
                  <Medal className="h-7 w-7 text-slate-400" />
                  <div className="text-center">
                    <p className="font-bold text-sm">{podium[1].name}</p>
                    <p className="text-xs text-white/50 mt-0.5">{podium[1].totalXP.toLocaleString()} XP</p>
                  </div>
                  <div className="flex gap-1">
                    {podium[1].earnedBadges.slice(0, 2).map((b) => (
                      <span key={b.code} className="text-lg" title={b.name}>{b.icon}</span>
                    ))}
                  </div>
                  <div className="w-full rounded-xl bg-white/5 p-2 text-center">
                    <p className="text-xs text-white/50">{isRTL ? 'دروس' : 'Lessons'}</p>
                    <p className="font-bold">{podium[1].publishedLessons}</p>
                  </div>
                </div>
              )}

              {/* 1st place */}
              {podium[0] && (
                <div className={`order-2 flex flex-col items-center gap-3 rounded-2xl border border-amber-400/40 bg-gradient-to-b from-amber-500/10 to-amber-900/5 backdrop-blur p-5 shadow-xl shadow-amber-500/10 -mt-4 ${podium[0].id === currentUserId ? 'ring-2 ring-amber-400' : ''}`}>
                  <span className="text-4xl">{podium[0].avatar}</span>
                  <Crown className="h-8 w-8 text-amber-400" />
                  <div className="text-center">
                    <p className="font-bold">{podium[0].name}</p>
                    <p className="text-xs text-amber-300/70 mt-0.5">{podium[0].totalXP.toLocaleString()} XP</p>
                  </div>
                  <div className="flex gap-1">
                    {podium[0].earnedBadges.slice(0, 3).map((b) => (
                      <span key={b.code} className="text-xl" title={b.name}>{b.icon}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 w-full gap-2">
                    <div className="rounded-xl bg-white/5 p-2 text-center">
                      <p className="text-xs text-white/50">{isRTL ? 'دروس' : 'Lessons'}</p>
                      <p className="font-bold text-amber-300">{podium[0].publishedLessons}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 p-2 text-center">
                      <p className="text-xs text-white/50">⭐ {isRTL ? 'امتیاز' : 'Rating'}</p>
                      <p className="font-bold text-amber-300">{podium[0].avgRating.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd place */}
              {podium[2] && (
                <div className={`order-3 flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 ${podium[2].id === currentUserId ? 'ring-2 ring-purple-400' : ''}`}>
                  <span className="text-3xl">{podium[2].avatar}</span>
                  <Medal className="h-7 w-7 text-amber-600" />
                  <div className="text-center">
                    <p className="font-bold text-sm">{podium[2].name}</p>
                    <p className="text-xs text-white/50 mt-0.5">{podium[2].totalXP.toLocaleString()} XP</p>
                  </div>
                  <div className="flex gap-1">
                    {podium[2].earnedBadges.slice(0, 2).map((b) => (
                      <span key={b.code} className="text-lg" title={b.name}>{b.icon}</span>
                    ))}
                  </div>
                  <div className="w-full rounded-xl bg-white/5 p-2 text-center">
                    <p className="text-xs text-white/50">{isRTL ? 'دروس' : 'Lessons'}</p>
                    <p className="font-bold">{podium[2].publishedLessons}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Rest of leaderboard */}
            {rest.length > 0 && (
              <div className="space-y-2">
                {rest.map((entry, idx) => {
                  const rank = idx + 4;
                  const isMe = entry.id === currentUserId;
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-4 rounded-2xl border p-4 backdrop-blur transition-all ${
                        isMe
                          ? 'border-purple-400/50 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className="w-8 text-center font-bold text-white/60">#{rank}</span>
                      <span className="text-2xl">{entry.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{entry.name}{isMe && <span className="ms-2 text-xs text-purple-300">({isRTL ? 'شما' : 'You'})</span>}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-white/50">
                          <span>📚 {entry.publishedLessons} {isRTL ? 'درس' : 'lessons'}</span>
                          <span>⭐ {entry.avgRating.toFixed(1)}</span>
                          <span>🔥 {entry.streak}d</span>
                        </div>
                      </div>
                      <div className="hidden sm:flex gap-1">
                        {entry.earnedBadges.slice(0, 2).map((b) => (
                          <span key={b.code} className="text-lg" title={b.name}>{b.icon}</span>
                        ))}
                      </div>
                      <div className="text-end">
                        <p className="font-bold text-purple-300">{entry.totalXP.toLocaleString()}</p>
                        <p className="text-xs text-white/40">XP · Lv {entry.level}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CTA */}
            <div className="mt-8 rounded-2xl border border-dashed border-purple-400/30 bg-purple-500/5 p-6 text-center">
              <p className="text-2xl mb-2">✨</p>
              <p className="font-semibold mb-1">{isRTL ? 'جایگاه شما در تابلوی افتخار!' : 'Your place is waiting on this board!'}</p>
              <p className="text-sm text-white/50 mb-4">{isRTL ? 'هر درس منتشرشده XP و باج‌ جدید به شما می‌دهد.' : 'Every published lesson earns you XP and new badges.'}</p>
              <Link
                href={`/${locale}/teacher/content`}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg hover:opacity-90"
              >
                <BookOpen className="h-4 w-4" />
                {isRTL ? 'ایجاد درس جدید' : 'Create a New Lesson'}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
