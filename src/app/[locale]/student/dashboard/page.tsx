'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  BookOpen,
  Award,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  PlayCircle,
  ChevronRight,
  Brain,
  Zap,
  BarChart3
} from 'lucide-react';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';

interface Course {
  id: string;
  title: string;
  titleFA: string | null;
  description: string | null;
  subject: {
    code: string;
    name: string;
    nameFA: string | null;
    icon: string;
    color: string;
  };
  units: Array<{
    id: string;
    title: string;
    titleFA: string | null;
    lessons: Array<{
      id: string;
      title: string;
      titleFA: string | null;
      phase: string;
      estimatedTime: number | null;
      completion?: {
        completedAt: string | null;
        masteryScore: number | null;
      };
    }>;
  }>;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const locale = useLocale();
  const isRTL = locale === 'fa';

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<any[]>([]);
  const [masteryStats, setMasteryStats] = useState({
    mastered: 0,
    proficient: 0,
    developing: 0,
    total: 0
  });

  useEffect(() => {
    loadCourses();
    loadSkills();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await fetch('/api/v1/student/courses', {
        headers: createUserHeaders(getStoredUserId()),
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSkills = async () => {
    try {
      const res = await fetch('/api/v1/skills', {
        headers: createUserHeaders(getStoredUserId()),
      });
      if (res.ok) {
        const data = await res.json();
        setSkills(data.skills || []);
        
        // Calculate mastery stats
        const mastered = data.skills?.filter((s: any) => s.masteryStatus === 'MASTERED' || s.masteryStatus === 'EXPERT').length || 0;
        const proficient = data.skills?.filter((s: any) => s.masteryStatus === 'PROFICIENT').length || 0;
        const developing = data.skills?.filter((s: any) => s.masteryStatus === 'DEVELOPING' || s.masteryStatus === 'STRUGGLING').length || 0;
        
        setMasteryStats({
          mastered,
          proficient,
          developing,
          total: data.skills?.length || 0
        });
      }
    } catch (error) {
      console.error('Error loading skills:', error);
    }
  };

  const startLesson = (lessonId: string) => {
    router.push(`/${locale}/student/lessons/${lessonId}/learn`);
  };

  const phaseColors: Record<string, string> = {
    ENGAGE: 'bg-purple-100 text-purple-700',
    EXPLORE: 'bg-blue-100 text-blue-700',
    EXPLAIN: 'bg-green-100 text-green-700',
    ELABORATE: 'bg-orange-100 text-orange-700',
    EVALUATE: 'bg-red-100 text-red-700'
  };

  const phaseNames: Record<string, { en: string; fa: string }> = {
    ENGAGE: { en: 'Engage', fa: 'تأثیر' },
    EXPLORE: { en: 'Explore', fa: 'تحقیق' },
    EXPLAIN: { en: 'Explain', fa: 'توضیح' },
    ELABORATE: { en: 'Elaborate', fa: 'تعمیم' },
    EVALUATE: { en: 'Evaluate', fa: 'تعیین' }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isRTL ? 'داشبورد دانش‌آموز' : 'Student Dashboard'}
          </h1>
          <p className="text-gray-600">
            {isRTL
              ? 'به پلتفرم یادگیری دانش خوش آمدید'
              : 'Welcome to Danesh Learning Platform'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {courses.reduce((sum, c) => sum + c.units.reduce((s, u) => s + u.lessons.length, 0), 0)}
            </p>
            <p className="text-gray-600 text-sm">
              {isRTL ? 'درس‌های موجود' : 'Available Lessons'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {courses.reduce(
                (sum, c) =>
                  sum +
                  c.units.reduce(
                    (s, u) => s + u.lessons.filter((l) => l.completion?.completedAt).length,
                    0
                  ),
                0
              )}
            </p>
            <p className="text-gray-600 text-sm">
              {isRTL ? 'درس‌های تکمیل شده' : 'Completed Lessons'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-gray-600 text-sm">{isRTL ? 'نشان‌ها' : 'Badges'}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">0 XP</p>
            <p className="text-gray-600 text-sm">{isRTL ? 'امتیاز تجربه' : 'Experience Points'}</p>
          </div>
        </div>

        {/* Adaptive Assessment Card */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8 text-white">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {isRTL ? 'سیستم ارزیابی تطبیقی' : 'Adaptive Assessment System'}
                    </h2>
                    <p className="text-white/80">
                      {isRTL
                        ? 'تمرین هوشمند برای پیشرفت سریع‌تر'
                        : 'Smart practice for faster progress'}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/${locale}/student/skills`}
                  className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  {isRTL ? 'مشاهده مهارت‌ها' : 'View Skills'}
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="w-6 h-6 text-white/80" />
                    <span className="text-3xl font-bold">{masteryStats.total}</span>
                  </div>
                  <p className="text-sm text-white/70">
                    {isRTL ? 'مهارت‌های موجود' : 'Total Skills'}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <Award className="w-6 h-6 text-white/80" />
                    <span className="text-3xl font-bold">{masteryStats.mastered}</span>
                  </div>
                  <p className="text-sm text-white/70">
                    {isRTL ? 'تسلط یافته' : 'Mastered'}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="w-6 h-6 text-white/80" />
                    <span className="text-3xl font-bold">{masteryStats.proficient}</span>
                  </div>
                  <p className="text-sm text-white/70">
                    {isRTL ? 'ماهر' : 'Proficient'}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-6 h-6 text-white/80" />
                    <span className="text-3xl font-bold">{masteryStats.developing}</span>
                  </div>
                  <p className="text-sm text-white/70">
                    {isRTL ? 'در حال یادگیری' : 'Learning'}
                  </p>
                </div>
              </div>

              {skills.length > 0 && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {skills.slice(0, 4).map((skill: any) => (
                    <Link
                      key={skill.id}
                      href={`/${locale}/student/practice/${skill.id}`}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white group-hover:underline">
                            {isRTL && skill.nameFA ? skill.nameFA : skill.name}
                          </h4>
                          <p className="text-sm text-white/70 mt-1">
                            {isRTL ? 'سطح تسلط:' : 'Mastery:'} {skill.masteryScore || 0}%
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-yellow-300" />
                          <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Courses */}
        {courses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isRTL ? 'هنوز در هیچ دوره‌ای ثبت‌نام نکرده‌اید' : 'No courses enrolled yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {isRTL
                ? 'برای شروع یادگیری، در یک دوره ثبت‌نام کنید'
                : 'Enroll in a course to start learning'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Course Header */}
                <div
                  className="p-6"
                  style={{ backgroundColor: `${course.subject.color}20`, borderLeft: `4px solid ${course.subject.color}` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{course.subject.icon}</div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {isRTL && course.titleFA ? course.titleFA : course.title}
                      </h2>
                      <p className="text-gray-600">
                        {isRTL && course.subject.nameFA
                          ? course.subject.nameFA
                          : course.subject.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Units & Lessons */}
                <div className="p-6">
                  {course.units.map((unit) => (
                    <div key={unit.id} className="mb-6 last:mb-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {isRTL && unit.titleFA ? unit.titleFA : unit.title}
                      </h3>

                      <div className="space-y-2">
                        {unit.lessons.map((lesson) => {
                          const isCompleted = !!lesson.completion?.completedAt;
                          const phaseName = phaseNames[lesson.phase];
                          const phaseColor = phaseColors[lesson.phase];

                          return (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-4 flex-1">
                                {isCompleted ? (
                                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                                ) : (
                                  <PlayCircle className="w-6 h-6 text-blue-500 flex-shrink-0" />
                                )}

                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900">
                                    {isRTL && lesson.titleFA ? lesson.titleFA : lesson.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-1 rounded ${phaseColor}`}>
                                      {isRTL ? phaseName?.fa : phaseName?.en}
                                    </span>
                                    {lesson.estimatedTime && (
                                      <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {lesson.estimatedTime} {isRTL ? 'دقیقه' : 'min'}
                                      </span>
                                    )}
                                    {isCompleted && lesson.completion?.masteryScore && (
                                      <span className="text-xs text-green-600 font-medium">
                                        {Math.round(lesson.completion.masteryScore)}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => startLesson(lesson.id)}
                                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex-shrink-0"
                              >
                                {isCompleted ? (
                                  <>
                                    {isRTL ? 'مرور' : 'Review'}
                                    <ChevronRight className="w-4 h-4" />
                                  </>
                                ) : (
                                  <>
                                    {isRTL ? 'شروع' : 'Start'}
                                    <PlayCircle className="w-4 h-4" />
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
