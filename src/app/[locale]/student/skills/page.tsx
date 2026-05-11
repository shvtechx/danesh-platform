'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Circle, 
  CheckCircle, 
  Star,
  Lock,
  Play,
  RotateCcw
} from 'lucide-react';

interface Skill {
  id: string;
  code: string;
  name: string;
  nameFA: string;
  description: string;
  descriptionFA: string;
  gradeBandMin: number;
  gradeBandMax: number;
  mastery?: {
    masteryScore: number;
    status: string;
    abilityEstimate: number;
    lastPracticedAt: Date | null;
  };
  prerequisitesMet: boolean;
}

export default function SkillsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('practice');
  const tCommon = useTranslations('common');
  const locale = params.locale as string;

  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'mastered'>('available');

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/skills');
      
      if (!res.ok) {
        throw new Error('Failed to fetch skills');
      }
      
      const data = await res.json();
      setSkills(data.skills || data.items || data || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const getMasteryColor = (score: number) => {
    if (score >= 95) return 'text-purple-600 bg-purple-50 border-purple-200';
    if (score >= 85) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score > 0) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
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

  const filteredSkills = skills.filter(skill => {
    if (filter === 'available') {
      return skill.prerequisitesMet && (!skill.mastery || skill.mastery.masteryScore < 85);
    }
    if (filter === 'mastered') {
      return skill.mastery && skill.mastery.masteryScore >= 85;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{tCommon('loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {locale === 'fa' ? 'مهارت‌های تمرینی' : 'Practice Skills'}
        </h1>
        <p className="text-gray-600">
          {locale === 'fa'
            ? 'مهارت‌های خود را انتخاب کنید و تمرین کنید'
            : 'Select skills to practice and improve your mastery'}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'available' ? 'default' : 'outline'}
          onClick={() => setFilter('available')}
        >
          {locale === 'fa' ? 'در دسترس' : 'Available'}
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          {locale === 'fa' ? 'همه' : 'All Skills'}
        </Button>
        <Button
          variant={filter === 'mastered' ? 'default' : 'outline'}
          onClick={() => setFilter('mastered')}
        >
          {locale === 'fa' ? 'تسلط یافته' : 'Mastered'}
        </Button>
      </div>

      {/* Skills grid */}
      {filteredSkills.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Circle className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-lg text-gray-600 mb-2">
            {locale === 'fa' ? 'هیچ مهارتی موجود نیست' : 'No skills available'}
          </p>
          <p className="text-sm text-gray-500">
            {locale === 'fa'
              ? 'لطفاً بعداً مراجعه کنید یا با معلم خود تماس بگیرید'
              : 'Please check back later or contact your teacher'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredSkills.map((skill) => {
            const mastery = skill.mastery;
            const isLocked = !skill.prerequisitesMet;
            const masteryScore = mastery?.masteryScore || 0;
            const status = mastery?.status || 'NOT_STARTED';

            return (
              <Card
                key={skill.id}
                className={`p-6 ${isLocked ? 'opacity-50' : ''}`}
              >
                {/* Skill header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">
                        {locale === 'fa' ? skill.nameFA : skill.name}
                      </h3>
                      {isLocked && <Lock className="w-4 h-4 text-gray-400" />}
                    </div>
                    <p className="text-sm text-gray-600">
                      {locale === 'fa' ? skill.descriptionFA : skill.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {locale === 'fa' ? 'پایه' : 'Grade'} {skill.gradeBandMin}
                      {skill.gradeBandMax !== skill.gradeBandMin &&
                        `-${skill.gradeBandMax}`}
                    </p>
                  </div>

                  {/* Mastery badge */}
                  {mastery && (
                    <div
                      className={`flex items-center gap-1 px-3 py-1 rounded-full border-2 ${getMasteryColor(
                        masteryScore
                      )}`}
                    >
                      {getMasteryIcon(status)}
                      <span className="text-sm font-medium">
                        {getMasteryLabel(status)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {mastery && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{t('mastery')}</span>
                      <span className="font-bold">{masteryScore}%</span>
                    </div>
                    <Progress value={masteryScore} className="h-2" />
                  </div>
                )}

                {/* Stats */}
                {mastery && (
                  <div className="flex gap-4 text-xs text-gray-600 mb-4">
                    <div>
                      <span className="font-medium">
                        {locale === 'fa' ? 'توانایی' : 'Ability'}:
                      </span>{' '}
                      {mastery.abilityEstimate.toFixed(2)}
                    </div>
                    {mastery.lastPracticedAt && (
                      <div>
                        <span className="font-medium">
                          {locale === 'fa' ? 'آخرین تمرین' : 'Last'}:
                        </span>{' '}
                        {new Date(mastery.lastPracticedAt).toLocaleDateString(
                          locale === 'fa' ? 'fa-IR' : 'en-US'
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Action button */}
                <Button
                  onClick={() => startPractice(skill.id)}
                  disabled={isLocked}
                  className="w-full"
                  variant={masteryScore >= 85 ? 'outline' : 'default'}
                >
                  {isLocked ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      {locale === 'fa' ? 'قفل شده' : 'Locked'}
                    </>
                  ) : mastery && masteryScore >= 85 ? (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      {locale === 'fa' ? 'مرور' : 'Review'}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      {locale === 'fa' ? 'شروع تمرین' : 'Start Practice'}
                    </>
                  )}
                </Button>

                {/* Locked message */}
                {isLocked && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {locale === 'fa'
                      ? 'ابتدا پیش‌نیازها را تکمیل کنید'
                      : 'Complete prerequisites first'}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
