'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Brain, Clock, Heart, Mail, ShieldAlert, TrendingUp } from 'lucide-react';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';

interface StudentDetail {
  studentId: string;
  studentName: string;
  email: string;
  gradeBand: string | null;
  averageMastery: number;
  totalSkills: number;
  masteredSkills: number;
  proficientSkills: number;
  totalPracticeTime: number;
  totalAttempts: number;
  recommendedSkills: Array<{
    skillId: string;
    skillName: string;
    subject: string;
    masteryScore: number;
  }>;
  strengths: Array<{
    skillId: string;
    skillName: string;
    subject: string;
    masteryScore: number;
  }>;
  recentSessions: Array<{
    id: string;
    skillName: string;
    subject: string;
    questionsAnswered: number;
    correctAnswers: number;
    startedAt: string;
    totalTime: number;
  }>;
  wellbeing: {
    status: 'stable' | 'watch' | 'support' | 'urgent';
    score: number;
    averageMood: number | null;
    averageStress: number | null;
    openConcernReports: number;
    checkinsLast14Days: number;
    recommendedAction: 'celebrate' | 'monitor' | 'check-in' | 'escalate';
  };
  skills: Array<{
    skillId: string;
    skillName: string;
    subject: string;
    masteryScore: number;
    masteryStatus: string;
    totalAttempts: number;
    correctAttempts: number;
    lastPracticedAt: string | null;
  }>;
}

const gradeBandLabels: Record<string, { en: string; fa: string }> = {
  EARLY_YEARS: { en: 'Early Years', fa: 'سال‌های آغازین' },
  PRIMARY: { en: 'Primary', fa: 'ابتدایی' },
  MIDDLE: { en: 'Middle School', fa: 'متوسطه اول' },
  SECONDARY: { en: 'Secondary', fa: 'متوسطه دوم' },
};

export default function TeacherStudentDetailPage() {
  const params = useParams();
  const locale = params.locale as string;
  const studentId = params.id as string;
  const isRTL = locale === 'fa';
  const t = useTranslations();
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadStudent = async () => {
      try {
        setLoading(true);
        setFeedback(null);
        const response = await fetch(`/api/v1/teacher/student-progress?locale=${locale}`, {
          headers: createUserHeaders(getStoredUserId()),
        });

        if (!response.ok) {
          throw new Error('Failed to load student');
        }

        const data = await response.json();
        const match = (data.students || []).find((item: StudentDetail) => item.studentId === studentId) || null;

        if (active) {
          setStudent(match);
          if (!match) {
            setFeedback(isRTL ? 'دانش‌آموز موردنظر پیدا نشد.' : 'The requested student could not be found.');
          }
        }
      } catch {
        if (active) {
          setFeedback(isRTL ? 'بارگذاری پرونده دانش‌آموز انجام نشد.' : 'Student profile could not be loaded.');
          setStudent(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadStudent();

    return () => {
      active = false;
    };
  }, [isRTL, locale, studentId]);

  const gradeBandLabel = useMemo(() => {
    if (!student?.gradeBand) {
      return isRTL ? 'ثبت نشده' : 'Not set';
    }
    return isRTL ? gradeBandLabels[student.gradeBand]?.fa || student.gradeBand : gradeBandLabels[student.gradeBand]?.en || student.gradeBand;
  }, [isRTL, student?.gradeBand]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/teacher/students`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <BackIcon className="h-5 w-5" />
              <span>{isRTL ? 'بازگشت به دانش‌آموزان' : 'Back to students'}</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {feedback ? <FeedbackBanner className="mb-6" variant="error" message={feedback} /> : null}

        {!student ? (
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center text-muted-foreground">
            <ShieldAlert className="mx-auto mb-4 h-10 w-10 opacity-70" />
            <p>{isRTL ? 'پرونده‌ای برای این دانش‌آموز موجود نیست.' : 'No profile is available for this student.'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-3xl border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                    {student.studentName[0]}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">{student.studentName}</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" />{student.email || '—'}</span>
                      <span className="rounded-full bg-muted px-3 py-1">{isRTL ? 'پایه:' : 'Grade band:'} {gradeBandLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:w-[20rem]">
                  <div className="rounded-2xl bg-primary/5 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{isRTL ? 'تسلط میانگین' : 'Average mastery'}</p>
                    <p className="mt-2 text-3xl font-bold text-primary">{student.averageMastery}%</p>
                  </div>
                  <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-950/20">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{isRTL ? 'بهزیستی' : 'Wellbeing'}</p>
                    <p className="mt-2 text-3xl font-bold text-rose-600">{student.wellbeing.score}%</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">{isRTL ? 'مهارت‌های ثبت‌شده' : 'Tracked skills'}</p>
                <p className="mt-2 text-2xl font-bold">{student.totalSkills}</p>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">{isRTL ? 'مهارت‌های تسلط‌یافته' : 'Mastered skills'}</p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">{student.masteredSkills}</p>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">{isRTL ? 'پرسش‌های پاسخ‌داده‌شده' : 'Answered questions'}</p>
                <p className="mt-2 text-2xl font-bold text-blue-600">{student.totalAttempts}</p>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">{isRTL ? 'زمان تمرین' : 'Practice time'}</p>
                <p className="mt-2 text-2xl font-bold text-violet-600">{Math.round(student.totalPracticeTime / 60)} {isRTL ? 'دقیقه' : 'min'}</p>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6">
                <section className="rounded-3xl border bg-card p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">{isRTL ? 'نقشه مهارت‌ها' : 'Skill map'}</h2>
                  </div>
                  <div className="space-y-3">
                    {student.skills.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{isRTL ? 'هنوز داده مهارتی ثبت نشده است.' : 'No skill data has been recorded yet.'}</p>
                    ) : (
                      student.skills
                        .slice()
                        .sort((a, b) => a.masteryScore - b.masteryScore)
                        .map((skill) => (
                          <div key={skill.skillId} className="rounded-2xl border bg-background p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="font-semibold">{skill.skillName}</p>
                                <p className="text-sm text-muted-foreground">{skill.subject}</p>
                              </div>
                              <div className="text-sm font-medium text-primary">{skill.masteryScore}%</div>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-muted">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${skill.masteryScore}%` }} />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                              <span>{isRTL ? 'وضعیت:' : 'Status:'} {skill.masteryStatus}</span>
                              <span>{isRTL ? 'تلاش:' : 'Attempts:'} {skill.totalAttempts}</span>
                              <span>{isRTL ? 'پاسخ درست:' : 'Correct:'} {skill.correctAttempts}</span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </section>

                <section className="rounded-3xl border bg-card p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">{isRTL ? 'جلسات اخیر' : 'Recent sessions'}</h2>
                  </div>
                  <div className="space-y-3">
                    {student.recentSessions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{isRTL ? 'جلسه‌ای ثبت نشده است.' : 'No recent sessions are available.'}</p>
                    ) : (
                      student.recentSessions.map((session) => {
                        const accuracy = session.questionsAnswered > 0 ? Math.round((session.correctAnswers / session.questionsAnswered) * 100) : 0;
                        return (
                          <div key={session.id} className="rounded-2xl border bg-background p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="font-medium">{session.skillName}</p>
                                <p className="text-sm text-muted-foreground">{session.subject}</p>
                              </div>
                              <div className="text-sm text-muted-foreground">{accuracy}%</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              </div>

              <aside className="space-y-4">
                <section className="rounded-3xl border bg-card p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-lg font-semibold">{isRTL ? 'نقاط قوت' : 'Strengths'}</h2>
                  </div>
                  <div className="space-y-3">
                    {student.strengths.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{isRTL ? 'هنوز نقطه قوتی ثبت نشده است.' : 'No strengths identified yet.'}</p>
                    ) : (
                      student.strengths.map((skill) => (
                        <div key={skill.skillId} className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/20">
                          <p className="font-medium">{skill.skillName}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{skill.subject}</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="rounded-3xl border bg-card p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-amber-600" />
                    <h2 className="text-lg font-semibold">{isRTL ? 'پیشنهاد برای تمرین' : 'Practice priorities'}</h2>
                  </div>
                  <div className="space-y-3">
                    {student.recommendedSkills.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{isRTL ? 'فعلاً مهارتی برای اولویت تمرین وجود ندارد.' : 'No priority practice skills yet.'}</p>
                    ) : (
                      student.recommendedSkills.map((skill) => (
                        <div key={skill.skillId} className="rounded-2xl bg-amber-50 p-3 dark:bg-amber-950/20">
                          <p className="font-medium">{skill.skillName}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{skill.subject}</p>
                          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{isRTL ? 'تسلط فعلی:' : 'Current mastery:'} {skill.masteryScore}%</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="rounded-3xl border bg-card p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-rose-600" />
                    <h2 className="text-lg font-semibold">{isRTL ? 'وضعیت بهزیستی' : 'Wellbeing snapshot'}</h2>
                  </div>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>{isRTL ? 'امتیاز کلی:' : 'Overall score:'} <span className="font-semibold text-foreground">{student.wellbeing.score}%</span></p>
                    <p>{isRTL ? 'ثبت‌ها در ۱۴ روز:' : 'Check-ins in 14 days:'} <span className="font-semibold text-foreground">{student.wellbeing.checkinsLast14Days}</span></p>
                    <p>{isRTL ? 'میانگین حال:' : 'Average mood:'} <span className="font-semibold text-foreground">{student.wellbeing.averageMood ?? '—'}</span></p>
                    <p>{isRTL ? 'میانگین استرس:' : 'Average stress:'} <span className="font-semibold text-foreground">{student.wellbeing.averageStress ?? '—'}</span></p>
                    <p>{isRTL ? 'گزارش‌های باز:' : 'Open concern reports:'} <span className="font-semibold text-foreground">{student.wellbeing.openConcernReports}</span></p>
                  </div>
                </section>
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
