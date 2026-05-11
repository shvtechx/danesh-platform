'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Clock, Users, Star, Filter, Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AUTH_STORAGE_KEY,
  createUserHeaders,
  getPrimaryRole,
  getStoredUserId,
} from '@/lib/auth/demo-auth-shared';
import { isDemoDataEnabled } from '@/lib/demo/demo-mode';

  interface CourseCard {
    id: string;
    title: string;
    titleFA?: string | null;
    description: string;
    duration: string;
    students: number;
    rating: number;
    progress: number;
    enrolled: boolean;
    paid?: boolean;
    price?: string;
    source: 'database' | 'fallback';
  }

  const FALLBACK_COURSES = {
    en: [
      {
        id: '1',
        title: 'Grade 8 Mathematics',
        titleFA: 'ریاضی پایه هشتم',
        description: 'Linear equations and inequalities',
        duration: '12 hours',
        students: 1250,
        rating: 4.8,
        progress: 65,
        enrolled: true,
      },
      {
        id: '2',
        title: 'Science',
        titleFA: 'علوم تجربی',
        description: 'Physics, Chemistry & Biology',
        duration: '18 hours',
        students: 980,
        rating: 4.6,
        progress: 40,
        enrolled: true,
      },
      {
        id: '3',
        title: 'English Language',
        titleFA: 'زبان انگلیسی',
        description: 'Grammar and Conversation',
        duration: '10 hours',
        students: 2100,
        rating: 4.9,
        progress: 80,
        enrolled: true,
      },
      {
        id: '4',
        title: 'Persian Literature',
        titleFA: 'ادبیات فارسی',
        description: 'Contemporary poetry and prose',
        duration: '14 hours',
        students: 650,
        rating: 4.7,
        progress: 0,
        enrolled: false,
      },
      {
        id: '5',
        title: 'AI + Robotics Venture Lab (Paid)',
        titleFA: 'AI + Robotics Venture Lab (Paid)',
        description: '4-term project-based pathway: from opportunity discovery to family-business app, smart robotics, and Demo Day.',
        duration: '48 workshop hours',
        students: 120,
        rating: 4.9,
        progress: 0,
        enrolled: false,
        paid: true,
        price: '$249 / term',
      },
    ],
    fa: [
      {
        id: '1',
        title: 'ریاضی پایه هشتم',
        titleFA: 'ریاضی پایه هشتم',
        description: 'معادلات خطی و نامعادلات',
        duration: '۱۲ ساعت',
        students: 1250,
        rating: 4.8,
        progress: 65,
        enrolled: true,
      },
      {
        id: '2',
        title: 'علوم تجربی',
        titleFA: 'علوم تجربی',
        description: 'فیزیک، شیمی و زیست‌شناسی',
        duration: '۱۸ ساعت',
        students: 980,
        rating: 4.6,
        progress: 40,
        enrolled: true,
      },
      {
        id: '3',
        title: 'زبان انگلیسی',
        titleFA: 'زبان انگلیسی',
        description: 'گرامر و مکالمه',
        duration: '۱۰ ساعت',
        students: 2100,
        rating: 4.9,
        progress: 80,
        enrolled: true,
      },
      {
        id: '4',
        title: 'ادبیات فارسی',
        titleFA: 'ادبیات فارسی',
        description: 'شعر و نثر معاصر',
        duration: '۱۴ ساعت',
        students: 650,
        rating: 4.7,
        progress: 0,
        enrolled: false,
      },
      {
        id: '5',
        title: 'AI + Robotics Venture Lab (Paid)',
        titleFA: 'AI + Robotics Venture Lab (Paid)',
        description: '۴ ترم پروژه‌محور: از ایده تا اپ واقعی خانوادگی، ربات هوشمند و دمو دی',
        duration: '۴۸ ساعت کارگاهی',
        students: 120,
        rating: 4.9,
        progress: 0,
        enrolled: false,
        paid: true,
        price: '$249 / term',
      },
    ],
  } as const;

  function getFallbackCourses(locale: string): CourseCard[] {
    return (locale === 'fa' ? FALLBACK_COURSES.fa : FALLBACK_COURSES.en).map((course) => ({
      ...course,
      source: 'fallback',
    }));
  }

  export default function CoursesPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations();
    const isRTL = locale === 'fa';
    const demoDataEnabled = isDemoDataEnabled();
    const [activeRole, setActiveRole] = useState<string>('STUDENT');
    const [activeUserId, setActiveUserId] = useState<string | null>(null);
    const [catalogCourses, setCatalogCourses] = useState<CourseCard[]>(() => demoDataEnabled ? getFallbackCourses(locale) : []);
    const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(
      () => new Set((demoDataEnabled ? getFallbackCourses(locale) : []).filter((course) => course.enrolled).map((course) => course.id))
    );
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'my' | 'all' | 'recommended'>('my');
    const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [pendingPaidCourse, setPendingPaidCourse] = useState<{ id: string; title: string; price: string } | null>(null);

    useEffect(() => {
      try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        setActiveUserId(getStoredUserId());
        if (!raw) return;
        const parsed = JSON.parse(raw) as { roles?: string[] };
        setActiveRole(getPrimaryRole(parsed?.roles || []));
      } catch {
        setActiveRole('STUDENT');
        setActiveUserId(null);
      }
    }, []);

    useEffect(() => {
      let active = true;

      const loadCatalog = async () => {
        try {
          const [catalogRes, enrolledRes] = await Promise.all([
            fetch(`/api/v1/courses?locale=${locale}`),
            activeUserId ? fetch('/api/v1/student/courses', { headers: createUserHeaders(activeUserId) }) : Promise.resolve(null),
          ]);

          const enrolledIds = new Set<string>();
          if (enrolledRes?.ok) {
            const enrolledData = await enrolledRes.json();
            for (const course of enrolledData.courses || []) {
              enrolledIds.add(course.id);
            }
          }

          if (catalogRes.ok) {
            const catalogData = await catalogRes.json();
            if (Array.isArray(catalogData.courses) && catalogData.courses.length > 0) {
              const mappedCatalog: CourseCard[] = catalogData.courses.map((course: any) => ({
                id: course.id,
                title: course.title,
                titleFA: course.titleFA,
                description:
                  course.description ||
                  (isRTL ? 'توضیحی برای این دوره ثبت نشده است.' : 'No description available for this course.'),
                duration:
                  course.totalLessons > 0
                    ? isRTL
                      ? `${course.totalLessons} درس`
                      : `${course.totalLessons} lessons`
                    : isRTL
                      ? `${course.unitsCount || 0} واحد`
                      : `${course.unitsCount || 0} units`,
                students: course.enrollmentsCount || 0,
                rating: 4.8,
                progress: 0,
                enrolled: enrolledIds.has(course.id),
                source: 'database',
              }));

              if (active) {
                setCatalogCourses(mappedCatalog);
                setEnrolledCourseIds(enrolledIds);
              }
              return;
            }
          }

          if (active) {
            const fallbackCourses = demoDataEnabled ? getFallbackCourses(locale) : [];
            setCatalogCourses(fallbackCourses);
            setEnrolledCourseIds(new Set(fallbackCourses.filter((course) => course.enrolled).map((course) => course.id)));
          }
        } catch (error) {
          console.error('Error loading course catalog:', error);
          if (active) {
            const fallbackCourses = demoDataEnabled ? getFallbackCourses(locale) : [];
            setCatalogCourses(fallbackCourses);
            setEnrolledCourseIds(new Set(fallbackCourses.filter((course) => course.enrolled).map((course) => course.id)));
          }
        }
      };

      loadCatalog();

      return () => {
        active = false;
      };
    }, [activeUserId, demoDataEnabled, isRTL, locale]);

    const handleEnroll = async (courseId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const course = catalogCourses.find((item) => item.id === courseId);
      if (!course) return;

      if (course.paid) {
        setPendingPaidCourse({ id: course.id, title: course.title, price: course.price || '' });
        return;
      }

      if (course.source === 'database' && activeUserId) {
        try {
          const response = await fetch('/api/v1/student/courses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...createUserHeaders(activeUserId),
            },
            body: JSON.stringify({
              courseId: course.id,
              courseTitle: course.title,
              courseTitleFA: course.titleFA,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to enroll in course');
          }
        } catch (error) {
          console.error('Error enrolling in course:', error);
          setFeedback({
            variant: 'error',
            message: isRTL ? 'ثبت‌نام انجام نشد. دوباره تلاش کنید.' : 'Enrollment failed. Please try again.',
          });
          return;
        }
      }

      setEnrolledCourseIds((prev) => new Set(Array.from(prev).concat(courseId)));
      setFeedback({
        variant: 'success',
        message: isRTL ? 'ثبت‌نام با موفقیت انجام شد!' : 'Successfully enrolled!',
      });
    };

    const confirmPaidEnrollment = () => {
      if (!pendingPaidCourse) return;

      setFeedback({
        variant: 'info',
        message: isRTL ? 'در حال انتقال به صفحه پرداخت...' : 'Redirecting to payment page...',
      });
      setPendingPaidCourse(null);
    };

    const hasFullCourseAccess = activeRole === 'SUPER_ADMIN' || activeRole === 'SUBJECT_ADMIN';

    const visibleCourses = useMemo(
      () =>
        catalogCourses
          .filter((course) => {
            if (activeTab === 'my') return enrolledCourseIds.has(course.id) || hasFullCourseAccess;
            if (activeTab === 'all') return true;
            if (activeTab === 'recommended') return !enrolledCourseIds.has(course.id);
            return true;
          })
          .filter((course) => {
            if (!searchTerm) return true;
            return (
              course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              course.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
          })
          .map((course) => ({
            ...course,
            enrolled: enrolledCourseIds.has(course.id) || hasFullCourseAccess,
            progress: enrolledCourseIds.has(course.id) || hasFullCourseAccess ? course.progress : 0,
          })),
      [activeTab, catalogCourses, enrolledCourseIds, hasFullCourseAccess, searchTerm]
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
          {feedback ? <FeedbackBanner variant={feedback.variant} message={feedback.message} /> : null}

          {hasFullCourseAccess && (
            <div className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
              {isRTL
                ? 'شما با نقش مدیر به همه دوره‌ها (از جمله دوره‌های ویژه پولی) دسترسی کامل دارید.'
                : 'You have full access to all courses (including premium paid courses) through your admin role.'}
            </div>
          )}

          {!demoDataEnabled && catalogCourses.length === 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
              {isRTL
                ? 'داده‌های نمایشی غیرفعال هستند. دوره‌های واقعی را ایجاد کنید تا این بخش با داده‌های واقعی پر شود.'
                : 'Demo data is disabled. Create real courses to populate this catalog.'}
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-muted-foreground">{isRTL ? 'دوره‌های آموزشی شما' : 'Your learning courses'}</p>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('common.search')}
                  className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => setActiveTab((current) => (current === 'recommended' ? 'all' : 'recommended'))}
                className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-4 hover:bg-muted"
              >
                <Filter className="h-4 w-4" />
                {t('common.filter')}
              </button>
            </div>
          </div>

          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('my')}
              className={`border-b-2 px-4 py-2 font-medium ${activeTab === 'my' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {t('courses.myCourses')}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`border-b-2 px-4 py-2 font-medium ${activeTab === 'all' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {t('courses.allCourses')}
            </button>
            <button
              onClick={() => setActiveTab('recommended')}
              className={`border-b-2 px-4 py-2 font-medium ${activeTab === 'recommended' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {t('courses.recommended')}
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleCourses.map((course) => (
              <Link
                key={course.id}
                href={`/${locale}/courses/${course.id}`}
                className="group overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg"
              >
                <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <BookOpen className="h-12 w-12 text-primary/50" />
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="font-semibold transition-colors group-hover:text-primary">{course.title}</h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
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
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${course.progress}%` }} />
                      </div>
                    </div>
                  )}
                  {!course.enrolled && (
                    <button
                      onClick={(e) => handleEnroll(course.id, e)}
                      className="w-full rounded-lg bg-primary py-2 font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      {t('courses.enrollNow')}
                    </button>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <Dialog open={Boolean(pendingPaidCourse)} onOpenChange={(open) => !open && setPendingPaidCourse(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRTL ? 'ثبت‌نام در دوره پولی' : 'Enroll in paid course'}</DialogTitle>
              <DialogDescription>
                {isRTL
                  ? `دوره «${pendingPaidCourse?.title ?? ''}» با هزینه ${pendingPaidCourse?.price ?? ''} ارائه می‌شود. آیا مایلید به صفحه پرداخت بروید؟`
                  : `"${pendingPaidCourse?.title ?? ''}" costs ${pendingPaidCourse?.price ?? ''}. Would you like to continue to payment?`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button type="button" onClick={() => setPendingPaidCourse(null)} className="rounded-lg border px-4 py-2 hover:bg-muted">
                {isRTL ? 'انصراف' : 'Cancel'}
              </button>
              <button type="button" onClick={confirmPaidEnrollment} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
                {isRTL ? 'ادامه به پرداخت' : 'Continue to payment'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
