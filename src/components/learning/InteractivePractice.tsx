'use client';

import { useState, useCallback } from 'react';
import {
  CheckCircle2, XCircle, Lightbulb, Trophy, Star,
  ArrowRight, ArrowLeft, RefreshCw, Zap, Target,
  Flame, BookOpen, Brain
} from 'lucide-react';

export interface PracticeQuestion {
  id: string;
  type: 'multiple-choice' | 'fill-blank' | 'drag-drop' | 'match' | 'order';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  questionFA?: string;
  options?: string[];
  optionsFA?: string[];
  correctAnswer: number | string | number[];
  explanation: string;
  explanationFA?: string;
  hint?: string;
  hintFA?: string;
  xp: number;
  skill: string;
}

interface InteractivePracticeProps {
  questions: PracticeQuestion[];
  locale: string;
  onComplete?: (score: number, xpEarned: number) => void;
  skillName?: string;
  skillNameFA?: string;
}

export function InteractivePractice({
  questions,
  locale,
  onComplete,
  skillName = 'Math',
  skillNameFA = 'ریاضی'
}: InteractivePracticeProps) {
  const isRTL = locale === 'fa';
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [skillLevel, setSkillLevel] = useState(50); // IXL-style skill score
  const [showExplanation, setShowExplanation] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [animation, setAnimation] = useState<'correct' | 'wrong' | null>(null);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Adaptive difficulty - IXL style
  const getSkillColor = () => {
    if (skillLevel >= 80) return 'text-green-500';
    if (skillLevel >= 60) return 'text-blue-500';
    if (skillLevel >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const handleAnswer = useCallback((answerIndex: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    
    const correct = answerIndex === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    
    if (correct) {
      setAnimation('correct');
      setStreak(prev => prev + 1);
      setMaxStreak(prev => Math.max(prev, streak + 1));
      setScore(prev => prev + 1);
      
      // IXL-style skill progression
      const xpMultiplier = streak >= 3 ? 1.5 : 1;
      const earnedXP = Math.round(currentQuestion.xp * xpMultiplier);
      setTotalXP(prev => prev + earnedXP);
      
      // Skill level increases more for harder questions
      const difficultyBonus = currentQuestion.difficulty === 'hard' ? 8 : 
                              currentQuestion.difficulty === 'medium' ? 5 : 3;
      setSkillLevel(prev => Math.min(100, prev + difficultyBonus));
    } else {
      setAnimation('wrong');
      setStreak(0);
      
      // Skill level decreases on wrong answers
      const difficultyPenalty = currentQuestion.difficulty === 'easy' ? 8 : 
                                currentQuestion.difficulty === 'medium' ? 5 : 3;
      setSkillLevel(prev => Math.max(0, prev - difficultyPenalty));
    }

    setTimeout(() => setAnimation(null), 600);
  }, [isAnswered, currentQuestion, streak]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowHint(false);
      setShowExplanation(false);
    } else {
      setCompleted(true);
      onComplete?.(score, totalXP);
    }
  };

  const handleHint = () => {
    if (!showHint && !isAnswered) {
      setShowHint(true);
    }
  };

  const handleTryAgain = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setStreak(0);
    setScore(0);
    setTotalXP(0);
    setShowHint(false);
    setSkillLevel(50);
    setCompleted(false);
  };

  if (completed) {
    const percentage = Math.round((score / questions.length) * 100);
    const stars = percentage >= 90 ? 3 : percentage >= 70 ? 2 : percentage >= 50 ? 1 : 0;
    
    return (
      <div className="bg-card border rounded-2xl p-8 text-center space-y-6">
        {/* Celebration Animation */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
            <Trophy className="h-12 w-12 text-white" />
          </div>
          {stars > 0 && (
            <div className="flex justify-center gap-2 mt-4">
              {[...Array(3)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-8 w-8 ${i < stars ? 'text-amber-400 fill-amber-400' : 'text-muted'}`}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold">
            {isRTL ? 'تبریک! تمرین کامل شد' : 'Practice Complete!'}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isRTL ? `مهارت ${skillNameFA}` : `${skillName} Skill`}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
            <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-600">{score}/{questions.length}</p>
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'پاسخ صحیح' : 'Correct'}
            </p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
            <Zap className="h-6 w-6 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-600">+{totalXP}</p>
            <p className="text-xs text-muted-foreground">XP</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
            <Flame className="h-6 w-6 text-purple-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-purple-600">{maxStreak}</p>
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'بیشترین پی‌در‌پی' : 'Best Streak'}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <Brain className="h-6 w-6 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-600">{skillLevel}</p>
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'امتیاز مهارت' : 'Skill Score'}
            </p>
          </div>
        </div>

        {/* Skill Progress Bar */}
        <div className="max-w-sm mx-auto">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">
              {isRTL ? 'سطح مهارت' : 'Skill Level'}
            </span>
            <span className={`font-bold ${getSkillColor()}`}>{skillLevel}/100</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500"
              style={{ width: `${skillLevel}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleTryAgain}
            className="px-6 py-3 rounded-xl border hover:bg-muted flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {isRTL ? 'تلاش مجدد' : 'Try Again'}
          </button>
          <button
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground flex items-center gap-2"
          >
            {isRTL ? 'ادامه' : 'Continue'}
            {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-2xl overflow-hidden">
      {/* Header with Progress & Stats */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white dark:bg-card rounded-full px-3 py-1 shadow-sm">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{isRTL ? skillNameFA : skillName}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>{currentIndex + 1}</span>
              <span>/</span>
              <span>{questions.length}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Streak */}
            {streak > 0 && (
              <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 rounded-full px-3 py-1">
                <Flame className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-bold text-amber-600">{streak}</span>
              </div>
            )}
            
            {/* Skill Score */}
            <div className={`flex items-center gap-1 ${getSkillColor()}`}>
              <Target className="h-4 w-4" />
              <span className="text-sm font-bold">{skillLevel}</span>
            </div>
            
            {/* XP */}
            <div className="flex items-center gap-1 text-amber-600">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-bold">+{totalXP}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Area */}
      <div className={`p-6 transition-all duration-300 ${
        animation === 'correct' ? 'bg-green-50 dark:bg-green-900/10' :
        animation === 'wrong' ? 'bg-red-50 dark:bg-red-900/10' : ''
      }`}>
        {/* Difficulty Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs px-2 py-1 rounded-full ${
            currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {isRTL 
              ? (currentQuestion.difficulty === 'easy' ? 'آسان' : currentQuestion.difficulty === 'medium' ? 'متوسط' : 'سخت')
              : currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)
            }
          </span>
          <span className="text-xs text-muted-foreground">+{currentQuestion.xp} XP</span>
        </div>

        {/* Question */}
        <h3 className="text-xl font-semibold mb-6">
          {isRTL && currentQuestion.questionFA ? currentQuestion.questionFA : currentQuestion.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options?.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectOption = currentQuestion.correctAnswer === index;
            const optionText = isRTL && currentQuestion.optionsFA ? currentQuestion.optionsFA[index] : option;
            
            let optionStyle = 'border-2 hover:border-primary/50 hover:bg-muted/50';
            
            if (isAnswered) {
              if (isCorrectOption) {
                optionStyle = 'border-2 border-green-500 bg-green-50 dark:bg-green-900/20';
              } else if (isSelected && !isCorrect) {
                optionStyle = 'border-2 border-red-500 bg-red-50 dark:bg-red-900/20';
              } else {
                optionStyle = 'border-2 border-muted opacity-50';
              }
            } else if (isSelected) {
              optionStyle = 'border-2 border-primary bg-primary/10';
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={isAnswered}
                className={`w-full p-4 rounded-xl text-start transition-all ${optionStyle}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isAnswered && isCorrectOption ? 'bg-green-500 text-white' :
                    isAnswered && isSelected && !isCorrect ? 'bg-red-500 text-white' :
                    isSelected ? 'bg-primary text-primary-foreground' :
                    'bg-muted'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1">{optionText}</span>
                  {isAnswered && isCorrectOption && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Hint */}
        {showHint && currentQuestion.hint && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {isRTL && currentQuestion.hintFA ? currentQuestion.hintFA : currentQuestion.hint}
              </p>
            </div>
          </div>
        )}

        {/* Explanation after answer */}
        {isAnswered && (
          <div className={`mt-4 p-4 rounded-xl ${
            isCorrect 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
              )}
              <div>
                <p className={`font-semibold ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {isCorrect 
                    ? (isRTL ? 'آفرین! پاسخ صحیح است' : 'Correct! Well done!') 
                    : (isRTL ? 'پاسخ نادرست' : 'Incorrect')
                  }
                  {isCorrect && streak >= 3 && (
                    <span className="ms-2 text-amber-500">🔥 {streak}x Streak!</span>
                  )}
                </p>
                {showExplanation && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    {isRTL && currentQuestion.explanationFA 
                      ? currentQuestion.explanationFA 
                      : currentQuestion.explanation
                    }
                  </p>
                )}
                {!showExplanation && (
                  <button
                    onClick={() => setShowExplanation(true)}
                    className="text-sm text-primary hover:underline mt-2"
                  >
                    {isRTL ? 'نمایش توضیح' : 'Show explanation'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
        <div>
          {!isAnswered && currentQuestion.hint && (
            <button
              onClick={handleHint}
              disabled={showHint}
              className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
                showHint ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'
              }`}
            >
              <Lightbulb className="h-4 w-4" />
              {isRTL ? 'راهنمایی' : 'Hint'}
            </button>
          )}
        </div>
        
        {isAnswered && (
          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2"
          >
            {currentIndex < questions.length - 1 
              ? (isRTL ? 'سوال بعدی' : 'Next Question')
              : (isRTL ? 'پایان تمرین' : 'Finish Practice')
            }
            {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
