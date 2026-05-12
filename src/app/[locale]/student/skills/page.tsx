'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { StudentShell } from '@/components/layout/StudentShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import { 
  TrendingUp, 
  TrendingDown, 
  Circle, 
  CheckCircle, 
  Star,
  Lock,
  Play,
  RotateCcw,
  BookOpen,
  Brain,
  Sparkles,
  Layers,
  FlaskConical,
  ArrowRight,
  Target,
  Filter,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';

interface Skill {
  id: string;
  code: string;
  name: string;
  nameFA: string;
  description: string;
  descriptionFA: string;
  gradeBandMin: string;
  gradeBandMax: string;
  questionCount: number;
  masteryStatus: string;
  subject: {
    id: string;
    code: string;
    name: string;
    nameFA?: string;
  };
  strand?: {
    id: string;
    name: string;
    nameFA?: string;
  } | null;
  mastery?: {
    masteryScore: number;
    status: string;
    abilityEstimate: number;
    lastPracticedAt: Date | null;
  };
  prerequisitesMet: boolean;
  visibilityMode?: 'ON_GRADE' | 'PREREQUISITE_SUPPORT';
  recommendedForStudent?: boolean;
  prerequisites?: Array<{
    id: string;
    name: string;
    nameFA?: string;
    mastery: number;
    isRequired: boolean;
  }>;
}

interface SkillsResponse {
  skills: Skill[];
  meta?: {
    studentGradeBand?: string | null;
    availableSubjects?: Array<{
      id: string;
      code: string;
      name: string;
      nameFA?: string;
    }>;
  };
}

interface SkillRecommendations {
  reviewDue: Array<{ skill: { id: string } }>;
  nextInSequence: Array<{ skill: { id: string } }>;
  needsReteaching: Array<{ skill: { id: string } }>;
  readyForChallenge: Array<{ skill: { id: string } }>;
}

const gradeBandLabels: Record<string, { en: string; fa: string }> = {
  EARLY_YEARS: { en: 'Early Years', fa: 'سال‌های آغازین' },
  PRIMARY: { en: 'Primary', fa: 'ابتدایی' },
  MIDDLE: { en: 'Middle School', fa: 'متوسطه اول' },
  SECONDARY: { en: 'Secondary', fa: 'متوسطه دوم' },
};

function hasMeaningfulCopy(...values: Array<string | null | undefined>) {
  const merged = values.filter(Boolean).join(' ').trim();
  if (!merged) {
    return false;
  }

  return !/(^|\b)(test|demo|dummy|placeholder|sample)(\b|_)/i.test(merged);
}

export default function SkillsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('practice');
  const tCommon = useTranslations('common');
  const locale = params.locale as string;

  const [skills, setSkills] = useState<Skill[]>([]);
  const [studentGradeBand, setStudentGradeBand] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [recommendations, setRecommendations] = useState<SkillRecommendations>({
    reviewDue: [],
    nextInSequence: [],
    needsReteaching: [],
    readyForChallenge: [],
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'mastered'>('available');

  useEffect(() => {
    void fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const userId = getStoredUserId();
      const headers = createUserHeaders(userId);

      const [skillsRes, recommendationsRes] = await Promise.all([
        fetch('/api/v1/skills', { headers }),
        fetch('/api/v1/practice/recommendations', { headers }),
      ]);

      if (!skillsRes.ok) {
        throw new Error('Failed to fetch skills');
      }

      const data = (await skillsRes.json()) as SkillsResponse;
      setSkills(data.skills || []);
      setStudentGradeBand(data.meta?.studentGradeBand || null);

      if (recommendationsRes.ok) {
        const recommendationData = (await recommendationsRes.json()) as SkillRecommendations;
        setRecommendations(recommendationData);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const recommendationLookup = new Map<string, { label: string; tone: string; icon: typeof Sparkles }>();
  recommendations.needsReteaching.forEach((item) => {
    recommendationLookup.set(item.skill.id, {
      label: locale === 'fa' ? 'نیازمند بازآموزی' : 'Needs reteaching',
      tone: 'bg-red-50 text-red-700 border-red-200',
      icon: Brain,
    });
  });
  recommendations.reviewDue.forEach((item) => {
    recommendationLookup.set(item.skill.id, {
      label: locale === 'fa' ? 'آماده مرور' : 'Review due',
      tone: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: RotateCcw,
    });
  });
  recommendations.readyForChallenge.forEach((item) => {
    recommendationLookup.set(item.skill.id, {
      label: locale === 'fa' ? 'آماده چالش' : 'Ready for challenge',
      tone: 'bg-violet-50 text-violet-700 border-violet-200',
      icon: Sparkles,
    });
  });

  const visibleSkills = skills.filter((skill) =>
    skill.questionCount > 0 && hasMeaningfulCopy(skill.code, skill.name, skill.nameFA, skill.description, skill.descriptionFA),
  );

  const subjects = Array.from(
    new Map(
      visibleSkills.map((skill) => [
        skill.subject.id,
        {
          id: skill.subject.id,
          label: locale === 'fa' ? skill.subject.nameFA || skill.subject.name : skill.subject.name,
        },
      ]),
    ).values(),
  );

  const getMasteryColor = (score: number) => {
    if (score >= 95) return 'text-purple-600 bg-purple-50 border-purple-200';
    if (score >= 85) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score > 0) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };


  const getGradeBandLabel = (value?: string | null) => {
    if (!value) return locale === 'fa' ? 'نامشخص' : 'Not set';
    return locale === 'fa' ? gradeBandLabels[value]?.fa || value : gradeBandLabels[value]?.en || value;
  };

  const formatSkillBand = (skill: Skill) => {
    if (skill.gradeBandMin === skill.gradeBandMax) {
      return getGradeBandLabel(skill.gradeBandMin);
    }

    return `${getGradeBandLabel(skill.gradeBandMin)} • ${getGradeBandLabel(skill.gradeBandMax)}`;
  };
  const getMasteryIcon = (status: string) => {
    switch (status) {
      case 'EXPERT':
        return <Star className="w-5 h-5" fill="currentColor" />;
      case 'MASTERED':
        return <CheckCircle className="w-5 h-5" />;
      case 'PROFICIENT':
        return <TrendingUp className="w-5 h-5" />;
      case 'DEVELOPING':
        return <Circle className="w-5 h-5" />;
      case 'STRUGGLING':
        return <TrendingDown className="w-5 h-5" />;
      default:
        return <Circle className="w-5 h-5" />;
    }
  };

  const getMasteryLabel = (status: string) => {
    const labels: Record<string, { en: string; fa: string }> = {
      EXPERT: { en: 'Expert', fa: 'متخصص' },
      MASTERED: { en: 'Mastered', fa: 'تسلط کامل' },
      PROFICIENT: { en: 'Proficient', fa: 'ماهر' },
      DEVELOPING: { en: 'Developing', fa: 'در حال توسعه' },
      STRUGGLING: { en: 'Needs Practice', fa: 'نیاز به تمرین' },
      NOT_STARTED: { en: 'Not Started', fa: 'شروع نشده' },
    };
    return locale === 'fa' ? labels[status]?.fa : labels[status]?.en || status;
  };

  const startPractice = (skillId: string) => {
    router.push(`/${locale}/student/practice/${skillId}`);
  };

  const filteredSkills = visibleSkills.filter(skill => {
    if (subjectFilter !== 'all' && skill.subject.id !== subjectFilter) {
      return false;
    }

    if (filter === 'available') {
      return skill.prerequisitesMet && (!skill.mastery || skill.mastery.masteryScore < 85);
    }
    if (filter === 'mastered') {
      return skill.mastery && skill.mastery.masteryScore >= 85;
    }
    return true;
  });

  const totalAvailable = visibleSkills.filter((skill) => skill.prerequisitesMet).length;
  const completedCount = visibleSkills.filter((skill) => (skill.mastery?.masteryScore || 0) >= 85).length;
  const featuredSkills = filteredSkills
    .filter((skill) => recommendationLookup.has(skill.id) || skill.recommendedForStudent)
    .slice(0, 3);

  const subjectSummaries = subjects.map((subject) => ({
    ...subject,
    count: visibleSkills.filter((skill) => skill.subject.id === subject.id).length,
  }));

  const groupedSkills = Array.from(
    filteredSkills.reduce((map, skill) => {
      const subjectKey = skill.subject.id;
      const bucket = map.get(subjectKey) || {
        id: subjectKey,
        label: locale === 'fa' ? skill.subject.nameFA || skill.subject.name : skill.subject.name,
        skills: [] as Skill[],
      };
      bucket.skills.push(skill);
      map.set(subjectKey, bucket);
      return map;
    }, new Map<string, { id: string; label: string; skills: Skill[] }>()),
  ).map(([, value]) => value);

  if (loading) {
    return (
      <StudentShell locale={locale}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="text-gray-600">{tCommon('loading')}...</p>
          </div>
        </div>
      </StudentShell>
    );
  }

  return (
    <StudentShell locale={locale}>
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-6 text-white shadow-xl">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm text-white/90 backdrop-blur">
                <Target className="h-4 w-4" />
                {locale === 'fa' ? 'مسیر تمرین هوشمند' : 'Smart practice pathway'}
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {locale === 'fa' ? 'مهارت‌های تمرینی شما' : 'Your practice skills'}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/85 sm:text-base">
                  {locale === 'fa'
                    ? 'این صفحه فقط مهارت‌های آماده تمرین را نشان می‌دهد؛ مهارت‌های آزمایشی و ناقص حذف شده‌اند تا مسیر یادگیری منظم‌تر، جذاب‌تر و بدون فضای خالی باشد.'
                    : 'This view now shows only classroom-ready skills, keeping unfinished test content out of the way so practice feels cleaner, sharper, and easier to navigate.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-white/90">
                <div className="rounded-full bg-white/10 px-4 py-2 backdrop-blur">
                  <span className="font-medium">{locale === 'fa' ? 'پایه' : 'Grade band'}:</span> {getGradeBandLabel(studentGradeBand)}
                </div>
                <div className="rounded-full bg-white/10 px-4 py-2 backdrop-blur">
                  <span className="font-medium">{locale === 'fa' ? 'مهارت آماده' : 'Ready skills'}:</span> {visibleSkills.length}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Card className="border-white/15 bg-white/10 p-4 text-white shadow-none backdrop-blur">
                <div className="flex items-center gap-3">
                  <Layers className="h-5 w-5 text-cyan-200" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/70">{locale === 'fa' ? 'پیشرفت فعلی' : 'Current progress'}</p>
                    <p className="mt-1 text-2xl font-bold">{completedCount}/{visibleSkills.length}</p>
                  </div>
                </div>
              </Card>
              <Card className="border-white/15 bg-white/10 p-4 text-white shadow-none backdrop-blur">
                <div className="flex items-center gap-3">
                  <Brain className="h-5 w-5 text-amber-200" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/70">{locale === 'fa' ? 'الان قابل تمرین' : 'Available now'}</p>
                    <p className="mt-1 text-2xl font-bold">{totalAvailable}</p>
                  </div>
                </div>
              </Card>
              <div className="sm:col-span-2 xl:col-span-1">
                <Button
                  size="lg"
                  className="w-full bg-white text-slate-900 hover:bg-white/90"
                  disabled={filteredSkills.length === 0}
                  onClick={() => filteredSkills[0] && startPractice(filteredSkills[0].id)}
                >
                  {locale === 'fa' ? 'شروع بهترین مهارت بعدی' : 'Start the best next skill'}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-4">
          <Card className="border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-blue-900">{locale === 'fa' ? 'نیازمند تمرین' : 'Needs practice'}</p>
                <p className="text-sm text-blue-700">{recommendations.needsReteaching.length} {locale === 'fa' ? 'مهارت' : 'skills'}</p>
              </div>
            </div>
          </Card>
          <Card className="border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-900">{locale === 'fa' ? 'آماده مرور' : 'Ready for review'}</p>
                <p className="text-sm text-amber-700">{recommendations.reviewDue.length} {locale === 'fa' ? 'مهارت' : 'skills'}</p>
              </div>
            </div>
          </Card>
          <Card className="border-violet-200 bg-violet-50 p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <div>
                <p className="text-sm font-semibold text-violet-900">{locale === 'fa' ? 'آماده چالش' : 'Ready for challenge'}</p>
                <p className="text-sm text-violet-700">{recommendations.readyForChallenge.length} {locale === 'fa' ? 'مهارت' : 'skills'}</p>
              </div>
            </div>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">{locale === 'fa' ? 'درس‌های فعال' : 'Active subjects'}</p>
                <p className="text-sm text-emerald-700">{subjectSummaries.length} {locale === 'fa' ? 'درس' : 'subjects'}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="rounded-3xl border-slate-200 p-5 shadow-sm">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Filter className="h-4 w-4" />
                  {locale === 'fa' ? 'فیلترها و تمرکز تمرین' : 'Filters and focus'}
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {locale === 'fa'
                    ? 'فیلترها بازطراحی شده‌اند تا به‌جای نوار اسکرول افقی، انتخاب‌ها به‌صورت ردیف‌های منظم و قابل لمس نمایش داده شوند.'
                    : 'Filters now wrap into clean rows instead of forcing a horizontal scrollbar under the subjects.'}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-600">
                {filteredSkills.length} {locale === 'fa' ? 'مهارت مطابق فیلتر' : 'skills match your filters'}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant={filter === 'available' ? 'default' : 'outline'} onClick={() => setFilter('available')}>
                {locale === 'fa' ? 'در دسترس' : 'Available'}
              </Button>
              <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
                {locale === 'fa' ? 'همه' : 'All skills'}
              </Button>
              <Button variant={filter === 'mastered' ? 'default' : 'outline'} onClick={() => setFilter('mastered')}>
                {locale === 'fa' ? 'تسلط‌یافته' : 'Mastered'}
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <button
                type="button"
                onClick={() => setSubjectFilter('all')}
                className={`rounded-2xl border px-4 py-3 text-start transition ${subjectFilter === 'all' ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
              >
                <p className="font-semibold">{locale === 'fa' ? 'همه درس‌ها' : 'All subjects'}</p>
                <p className="mt-1 text-sm text-slate-500">{visibleSkills.length} {locale === 'fa' ? 'مهارت آماده' : 'ready skills'}</p>
              </button>
              {subjectSummaries.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => setSubjectFilter(subject.id)}
                  className={`rounded-2xl border px-4 py-3 text-start transition ${subjectFilter === subject.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  <p className="font-semibold">{subject.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{subject.count} {locale === 'fa' ? 'مهارت' : 'skills'}</p>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {featuredSkills.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <div>
                <h2 className="text-xl font-semibold">{locale === 'fa' ? 'پیشنهادهای ویژه برای شروع' : 'Recommended starting points'}</h2>
                <p className="text-sm text-slate-500">
                  {locale === 'fa' ? 'برای شروع سریع، این کارت‌ها را از میان بهترین تمرین‌های فعلی انتخاب کن.' : 'Start with these curated cards for the smoothest next practice session.'}
                </p>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {featuredSkills.map((skill) => {
                const masteryScore = skill.mastery?.masteryScore || 0;
                const recommendation = recommendationLookup.get(skill.id);
                return (
                  <Card key={skill.id} className="overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 text-white shadow-lg">
                    <div className="flex h-full flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-white/60">{locale === 'fa' ? skill.subject.nameFA || skill.subject.name : skill.subject.name}</p>
                          <h3 className="mt-2 text-xl font-semibold">{locale === 'fa' ? skill.nameFA || skill.name : skill.name}</h3>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          {skill.visibilityMode === 'PREREQUISITE_SUPPORT' ? (
                            <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs text-amber-100">
                              {locale === 'fa' ? 'پایه‌ساز پشتیبان' : 'Foundation support'}
                            </span>
                          ) : null}
                          {recommendation ? <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/90">{recommendation.label}</span> : null}
                        </div>
                      </div>
                      <p className="mt-4 flex-1 text-sm leading-6 text-white/80">
                        {locale === 'fa'
                          ? skill.descriptionFA || skill.description || 'برای این مهارت مجموعه‌ای از پرسش‌های آماده تمرین در دسترس است.'
                          : skill.description || skill.descriptionFA || 'A ready-to-use practice set is available for this skill.'}
                      </p>
                      <div className="mt-5 flex items-center justify-between text-sm text-white/75">
                        <span>{skill.questionCount} {locale === 'fa' ? 'سوال' : 'questions'}</span>
                        <span>{masteryScore}% {locale === 'fa' ? 'تسلط' : 'mastery'}</span>
                      </div>
                      <Button className="mt-5 bg-white text-slate-900 hover:bg-white/90" onClick={() => startPractice(skill.id)}>
                        {locale === 'fa' ? 'شروع همین تمرین' : 'Start this practice'}
                        <ArrowRight className="ms-2 h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        ) : null}

        {filteredSkills.length === 0 ? (
          <Card className="rounded-3xl p-12 text-center">
            <div className="mb-4 text-gray-400">
              <Circle className="mx-auto h-16 w-16" />
            </div>
            <p className="mb-2 text-lg text-gray-700">
              {locale === 'fa' ? 'در این فیلتر مهارتی پیدا نشد' : 'No skills match this filter'}
            </p>
            <p className="text-sm text-gray-500">
              {locale === 'fa'
                ? 'فیلتر درس یا وضعیت را تغییر بده تا مهارت‌های بیشتری ببینی.'
                : 'Switch the subject or mastery filter to reveal more practice-ready skills.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {groupedSkills.map((group) => (
              <section key={group.id} className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <FlaskConical className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{group.label}</h2>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {group.skills.length} {locale === 'fa' ? 'مهارت' : 'skills'}
                  </span>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                  {group.skills.map((skill) => {
                    const mastery = skill.mastery;
                    const isLocked = !skill.prerequisitesMet;
                    const masteryScore = mastery?.masteryScore || 0;
                    const status = mastery?.status || 'NOT_STARTED';
                    const recommendation = recommendationLookup.get(skill.id);
                    const RecommendationIcon = recommendation?.icon;
                    const displayDescription = locale === 'fa'
                      ? skill.descriptionFA || skill.description || 'برای این مهارت تمرین آماده شده است.'
                      : skill.description || skill.descriptionFA || 'This skill is ready with a focused practice set.';

                    return (
                      <Card key={skill.id} className={`group rounded-3xl border-slate-200 p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${isLocked ? 'opacity-70' : ''}`}>
                        <div className="flex h-full flex-col">
                          <div className="mb-5 flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <h3 className="text-xl font-semibold text-slate-900">
                                  {locale === 'fa' ? skill.nameFA || skill.name : skill.name}
                                </h3>
                                {isLocked ? <Lock className="h-4 w-4 text-gray-400" /> : null}
                                {skill.visibilityMode === 'PREREQUISITE_SUPPORT' ? (
                                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                                    {locale === 'fa' ? 'پشتیبان پایه‌ای' : 'Prerequisite support'}
                                  </span>
                                ) : null}
                                {skill.recommendedForStudent ? (
                                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                    {locale === 'fa' ? 'پیشنهادی برای شما' : 'Recommended for you'}
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-sm leading-6 text-slate-600">{displayDescription}</p>
                              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                                <span className="rounded-full bg-slate-100 px-2.5 py-1">{formatSkillBand(skill)}</span>
                                {skill.strand ? (
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                    {locale === 'fa' ? skill.strand.nameFA || skill.strand.name : skill.strand.name}
                                  </span>
                                ) : null}
                                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                  {skill.questionCount} {locale === 'fa' ? 'سوال' : 'questions'}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2 text-right">
                              <div className={`inline-flex items-center gap-1 rounded-full border-2 px-3 py-1 ${getMasteryColor(masteryScore)}`}>
                                {getMasteryIcon(status)}
                                <span className="text-sm font-medium">{getMasteryLabel(status)}</span>
                              </div>
                              {recommendation && RecommendationIcon ? (
                                <div className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${recommendation.tone}`}>
                                  <RecommendationIcon className="h-3.5 w-3.5" />
                                  {recommendation.label}
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-start">
                            <div className="space-y-4">
                              <div>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                  <span className="text-slate-600">{t('mastery')}</span>
                                  <span className="font-bold text-slate-900">{masteryScore}%</span>
                                </div>
                                <Progress value={masteryScore} className="h-2.5" />
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                                  <p className="text-xs uppercase tracking-wide text-slate-400">{locale === 'fa' ? 'توانایی' : 'Ability'}</p>
                                  <p className="mt-1 font-semibold text-slate-900">{mastery ? mastery.abilityEstimate.toFixed(2) : '0.00'}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                                  <p className="text-xs uppercase tracking-wide text-slate-400">{locale === 'fa' ? 'آخرین تمرین' : 'Last practice'}</p>
                                  <p className="mt-1 font-semibold text-slate-900">
                                    {mastery?.lastPracticedAt
                                      ? new Date(mastery.lastPracticedAt).toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US')
                                      : locale === 'fa'
                                        ? 'هنوز ثبت نشده'
                                        : 'Not yet started'}
                                  </p>
                                </div>
                              </div>

                              {!skill.prerequisitesMet && skill.prerequisites && skill.prerequisites.length > 0 ? (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                                  <p className="font-medium">{locale === 'fa' ? 'پیش‌نیازهای لازم' : 'Required before practice'}</p>
                                  <ul className="mt-2 space-y-1.5">
                                    {skill.prerequisites.filter((item) => item.isRequired && item.mastery < 70).map((item) => (
                                      <li key={item.id}>
                                        • {locale === 'fa' ? item.nameFA || item.name : item.name} ({item.mastery}%)
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                            </div>

                            <div className="flex h-full flex-col justify-between gap-3 rounded-2xl bg-slate-50 p-4">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-slate-400">{locale === 'fa' ? 'گام بعدی' : 'Next move'}</p>
                                <p className="mt-2 text-sm font-medium text-slate-800">
                                  {isLocked
                                    ? locale === 'fa'
                                      ? 'اول پیش‌نیازها را تقویت کن.'
                                      : 'Strengthen the prerequisites first.'
                                    : masteryScore >= 85
                                      ? locale === 'fa'
                                        ? 'مرور کوتاه برای تثبیت کامل.'
                                        : 'Do a quick review to lock it in.'
                                      : locale === 'fa'
                                        ? 'یک ست تمرینی کامل را شروع کن.'
                                        : 'Launch a focused practice set.'}
                                </p>
                              </div>

                              <Button onClick={() => startPractice(skill.id)} disabled={isLocked} className="w-full" variant={masteryScore >= 85 ? 'outline' : 'default'}>
                                {isLocked ? (
                                  <>
                                    <Lock className="mr-2 h-4 w-4" />
                                    {locale === 'fa' ? 'قفل شده' : 'Locked'}
                                  </>
                                ) : mastery && masteryScore >= 85 ? (
                                  <>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    {locale === 'fa' ? 'مرور مهارت' : 'Review skill'}
                                  </>
                                ) : (
                                  <>
                                    <Play className="mr-2 h-4 w-4" />
                                    {locale === 'fa' ? 'شروع تمرین' : 'Start practice'}
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </StudentShell>
  );
}
