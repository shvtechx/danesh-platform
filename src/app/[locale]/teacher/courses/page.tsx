'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import { 
  BookOpen, ArrowLeft, ArrowRight, Plus, Search,
  MoreVertical, Edit, Trash2, Eye, Users, FileText, Clock,
  ChevronRight, ChevronLeft, Calendar, BarChart, Copy, Archive
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  grade: string;
  gradeCode: string;
  subject: string;
  subjectCode: string;
  students: number;
  lessons: number;
  status: 'published' | 'draft';
  progress: number;
  createdAt: string;
  lastUpdated: string;
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export default function TeacherCourses({ params: { locale } }: { params: { locale: string } }) {
  const router = useRouter();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;
  const NavArrow = isRTL ? ChevronLeft : ChevronRight;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        setFeedback(null);

        const response = await fetch(`/api/v1/teacher/courses?locale=${locale}`, {
          headers: createUserHeaders(getStoredUserId()),
        });

        if (!response.ok) {
          throw new Error('Failed to load teacher courses');
        }

        const data = await response.json();
        setCourses(data.courses || []);
      } catch {
        setCourses([]);
        setFeedback({
          variant: 'error',
          message: isRTL ? 'بارگذاری دوره‌های معلم ممکن نبود.' : 'Teacher courses could not be loaded.',
        });
      } finally {
        setLoading(false);
      }
    };

    void loadCourses();
  }, [isRTL, locale]);

  const handleCourseAction = (course: Course, action: 'duplicate' | 'analytics' | 'archive' | 'delete') => {
    if (action === 'analytics') {
      router.push(`/${locale}/teacher/analytics`);
      setShowMenu(null);
      return;
    }

    setFeedback({
      variant: 'info',
      message: isRTL
        ? 'این عمل هنوز به جریان ویرایش دوره متصل نشده است.'
        : 'This action is not yet connected to the course editing workflow.',
    });
    setShowMenu(null);
  };

  const filteredCourses = useMemo(
    () => courses.filter((course) => {
      const matchesSearch = [course.title, course.description, course.subject, course.grade]
        .join(' ')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || course.status === filterStatus;
      return matchesSearch && matchesStatus;
    }),
    [courses, filterStatus, searchQuery],
  );

  const stats = useMemo(
    () => ({
      totalCourses: courses.length,
      published: courses.filter((course) => course.status === 'published').length,
      drafts: courses.filter((course) => course.status === 'draft').length,
      students: courses.reduce((sum, course) => sum + course.students, 0),
    }),
    [courses],
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {isRTL ? 'منتشر شده' : 'Published'}
          </span>
        );
      case 'draft':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            {isRTL ? 'پیش‌نویس' : 'Draft'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/${locale}/teacher`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Arrow className="h-5 w-5" />
              <span>{isRTL ? 'بازگشت' : 'Back'}</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-semibold">{isRTL ? 'مدیریت دوره‌ها' : 'Manage Courses'}</h1>
          </div>
          <Link
            href={`/${locale}/teacher/courses/new`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{isRTL ? 'دوره جدید' : 'New Course'}</span>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {feedback ? <FeedbackBanner className="mb-6" variant={feedback.variant} message={feedback.message} /> : null}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalCourses}</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'کل دوره‌ها' : 'Total Courses'}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.published}</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'منتشر شده' : 'Published'}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Edit className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.drafts}</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'پیش‌نویس' : 'Drafts'}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.students}</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'کل دانش‌آموزان' : 'Total Students'}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'جستجوی دوره...' : 'Search courses...'}
              className="w-full ps-10 pe-4 py-2 rounded-lg border bg-background"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'published', 'draft'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as 'all' | 'published' | 'draft')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filterStatus === status 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card border hover:bg-muted'
                }`}
              >
                {status === 'all' ? (isRTL ? 'همه' : 'All') :
                 status === 'published' ? (isRTL ? 'منتشر شده' : 'Published') :
                 (isRTL ? 'پیش‌نویس' : 'Draft')}
              </button>
            ))}
          </div>
        </div>

        {/* Courses List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12 bg-card border rounded-xl">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {isRTL ? 'هیچ دوره تخصیص‌یافته‌ای یافت نشد.' : 'No assigned courses were found.'}
              </p>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <div 
                key={course.id}
                className="bg-card border rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Course Icon */}
                  <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>

                  {/* Course Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{course.title}</h3>
                          {getStatusBadge(course.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
                      </div>
                      
                      {/* Actions Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setShowMenu(showMenu === course.id ? null : course.id)}
                          className="p-2 rounded-lg hover:bg-muted"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {showMenu === course.id && (
                          <div className="absolute end-0 top-full mt-1 w-48 bg-card border rounded-xl shadow-lg z-10">
                            <Link
                              href={`/${locale}/teacher/courses/${course.id}`}
                              className="flex items-center gap-2 px-4 py-2 hover:bg-muted"
                            >
                              <Edit className="h-4 w-4" />
                              {isRTL ? 'ویرایش دوره' : 'Edit Course'}
                            </Link>
                            <Link
                              href={`/${locale}/courses/${course.id}`}
                              className="flex items-center gap-2 px-4 py-2 hover:bg-muted"
                            >
                              <Eye className="h-4 w-4" />
                              {isRTL ? 'مشاهده' : 'View'}
                            </Link>
                            <button type="button" onClick={() => handleCourseAction(course, 'duplicate')} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted">
                              <Copy className="h-4 w-4" />
                              {isRTL ? 'کپی دوره' : 'Duplicate'}
                            </button>
                            <button type="button" onClick={() => handleCourseAction(course, 'analytics')} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted">
                              <BarChart className="h-4 w-4" />
                              {isRTL ? 'تحلیل‌ها' : 'Analytics'}
                            </button>
                            <div className="border-t my-1" />
                            <button type="button" onClick={() => handleCourseAction(course, 'archive')} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted">
                              <Archive className="h-4 w-4" />
                              {isRTL ? 'آرشیو کردن' : 'Archive'}
                            </button>
                            <button type="button" onClick={() => handleCourseAction(course, 'delete')} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-destructive/10 text-destructive">
                              <Trash2 className="h-4 w-4" />
                              {isRTL ? 'حذف' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.students} {isRTL ? 'دانش‌آموز' : 'students'}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {course.lessons} {isRTL ? 'درس' : 'lessons'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {course.grade}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {isRTL ? 'آخرین بروزرسانی:' : 'Updated:'} {formatDate(course.lastUpdated, locale)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-muted">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{course.progress}%</span>
                      <Link
                        href={`/${locale}/teacher/courses/${course.id}`}
                        className="text-primary hover:underline text-sm flex items-center gap-1"
                      >
                        {isRTL ? 'ادامه ویرایش' : 'Continue'}
                        <NavArrow className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
