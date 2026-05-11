'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FileQuestion, Clock, CheckCircle, XCircle, PlayCircle, Trophy, Target, BarChart } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

export default function AssessmentsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const [activeFilter, setActiveFilter] = useState<'all' | 'quiz' | 'exam' | 'practice'>('all');

  const assessments = [
    {
      id: '1',
      title: isRTL ? 'آزمون ریاضی - فصل ۳' : 'Math Quiz - Chapter 3',
      subject: isRTL ? 'ریاضی' : 'Mathematics',
      type: 'quiz',
      questions: 15,
      duration: 20,
      status: 'completed',
      score: 85,
      dueDate: '2026-04-20',
    },
    {
      id: '2',
      title: isRTL ? 'امتحان علوم تجربی' : 'Science Exam',
      subject: isRTL ? 'علوم' : 'Science',
      type: 'exam',
      questions: 30,
      duration: 45,
      status: 'available',
      score: null,
      dueDate: '2026-04-25',
    },
    {
      id: '3',
      title: isRTL ? 'تمرین گرامر انگلیسی' : 'English Grammar Practice',
      subject: isRTL ? 'انگلیسی' : 'English',
      type: 'practice',
      questions: 20,
      duration: 30,
      status: 'in-progress',
      score: null,
      dueDate: '2026-04-18',
    },
    {
      id: '4',
      title: isRTL ? 'آزمونک ادبیات فارسی' : 'Persian Literature Quiz',
      subject: isRTL ? 'ادبیات' : 'Literature',
      type: 'quiz',
      questions: 10,
      duration: 15,
      status: 'missed',
      score: null,
      dueDate: '2026-04-10',
    },
  ];

  const statusIcons = {
    completed: CheckCircle,
    available: PlayCircle,
    'in-progress': Clock,
    missed: XCircle,
  };

  const statusColors = {
    completed: 'text-green-500',
    available: 'text-blue-500',
    'in-progress': 'text-amber-500',
    missed: 'text-red-500',
  };

  const statusLabels = {
    completed: isRTL ? 'تکمیل شده' : 'Completed',
    available: isRTL ? 'آماده' : 'Available',
    'in-progress': isRTL ? 'در حال انجام' : 'In Progress',
    missed: isRTL ? 'از دست رفته' : 'Missed',
  };

  const filteredAssessments = assessments.filter((assessment) =>
    activeFilter === 'all' ? true : assessment.type === activeFilter
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        locale={locale} 
        title={t('assessments.title')}
        backHref={`/${locale}/dashboard`}
        backLabel={isRTL ? 'داشبورد' : 'Dashboard'}
      />
      <div className="space-y-8 p-6">
        <div>
          <p className="text-muted-foreground mt-2">
            {isRTL ? 'آزمون‌ها و تمرین‌های شما' : 'Your quizzes and assessments'}
          </p>
        </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">24</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'تکمیل شده' : 'Completed'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <PlayCircle className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'در انتظار' : 'Pending'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">87%</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'میانگین نمره' : 'Average Score'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Target className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">5</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'نمره کامل' : 'Perfect Scores'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 border-b-2 font-medium ${
            activeFilter === 'all' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {isRTL ? 'همه' : 'All'}
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('quiz')}
          className={`px-4 py-2 border-b-2 ${
            activeFilter === 'quiz' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('assessments.quiz')}
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('exam')}
          className={`px-4 py-2 border-b-2 ${
            activeFilter === 'exam' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('assessments.exam')}
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('practice')}
          className={`px-4 py-2 border-b-2 ${
            activeFilter === 'practice' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('assessments.practice')}
        </button>
      </div>

      {/* Assessment List */}
      <div className="space-y-4">
        {filteredAssessments.map((assessment) => {
          const StatusIcon = statusIcons[assessment.status as keyof typeof statusIcons];
          return (
            <div
              key={assessment.id}
              className="flex items-center gap-4 rounded-xl border bg-card p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <FileQuestion className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{assessment.title}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {assessment.subject}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span>{assessment.questions} {isRTL ? 'سوال' : 'questions'}</span>
                  <span>{assessment.duration} {isRTL ? 'دقیقه' : 'min'}</span>
                  <span className={`flex items-center gap-1 ${statusColors[assessment.status as keyof typeof statusColors]}`}>
                    <StatusIcon className="h-4 w-4" />
                    {statusLabels[assessment.status as keyof typeof statusLabels]}
                  </span>
                </div>
              </div>
              {assessment.score !== null ? (
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{assessment.score}%</p>
                  <p className="text-sm text-muted-foreground">{t('assessments.score')}</p>
                </div>
              ) : (
                <Link
                  href={`/${locale}/assessments/${assessment.id}`}
                  className={`rounded-lg px-4 py-2 font-medium ${
                    assessment.status === 'available' || assessment.status === 'in-progress'
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  {assessment.status === 'in-progress'
                    ? t('assessments.continueAssessment')
                    : t('assessments.startAssessment')}
                </Link>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
