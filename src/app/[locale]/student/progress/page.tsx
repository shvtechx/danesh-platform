'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy, Star, Target, TrendingUp, Award, Flame,
  BookOpen, Clock, CheckCircle, Play, ChevronRight
} from 'lucide-react';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';

export default function EnhancedStudentDashboard() {
  const params = useParams();
  const locale = params.locale as string;
  const isRTL = locale === 'fa';

  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const headers = createUserHeaders(getStoredUserId());

      // Load progress data
      const progressRes = await fetch('/api/v1/student/progress', { headers });
      const progressJson = await progressRes.json();
      setProgressData(progressJson);

      // Load courses
      const coursesRes = await fetch('/api/v1/student/courses', { headers });
      const coursesJson = await coursesRes.json();
      setCourses(coursesJson.courses || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">{isRTL ? 'در حال بارگذاری...' : 'Loading your progress...'}</p>
        </div>
      </div>
    );
  }

  const xp = progressData?.xp || {
    total: 0,
    currentLevel: 1,
    xpInCurrentLevel: 0,
    xpNeededForNextLevel: 100,
    progressPercentage: 0
  };

  const badges = progressData?.badges || { total: 0, recent: [] };
  const quests = progressData?.quests || { active: [] };
  const phaseBreakdown = progressData?.phaseBreakdown || {};
  const recentActivity = progressData?.recentActivity || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {isRTL ? 'داشبورد من' : 'My Dashboard'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isRTL ? 'پیشرفت یادگیری شما' : 'Your learning progress'}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-bold text-gray-900">{isRTL ? 'نوار ۰ روزه' : '0-day streak'}</span>
          </div>
        </div>

        {/* XP & Level Progress */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 shadow-xl text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm opacity-90">{isRTL ? 'سطح فعلی' : 'Current Level'}</p>
                <h2 className="text-3xl font-bold">Level {xp.currentLevel}</h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{xp.total} XP</p>
              <p className="text-sm opacity-90">{isRTL ? 'مجموع امتیاز' : 'Total Points'}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white/20 rounded-full h-6 overflow-hidden backdrop-blur">
            <div
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full flex items-center justify-center text-xs font-bold transition-all duration-500"
              style={{ width: `${Math.min(xp.progressPercentage, 100)}%` }}
            >
              {xp.progressPercentage > 10 && `${Math.round(xp.progressPercentage)}%`}
            </div>
          </div>
          <p className="text-sm mt-2 opacity-90">
            {xp.xpInCurrentLevel} / {xp.xpNeededForNextLevel} XP {isRTL ? 'به سطح بعدی' : 'to next level'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Badges */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-yellow-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{isRTL ? 'نشان‌ها' : 'Badges'}</h3>
                <p className="text-sm text-gray-600">{badges.total} {isRTL ? 'کسب شده' : 'earned'}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {badges.recent.slice(0, 6).map((badge: any) => (
                <div
                  key={badge.id}
                  className="w-12 h-12 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
                  title={isRTL ? badge.nameFA : badge.name}
                >
                  <span className="text-2xl">{badge.icon || '🏆'}</span>
                </div>
              ))}
              {badges.total === 0 && (
                <p className="text-sm text-gray-500 italic">
                  {isRTL ? 'هنوز نشانی کسب نکرده‌اید' : 'No badges yet'}
                </p>
              )}
            </div>
          </div>

          {/* Active Quests */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{isRTL ? 'ماموریت‌ها' : 'Quests'}</h3>
                <p className="text-sm text-gray-600">{quests.active.length} {isRTL ? 'فعال' : 'active'}</p>
              </div>
            </div>
            {quests.active.length > 0 ? (
              <div className="space-y-2">
                {quests.active.slice(0, 3).map((quest: any) => (
                  <div key={quest.id} className="bg-purple-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {isRTL ? quest.titleFA : quest.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-purple-500 h-full transition-all"
                          style={{ width: `${quest.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-purple-600 font-bold">
                        {quest.completedSteps}/{quest.totalSteps}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                {isRTL ? 'هیچ ماموریت فعالی ندارید' : 'No active quests'}
              </p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{isRTL ? 'فعالیت اخیر' : 'Recent Activity'}</h3>
                <p className="text-sm text-gray-600">{isRTL ? 'آخرین دستاوردها' : 'Latest achievements'}</p>
              </div>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {recentActivity.slice(0, 5).map((activity: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{activity.sourceType || activity.eventType}</span>
                  <span className="font-bold text-green-600">+{activity.points} XP</span>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  {isRTL ? 'هنوز فعالیتی ندارید' : 'No recent activity'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 5E Phase Breakdown Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {isRTL ? 'پیشرفت چرخه ۵ت' : '5E Learning Cycle Progress'}
          </h3>
          <div className="grid grid-cols-5 gap-4">
            {[
              { key: '5E_ENGAGE', name: 'Engage', nameFA: 'تأثیر', color: 'purple', icon: '💡' },
              { key: '5E_EXPLORE', name: 'Explore', nameFA: 'تحقیق', color: 'blue', icon: '🔍' },
              { key: '5E_EXPLAIN', name: 'Explain', nameFA: 'توضیح', color: 'green', icon: '📖' },
              { key: '5E_ELABORATE', name: 'Elaborate', nameFA: 'تعمیم', color: 'orange', icon: '✏️' },
              { key: '5E_EVALUATE', name: 'Evaluate', nameFA: 'تعیین', color: 'red', icon: '🎯' }
            ].map((phase) => (
              <div key={phase.key} className={`bg-${phase.color}-50 rounded-xl p-4 text-center border-2 border-${phase.color}-200`}>
                <div className="text-3xl mb-2">{phase.icon}</div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {isRTL ? phase.nameFA : phase.name}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {phaseBreakdown[phase.key] || 0}
                </p>
                <p className="text-xs text-gray-600">{isRTL ? 'درس' : 'lessons'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* My Courses */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {isRTL ? 'دوره‌های من' : 'My Courses'}
            </h3>
            <Link href={`/${locale}/courses`} className="text-blue-600 hover:underline flex items-center gap-1">
              {isRTL ? 'مشاهده همه' : 'View All'}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.slice(0, 3).map((course) => (
                <div key={course.id} className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-400 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">
                        {isRTL ? course.titleFA : course.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {course.units?.length || 0} {isRTL ? 'واحد' : 'units'}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: course.subject?.color || '#3B82F6' }}>
                      <span className="text-xl">{course.subject?.icon || '📚'}</span>
                    </div>
                  </div>

                  {course.units && course.units[0] && course.units[0].lessons && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-600 mb-2">{isRTL ? 'درس‌های اخیر' : 'Recent Lessons'}</p>
                      {course.units[0].lessons.slice(0, 2).map((lesson: any) => (
                        <Link
                          key={lesson.id}
                          href={`/${locale}/student/lessons/${lesson.id}/learn`}
                          className="block bg-gray-50 rounded-lg p-2 mb-2 hover:bg-blue-50 transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-900">{isRTL ? lesson.titleFA : lesson.title}</span>
                            {lesson.completion ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Play className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  <Link
                    href={`/${locale}/student/dashboard`}
                    className="block text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    {isRTL ? 'ادامه یادگیری' : 'Continue Learning'}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">
              {isRTL ? 'هنوز در دوره‌ای ثبت‌نام نکرده‌اید' : 'You have not enrolled in any courses yet'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
