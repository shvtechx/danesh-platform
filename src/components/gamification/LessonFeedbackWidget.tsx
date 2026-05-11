'use client';

import { useEffect, useState, useCallback } from 'react';
import { Smile, Send, BarChart2 } from 'lucide-react';

interface FeedbackStats {
  totalResponses: number;
  avgScore: number;
  counts: Record<string, number>;
  recentComments: string[];
}

interface Props {
  lessonId: string;
  locale: string;
  userId?: string;
  compact?: boolean;
}

type Reaction = 'love' | 'happy' | 'neutral' | 'confused' | 'sad';

const REACTIONS: Array<{ key: Reaction; emoji: string; labelEN: string; labelFA: string; score: number }> = [
  { key: 'love', emoji: '😍', labelEN: 'Loved it!', labelFA: 'عاشقشم!', score: 5 },
  { key: 'happy', emoji: '😊', labelEN: 'Pretty good', labelFA: 'خوب بود', score: 4 },
  { key: 'neutral', emoji: '😐', labelEN: 'It was OK', labelFA: 'معمولی', score: 3 },
  { key: 'confused', emoji: '😕', labelEN: 'Confusing', labelFA: 'گیج‌کننده', score: 2 },
  { key: 'sad', emoji: '😢', labelEN: 'Too hard', labelFA: 'خیلی سخت', score: 1 },
];

const SCORE_LABELS: Record<number, string> = { 5: '⭐⭐⭐⭐⭐', 4: '⭐⭐⭐⭐', 3: '⭐⭐⭐', 2: '⭐⭐', 1: '⭐' };

function getScoreColor(score: number) {
  if (score >= 4.5) return 'text-emerald-600';
  if (score >= 3.5) return 'text-blue-600';
  if (score >= 2.5) return 'text-amber-600';
  return 'text-red-600';
}

export default function LessonFeedbackWidget({ lessonId, locale, userId, compact = false }: Props) {
  const isRTL = locale === 'fa';
  const [selected, setSelected] = useState<Reaction | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = useCallback(() => {
    fetch(`/api/v1/lessons/${lessonId}/feedback`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, [lessonId]);

  useEffect(() => {
    if (submitted || showStats) fetchStats();
  }, [submitted, showStats, fetchStats]);

  const handleSubmit = async () => {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/lessons/${lessonId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction: selected, comment: comment.trim() || undefined, userId }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      setSubmitted(true);
    } catch {
      setError(isRTL ? 'خطا در ارسال. دوباره تلاش کنید.' : 'Error submitting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted && stats) {
    const total = stats.totalResponses;
    return (
      <div className="rounded-2xl border bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-5">
        <div className="text-center mb-4">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-semibold text-emerald-700 dark:text-emerald-300">
            {isRTL ? 'ممنون از بازخورد شما!' : 'Thanks for your feedback!'}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isRTL ? `${total} دانش‌آموز نظر دادند` : `${total} students responded`}
          </p>
        </div>

        {/* Average score */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>{stats.avgScore.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">/ 5.0</span>
        </div>

        {/* Reaction bars */}
        <div className="space-y-2">
          {REACTIONS.map((r) => {
            const cnt = stats.counts[r.key] || 0;
            const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
            return (
              <div key={r.key} className="flex items-center gap-2">
                <span className="text-lg w-7 text-center">{r.emoji}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500/70 transition-all duration-1000" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>

        {/* Recent comments */}
        {stats.recentComments.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">{isRTL ? 'نظرات اخیر:' : 'Recent comments:'}</p>
            {stats.recentComments.map((c, i) => (
              <p key={i} className="text-xs rounded-lg bg-white/70 dark:bg-black/20 px-3 py-2 italic">"{c}"</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Smile className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-sm">
            {isRTL ? 'این درس چطور بود؟' : 'How was this lesson?'}
          </h3>
        </div>
        {!compact && (
          <button
            onClick={() => setShowStats((v) => !v)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-accent transition-colors"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            {isRTL ? 'آمار' : 'Stats'}
          </button>
        )}
      </div>

      {showStats && stats && !submitted && (
        <div className="mb-4 rounded-xl bg-muted/50 p-3 space-y-2">
          <p className="text-xs font-medium">{stats.totalResponses} {isRTL ? 'پاسخ تاکنون' : 'responses so far'} • avg {stats.avgScore.toFixed(1)}/5</p>
          {REACTIONS.map((r) => {
            const cnt = stats.counts[r.key] || 0;
            const pct = stats.totalResponses > 0 ? Math.round((cnt / stats.totalResponses) * 100) : 0;
            return (
              <div key={r.key} className="flex items-center gap-2">
                <span className="w-6 text-center">{r.emoji}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500/60" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{cnt}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Emoji selection */}
      <div className="flex justify-between gap-1 mb-4">
        {REACTIONS.map((r) => (
          <button
            key={r.key}
            onClick={() => setSelected(r.key)}
            className={`flex flex-col items-center gap-1 flex-1 rounded-xl p-2.5 border-2 transition-all duration-200 ${
              selected === r.key
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 scale-110 shadow-md shadow-violet-200 dark:shadow-violet-900/30'
                : 'border-transparent hover:border-violet-200 hover:bg-muted/50'
            }`}
            title={isRTL ? r.labelFA : r.labelEN}
          >
            <span className={`text-2xl transition-transform duration-200 ${selected === r.key ? 'animate-bounce' : ''}`}>
              {r.emoji}
            </span>
            {!compact && (
              <span className="text-[10px] text-muted-foreground leading-tight text-center">
                {isRTL ? r.labelFA : r.labelEN}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Comment box (appears after selection) */}
      {selected && (
        <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={isRTL ? 'نظر اضافی؟ (اختیاری)' : 'Any additional comment? (optional)'}
            dir={isRTL ? 'rtl' : 'ltr'}
            rows={2}
            className="w-full resize-none rounded-xl border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-muted-foreground"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {loading ? (
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                {isRTL ? 'ارسال بازخورد' : 'Send Feedback'}
              </>
            )}
          </button>
        </div>
      )}

      {!selected && (
        <p className="text-center text-xs text-muted-foreground">
          {isRTL ? 'یکی از ایموجی‌ها را انتخاب کنید' : 'Select an emoji to rate this lesson'}
        </p>
      )}
    </div>
  );
}
