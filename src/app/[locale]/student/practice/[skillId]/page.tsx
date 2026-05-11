'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { CheckCircle, XCircle, Lightbulb, Trophy, Clock } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  textFA?: string;
  options: { id: string; text: string; textFA?: string; isCorrect: boolean }[];
  hints?: string[];
  irtDifficulty?: number;
}

interface SessionState {
  sessionId: string;
  currentQuestion: Question | null;
  currentMastery: number;
  currentAbility: number;
  questionsAnswered: number;
  questionsCorrect: number;
  timeStarted: number;
  hintsUsed: number;
}

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('practice');
  const tCommon = useTranslations('common');
  const locale = params.locale as string;
  const skillId = params.skillId as string;

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionState | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [showHint, setShowHint] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [pageFeedback, setPageFeedback] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Timer
  useEffect(() => {
    if (session && !showFeedback) {
      const interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - session.timeStarted) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [session, showFeedback]);

  // Start practice session
  useEffect(() => {
    startSession();
  }, [skillId]);

  const startSession = async () => {
    try {
      setLoading(true);
      setPageFeedback(null);
      const res = await fetch('/api/v1/practice/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId, sessionType: 'PRACTICE' }),
      });

      if (!res.ok) throw new Error('Failed to start session');

      const data = await res.json();
      setSession({
        sessionId: data.sessionId,
        currentQuestion: data.firstQuestion,
        currentMastery: data.currentMastery,
        currentAbility: data.currentAbility,
        questionsAnswered: 0,
        questionsCorrect: 0,
        timeStarted: Date.now(),
        hintsUsed: 0,
      });
    } catch (error) {
      console.error('Error starting session:', error);
      setPageFeedback({
        variant: 'error',
        message: locale === 'fa' ? 'شروع جلسه تمرین ناموفق بود.' : 'Failed to start practice session.',
      });
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !session) return;

    try {
      setPageFeedback(null);
      const res = await fetch('/api/v1/practice/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          questionId: session.currentQuestion?.id,
          answer: selectedAnswer,
          timeSpentSeconds: timeSpent,
          hintsUsed: showHint ? 1 : 0,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit answer');

      const data = await res.json();
      setFeedback(data);
      setShowFeedback(true);

      // Update session state
      setSession({
        ...session,
        questionsAnswered: session.questionsAnswered + 1,
        questionsCorrect: data.isCorrect
          ? session.questionsCorrect + 1
          : session.questionsCorrect,
        currentMastery: data.newMastery,
        currentAbility: data.newAbility,
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
      setPageFeedback({
        variant: 'error',
        message: locale === 'fa' ? 'ارسال پاسخ ناموفق بود.' : 'Failed to submit answer.',
      });
    }
  };

  const nextQuestion = () => {
    if (!feedback) return;

    if (feedback.sessionComplete) {
      endSession('COMPLETED');
    } else {
      setSession({
        ...session!,
        currentQuestion: feedback.nextQuestion,
        timeStarted: Date.now(),
        hintsUsed: 0,
      });
      setSelectedAnswer(null);
      setShowFeedback(false);
      setFeedback(null);
      setShowHint(false);
      setTimeSpent(0);
    }
  };

  const endSession = async (reason: string = 'QUIT') => {
    if (!session) return;

    try {
      setPageFeedback(null);
      const res = await fetch('/api/v1/practice/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          exitReason: reason,
        }),
      });

      if (!res.ok) throw new Error('Failed to end session');

      await res.json();
      router.push(
        `/${locale}/student/practice/results?sessionId=${session.sessionId}`
      );
    } catch (error) {
      console.error('Error ending session:', error);
      setPageFeedback({
        variant: 'error',
        message: locale === 'fa' ? 'پایان جلسه ناموفق بود.' : 'Failed to end session.',
      });
    }
  };

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{tCommon('loading')}...</p>
        </div>
      </div>
    );
  }

  const question = session.currentQuestion;
  if (!question) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <p className="text-lg">{t('noQuestionsAvailable')}</p>
          <Button onClick={() => router.back()} className="mt-4">
            {tCommon('back')}
          </Button>
        </Card>
      </div>
    );
  }

  const accuracy = session.questionsAnswered > 0
    ? Math.round((session.questionsCorrect / session.questionsAnswered) * 100)
    : 0;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header with progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{t('practice')}</h1>
            <p className="text-gray-600">
              {t('question')} {session.questionsAnswered + 1}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <span className="font-mono">{Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => endSession('QUIT')}
            >
              {t('quit')}
            </Button>
          </div>
        </div>

        {/* Mastery progress */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between text-sm mb-2">
            <span>{t('mastery')}</span>
            <span className="font-bold">{session.currentMastery}%</span>
          </div>
          <Progress value={session.currentMastery} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{t('accuracy')}: {accuracy}%</span>
            <span>{session.questionsCorrect}/{session.questionsAnswered} {t('correct')}</span>
          </div>
        </div>
      </div>

      {pageFeedback ? (
        <FeedbackBanner className="mb-6" variant={pageFeedback.variant} message={pageFeedback.message} />
      ) : null}

      {/* Question card */}
      <Card className="p-8 mb-6">
        <div className="mb-6">
          <p className="text-lg leading-relaxed">
            {locale === 'fa' ? question.textFA || question.text : question.text}
          </p>
          {question.irtDifficulty !== undefined && (
            <div className="mt-2 text-sm text-gray-500">
              {t('difficulty')}: {Math.round((question.irtDifficulty + 3) / 6 * 100)}%
            </div>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option.text;
            const showCorrect = showFeedback && option.isCorrect;
            const showWrong = showFeedback && isSelected && !option.isCorrect;

            return (
              <button
                key={option.id}
                onClick={() => !showFeedback && setSelectedAnswer(option.text)}
                disabled={showFeedback}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${showCorrect ? 'border-green-500 bg-green-50' : ''} ${
                  showWrong ? 'border-red-500 bg-red-50' : ''
                } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <span>
                    {locale === 'fa' ? option.textFA || option.text : option.text}
                  </span>
                  {showCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {showWrong && <XCircle className="w-5 h-5 text-red-600" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Hint button */}
        {!showFeedback && question.hints && question.hints.length > 0 && (
          <div className="mt-6">
            {!showHint ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHint(true)}
                className="w-full"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                {t('showHint')}
              </Button>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <p className="text-sm">{question.hints[0]}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feedback */}
        {showFeedback && feedback && (
          <div
            className={`mt-6 p-4 rounded-lg border-2 ${
              feedback.isCorrect
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {feedback.isCorrect ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="font-bold text-green-900">{t('correct')}!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-600" />
                  <span className="font-bold text-red-900">{t('incorrect')}</span>
                </>
              )}
            </div>
            <p className="text-sm mt-2">
              {locale === 'fa'
                ? feedback.explanationFA || feedback.explanation
                : feedback.explanation}
            </p>
            {feedback.xpEarned > 0 && (
              <div className="flex items-center gap-2 mt-3 text-blue-600">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">+{feedback.xpEarned} XP</span>
              </div>
            )}
          </div>
        )}

        {/* Action button */}
        <div className="mt-6">
          {!showFeedback ? (
            <Button
              onClick={submitAnswer}
              disabled={!selectedAnswer}
              className="w-full"
              size="lg"
            >
              {t('submitAnswer')}
            </Button>
          ) : (
            <Button onClick={nextQuestion} className="w-full" size="lg">
              {feedback.sessionComplete ? t('viewResults') : t('nextQuestion')}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
