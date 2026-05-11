'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  Filter,
  GraduationCap,
  Plus,
  Save,
  Search,
  Users,
  X,
} from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  subject: string;
  avatar: string;
  coursesCount: number;
  subjects: string[];
  subjectLabels: string[];
  assignedCourseIds?: string[];
}

interface SubjectOption {
  id: string;
  code: string;
  normalizedCode: string;
  name: string;
  courseCount: number;
}

interface Course {
  id: string;
  title: string;
  grade: string;
  subject: string;
  subjectCode: string;
  normalizedSubjectCode: string;
  lessons: number;
  students: number;
  status: 'active' | 'draft';
}

function normalizeSubjectCode(value: string | null | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export default function CourseAssignmentsPage({ params: { locale } }: { params: { locale: string } }) {
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [searchAvailableSubjects, setSearchAvailableSubjects] = useState('');
  const [searchAssignedSubjects, setSearchAssignedSubjects] = useState('');
  const [searchAvailableCourses, setSearchAvailableCourses] = useState('');
  const [searchAssignedCourses, setSearchAssignedCourses] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectOption[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [courseAssignments, setCourseAssignments] = useState<Record<string, string[]>>({});
  const [subjectAssignments, setSubjectAssignments] = useState<Record<string, string[]>>({});
  const [pendingChanges, setPendingChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const adminHeaders = createUserHeaders(getStoredUserId());
        const [teachersResponse, coursesResponse, subjectsResponse] = await Promise.all([
          fetch(`/api/v1/admin/teachers?locale=${locale}`, {
            cache: 'no-store',
            headers: adminHeaders,
          }),
          fetch(`/api/v1/courses?locale=${locale}&publishedOnly=false&limit=100`, { cache: 'no-store' }),
          fetch('/api/v1/admin/subjects', { cache: 'no-store' }),
        ]);

        if (!teachersResponse.ok || !coursesResponse.ok || !subjectsResponse.ok) {
          throw new Error('Failed to load assignment data');
        }

        const [teachersData, coursesData, subjectsData] = await Promise.all([
          teachersResponse.json(),
          coursesResponse.json(),
          subjectsResponse.json(),
        ]);

        const teacherRecords = (teachersData.teachers || []).map((teacher: any) => ({
          id: teacher.id,
          name: teacher.name,
          subject: teacher.subject,
          avatar: teacher.avatar || teacher.name?.[0]?.toUpperCase() || 'T',
          coursesCount: teacher.courses || 0,
          subjects: (teacher.subjects || []).map((subjectCode: string) => normalizeSubjectCode(subjectCode)),
          subjectLabels: teacher.subjectLabels || [],
          assignedCourseIds: teacher.assignedCourseIds || [],
        } satisfies Teacher));

        const subjectRecords = (subjectsData.subjects || []).map((subject: any) => ({
          id: subject.id,
          code: String(subject.code || ''),
          normalizedCode: normalizeSubjectCode(subject.code),
          name: locale === 'fa' ? (subject.nameFA || subject.name) : subject.name,
          courseCount: subject._count?.courses || 0,
        } satisfies SubjectOption));

        const courseRecords = (coursesData.courses || []).map((course: any) => ({
          id: course.id,
          title: course.title,
          grade: locale === 'fa' ? (course.gradeLevel?.nameFA || course.gradeLevel?.name || '—') : (course.gradeLevel?.name || course.gradeLevel?.nameFA || '—'),
          subject: locale === 'fa' ? (course.subject?.nameFA || course.subject?.name || '—') : (course.subject?.name || course.subject?.nameFA || '—'),
          subjectCode: String(course.subject?.code || ''),
          normalizedSubjectCode: normalizeSubjectCode(course.subject?.code),
          lessons: course.totalLessons || course.unitsCount || 0,
          students: course.enrollmentsCount || 0,
          status: course.isPublished ? 'active' : 'draft',
        } satisfies Course));

        setTeachers(teacherRecords);
        setAllSubjects(subjectRecords);
        setAllCourses(courseRecords);
        setCourseAssignments(
          teacherRecords.reduce((accumulator: Record<string, string[]>, teacher: Teacher) => {
            accumulator[teacher.id] = teacher.assignedCourseIds || [];
            return accumulator;
          }, {}),
        );
        setSubjectAssignments(
          teacherRecords.reduce((accumulator: Record<string, string[]>, teacher: Teacher) => {
            accumulator[teacher.id] = teacher.subjects || [];
            return accumulator;
          }, {}),
        );
      } catch {
        setTeachers([]);
        setAllSubjects([]);
        setAllCourses([]);
        setCourseAssignments({});
        setSubjectAssignments({});
        setFeedback({
          variant: 'error',
          message: isRTL ? 'بارگذاری تخصیص موضوع و دوره ممکن نبود.' : 'Subject and course assignment data could not be loaded.',
        });
      }
    };

    void loadData();
  }, [isRTL, locale]);

  const selectedTeacherRecord = useMemo(
    () => teachers.find((teacher) => teacher.id === selectedTeacher) || null,
    [selectedTeacher, teachers],
  );

  const assignedCourseIds = selectedTeacher ? (courseAssignments[selectedTeacher] || []) : [];
  const assignedSubjectCodes = selectedTeacher ? (subjectAssignments[selectedTeacher] || []) : [];
  const assignedSubjectSet = new Set(assignedSubjectCodes);

  const availableSubjects = allSubjects.filter((subject) => !assignedSubjectSet.has(subject.normalizedCode));
  const filteredAvailableSubjects = availableSubjects.filter((subject) =>
    [subject.name, subject.code].join(' ').toLowerCase().includes(searchAvailableSubjects.toLowerCase()),
  );
  const filteredAssignedSubjects = allSubjects
    .filter((subject) => assignedSubjectSet.has(subject.normalizedCode))
    .filter((subject) => [subject.name, subject.code].join(' ').toLowerCase().includes(searchAssignedSubjects.toLowerCase()));

  const availableCourses = allCourses.filter((course) => {
    if (assignedCourseIds.includes(course.id)) {
      return false;
    }

    if (assignedSubjectCodes.length === 0) {
      return true;
    }

    return assignedSubjectSet.has(course.normalizedSubjectCode);
  });

  const filteredAvailableCourses = availableCourses.filter((course) =>
    [course.title, course.subject, course.grade].join(' ').toLowerCase().includes(searchAvailableCourses.toLowerCase()),
  );
  const filteredAssignedCourses = allCourses
    .filter((course) => assignedCourseIds.includes(course.id))
    .filter((course) => [course.title, course.subject, course.grade].join(' ').toLowerCase().includes(searchAssignedCourses.toLowerCase()));

  const handleAssignSubject = (subjectCode: string) => {
    if (!selectedTeacher) return;
    setSubjectAssignments((prev) => ({
      ...prev,
      [selectedTeacher]: Array.from(new Set([...(prev[selectedTeacher] || []), subjectCode])),
    }));
    setPendingChanges(true);
  };

  const handleUnassignSubject = (subjectCode: string) => {
    if (!selectedTeacher) return;

    setSubjectAssignments((prev) => ({
      ...prev,
      [selectedTeacher]: (prev[selectedTeacher] || []).filter((code) => code !== subjectCode),
    }));
    setCourseAssignments((prev) => ({
      ...prev,
      [selectedTeacher]: (prev[selectedTeacher] || []).filter((courseId) => {
        const course = allCourses.find((item) => item.id === courseId);
        return course?.normalizedSubjectCode !== subjectCode;
      }),
    }));
    setPendingChanges(true);
  };

  const handleAssignCourse = (course: Course) => {
    if (!selectedTeacher) return;

    setCourseAssignments((prev) => ({
      ...prev,
      [selectedTeacher]: Array.from(new Set([...(prev[selectedTeacher] || []), course.id])),
    }));
    setSubjectAssignments((prev) => ({
      ...prev,
      [selectedTeacher]: Array.from(new Set([...(prev[selectedTeacher] || []), course.normalizedSubjectCode])),
    }));
    setPendingChanges(true);
  };

  const handleUnassignCourse = (courseId: string) => {
    if (!selectedTeacher) return;
    setCourseAssignments((prev) => ({
      ...prev,
      [selectedTeacher]: (prev[selectedTeacher] || []).filter((id) => id !== courseId),
    }));
    setPendingChanges(true);
  };

  const handleSave = () => {
    if (!selectedTeacher) {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'ابتدا یک معلم را انتخاب کنید.' : 'Select a teacher first.',
      });
      return;
    }

    const persistAssignments = async () => {
      setSaving(true);
      setFeedback(null);

      try {
        const response = await fetch(`/api/v1/admin/teachers/${selectedTeacher}/assignments`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...createUserHeaders(getStoredUserId()),
          },
          body: JSON.stringify({
            assignedSubjectCodes: subjectAssignments[selectedTeacher] || [],
            assignedCourseIds: courseAssignments[selectedTeacher] || [],
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || 'failed_to_save_assignments');
        }

        const savedSubjectCodes = (data.assignedSubjectCodes || []).map((subjectCode: string) => normalizeSubjectCode(subjectCode));
        const savedCourseIds = data.assignedCourseIds || [];

        setSubjectAssignments((prev) => ({
          ...prev,
          [selectedTeacher]: savedSubjectCodes,
        }));
        setCourseAssignments((prev) => ({
          ...prev,
          [selectedTeacher]: savedCourseIds,
        }));
        setTeachers((prev) => prev.map((teacher) => {
          if (teacher.id !== selectedTeacher) {
            return teacher;
          }

          return {
            ...teacher,
            coursesCount: savedCourseIds.length,
            subjects: savedSubjectCodes,
            assignedCourseIds: savedCourseIds,
            subjectLabels: allSubjects
              .filter((subject) => savedSubjectCodes.includes(subject.normalizedCode))
              .map((subject) => subject.name),
          };
        }));
        setPendingChanges(false);
        setFeedback({
          variant: 'success',
          message: isRTL ? 'تخصیص موضوع و دوره ذخیره شد.' : 'Subject and course assignments were saved.',
        });
      } catch {
        setFeedback({
          variant: 'error',
          message: isRTL ? 'ذخیره تخصیص‌ها انجام نشد.' : 'Unable to save the assignments.',
        });
      } finally {
        setSaving(false);
      }
    };

    void persistAssignments();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/admin`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Arrow className="h-5 w-5" />
              <span>{isRTL ? 'بازگشت' : 'Back'}</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-semibold">{isRTL ? 'تخصیص موضوع و دوره' : 'Assign Subjects & Courses'}</h1>
          </div>
          {pendingChanges ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              <Save className="h-4 w-4" />
              {saving ? (isRTL ? 'در حال ذخیره...' : 'Saving...') : (isRTL ? 'ذخیره تغییرات' : 'Save Changes')}
            </button>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {feedback ? <FeedbackBanner className="mb-6" variant={feedback.variant} message={feedback.message} /> : null}

        <div className="mb-6 rounded-xl border bg-card p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="font-semibold">{isRTL ? 'تفاوت موضوع و دوره' : 'Subject vs. course'}</h2>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                {isRTL
                  ? 'موضوع مشخص می‌کند معلم در چه حوزه‌هایی می‌تواند تدریس کند. دوره یک کلاس یا محتوای مشخص در همان موضوع است. با تخصیص دوره، موضوع مربوط نیز به‌صورت خودکار همگام می‌شود.'
                  : 'A subject defines the teaching domain a teacher can cover. A course is a concrete class within that subject. Assigning a course automatically keeps its subject in sync.'}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              <div>{allSubjects.length} {isRTL ? 'موضوع موجود' : 'available subjects'}</div>
              <div>{allCourses.length} {isRTL ? 'دوره موجود' : 'available courses'}</div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-xl border bg-card p-4">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <GraduationCap className="h-5 w-5 text-primary" />
            {isRTL ? 'انتخاب معلم' : 'Select Teacher'}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {teachers.map((teacher) => (
              <button
                key={teacher.id}
                onClick={() => setSelectedTeacher(teacher.id)}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 text-start transition-all ${
                  selectedTeacher === teacher.id
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-muted/50 hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                  {teacher.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{teacher.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{teacher.subjectLabels.join(', ') || teacher.subject}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(courseAssignments[teacher.id] || []).length} {isRTL ? 'دوره' : 'courses'}
                  </p>
                </div>
                {selectedTeacher === teacher.id ? <Check className="h-5 w-5 text-primary" /> : null}
              </button>
            ))}
          </div>
        </div>

        {selectedTeacherRecord ? (
          <div className="space-y-6">
            <div className="rounded-xl border bg-card p-5">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="font-semibold">{selectedTeacherRecord.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isRTL
                      ? 'ابتدا موضوع‌ها را مشخص کنید، سپس دوره‌های همان موضوع‌ها را برای این معلم تخصیص دهید.'
                      : 'Pick subjects first, then assign courses that belong to those subjects for this teacher.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span className="rounded-full border px-3 py-1">{assignedSubjectCodes.length} {isRTL ? 'موضوع' : 'subjects'}</span>
                  <span className="rounded-full border px-3 py-1">{assignedCourseIds.length} {isRTL ? 'دوره' : 'courses'}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="overflow-hidden rounded-xl border bg-card">
                <div className="border-b bg-muted/30 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">{isRTL ? 'موضوع‌های قابل تخصیص' : 'Available Subjects'}</h3>
                    <span className="text-sm text-muted-foreground">{availableSubjects.length}</span>
                  </div>
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchAvailableSubjects}
                      onChange={(event) => setSearchAvailableSubjects(event.target.value)}
                      placeholder={isRTL ? 'جستجوی موضوع...' : 'Search subjects...'}
                      className="w-full rounded-lg border bg-background py-2 pe-4 ps-10 text-sm"
                    />
                  </div>
                </div>
                <div className="max-h-[360px] divide-y overflow-y-auto">
                  {filteredAvailableSubjects.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Filter className="mx-auto mb-2 h-10 w-10 opacity-50" />
                      <p>{isRTL ? 'موضوعی برای تخصیص باقی نمانده است.' : 'No more subjects available to assign.'}</p>
                    </div>
                  ) : filteredAvailableSubjects.map((subject) => (
                    <div key={subject.id} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/20">
                      <div>
                        <p className="font-medium">{subject.name}</p>
                        <p className="text-xs text-muted-foreground">{subject.code} • {subject.courseCount} {isRTL ? 'دوره' : 'courses'}</p>
                      </div>
                      <button
                        onClick={() => handleAssignSubject(subject.normalizedCode)}
                        className="rounded-lg bg-green-100 p-2 text-green-700 hover:bg-green-200"
                        title={isRTL ? 'تخصیص موضوع' : 'Assign subject'}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border bg-card">
                <div className="border-b bg-green-50 p-4 dark:bg-green-900/20">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">{isRTL ? 'موضوع‌های تخصیص‌یافته' : 'Assigned Subjects'}</h3>
                    <span className="text-sm text-muted-foreground">{assignedSubjectCodes.length}</span>
                  </div>
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchAssignedSubjects}
                      onChange={(event) => setSearchAssignedSubjects(event.target.value)}
                      placeholder={isRTL ? 'جستجوی موضوع تخصیص‌یافته...' : 'Search assigned subjects...'}
                      className="w-full rounded-lg border bg-background py-2 pe-4 ps-10 text-sm"
                    />
                  </div>
                </div>
                <div className="max-h-[360px] divide-y overflow-y-auto">
                  {filteredAssignedSubjects.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <GraduationCap className="mx-auto mb-2 h-10 w-10 opacity-50" />
                      <p>{isRTL ? 'هنوز موضوعی تخصیص داده نشده است.' : 'No subjects have been assigned yet.'}</p>
                    </div>
                  ) : filteredAssignedSubjects.map((subject) => (
                    <div key={subject.id} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/20">
                      <div>
                        <p className="font-medium">{subject.name}</p>
                        <p className="text-xs text-muted-foreground">{subject.code} • {subject.courseCount} {isRTL ? 'دوره' : 'courses'}</p>
                      </div>
                      <button
                        onClick={() => handleUnassignSubject(subject.normalizedCode)}
                        className="rounded-lg bg-red-100 p-2 text-red-700 hover:bg-red-200"
                        title={isRTL ? 'حذف موضوع' : 'Remove subject'}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="overflow-hidden rounded-xl border bg-card">
                <div className="border-b bg-muted/30 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      {isRTL ? 'دوره‌های قابل تخصیص' : 'Available Courses'}
                    </h3>
                    <span className="text-sm text-muted-foreground">{availableCourses.length}</span>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">
                    {assignedSubjectCodes.length === 0
                      ? (isRTL ? 'در حال نمایش همه دوره‌ها. با تخصیص یک دوره، موضوع آن نیز خودکار اضافه می‌شود.' : 'Showing all courses. Assigning a course will automatically add its subject as well.')
                      : (isRTL ? 'فقط دوره‌های مربوط به موضوع‌های انتخاب‌شده نمایش داده می‌شوند.' : 'Only courses from the selected subjects are shown.')}
                  </p>
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchAvailableCourses}
                      onChange={(event) => setSearchAvailableCourses(event.target.value)}
                      placeholder={isRTL ? 'جستجوی دوره...' : 'Search courses...'}
                      className="w-full rounded-lg border bg-background py-2 pe-4 ps-10 text-sm"
                    />
                  </div>
                </div>
                <div className="max-h-[520px] divide-y overflow-y-auto">
                  {filteredAvailableCourses.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <BookOpen className="mx-auto mb-2 h-10 w-10 opacity-50" />
                      <p>{isRTL ? 'دوره‌ای برای نمایش وجود ندارد.' : 'No courses are available to show.'}</p>
                    </div>
                  ) : filteredAvailableCourses.map((course) => (
                    <div key={course.id} className="p-4 hover:bg-muted/20">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                          <BookOpen className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-medium">{course.title}</h4>
                            {course.status === 'draft' ? <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">{isRTL ? 'پیش‌نویس' : 'Draft'}</span> : null}
                          </div>
                          <p className="text-sm text-muted-foreground">{course.grade} • {course.subject}</p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{course.lessons} {isRTL ? 'درس' : 'lessons'}</span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.students} {isRTL ? 'دانش‌آموز' : 'students'}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAssignCourse(course)}
                          className="rounded-lg bg-green-100 p-2 text-green-700 hover:bg-green-200"
                          title={isRTL ? 'تخصیص دوره' : 'Assign course'}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border bg-card">
                <div className="border-b bg-green-50 p-4 dark:bg-green-900/20">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <Check className="h-5 w-5 text-green-600" />
                      {isRTL ? 'دوره‌های تخصیص‌یافته' : 'Assigned Courses'}
                    </h3>
                    <span className="text-sm text-muted-foreground">{assignedCourseIds.length}</span>
                  </div>
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchAssignedCourses}
                      onChange={(event) => setSearchAssignedCourses(event.target.value)}
                      placeholder={isRTL ? 'جستجوی دوره تخصیص‌یافته...' : 'Search assigned courses...'}
                      className="w-full rounded-lg border bg-background py-2 pe-4 ps-10 text-sm"
                    />
                  </div>
                </div>
                <div className="max-h-[520px] divide-y overflow-y-auto">
                  {filteredAssignedCourses.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <BookOpen className="mx-auto mb-2 h-10 w-10 opacity-50" />
                      <p>{isRTL ? 'هیچ دوره‌ای تخصیص داده نشده است.' : 'No courses are assigned yet.'}</p>
                    </div>
                  ) : filteredAssignedCourses.map((course) => (
                    <div key={course.id} className="p-4 hover:bg-muted/20">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                          <BookOpen className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-medium">{course.title}</h4>
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">{isRTL ? 'تخصیص داده‌شده' : 'Assigned'}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{course.grade} • {course.subject}</p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{course.lessons} {isRTL ? 'درس' : 'lessons'}</span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.students} {isRTL ? 'دانش‌آموز' : 'students'}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnassignCourse(course.id)}
                          className="rounded-lg bg-red-100 p-2 text-red-700 hover:bg-red-200"
                          title={isRTL ? 'حذف دوره' : 'Remove course'}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed bg-muted/30 p-12 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-medium">{isRTL ? 'معلمی را انتخاب کنید' : 'Select a teacher'}</h3>
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'برای مدیریت موضوع‌ها و دوره‌ها، ابتدا یک معلم را انتخاب کنید.' : 'Choose a teacher first to manage their subjects and courses.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
