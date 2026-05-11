'use client';

import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type FeedbackVariant = 'success' | 'error' | 'info';

interface FeedbackBannerProps {
  variant?: FeedbackVariant;
  title?: string;
  message: string;
  className?: string;
}

const variantStyles: Record<FeedbackVariant, { icon: typeof Info; className: string }> = {
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-100',
  },
  error: {
    icon: AlertCircle,
    className: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-100',
  },
  info: {
    icon: Info,
    className: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-100',
  },
};

export function FeedbackBanner({ variant = 'info', title, message, className }: FeedbackBannerProps) {
  const { icon: Icon, className: variantClassName } = variantStyles[variant];

  return (
    <div className={cn('flex items-start gap-3 rounded-xl border px-4 py-3', variantClassName, className)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <p className="text-sm leading-6">{message}</p>
      </div>
    </div>
  );
}