'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Trophy,
  Target,
  CheckCircle,
  Clock,
  Coins,
  Flame,
  Star,
  ChevronRight,
  Play,
  CheckCheck,
  XCircle,
} from 'lucide-react';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';

interface QuestStep {
  id: string;
  sequence: number;
  title: string;
  titleFA?: string;
  description?: string;
  descriptionFA?: string;
  xpReward: number;
  criteria: any;
}

interface Quest {
  id: string;
  code: string;
  title: string;
  titleFA?: string;
  description?: string;
  descriptionFA?: string;
  narrative?: string;
  narrativeFA?: string;
  category: string;
  xpReward: number;
  coinReward: number;
  startDate?: string;
  endDate?: string;
  steps: QuestStep[];
  userProgress?: {
    status: string;
    currentStep: number;
    startedAt?: string;
    completedAt?: string;
    stepProgress?: {
      completed: boolean;
      progress: number;
      target: number;
    };
  };
}

interface QuestsData {
  active: Quest[];
  completed: Quest[];
  available: Quest[];
}

export default function QuestsPage() {
  const t = useTranslations();
  const [quests, setQuests] = useState<QuestsData>({
    active: [],
    completed: [],
    available: [],
  });
  const [activeTab, setActiveTab] = useState<'active' | 'available' | 'completed'>('active');
  const [loading, setLoading] = useState(true);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      const response = await fetch('/api/v1/student/quests', {
        headers: createUserHeaders(getStoredUserId()),
      });
      const result = await response.json();
      if (result.success) {
        setQuests(result.data);
      }
    } catch (error) {
      console.error('Error fetching quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuest = async (questId: string) => {
    try {
      const response = await fetch('/api/v1/student/quests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...createUserHeaders(getStoredUserId()),
        },
        body: JSON.stringify({ questId }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchQuests();
        setSelectedQuest(null);
      }
    } catch (error) {
      console.error('Error starting quest:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      PERSIAN_MYTHOLOGY: 'purple',
      ISLAMIC_SCHOLARS: 'green',
      GLOBAL_SCIENCE: 'blue',
      CITIZENSHIP: 'orange',
      SEASONAL: 'pink',
    };
    return colors[category] || 'gray';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, JSX.Element> = {
      PERSIAN_MYTHOLOGY: <Star className="h-5 w-5" />,
      ISLAMIC_SCHOLARS: <Trophy className="h-5 w-5" />,
      GLOBAL_SCIENCE: <Target className="h-5 w-5" />,
      CITIZENSHIP: <Flame className="h-5 w-5" />,
      SEASONAL: <Clock className="h-5 w-5" />,
    };
    return icons[category] || <Target className="h-5 w-5" />;
  };

  const formatTimeRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) {
      return `${hours}h remaining`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d remaining`;
  };

  const QuestCard = ({ quest, isActive }: { quest: Quest; isActive?: boolean }) => {
    const color = getCategoryColor(quest.category);
    const icon = getCategoryIcon(quest.category);
    const timeRemaining = formatTimeRemaining(quest.endDate);
    const isCompleted = quest.userProgress?.status === 'COMPLETED';
    const isExpired = quest.userProgress?.status === 'EXPIRED';

    const progressPercentage = isActive && quest.userProgress?.stepProgress
      ? (quest.userProgress.stepProgress.progress / quest.userProgress.stepProgress.target) * 100
      : 0;

    return (
      <div
        className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
          isActive
            ? `border-${color}-500 bg-${color}-50/50`
            : isCompleted
            ? 'border-green-500 bg-green-50/50'
            : isExpired
            ? 'border-gray-300 bg-gray-50 opacity-60'
            : 'border-gray-200 bg-white hover:border-purple-300'
        }`}
        onClick={() => setSelectedQuest(quest)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isCompleted
                  ? 'bg-green-100 text-green-600'
                  : isExpired
                  ? 'bg-gray-100 text-gray-400'
                  : `bg-${color}-100 text-${color}-600`
              }`}
            >
              {isCompleted ? <CheckCheck className="h-6 w-6" /> : isExpired ? <XCircle className="h-6 w-6" /> : icon}
            </div>
            <div>
              <h3 className="font-bold text-lg">{quest.title}</h3>
              <p className="text-sm text-gray-500">{quest.description}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>

        {/* Progress bar for active quests */}
        {isActive && quest.userProgress?.stepProgress && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">
                Step {(quest.userProgress.currentStep || 0) + 1} of {quest.steps.length}
              </span>
              <span className="font-semibold text-purple-600">
                {quest.userProgress.stepProgress.progress} / {quest.userProgress.stepProgress.target}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Rewards */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-yellow-600">
            <Trophy className="h-4 w-4" />
            <span className="font-semibold">{quest.xpReward} XP</span>
          </div>
          {quest.coinReward > 0 && (
            <div className="flex items-center gap-1 text-orange-600">
              <Coins className="h-4 w-4" />
              <span className="font-semibold">{quest.coinReward} Coins</span>
            </div>
          )}
          {timeRemaining && (
            <div className="flex items-center gap-1 text-red-500 ml-auto">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-semibold">{timeRemaining}</span>
            </div>
          )}
        </div>

        {/* Completion badge */}
        {isCompleted && quest.userProgress?.completedAt && (
          <div className="mt-3 text-xs text-green-600 flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Completed on {new Date(quest.userProgress.completedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    );
  };

  const QuestDetailModal = ({ quest }: { quest: Quest }) => {
    const color = getCategoryColor(quest.category);
    const icon = getCategoryIcon(quest.category);
    const isActive = quest.userProgress?.status === 'IN_PROGRESS';
    const isCompleted = quest.userProgress?.status === 'COMPLETED';
    const canStart = !quest.userProgress || quest.userProgress.status === 'EXPIRED';

    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={() => setSelectedQuest(null)}
      >
        <div
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-8 bg-gradient-to-br from-${color}-500 to-${color}-600 text-white rounded-t-2xl`}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-xl">{icon}</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{quest.title}</h2>
                <p className="text-white/90">{quest.description}</p>
              </div>
            </div>

            {/* Rewards */}
            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                <span className="text-xl font-bold">{quest.xpReward} XP</span>
              </div>
              {quest.coinReward > 0 && (
                <div className="flex items-center gap-2">
                  <Coins className="h-6 w-6" />
                  <span className="text-xl font-bold">{quest.coinReward} Coins</span>
                </div>
              )}
            </div>
          </div>

          {/* Narrative */}
          {quest.narrative && (
            <div className="p-6 bg-gray-50 border-b">
              <p className="text-gray-700 italic">{quest.narrative}</p>
            </div>
          )}

          {/* Steps */}
          <div className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Quest Steps
            </h3>
            <div className="space-y-3">
              {quest.steps.map((step, index) => {
                const isCurrentStep = isActive && quest.userProgress?.currentStep === index;
                const isStepCompleted = isActive && (quest.userProgress?.currentStep || 0) > index;

                return (
                  <div
                    key={step.id}
                    className={`p-4 rounded-lg border-2 ${
                      isStepCompleted
                        ? 'border-green-500 bg-green-50'
                        : isCurrentStep
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          isStepCompleted
                            ? 'bg-green-500 text-white'
                            : isCurrentStep
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {isStepCompleted ? <CheckCircle className="h-5 w-5" /> : index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold">{step.title}</h4>
                          {step.xpReward > 0 && (
                            <span className="text-sm text-yellow-600 font-semibold flex items-center gap-1">
                              <Trophy className="h-4 w-4" />
                              +{step.xpReward} XP
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{step.description}</p>

                        {/* Current step progress */}
                        {isCurrentStep && quest.userProgress?.stepProgress && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Progress</span>
                              <span className="font-semibold">
                                {quest.userProgress.stepProgress.progress} / {quest.userProgress.stepProgress.target}
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                style={{
                                  width: `${Math.min(
                                    (quest.userProgress.stepProgress.progress /
                                      quest.userProgress.stepProgress.target) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-6 border-t flex gap-3">
            <button
              onClick={() => setSelectedQuest(null)}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            {canStart && (
              <button
                onClick={() => startQuest(quest.id)}
                className={`flex-1 px-6 py-3 bg-gradient-to-r from-${color}-500 to-${color}-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2`}
              >
                <Play className="h-5 w-5" />
                Start Quest
              </button>
            )}
            {isCompleted && (
              <div className="flex-1 px-6 py-3 bg-green-100 text-green-700 rounded-lg font-semibold flex items-center justify-center gap-2">
                <CheckCheck className="h-5 w-5" />
                Completed
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading quests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🎯 Quests
          </h1>
          <p className="text-gray-600">Complete quests to earn XP, coins, and unlock achievements!</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl shadow-sm">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'active'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Active ({quests.active.length})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'available'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Available ({quests.available.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'completed'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Completed ({quests.completed.length})
          </button>
        </div>

        {/* Quest list */}
        <div className="space-y-4">
          {activeTab === 'active' &&
            (quests.active.length > 0 ? (
              quests.active.map((quest) => <QuestCard key={quest.id} quest={quest} isActive />)
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Active Quests</h3>
                <p className="text-gray-500">Start a quest from the Available tab to begin your adventure!</p>
              </div>
            ))}

          {activeTab === 'available' &&
            (quests.available.length > 0 ? (
              quests.available.map((quest) => <QuestCard key={quest.id} quest={quest} />)
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <CheckCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Available Quests</h3>
                <p className="text-gray-500">Check back later for new quests!</p>
              </div>
            ))}

          {activeTab === 'completed' &&
            (quests.completed.length > 0 ? (
              quests.completed.map((quest) => <QuestCard key={quest.id} quest={quest} />)
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Completed Quests Yet</h3>
                <p className="text-gray-500">Complete quests to see them here!</p>
              </div>
            ))}
        </div>
      </div>

      {/* Quest detail modal */}
      {selectedQuest && <QuestDetailModal quest={selectedQuest} />}
    </div>
  );
}
