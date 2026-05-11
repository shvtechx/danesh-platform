'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Calendar, Check, Edit, GraduationCap,
  Mail, Phone, Plus, Trash2, Users, X,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

interface TeacherRecord {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  department: string | null;
  departmentLabel: string;
  subjects: string[];
  subjectLabels?: string[];
  assignedCourseIds: string[];
  students: number;
  courses: number;
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  avatar: string;
  bio: string;
}

interface CourseOption {
  id: string;
  code: string;
  title: string;
  titleFA: string | null;
  subjectCode: string;
  subjectName: string;
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export default function TeacherDetailPage({ params: { locale, id } }: { params: { locale: string; id: string } }) {
  const isRTL = locale === 'fa';
  const router = useRouter();

  const [teacher, setTeacher] = useState<TeacherRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Course assignment state
  const [allCourses, setAllCourses] = useState<CourseOption[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());
  const [isSavingCourses, setIsSavingCourses] = useState(false);
  const [coursesSaved, setCoursesSaved] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [courseFilter, setCourseFilter] = useState('');

  const loadTeacher = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/admin/teachers/${id}?locale=${locale}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'failed_to_load_teacher');
      setTeacher(data.teacher || null);
      setSelectedCourseIds(new Set(data.teacher?.assignedCourseIds || []));
    } catch {
      setTeacher(null);
      setError(isRTL ? 'اطلاعات معلم بارگیری نشد.' : 'Unable to load teacher details.');
    } finally {
      setLoading(false);
    }
  }, [id, isRTL, locale]);

  const loadCourses = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/courses?limit=200', { cache: 'no-store' });
      const data = await response.json();
      const raw: any[] = data.courses || data.data || [];
      setAllCourses(raw.map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        titleFA: c.titleFA || null,
        subjectCode: c.subject?.code || c.subjectCode || '',
        subjectName: c.subject?.name || c.subjectName || c.subject?.code || '',
      })));
    } catch {
      // non-fatal: course panel will show empty
    }
  }, []);

  useEffect(() => {
    loadTeacher();
    loadCourses();
  }, [loadTeacher, loadCourses]);

  // Subjects are auto-derived from selected courses — no separate subject assignment needed
  const derivedSubjects = useMemo(() => {
    const names = new Map<string, string>();
    for (const courseId of Array.from(selectedCourseIds)) {
      const course = allCourses.find((c) => c.id === courseId);
      if (course?.subjectCode && course?.subjectName) {
        names.set(course.subjectCode, course.subjectName);
      }
    }
    return Array.from(names.values());
  }, [selectedCourseIds, allCourses]);

  const filteredCourses = useMemo(() => {
    const q = courseFilter.trim().toLowerCase();
    if (!q) return allCourses;
    return allCourses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.titleFA || '').includes(q) ||
        c.subjectCode.toLowerCase().includes(q) ||
        c.subjectName.toLowerCase().includes(q),
    );
  }, [allCourses, courseFilter]);

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
    setCoursesSaved(false);
  };

  const saveCourseAssignments = async () => {
    setIsSavingCourses(true);
    setCoursesError(null);
    setCoursesSaved(false);
    try {
      const response = await fetch(`/api/v1/admin/teachers/${id}/assignments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedCourseIds: Array.from(selectedCourseIds),
          assignedSubjectCodes: [], // subjects are auto-derived from course subjects by the API
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'failed_to_save');
      setCoursesSaved(true);
      await loadTeacher();
    } catch (err) {
      setCoursesError(err instanceof Error ? err.message : (isRTL ? 'ذخیره دوره‌ها انجام نشد.' : 'Failed to save course assignments.'));
    } finally {
      setIsSavingCourses(false);
    }
  };

  const statusLabel = useMemo(() => {
    if (!teacher) return '';
    if (teacher.status === 'active') return isRTL ? 'فعال' : 'Active';
    if (teacher.status === 'inactive') return isRTL ? 'غیرفعال' : 'Inactive';
    return isRTL ? 'در انتظار' : 'Pending';
  }, [isRTL, teacher]);

  const statusClassName = useMemo(() => {
    if (!teacher) return '';
    if (teacher.status === 'active') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (teacher.status === 'inactive') return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  }, [teacher]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/v1/admin/teachers/${id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'failed_to_delete_teacher');
      router.push(`/${locale}/admin/teachers`);
      router.refresh();
    } catch {
      setError(isRTL ? 'حذف معلم انجام نشد.' : 'Unable to delete the teacher.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        locale={locale}
        title={isRTL ? 'جزئیات معلم' : 'Teacher Details'}
        backHref={`/${locale}/admin/teachers`}
        backLabel={isRTL ? 'بازگشت به فهرست' : 'Back to teachers'}
      >
        <Link href={`/${locale}/admin/teachers/${id}/edit`} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted">
          <Edit className="h-4 w-4" />
          <span>{isRTL ? 'ویرایش' : 'Edit'}</span>
        </Link>
        <button
          onClick={handleDelete}
          disabled={isDeleting || loading || !teacher}
          className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm text-white hover:bg-destructive/90 disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          <span>{isDeleting ? (isRTL ? 'در حال حذف...' : 'Deleting...') : (isRTL ? 'حذف' : 'Delete')}</span>
        </button>
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
        )}

        {loading ? (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
            {isRTL ? 'در حال بارگیری...' : 'Loading...'}
          </div>
        ) : !teacher ? (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
            {isRTL ? 'معلم پیدا نشد.' : 'Teacher not found.'}
          </div>
        ) : (
          <div className="space-y-6">

            {/* Profile card */}
            <div className="rounded-xl border bg-card p-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 text-4xl font-bold text-primary">
                  {teacher.avatar}
                </div>
                <div className="flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold">{teacher.name}</h2>
                    <span className={`rounded-full px-3 py-1 text-sm ${statusClassName}`}>{statusLabel}</span>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">{teacher.departmentLabel} • {teacher.subject}</p>
                  <p className="mb-4 text-sm leading-6 text-muted-foreground">
                    {teacher.bio || (isRTL ? 'برای این معلم توضیحی ثبت نشده است.' : 'No biography has been added for this teacher.')}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />{teacher.email}
                    </span>
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {teacher.phone || (isRTL ? 'ثبت نشده' : 'Not provided')}
                    </span>
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {isRTL ? 'عضویت:' : 'Joined:'} {formatDate(teacher.joinDate, locale)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border bg-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{isRTL ? 'موضوع‌های تدریس' : 'Teaching Subjects'}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {derivedSubjects.length > 0
                    ? derivedSubjects.map((name) => (
                        <span key={name} className="rounded-lg bg-muted px-3 py-1 text-sm">{name}</span>
                      ))
                    : <span className="text-sm text-muted-foreground">{isRTL ? 'پس از تخصیص دوره نمایش می‌یابد' : 'Shown after courses are assigned'}</span>}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{isRTL ? 'بر اساس دوره‌های تخصیص‌یافته' : 'Auto-derived from assigned courses'}</p>
              </div>
              <div className="rounded-xl border bg-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{isRTL ? 'دانش‌آموزان' : 'Students'}</h3>
                </div>
                <p className="text-3xl font-bold">{teacher.students}</p>
                <p className="text-sm text-muted-foreground">{isRTL ? 'در حال حاضر تخصیص داده شده' : 'Currently assigned'}</p>
              </div>
              <div className="rounded-xl border bg-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{isRTL ? 'دوره‌ها' : 'Courses'}</h3>
                </div>
                <p className="text-3xl font-bold">{selectedCourseIds.size}</p>
                <p className="text-sm text-muted-foreground">{isRTL ? 'دوره‌های تخصیص داده شده' : 'Assigned courses'}</p>
              </div>
            </div>

            {/* Course Assignment Panel */}
            <div className="rounded-xl border bg-card p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">
                    {isRTL ? 'تخصیص دوره‌ها به معلم' : 'Assign Courses to Teacher'}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  {coursesSaved && (
                    <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                      <Check className="h-4 w-4" />
                      {isRTL ? 'ذخیره شد' : 'Saved'}
                    </span>
                  )}
                  <button
                    onClick={saveCourseAssignments}
                    disabled={isSavingCourses}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    {isSavingCourses ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {isRTL ? 'ذخیره تخصیص' : 'Save Assignments'}
                  </button>
                </div>
              </div>

              {coursesError && (
                <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {coursesError}
                </div>
              )}

              <p className="mb-3 text-sm text-muted-foreground">
                {isRTL
                  ? `${selectedCourseIds.size} دوره انتخاب شده از ${allCourses.length} دوره موجود. روی هر دوره کلیک کنید تا اضافه یا حذف شود.`
                  : `${selectedCourseIds.size} of ${allCourses.length} courses selected. Click a course to toggle assignment.`}
              </p>

              {/* Search */}
              <div className="relative mb-4">
                <input
                  type="text"
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  placeholder={isRTL ? 'جستجوی دوره...' : 'Search courses...'}
                  className="w-full rounded-lg border bg-background px-4 py-2 text-sm pe-8"
                />
                {courseFilter && (
                  <button
                    onClick={() => setCourseFilter('')}
                    className="absolute top-1/2 end-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {allCourses.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {isRTL ? 'هیچ دوره‌ای یافت نشد.' : 'No courses found.'}
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCourses.map((course) => {
                    const assigned = selectedCourseIds.has(course.id);
                    return (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => toggleCourse(course.id)}
                        className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                          assigned
                            ? 'border-primary/50 bg-primary/5 hover:bg-primary/10'
                            : 'border-border bg-background hover:bg-muted'
                        }`}
                      >
                        <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${assigned ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                          {assigned ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3 text-muted-foreground" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {isRTL && course.titleFA ? course.titleFA : course.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{course.subjectName} · {course.code}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
