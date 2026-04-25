'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Clock, Users, Star, Filter, Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { AUTH_STORAGE_KEY, getPrimaryRole } from '@/lib/auth/demo-users';

export default function CoursesPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const [activeRole, setActiveRole] = useState<string>('STUDENT');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { roles?: string[] };
      setActiveRole(getPrimaryRole(parsed?.roles || []));
    } catch {
      setActiveRole('STUDENT');
    }
  }, []);

  const hasFullCourseAccess = activeRole === 'SUPER_ADMIN' || activeRole === 'SUBJECT_ADMIN';

  const courses = [
    {
      id: '1',
      title: isRTL ? 'ریاضی پایه هشتم' : 'Grade 8 Mathematics',
      description: isRTL ? 'معادلات خطی و نامعادلات' : 'Linear equations and inequalities',
      instructor: isRTL ? 'دکتر احمدی' : 'Dr. Ahmadi',
      progress: 65,
      lessons: 24,
      duration: '12 hours',
      students: 1250,
      rating: 4.8,
      enrolled: true,
    },
    {
      id: '2',
      title: isRTL ? 'علوم تجربی' : 'Science',
      description: isRTL ? 'فیزیک، شیمی و زیست‌شناسی' : 'Physics, Chemistry & Biology',
      instructor: isRTL ? 'استاد رضایی' : 'Prof. Rezaei',
      progress: 40,
      lessons: 32,
      duration: '18 hours',
      students: 980,
      rating: 4.6,
      enrolled: true,
    },
    {
      id: '3',
      title: isRTL ? 'زبان انگلیسی' : 'English Language',
      description: isRTL ? 'گرامر و مکالمه' : 'Grammar and Conversation',
      instructor: isRTL ? 'خانم کریمی' : 'Ms. Karimi',
      progress: 80,
      lessons: 18,
      duration: '10 hours',
      students: 2100,
      rating: 4.9,
      enrolled: true,
    },
    {
      id: '4',
      title: isRTL ? 'ادبیات فارسی' : 'Persian Literature',
      description: isRTL ? 'شعر و نثر معاصر' : 'Contemporary poetry and prose',
      instructor: isRTL ? 'استاد محمدی' : 'Prof. Mohammadi',
      progress: 0,
      lessons: 20,
      duration: '14 hours',
      students: 650,
      rating: 4.7,
      enrolled: false,
    },
    {
      id: '5',
      title: isRTL
        ? 'AI + Robotics Venture Lab (Paid)'
        : 'AI + Robotics Venture Lab (Paid)',
      description: isRTL
        ? '۴ ترم پروژه‌محور: از ایده تا اپ واقعی خانوادگی، ربات هوشمند و دمو دی'
        : '4-term project-based pathway: from opportunity discovery to family-business app, smart robotics, and Demo Day.',
      instructor: isRTL ? 'Danesh Innovation Faculty' : 'Danesh Innovation Faculty',
      progress: 0,
      lessons: 12,
      duration: '48 workshop hours',
      students: 120,
      rating: 4.9,
      enrolled: false,
      paid: true,
      price: '$249 / term',
    },
  ];

  const visibleCourses = useMemo(
    () =>
      courses.map((course) => {
        if (!hasFullCourseAccess) return course;
        return {
          ...course,
          enrolled: true,
          progress: course.progress || 0,
        };
      }),
    [courses, hasFullCourseAccess],
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        locale={locale} 
        title={t('courses.title')}
        backHref={`/${locale}/dashboard`}
        backLabel={isRTL ? 'داشبورد' : 'Dashboard'}
      />
      <div className="space-y-6 p-6">
        {hasFullCourseAccess && (
          <div className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
            {isRTL
              ? 'شما با نقش مدیر به همه دوره‌ها (از جمله دوره‌های ویژه پولی) دسترسی کامل دارید.'
              : 'You have full access to all courses (including premium paid courses) through your admin role.'}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-muted-foreground">{isRTL ? 'دوره‌های آموزشی شما' : 'Your learning courses'}</p>
          </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder={t('common.search')}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm"
            />
          </div>
          <button className="h-10 px-4 rounded-lg border border-input bg-background hover:bg-muted flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t('common.filter')}
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        <button className="px-4 py-2 border-b-2 border-primary text-primary font-medium">
          {t('courses.myCourses')}
        </button>
        <button className="px-4 py-2 text-muted-foreground hover:text-foreground">
          {t('courses.allCourses')}
        </button>
        <button className="px-4 py-2 text-muted-foreground hover:text-foreground">
          {t('courses.recommended')}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visibleCourses.map((course) => (
          <Link
            key={course.id}
            href={`/${locale}/courses/${course.id}`}
            className="group rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all"
          >
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-primary/50" />
            </div>
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">{course.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                {course.paid && (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      {isRTL ? 'دوره ویژه پولی' : 'Premium Paid Course'}
                    </span>
                    <span className="text-xs font-semibold text-primary">{course.price}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {course.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {course.students}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500" />
                  {course.rating}
                </span>
              </div>
              {course.enrolled && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{t('courses.progress')}</span>
                    <span className="font-medium">{course.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              )}
              {!course.enrolled && (
                <button className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90">
                  {t('courses.enrollNow')}
                </button>
              )}
            </div>
          </Link>
        ))}
      </div>
      </div>
    </div>
  );
}
