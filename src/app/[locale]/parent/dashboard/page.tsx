'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Users, TrendingUp, Award, Heart, Clock, Target,
  BookOpen, AlertCircle, ChevronRight, Download, Calendar,
  Smile, Meh, Frown, BarChart3
} from 'lucide-react';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  gradeBand?: string;
  relationship: string;
  stats: {
    totalXP: number;
    currentLevel: number;
    lessonsCompleted: number;
    badgesEarned: number;
    avgTimePerDay: number;
    recentMood: number | null;
    moodTrend: Array<{ date: Date; mood: number }>;
  };
}

interface DetailedProgress {
  student: {
    id: string;
    totalXP: number;
    currentLevel: number;
    xpProgress: number;
  };
  subjects: Array<{
    code: string;
    name: string;
    nameFA: string;
    icon: string;
    color: string;
    lessonsCompleted: number;
    totalTimeSpent: number;
    avgMasteryScore: number;
  }>;
  wellbeing: {
    recentCheckins: Array<{
      date: Date;
      mood: number;
      notes?: string;
      triggers?: any;
    }>;
    avgMood: number | null;
  };
  assessments: {
    recent: Array<{
      id: string;
      title: string;
      titleFA: string;
      score: number;
      maxScore: number;
      percentage: number | null;
      completedAt: Date;
    }>;
  };
  badges: {
    total: number;
    recent: Array<{
      name: string;
      nameFA: string;
      icon: string;
      category: string;
      earnedAt: Date;
    }>;
  };
}

export default function ParentDashboardPage() {
  const params = useParams();
  const locale = params.locale as string;
  const isRTL = locale === 'fa';

  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [detailedProgress, setDetailedProgress] = useState<DetailedProgress | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadChildProgress(selectedChild);
    }
  }, [selectedChild]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/parent/children');
      const data = await res.json();
      setChildren(data.children || []);
      if (data.children && data.children.length > 0) {
        setSelectedChild(data.children[0].id);
      }
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChildProgress = async (childId: string) => {
    try {
      setLoadingDetails(true);
      const res = await fetch(`/api/v1/parent/${childId}/progress`);
      const data = await res.json();
      setDetailedProgress(data);
    } catch (error) {
      console.error('Error loading child progress:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getMoodIcon = (mood: number | null) => {
    if (!mood) return <Meh className="w-6 h-6 text-gray-400" />;
    if (mood >= 4) return <Smile className="w-6 h-6 text-green-500" />;
    if (mood >= 3) return <Meh className="w-6 h-6 text-yellow-500" />;
    return <Frown className="w-6 h-6 text-red-500" />;
  };

  const getMoodColor = (mood: number | null) => {
    if (!mood) return 'bg-gray-100';
    if (mood >= 4) return 'bg-green-100';
    if (mood >= 3) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleDownloadReport = () => {
    if (!currentChild) return;

    const reportLines = [
      isRTL ? 'گزارش پیشرفت دانش‌آموز' : 'Student Progress Report',
      `${isRTL ? 'دانش‌آموز' : 'Student'}: ${currentChild.firstName} ${currentChild.lastName}`,
      `${isRTL ? 'سطح فعلی' : 'Current Level'}: ${currentChild.stats.currentLevel}`,
      `${isRTL ? 'XP کل' : 'Total XP'}: ${currentChild.stats.totalXP}`,
      `${isRTL ? 'درس‌های تکمیل شده' : 'Lessons Completed'}: ${currentChild.stats.lessonsCompleted}`,
      `${isRTL ? 'نشان‌ها' : 'Badges'}: ${currentChild.stats.badgesEarned}`,
      '',
      isRTL ? 'جزئیات دروس' : 'Subject Details',
      ...(detailedProgress?.subjects || []).map((subject) => `${isRTL ? subject.nameFA : subject.name}: ${subject.avgMasteryScore}%`),
    ];

    const blob = new Blob([reportLines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `parent-report-${currentChild.firstName}-${currentChild.lastName}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">
            {isRTL ? 'در حال بارگذاری...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  const currentChild = children.find(c => c.id === selectedChild);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {isRTL ? 'داشبورد والدین' : 'Parent Dashboard'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isRTL ? 'پیشرفت فرزندان خود را دنبال کنید' : 'Monitor your children\'s progress'}
            </p>
          </div>
          <button type="button" onClick={handleDownloadReport} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
            <Download className="w-4 h-4" />
            {isRTL ? 'دانلود گزارش' : 'Download Report'}
          </button>
        </div>

        {/* Child Selector */}
        {children.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {isRTL ? 'فرزندان من' : 'My Children'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedChild === child.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {child.avatarUrl ? (
                      <img
                        src={child.avatarUrl}
                        alt={child.firstName}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {child.firstName[0]}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">
                        {child.firstName} {child.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{child.gradeBand || 'Student'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-blue-50 rounded px-2 py-1">
                      <span className="text-blue-600 font-bold">Level {child.stats.currentLevel}</span>
                    </div>
                    <div className="bg-green-50 rounded px-2 py-1">
                      <span className="text-green-600 font-bold">{child.stats.lessonsCompleted} {isRTL ? 'درس' : 'lessons'}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getMoodColor(child.stats.recentMood)}`}>
                      {getMoodIcon(child.stats.recentMood)}
                      <span className="text-sm font-medium">
                        {isRTL ? 'خلق و خو' : 'Mood'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {currentChild && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-blue-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{isRTL ? 'درس‌های تکمیل شده' : 'Lessons Completed'}</p>
                  <p className="text-2xl font-bold text-gray-900">{currentChild.stats.lessonsCompleted}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-yellow-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{isRTL ? 'نشان‌ها' : 'Badges'}</p>
                  <p className="text-2xl font-bold text-gray-900">{currentChild.stats.badgesEarned}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-purple-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{isRTL ? 'میانگین زمان روزانه' : 'Avg Daily Time'}</p>
                  <p className="text-2xl font-bold text-gray-900">{formatTime(currentChild.stats.avgTimePerDay)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-green-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{isRTL ? 'سطح' : 'Level'}</p>
                  <p className="text-2xl font-bold text-gray-900">{currentChild.stats.currentLevel}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Progress */}
        {loadingDetails ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{isRTL ? 'در حال بارگذاری جزئیات...' : 'Loading details...'}</p>
          </div>
        ) : detailedProgress && (
          <>
            {/* Subject Performance */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {isRTL ? 'عملکرد در موضوعات' : 'Subject Performance'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {detailedProgress.subjects.map((subject) => (
                  <div
                    key={subject.code}
                    className="border-2 border-gray-200 rounded-xl p-4 hover:border-purple-300 transition"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                        style={{ backgroundColor: subject.color + '20' }}
                      >
                        {subject.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">
                          {isRTL ? subject.nameFA : subject.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {subject.lessonsCompleted} {isRTL ? 'درس' : 'lessons'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{isRTL ? 'میانگین نمره' : 'Avg Score'}</span>
                        <span className="font-bold text-gray-900">{subject.avgMasteryScore}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${subject.avgMasteryScore}%`,
                            backgroundColor: subject.color
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{isRTL ? 'زمان کل' : 'Total Time'}</span>
                        <span>{formatTime(subject.totalTimeSpent)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Wellbeing Trends */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isRTL ? 'روند سلامت روان' : 'Wellbeing Trends'}
                </h2>
                {detailedProgress.wellbeing.avgMood && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{isRTL ? 'میانگین' : 'Average'}:</span>
                    <span className="font-bold text-lg">{detailedProgress.wellbeing.avgMood.toFixed(1)}/5</span>
                  </div>
                )}
              </div>

              {detailedProgress.wellbeing.recentCheckins.length > 0 ? (
                <div className="space-y-3">
                  {detailedProgress.wellbeing.recentCheckins.slice(0, 7).map((checkin, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-full ${getMoodColor(checkin.mood)}`}>
                        {getMoodIcon(checkin.mood)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(checkin.date).toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US')}
                        </p>
                        {checkin.notes && (
                          <p className="text-xs text-gray-600 mt-1">{checkin.notes}</p>
                        )}
                      </div>
                      <div className="text-lg font-bold text-gray-900">{checkin.mood}/5</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  {isRTL ? 'هنوز چک‌این سلامت روانی ثبت نشده' : 'No wellbeing check-ins yet'}
                </p>
              )}
            </div>

            {/* Recent Assessments */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {isRTL ? 'آزمون‌های اخیر' : 'Recent Assessments'}
              </h2>
              {detailedProgress.assessments.recent.length > 0 ? (
                <div className="space-y-3">
                  {detailedProgress.assessments.recent.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 transition"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">
                          {isRTL ? assessment.titleFA : assessment.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(assessment.completedAt).toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {assessment.percentage}%
                        </p>
                        <p className="text-sm text-gray-600">
                          {assessment.score}/{assessment.maxScore}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  {isRTL ? 'هنوز آزمونی تکمیل نشده' : 'No assessments completed yet'}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
