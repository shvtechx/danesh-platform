'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-3 w-full overflow-hidden rounded-full bg-secondary',
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        'h-full w-full flex-1 bg-primary transition-all duration-300',
        indicatorClassName
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

// XP Progress Bar - Specialized for gamification
interface XPProgressProps {
  currentXP: number;
  nextLevelXP: number;
  level: number;
  className?: string;
  showLabel?: boolean;
}

const XPProgress = ({
  currentXP,
  nextLevelXP,
  level,
  className,
  showLabel = true,
}: XPProgressProps) => {
  const percentage = Math.min((currentXP / nextLevelXP) * 100, 100);

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Level <span className="text-primary">{level}</span>
          </span>
          <span className="text-muted-foreground">
            {currentXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
          </span>
        </div>
      )}
      <div className="relative h-4 overflow-hidden rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        {/* Stars decoration */}
        <div className="absolute inset-y-0 right-2 flex items-center">
          <span className="text-xs">⭐</span>
        </div>
      </div>
    </div>
  );
};

// Lesson Progress - Shows completion in a lesson
interface LessonProgressProps {
  completed: number;
  total: number;
  className?: string;
}

const LessonProgress = ({ completed, total, className }: LessonProgressProps) => {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Progress</span>
        <span className="font-medium">
          {completed} / {total}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
};

// Streak Progress - For daily streak visualization
interface StreakProgressProps {
  currentStreak: number;
  maxStreak?: number;
  daysOfWeek?: boolean[];
  className?: string;
}

const StreakProgress = ({
  currentStreak,
  maxStreak = 7,
  daysOfWeek = [],
  className,
}: StreakProgressProps) => {
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">🔥 Streak</span>
        <span className="text-lg font-bold text-orange-500">{currentStreak} days</span>
      </div>
      
      {/* Week visualization */}
      <div className="flex gap-1">
        {dayLabels.map((day, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                'h-8 w-full rounded-md transition-all',
                daysOfWeek[index]
                  ? 'bg-gradient-to-t from-orange-500 to-amber-400'
                  : 'bg-muted'
              )}
            />
            <span className="text-xs text-muted-foreground">{day}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Circular Progress - For badges, achievements
interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

const CircularProgress = ({
  value,
  size = 80,
  strokeWidth = 8,
  className,
  children,
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn('relative inline-flex', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-500"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || <span className="text-lg font-bold">{value}%</span>}
      </div>
    </div>
  );
};

export {
  Progress,
  XPProgress,
  LessonProgress,
  StreakProgress,
  CircularProgress,
};
