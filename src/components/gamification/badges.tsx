'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn, toPersianDigits } from '@/lib/utils';
import { Trophy, Star, Lock, Check } from 'lucide-react';

// Badge rarity configuration
const rarityConfig = {
  common: {
    name: { en: 'Common', fa: 'معمولی' },
    color: 'from-gray-400 to-gray-500',
    border: 'border-gray-300',
    glow: '',
  },
  rare: {
    name: { en: 'Rare', fa: 'کمیاب' },
    color: 'from-blue-400 to-blue-600',
    border: 'border-blue-400',
    glow: 'shadow-blue-400/30',
  },
  epic: {
    name: { en: 'Epic', fa: 'حماسی' },
    color: 'from-purple-400 to-purple-600',
    border: 'border-purple-400',
    glow: 'shadow-purple-400/40',
  },
  legendary: {
    name: { en: 'Legendary', fa: 'افسانه‌ای' },
    color: 'from-amber-400 to-orange-500',
    border: 'border-amber-400',
    glow: 'shadow-amber-400/50 animate-pulse-soft',
  },
  mythic: {
    name: { en: 'Mythic', fa: 'اسطوره‌ای' },
    color: 'from-pink-400 via-purple-500 to-indigo-500',
    border: 'border-pink-400',
    glow: 'shadow-pink-400/50 animate-shimmer',
  },
};

type BadgeRarity = keyof typeof rarityConfig;

interface BadgeProps {
  id: string;
  name: string;
  nameFa?: string;
  description: string;
  descriptionFa?: string;
  icon: string; // Emoji
  rarity: BadgeRarity;
  earned?: boolean;
  earnedAt?: Date;
  progress?: number; // 0-100 for locked badges
  size?: 'sm' | 'md' | 'lg';
  locale?: string;
  onClick?: () => void;
}

export function Badge({
  id,
  name,
  nameFa,
  description,
  descriptionFa,
  icon,
  rarity,
  earned = false,
  earnedAt,
  progress,
  size = 'md',
  locale = 'en',
  onClick,
}: BadgeProps) {
  const isRTL = locale === 'fa';
  const config = rarityConfig[rarity];
  const displayName = isRTL && nameFa ? nameFa : name;
  const displayDesc = isRTL && descriptionFa ? descriptionFa : description;

  const sizeClasses = {
    sm: { container: 'w-16 h-16', icon: 'text-2xl', text: 'text-xs' },
    md: { container: 'w-24 h-24', icon: 'text-4xl', text: 'text-sm' },
    lg: { container: 'w-32 h-32', icon: 'text-5xl', text: 'text-base' },
  };

  return (
    <motion.div
      whileHover={{ scale: earned ? 1.05 : 1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center p-2 cursor-pointer transition-all',
        !earned && 'opacity-50 grayscale'
      )}
    >
      {/* Badge Icon Container */}
      <div
        className={cn(
          'relative rounded-full flex items-center justify-center bg-gradient-to-br border-2',
          sizeClasses[size].container,
          config.color,
          config.border,
          earned && config.glow,
          earned && 'shadow-lg'
        )}
      >
        <span className={sizeClasses[size].icon}>{icon}</span>

        {/* Lock overlay for unearned badges */}
        {!earned && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            {progress !== undefined && progress > 0 ? (
              <span className="text-white text-xs font-bold">
                {isRTL ? toPersianDigits(progress.toString()) : progress}%
              </span>
            ) : (
              <Lock className="h-5 w-5 text-white" />
            )}
          </div>
        )}

        {/* Earned checkmark */}
        {earned && (
          <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}

        {/* Progress ring for partial progress */}
        {!earned && progress !== undefined && progress > 0 && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="48%"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              className="text-white/30"
            />
            <circle
              cx="50%"
              cy="50%"
              r="48%"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              strokeDasharray={`${progress * 3.14} 314`}
              className="text-white"
            />
          </svg>
        )}
      </div>

      {/* Badge Name */}
      <p className={cn('mt-2 font-medium text-center', sizeClasses[size].text)}>
        {displayName}
      </p>

      {/* Rarity Tag */}
      <span
        className={cn(
          'px-2 py-0.5 rounded-full text-xs font-medium capitalize mt-1',
          rarity === 'common' && 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
          rarity === 'rare' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          rarity === 'epic' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
          rarity === 'legendary' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
          rarity === 'mythic' && 'bg-gradient-to-r from-pink-100 to-indigo-100 text-purple-700 dark:from-pink-900/30 dark:to-indigo-900/30 dark:text-pink-400'
        )}
      >
        {isRTL ? config.name.fa : config.name.en}
      </span>
    </motion.div>
  );
}

// Badge Grid Component
interface BadgeGridProps {
  badges: BadgeProps[];
  locale?: string;
  columns?: number;
}

export function BadgeGrid({ badges, locale = 'en', columns = 4 }: BadgeGridProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeProps | null>(null);

  return (
    <div className="space-y-4">
      <div
        className={cn('grid gap-4')}
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {badges.map((badge) => (
          <Badge
            key={badge.id}
            {...badge}
            locale={locale}
            onClick={() => setSelectedBadge(badge)}
          />
        ))}
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedBadge(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4"
          >
            <div className="flex flex-col items-center">
              <Badge {...selectedBadge} locale={locale} size="lg" />
              <p className="mt-4 text-center text-muted-foreground">
                {locale === 'fa' && selectedBadge.descriptionFa
                  ? selectedBadge.descriptionFa
                  : selectedBadge.description}
              </p>
              {selectedBadge.earnedAt && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {locale === 'fa' ? 'کسب شده در:' : 'Earned:'}{' '}
                  {new Date(selectedBadge.earnedAt).toLocaleDateString(
                    locale === 'fa' ? 'fa-IR' : 'en-US'
                  )}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedBadge(null)}
              className="mt-6 w-full py-2 rounded-lg bg-muted hover:bg-muted/80"
            >
              {locale === 'fa' ? 'بستن' : 'Close'}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// XP Display Component
interface XPDisplayProps {
  current: number;
  level: number;
  nextLevel: number;
  locale?: string;
  compact?: boolean;
}

export function XPDisplay({
  current,
  level,
  nextLevel,
  locale = 'en',
  compact = false,
}: XPDisplayProps) {
  const isRTL = locale === 'fa';
  const percentage = Math.min((current / nextLevel) * 100, 100);
  const displayCurrent = isRTL ? toPersianDigits(current.toString()) : current.toLocaleString();
  const displayNext = isRTL ? toPersianDigits(nextLevel.toString()) : nextLevel.toLocaleString();
  const displayLevel = isRTL ? toPersianDigits(level.toString()) : level;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-900 text-sm font-bold">
          <Star className="h-3 w-3" />
          <span>{displayLevel}</span>
        </div>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-300 font-bold text-amber-900">
            {displayLevel}
          </div>
          <div>
            <p className="text-sm font-medium">
              {isRTL ? 'سطح' : 'Level'} {displayLevel}
            </p>
            <p className="text-xs text-muted-foreground">
              {displayCurrent} / {displayNext} XP
            </p>
          </div>
        </div>
        <Trophy className="h-6 w-6 text-amber-500" />
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </motion.div>
      </div>
    </div>
  );
}

// Leaderboard Component
interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  xp: number;
  level: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  locale?: string;
  title?: string;
}

export function Leaderboard({
  entries,
  currentUserId,
  locale = 'en',
  title,
}: LeaderboardProps) {
  const isRTL = locale === 'fa';

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  return (
    <div className="space-y-3">
      {title && <h3 className="font-semibold text-lg">{title}</h3>}
      
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.userId}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg transition-colors',
              entry.userId === currentUserId
                ? 'bg-primary/10 border border-primary/20'
                : 'bg-muted/50 hover:bg-muted'
            )}
          >
            {/* Rank */}
            <div className="w-8 text-center">
              {getMedalEmoji(entry.rank) || (
                <span className="text-muted-foreground font-medium">
                  {isRTL ? toPersianDigits(entry.rank.toString()) : entry.rank}
                </span>
              )}
            </div>

            {/* Avatar */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-medium">
                {entry.name.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-yellow-300 flex items-center justify-center text-xs font-bold text-amber-900">
                {isRTL ? toPersianDigits(entry.level.toString()) : entry.level}
              </div>
            </div>

            {/* Name */}
            <div className="flex-1">
              <p className="font-medium">{entry.name}</p>
              {entry.userId === currentUserId && (
                <p className="text-xs text-primary">
                  {isRTL ? 'شما' : 'You'}
                </p>
              )}
            </div>

            {/* XP */}
            <div className="text-end">
              <p className="font-bold text-amber-600">
                {isRTL
                  ? toPersianDigits(entry.xp.toLocaleString())
                  : entry.xp.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">XP</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
