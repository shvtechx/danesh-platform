'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Mood options with emoji and colors
const moodOptions = [
  { value: 1, emoji: '😢', label: { en: 'Very Sad', fa: 'خیلی ناراحت' }, color: 'from-red-400 to-red-500' },
  { value: 2, emoji: '😔', label: { en: 'Sad', fa: 'ناراحت' }, color: 'from-orange-400 to-orange-500' },
  { value: 3, emoji: '😐', label: { en: 'Neutral', fa: 'معمولی' }, color: 'from-yellow-400 to-yellow-500' },
  { value: 4, emoji: '😊', label: { en: 'Happy', fa: 'خوشحال' }, color: 'from-lime-400 to-green-500' },
  { value: 5, emoji: '😄', label: { en: 'Very Happy', fa: 'خیلی خوشحال' }, color: 'from-green-400 to-emerald-500' },
];

const energyOptions = [
  { value: 1, emoji: '🔋', label: { en: 'Very Low', fa: 'خیلی کم' }, fill: 20 },
  { value: 2, emoji: '🔋', label: { en: 'Low', fa: 'کم' }, fill: 40 },
  { value: 3, emoji: '🔋', label: { en: 'Medium', fa: 'متوسط' }, fill: 60 },
  { value: 4, emoji: '🔋', label: { en: 'High', fa: 'زیاد' }, fill: 80 },
  { value: 5, emoji: '🔋', label: { en: 'Very High', fa: 'خیلی زیاد' }, fill: 100 },
];

const emotionTags = [
  { id: 'anxious', en: 'Anxious', fa: 'مضطرب', emoji: '😰' },
  { id: 'excited', en: 'Excited', fa: 'هیجان‌زده', emoji: '🎉' },
  { id: 'grateful', en: 'Grateful', fa: 'سپاسگزار', emoji: '🙏' },
  { id: 'tired', en: 'Tired', fa: 'خسته', emoji: '😴' },
  { id: 'confident', en: 'Confident', fa: 'با اعتماد به نفس', emoji: '💪' },
  { id: 'stressed', en: 'Stressed', fa: 'استرس‌دار', emoji: '😫' },
  { id: 'calm', en: 'Calm', fa: 'آرام', emoji: '😌' },
  { id: 'frustrated', en: 'Frustrated', fa: 'ناامید', emoji: '😤' },
  { id: 'hopeful', en: 'Hopeful', fa: 'امیدوار', emoji: '🌟' },
  { id: 'lonely', en: 'Lonely', fa: 'تنها', emoji: '😔' },
];

interface MoodCheckinProps {
  locale: string;
  onSubmit: (data: {
    moodScore: number;
    energyLevel?: number;
    emotions: string[];
    notes?: string;
  }) => void;
  onSkip?: () => void;
}

export function MoodCheckin({ locale, onSubmit, onSkip }: MoodCheckinProps) {
  const t = useTranslations();
  const isRTL = locale === 'fa';

  const [step, setStep] = useState<'mood' | 'energy' | 'emotions' | 'notes'>('mood');
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<number | null>(null);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const handleMoodSelect = (value: number) => {
    setSelectedMood(value);
    setTimeout(() => setStep('energy'), 300);
  };

  const handleEnergySelect = (value: number) => {
    setSelectedEnergy(value);
    setTimeout(() => setStep('emotions'), 300);
  };

  const toggleEmotion = (id: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (selectedMood) {
      onSubmit({
        moodScore: selectedMood,
        energyLevel: selectedEnergy || undefined,
        emotions: selectedEmotions,
        notes: notes || undefined,
      });
    }
  };

  const selectedMoodOption = moodOptions.find((m) => m.value === selectedMood);

  return (
    <div className="min-h-[400px] w-full max-w-lg mx-auto">
      <AnimatePresence mode="wait">
        {/* Step 1: Mood Selection */}
        {step === 'mood' && (
          <motion.div
            key="mood"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <h2 className="text-2xl font-bold">
              {isRTL ? 'امروز چطوری؟' : 'How are you feeling today?'}
            </h2>
            <p className="text-muted-foreground">
              {isRTL ? 'حال و هوای امروزت رو انتخاب کن' : 'Select your mood'}
            </p>

            <div className="flex justify-center gap-4">
              {moodOptions.map((mood) => (
                <motion.button
                  key={mood.value}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMoodSelect(mood.value)}
                  className={cn(
                    'text-5xl p-4 rounded-2xl transition-all',
                    selectedMood === mood.value
                      ? `bg-gradient-to-br ${mood.color} shadow-lg ring-4 ring-primary/30`
                      : 'hover:bg-muted'
                  )}
                >
                  {mood.emoji}
                </motion.button>
              ))}
            </div>

            {onSkip && (
              <button
                onClick={onSkip}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {isRTL ? 'رد کردن' : 'Skip for now'}
              </button>
            )}
          </motion.div>
        )}

        {/* Step 2: Energy Level */}
        {step === 'energy' && (
          <motion.div
            key="energy"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="text-6xl mb-4">{selectedMoodOption?.emoji}</div>
            <h2 className="text-2xl font-bold">
              {isRTL ? 'سطح انرژیت چقدره؟' : "What's your energy level?"}
            </h2>

            <div className="flex justify-center gap-3">
              {energyOptions.map((energy) => (
                <motion.button
                  key={energy.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEnergySelect(energy.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl transition-all',
                    selectedEnergy === energy.value
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {/* Battery indicator */}
                  <div className="relative w-8 h-12 border-2 rounded-sm">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-1 bg-current rounded-t" />
                    <div
                      className={cn(
                        'absolute bottom-0 left-0 right-0 rounded-sm transition-all',
                        energy.value <= 2 ? 'bg-red-500' : energy.value === 3 ? 'bg-yellow-500' : 'bg-green-500'
                      )}
                      style={{ height: `${energy.fill}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {isRTL ? energy.label.fa : energy.label.en}
                  </span>
                </motion.button>
              ))}
            </div>

            <button
              onClick={() => setStep('emotions')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {isRTL ? 'رد کردن' : 'Skip'}
            </button>
          </motion.div>
        )}

        {/* Step 3: Emotion Tags */}
        {step === 'emotions' && (
          <motion.div
            key="emotions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <h2 className="text-2xl font-bold">
              {isRTL ? 'چه احساساتی داری؟' : 'What emotions are you feeling?'}
            </h2>
            <p className="text-muted-foreground">
              {isRTL ? 'می‌تونی چند تا انتخاب کنی' : 'Select all that apply'}
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              {emotionTags.map((emotion) => (
                <motion.button
                  key={emotion.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleEmotion(emotion.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all',
                    selectedEmotions.includes(emotion.id)
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  <span>{emotion.emoji}</span>
                  <span>{isRTL ? emotion.fa : emotion.en}</span>
                </motion.button>
              ))}
            </div>

            <div className="flex gap-4 justify-center pt-4">
              <button
                onClick={() => setStep('energy')}
                className="px-6 py-2 rounded-lg border hover:bg-muted"
              >
                {isRTL ? 'قبلی' : 'Back'}
              </button>
              <button
                onClick={() => setStep('notes')}
                className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
              >
                {isRTL ? 'بعدی' : 'Next'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Notes (optional) */}
        {step === 'notes' && (
          <motion.div
            key="notes"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <h2 className="text-2xl font-bold">
              {isRTL ? 'می‌خوای چیزی اضافه کنی؟' : 'Anything you want to add?'}
            </h2>
            <p className="text-muted-foreground">
              {isRTL ? 'اختیاری - فقط برای خودت' : 'Optional - just for you'}
            </p>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isRTL ? 'افکار، احساسات، یا هر چیز دیگه‌ای...' : 'Your thoughts, feelings, or anything else...'}
              className="w-full h-32 p-4 rounded-xl border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              dir={isRTL ? 'rtl' : 'ltr'}
            />

            <div className="flex gap-4 justify-center pt-4">
              <button
                onClick={() => setStep('emotions')}
                className="px-6 py-2 rounded-lg border hover:bg-muted"
              >
                {isRTL ? 'قبلی' : 'Back'}
              </button>
              <button
                onClick={handleSubmit}
                className="px-8 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 flex items-center gap-2"
              >
                ✨ {isRTL ? 'ثبت' : 'Submit'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact mood indicator for dashboard
interface MoodIndicatorProps {
  moodScore: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  locale?: string;
}

export function MoodIndicator({
  moodScore,
  size = 'md',
  showLabel = false,
  locale = 'en',
}: MoodIndicatorProps) {
  const mood = moodOptions.find((m) => m.value === moodScore) || moodOptions[2];
  const isRTL = locale === 'fa';

  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={sizeClasses[size]}>{mood.emoji}</span>
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {isRTL ? mood.label.fa : mood.label.en}
        </span>
      )}
    </div>
  );
}

// Weekly mood chart
interface WeeklyMoodChartProps {
  data: { date: string; moodScore: number }[];
  locale?: string;
}

export function WeeklyMoodChart({ data, locale = 'en' }: WeeklyMoodChartProps) {
  const isRTL = locale === 'fa';
  const dayLabels = isRTL
    ? ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-2">
      <div className={cn('flex gap-1', isRTL && 'flex-row-reverse')}>
        {dayLabels.map((day, index) => {
          const dayData = data[index];
          const mood = dayData
            ? moodOptions.find((m) => m.value === dayData.moodScore)
            : null;

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-sm',
                  mood ? `bg-gradient-to-br ${mood.color}` : 'bg-muted'
                )}
              >
                {mood ? mood.emoji : '-'}
              </div>
              <span className="text-xs text-muted-foreground">{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
