'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Gift,
  Play,
  Star,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';

type QuestStep = {
  id: string;
  sequence: number;
  title: string;
  titleFA?: string | null;
  xpReward: number;
};

type Quest = {
  id: string;
  title: string;
  titleFA?: string | null;
  description?: string | null;
  descriptionFA?: string | null;
  category?: string | null;
  xpReward: number;
  coinReward?: number;
  startDate?: string | null;
  endDate?: string | null;
  steps: QuestStep[];
  userProgress?: {
    status: string;
    currentStep: number;
    startedAt?: string | null;
    completedAt?: string | null;
    stepProgress?: {
      completed: boolean;
      progress: number;
      target: number;
    } | null;
  };
};

type QuestData = {
  active: Quest[];
  completed: Quest[];
  available: Quest[];
};

const EMPTY_QUESTS: QuestData = {
  active: [],
  completed: [],
  available: [],
};

function getRelativeTimeLabel(endDate: string | null | undefined, isRTL: boolean) {
  if (!endDate) {
    return isRTL ? 'بدون محدودیت' : 'No deadline';
  }

  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) {
    return isRTL ? 'به پایان رسیده' : 'Expired';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) {
    return isRTL ? `${hours} ساعت باقی‌مانده` : `${hours}h left`;
  }

  const days = Math.floor(hours / 24);
  return isRTL ? `${days} روز باقی‌مانده` : `${days}d left`;
}

function getCategoryColor(category?: string | null) {
  const colors: Record<string, string> = {
    PERSIAN_MYTHOLOGY: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
    ISLAMIC_SCHOLARS: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300',
    GLOBAL_SCIENCE: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
    CITIZENSHIP: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300',
    SEASONAL: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300',
  };

  return colors[category || ''] || 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300';
}

function getCategoryIcon(category?: string | null) {
  switch (category) {
    case 'GLOBAL_SCIENCE':
      return Zap;
    case 'CITIZENSHIP':
      return Flame;
    case 'ISLAMIC_SCHOLARS':
      return Trophy;
    case 'PERSIAN_MYTHOLOGY':
      return Star;
    default:
      return Target;
  }
}

export default function QuestsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const [quests, setQuests] = useState<QuestData>(EMPTY_QUESTS);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ variant: 'error' | 'info'; message: string } | null>(null);
  const [startingQuestId, setStartingQuestId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadQuests = async () => {
      try {
        setIsLoading(true);
        setFeedback(null);

        const response = await fetch('/api/v1/student/quests', {
          cache: 'no-store',
          headers: createUserHeaders(getStoredUserId()),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch quests');
        }

        const result = (await response.json()) as { success: boolean; data?: QuestData };
        if (!result.success) {
          throw new Error('Failed to fetch quests');
        }

        if (active) {
          setQuests(result.data || EMPTY_QUESTS);
        }
      } catch {
        if (active) {
          setQuests(EMPTY_QUESTS);
          setFeedback({
            variant: 'error',
            message: isRTL ? 'بارگذاری مأموریت‌ها انجام نشد.' : 'Quest data could not be loaded.',
          });
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadQuests();

    return () => {
      active = false;
    };
  }, [isRTL]);

  const startQuest = async (questId: string) => {
    try {
      setStartingQuestId(questId);
      setFeedback(null);

      const response = await fetch('/api/v1/student/quests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...createUserHeaders(getStoredUserId()),
        },
        body: JSON.stringify({ questId }),
      });

      const result = (await response.json()) as { success: boolean; error?: string };
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to start quest');
      }

      const refresh = await fetch('/api/v1/student/quests', {
        cache: 'no-store',
        headers: createUserHeaders(getStoredUserId()),
      });

      if (refresh.ok) {
        const refreshed = (await refresh.json()) as { success: boolean; data?: QuestData };
        if (refreshed.success) {
          setQuests(refreshed.data || EMPTY_QUESTS);
        }
      }

      setFeedback({
        variant: 'info',
        message: isRTL ? 'مأموریت با موفقیت آغاز شد.' : 'Quest started successfully.',
      });
    } catch (error) {
      setFeedback({
        variant: 'error',
        message: error instanceof Error ? error.message : isRTL ? 'شروع مأموریت انجام نشد.' : 'Quest could not be started.',
      });
    } finally {
      setStartingQuestId(null);
    }
  };

  const totalWeeklyXP = useMemo(
    () => quests.active.reduce((sum, quest) => sum + quest.xpReward, 0),
    [quests.active],
  );

  const activeSummary = useMemo(
    () => quests.active.reduce((sum, quest) => sum + (quest.userProgress?.stepProgress?.progress || 0), 0),
    [quests.active],
  );

  const QuestCard = ({ quest, mode }: { quest: Quest; mode: 'active' | 'available' | 'completed' }) => {
    const Icon = getCategoryIcon(quest.category);
    const title = isRTL ? quest.titleFA || quest.title : quest.title;
    const description = isRTL ? quest.descriptionFA || quest.description || '' : quest.description || quest.descriptionFA || '';
    const progress = quest.userProgress?.stepProgress?.progress || 0;
    const target = quest.userProgress?.stepProgress?.target || quest.steps.length || 1;
    const progressPercent = Math.min(Math.round((progress / Math.max(target, 1)) * 100), 100);

    return (
      <div className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
        <div className="flex items-start gap-4">
          <div className={`rounded-xl p-3 ${getCategoryColor(quest.category)}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
              {mode === 'completed' ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : null}
            </div>

            {mode !== 'completed' ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {mode === 'active' ? `${progress} / ${target}` : `${quest.steps.length} ${isRTL ? 'مرحله' : 'steps'}`}
                  </span>
                  <span className="font-medium">{mode === 'active' ? `${progressPercent}%` : getRelativeTimeLabel(quest.endDate, isRTL)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${mode === 'active' ? progressPercent : 0}%` }} />
                </div>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-sm font-medium text-amber-600">
                  <Award className="h-4 w-4" />
                  +{quest.xpReward} XP
                </span>
                {(quest.coinReward || 0) > 0 ? (
                  <span className="flex items-center gap-1 text-sm font-medium text-cyan-600">
                    <Gift className="h-4 w-4" />
                    +{quest.coinReward}
                  </span>
                ) : null}
              </div>

              {mode === 'available' ? (
                <button
                  type="button"
                  onClick={() => startQuest(quest.id)}
                  disabled={startingQuestId === quest.id}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  <Play className="h-4 w-4" />
                  {startingQuestId === quest.id ? (isRTL ? 'در حال شروع...' : 'Starting...') : (isRTL ? 'شروع مأموریت' : 'Start Quest')}
                </button>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {mode === 'completed'
                    ? quest.userProgress?.completedAt
                      ? new Date(quest.userProgress.completedAt).toLocaleDateString(isRTL ? 'fa-IR' : 'en-US')
                      : isRTL
                        ? 'تکمیل شده'
                        : 'Completed'
                    : getRelativeTimeLabel(quest.endDate, isRTL)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        locale={locale}
        title={t('gamification.quests')}
        backHref={`/${locale}/dashboard`}
        backLabel={isRTL ? 'داشبورد' : 'Dashboard'}
      />

      <div className="space-y-8 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-muted-foreground">
              {isRTL ? 'مأموریت‌های زنده برای رشد فردی، استمرار و پیشرفت مرحله‌ای' : 'Live quests designed to encourage personal growth, consistency, and step-by-step progress'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{isRTL ? 'مأموریت‌های فعال' : 'Active quests'}</p>
                <p className="font-bold">{isLoading ? '—' : `${quests.active.length}`}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2">
              <Award className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">{isRTL ? 'XP در جریان' : 'XP in progress'}</p>
                <p className="font-bold text-amber-600">{isLoading ? '—' : `+${totalWeeklyXP}`}</p>
              </div>
            </div>
          </div>
        </div>

        {feedback ? <FeedbackBanner variant={feedback.variant} message={feedback.message} /> : null}

        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Flame className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold">{isRTL ? 'مأموریت‌های فعال' : 'Active Quests'}</h2>
          </div>
          {quests.active.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
              {isLoading ? (isRTL ? 'در حال بارگذاری مأموریت‌ها...' : 'Loading quests...') : (isRTL ? 'در حال حاضر مأموریت فعالی وجود ندارد.' : 'There are no active quests right now.')}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {quests.active.map((quest) => (
                <QuestCard key={quest.id} quest={quest} mode="active" />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold">{isRTL ? 'مأموریت‌های قابل شروع' : 'Available Quests'}</h2>
          </div>
          {quests.available.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
              {isRTL ? 'همه مأموریت‌های موجود شروع شده یا تکمیل شده‌اند.' : 'All currently available quests have already been started or completed.'}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {quests.available.map((quest) => (
                <QuestCard key={quest.id} quest={quest} mode="available" />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold">{isRTL ? 'تکمیل‌شده‌ها' : 'Completed Quests'}</h2>
          </div>
          {quests.completed.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
              {isRTL ? 'هنوز مأموریتی تکمیل نشده است.' : 'No quests have been completed yet.'}
            </div>
          ) : (
            <div className="space-y-4">
              {quests.completed.map((quest) => (
                <QuestCard key={quest.id} quest={quest} mode="completed" />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-2 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">{isRTL ? 'جمع‌بندی رشد' : 'Growth snapshot'}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {isRTL
                ? `در حال حاضر ${quests.active.length} مأموریت فعال دارید، ${quests.completed.length} مأموریت را کامل کرده‌اید و مجموع پیشرفت ثبت‌شده در گام‌های فعال ${activeSummary.toLocaleString('fa-IR')} است.`
                : `You currently have ${quests.active.length} active quests, have completed ${quests.completed.length} quests, and have logged ${activeSummary.toLocaleString('en-US')} total progress points across active steps.`}
            </p>
            <div className="mt-4">
              <Link href={`/${locale}/leaderboard`} className="text-sm text-primary hover:underline">
                {isRTL ? 'مشاهده رتبه‌بندی برای دنبال‌کردن رشد' : 'View leaderboard to track growth'}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
