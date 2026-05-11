'use client';

import { useCallback, useEffect, useState } from 'react';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import {
  ArrowLeft, ArrowRight, BookOpen, GraduationCap, Plus, Search,
  Users, UserPlus, UserMinus, Upload, Download, X, Check,
  ChevronDown, ChevronRight, Settings, Eye, Layers, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

/* ── Types ── */
interface Course {
  id: string; title: string; titleFA?: string; code: string;
  isPublished: boolean; coverImage?: string;
  subject?: { id: string; name: string; nameFA?: string; code: string };
  gradeLevel?: { id: string; name: string; nameFA?: string };
  enrollmentCount: number; lessonCount: number; publishedLessonCount: number;
}
interface Member {
  userId: string; email: string; displayName: string; avatarUrl?: string;
  role: 'TEACHER' | 'STUDENT'; enrolledAt: string; progress: number;
}
interface UserOption { id: string; email: string; displayName: string; role: 'TEACHER' | 'STUDENT' }
interface SubjectOption { id: string; name: string; code: string }
interface GradeOption { id: string; name: string; code: string }

/* ── CSV helpers ── */
function parseCsvText(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] || '']));
  });
}

export default function AdminCourseManagementPage({ params: { locale } }: { params: { locale: string } }) {
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [grades, setGrades] = useState<GradeOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'teachers' | 'students'>('students');
  const [search, setSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [userPickerSearch, setUserPickerSearch] = useState('');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [importType, setImportType] = useState<'users' | 'enrollments' | 'courses'>('enrollments');
  const [importResults, setImportResults] = useState<null | { ok: number; errors: number; results: any[] }>(null);
  const [importParsed, setImportParsed] = useState<Record<string, string>[]>([]);
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Create course form
  const [newCourse, setNewCourse] = useState({ title: '', titleFA: '', subjectId: '', gradeLevelId: '', code: '', description: '' });

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/courses?search=${encodeURIComponent(search)}`, {
        headers: createUserHeaders(getStoredUserId()),
      });
      const data = await res.json();
      setCourses(data.courses || []);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const loadMeta = useCallback(async () => {
    const [usersRes, subjectsRes, gradesRes] = await Promise.all([
      fetch('/api/v1/admin/users', { headers: createUserHeaders(getStoredUserId()) }),
      fetch('/api/v1/admin/subjects', { headers: createUserHeaders(getStoredUserId()) }),
      fetch('/api/v1/admin/grade-levels', { headers: createUserHeaders(getStoredUserId()) }),
    ]);
    if (usersRes.ok) {
      const d = await usersRes.json();
      setAllUsers(
        (d.users || []).map((u: any) => {
          const roles: string[] = u.roles || [];
          const isTeacher = roles.some((r) => ['SUPPORT_TEACHER', 'TUTOR', 'COUNSELOR'].includes(r));
          const name = u.profile?.displayName || [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(' ') || u.email;
          return { id: u.id, email: u.email, displayName: name, role: isTeacher ? 'TEACHER' : 'STUDENT' };
        })
      );
    }
    if (subjectsRes.ok) {
      const d = await subjectsRes.json();
      setSubjects((d.subjects || []).map((s: any) => ({ id: s.id, name: isRTL ? (s.nameFA || s.name) : s.name, code: s.code })));
    }
    if (gradesRes.ok) {
      const d = await gradesRes.json();
      setGrades((d.grades || []).map((g: any) => ({ id: g.id, name: isRTL ? (g.nameFA || g.name) : g.name, code: g.code })));
    }
  }, [isRTL]);

  useEffect(() => { loadCourses(); loadMeta(); }, []);

  const loadMembers = useCallback(async (courseId: string) => {
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/courses/${courseId}/members`, {
        headers: createUserHeaders(getStoredUserId()),
      });
      const data = await res.json();
      setMembers(data.members || []);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    setMembers([]);
    loadMembers(course.id);
    setShowAddMembers(false);
    setSelectedUserIds(new Set());
  };

  const handleAddMembers = async () => {
    if (!selectedCourse || selectedUserIds.size === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/courses/${selectedCourse.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...createUserHeaders(getStoredUserId()) },
        body: JSON.stringify({ userIds: Array.from(selectedUserIds) }),
      });
      if (!res.ok) throw new Error('Failed');
      setFeedback({ variant: 'success', message: isRTL ? `${selectedUserIds.size} نفر اضافه شدند.` : `${selectedUserIds.size} member(s) added.` });
      setShowAddMembers(false);
      setSelectedUserIds(new Set());
      loadMembers(selectedCourse.id);
      loadCourses();
    } catch {
      setFeedback({ variant: 'error', message: isRTL ? 'خطا در افزودن اعضا' : 'Failed to add members' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedCourse) return;
    try {
      await fetch(`/api/v1/admin/courses/${selectedCourse.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...createUserHeaders(getStoredUserId()) },
        body: JSON.stringify({ userId }),
      });
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      loadCourses();
    } catch {
      setFeedback({ variant: 'error', message: isRTL ? 'خطا در حذف عضو' : 'Failed to remove member' });
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourse.title || !newCourse.subjectId || !newCourse.gradeLevelId) {
      setFeedback({ variant: 'error', message: isRTL ? 'عنوان، موضوع و پایه الزامی هستند.' : 'Title, subject, and grade are required.' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...createUserHeaders(getStoredUserId()) },
        body: JSON.stringify(newCourse),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setFeedback({ variant: 'success', message: isRTL ? `دوره "${newCourse.title}" ساخته شد.` : `Course "${newCourse.title}" created.` });
      setShowCreateCourse(false);
      setNewCourse({ title: '', titleFA: '', subjectId: '', gradeLevelId: '', code: '', description: '' });
      loadCourses();
      // Auto-select the new course
      if (data.course) handleSelectCourse(data.course);
    } catch (err: any) {
      setFeedback({ variant: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setImportParsed(parseCsvText(text));
      setImportResults(null);
    };
    reader.readAsText(file);
  };

  const handleRunImport = async () => {
    if (!importParsed.length) return;
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...createUserHeaders(getStoredUserId()) },
        body: JSON.stringify({ type: importType, rows: importParsed }),
      });
      const data = await res.json();
      setImportResults(data);
      if (data.ok > 0) loadCourses();
    } catch {
      setFeedback({ variant: 'error', message: 'Import failed' });
    } finally {
      setSaving(false);
    }
  };

  const enrolledIds = new Set(members.map((m) => m.userId));
  const tabMembers = members.filter((m) => m.role === (tab === 'teachers' ? 'TEACHER' : 'STUDENT'));
  const filteredTabMembers = memberSearch
    ? tabMembers.filter((m) => [m.displayName, m.email].join(' ').toLowerCase().includes(memberSearch.toLowerCase()))
    : tabMembers;

  const pickerRole = tab === 'teachers' ? 'TEACHER' : 'STUDENT';
  const availableToAdd = allUsers.filter(
    (u) => u.role === pickerRole && !enrolledIds.has(u.id)
  );
  const filteredAvailable = userPickerSearch
    ? availableToAdd.filter((u) => [u.displayName, u.email].join(' ').toLowerCase().includes(userPickerSearch.toLowerCase()))
    : availableToAdd;

  const filteredCourses = search
    ? courses.filter((c) => [c.title, c.code, c.subject?.name || ''].join(' ').toLowerCase().includes(search.toLowerCase()))
    : courses;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href={`/${locale}/admin`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Arrow className="h-5 w-5" />
              <span className="hidden sm:inline">{isRTL ? 'پنل مدیریت' : 'Admin'}</span>
            </Link>
            <div className="h-5 w-px bg-border" />
            <h1 className="flex items-center gap-2 font-bold">
              <Layers className="h-5 w-5 text-primary" />
              {isRTL ? 'مدیریت دوره‌ها' : 'Course Management'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkImport(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'وارد کردن گروهی' : 'Bulk Import'}</span>
            </button>
            <button
              onClick={() => setShowCreateCourse(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span>{isRTL ? 'دوره جدید' : 'New Course'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {feedback && (
          <div className="mb-4">
            <FeedbackBanner variant={feedback.variant} message={feedback.message} />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* ── Left: Course List ── */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={isRTL ? 'جستجوی دوره...' : 'Search courses...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border bg-background py-2 pe-4 ps-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                <BookOpen className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p className="text-sm">{isRTL ? 'دوره‌ای یافت نشد' : 'No courses found'}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
                {filteredCourses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => handleSelectCourse(course)}
                    className={`w-full rounded-xl border p-3 text-start transition-all hover:shadow-sm ${
                      selectedCourse?.id === course.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'bg-card hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-sm">{course.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {course.subject?.name} • {course.gradeLevel?.name}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        course.isPublished
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}>
                        {course.isPublished ? (isRTL ? 'منتشر' : 'Live') : (isRTL ? 'پیش‌نویس' : 'Draft')}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.enrollmentCount}</span>
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{course.publishedLessonCount}/{course.lessonCount}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Course Detail ── */}
          {selectedCourse ? (
            <div className="space-y-5">
              {/* Course header */}
              <div className="rounded-2xl border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">{selectedCourse.title}</h2>
                    {selectedCourse.titleFA && (
                      <p className="text-sm text-muted-foreground" dir="rtl">{selectedCourse.titleFA}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>{selectedCourse.subject?.name}</span>
                      <span>•</span>
                      <span>{selectedCourse.gradeLevel?.name}</span>
                      <span>•</span>
                      <span className="font-mono">{selectedCourse.code}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                      selectedCourse.isPublished
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedCourse.isPublished ? (isRTL ? 'منتشرشده' : 'Published') : (isRTL ? 'پیش‌نویس' : 'Draft')}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: isRTL ? 'اعضا' : 'Members', value: selectedCourse.enrollmentCount, icon: Users },
                    { label: isRTL ? 'دروس منتشر' : 'Published Lessons', value: selectedCourse.publishedLessonCount, icon: BookOpen },
                    { label: isRTL ? 'کل دروس' : 'Total Lessons', value: selectedCourse.lessonCount, icon: Layers },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-xl border bg-muted/30 p-3 text-center">
                      <Icon className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                      <p className="text-2xl font-bold">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Members panel */}
              <div className="rounded-2xl border bg-card">
                <div className="flex items-center justify-between border-b px-5 py-4">
                  <div className="flex gap-1">
                    {(['students', 'teachers'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => { setTab(t); setShowAddMembers(false); setSelectedUserIds(new Set()); }}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          tab === t ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                        }`}
                      >
                        {t === 'students'
                          ? (isRTL ? `دانش‌آموزان (${members.filter((m) => m.role === 'STUDENT').length})` : `Students (${members.filter((m) => m.role === 'STUDENT').length})`)
                          : (isRTL ? `معلمان (${members.filter((m) => m.role === 'TEACHER').length})` : `Teachers (${members.filter((m) => m.role === 'TEACHER').length})`)
                        }
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => { setShowAddMembers(true); setUserPickerSearch(''); setSelectedUserIds(new Set()); }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                  >
                    <UserPlus className="h-4 w-4" />
                    {isRTL
                      ? (tab === 'teachers' ? 'افزودن معلم' : 'افزودن دانش‌آموز')
                      : (tab === 'teachers' ? 'Add Teacher' : 'Add Student')
                    }
                  </button>
                </div>

                {/* Add member picker */}
                {showAddMembers && (
                  <div className="border-b bg-muted/30 p-4 space-y-3">
                    <div className="relative">
                      <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder={isRTL ? 'جستجوی نام یا ایمیل...' : 'Search by name or email...'}
                        value={userPickerSearch}
                        onChange={(e) => setUserPickerSearch(e.target.value)}
                        className="w-full rounded-lg border bg-background py-2 pe-4 ps-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredAvailable.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                          {isRTL ? 'کاربری یافت نشد' : 'No users found'}
                        </p>
                      ) : filteredAvailable.map((u) => (
                        <label key={u.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-background cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.has(u.id)}
                            onChange={(e) => {
                              const next = new Set(selectedUserIds);
                              if (e.target.checked) next.add(u.id); else next.delete(u.id);
                              setSelectedUserIds(next);
                            }}
                            className="h-4 w-4 rounded"
                          />
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                            {u.displayName[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{u.displayName}</p>
                            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {selectedUserIds.size > 0
                          ? (isRTL ? `${selectedUserIds.size} انتخاب شده` : `${selectedUserIds.size} selected`)
                          : ''}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => setShowAddMembers(false)} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
                          {isRTL ? 'انصراف' : 'Cancel'}
                        </button>
                        <button
                          onClick={handleAddMembers}
                          disabled={selectedUserIds.size === 0 || saving}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
                        >
                          {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          {isRTL ? 'افزودن' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Member search */}
                <div className="border-b px-5 py-3">
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={isRTL ? 'فیلتر اعضا...' : 'Filter members...'}
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full rounded-lg border bg-background py-1.5 pe-4 ps-9 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                {membersLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredTabMembers.length === 0 ? (
                  <div className="p-10 text-center text-muted-foreground">
                    <GraduationCap className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    <p className="text-sm">
                      {isRTL
                        ? (tab === 'teachers' ? 'هنوز معلمی اضافه نشده' : 'هنوز دانش‌آموزی اضافه نشده')
                        : (tab === 'teachers' ? 'No teachers yet' : 'No students yet')}
                    </p>
                    <p className="mt-1 text-xs">
                      {isRTL ? 'از دکمه بالا اضافه کنید' : 'Use the button above to add members'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredTabMembers.map((m) => (
                      <div key={m.userId} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                          {m.displayName[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-sm">{m.displayName}</p>
                          <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                        </div>
                        {tab === 'students' && (
                          <div className="shrink-0 w-28">
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${m.progress}%` }} />
                            </div>
                            <p className="mt-0.5 text-right text-xs text-muted-foreground">{m.progress.toFixed(0)}%</p>
                          </div>
                        )}
                        <button
                          onClick={() => handleRemoveMember(m.userId)}
                          title={isRTL ? 'حذف از دوره' : 'Remove from course'}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-80 flex-col items-center justify-center rounded-2xl border border-dashed text-muted-foreground">
              <BookOpen className="mb-3 h-12 w-12 opacity-30" />
              <p className="font-medium">{isRTL ? 'یک دوره را انتخاب کنید' : 'Select a course'}</p>
              <p className="mt-1 text-sm">{isRTL ? 'یا یک دوره جدید بسازید' : 'Or create a new one'}</p>
              <button
                onClick={() => setShowCreateCourse(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                {isRTL ? 'دوره جدید' : 'New Course'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Create Course Modal ── */}
      {showCreateCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border shadow-2xl">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="font-bold text-lg">{isRTL ? 'ایجاد دوره جدید' : 'Create New Course'}</h2>
              <button onClick={() => setShowCreateCourse(false)} className="rounded-lg p-1.5 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">{isRTL ? 'عنوان دوره (انگلیسی)*' : 'Course Title (English)*'}</label>
                <input
                  value={newCourse.title}
                  onChange={(e) => setNewCourse((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Mathematics Grade 7"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{isRTL ? 'عنوان دوره (فارسی)' : 'Course Title (Persian)'}</label>
                <input
                  value={newCourse.titleFA}
                  onChange={(e) => setNewCourse((p) => ({ ...p, titleFA: e.target.value }))}
                  placeholder="مثلاً ریاضی پایه هفتم"
                  dir="rtl"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{isRTL ? 'موضوع*' : 'Subject*'}</label>
                  <select
                    value={newCourse.subjectId}
                    onChange={(e) => setNewCourse((p) => ({ ...p, subjectId: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{isRTL ? 'انتخاب کنید' : 'Select subject'}</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{isRTL ? 'پایه تحصیلی*' : 'Grade Level*'}</label>
                  <select
                    value={newCourse.gradeLevelId}
                    onChange={(e) => setNewCourse((p) => ({ ...p, gradeLevelId: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{isRTL ? 'انتخاب کنید' : 'Select grade'}</option>
                    {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{isRTL ? 'کد دوره (اختیاری)' : 'Course Code (optional)'}</label>
                <input
                  value={newCourse.code}
                  onChange={(e) => setNewCourse((p) => ({ ...p, code: e.target.value }))}
                  placeholder="e.g. MATH-7A"
                  className="w-full rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{isRTL ? 'توضیح (اختیاری)' : 'Description (optional)'}</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t p-5">
              <button onClick={() => setShowCreateCourse(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">
                {isRTL ? 'انصراف' : 'Cancel'}
              </button>
              <button
                onClick={handleCreateCourse}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {isRTL ? 'ایجاد دوره' : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Import Modal ── */}
      {showBulkImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-card border shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="font-bold text-lg">{isRTL ? 'وارد کردن گروهی از CSV' : 'Bulk Import from CSV'}</h2>
              <button onClick={() => { setShowBulkImport(false); setImportParsed([]); setImportResults(null); }} className="rounded-lg p-1.5 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              {/* Import type selector */}
              <div className="flex gap-2">
                {(['users', 'enrollments', 'courses'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setImportType(t); setImportParsed([]); setImportResults(null); }}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${importType === t ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`}
                  >
                    {t === 'users' ? (isRTL ? 'کاربران' : 'Users') : t === 'enrollments' ? (isRTL ? 'ثبت‌نام‌ها' : 'Enrollments') : (isRTL ? 'دوره‌ها' : 'Courses')}
                  </button>
                ))}
              </div>

              {/* Template download */}
              <div className="flex items-center gap-3 rounded-xl border border-dashed bg-muted/30 p-3">
                <Download className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{isRTL ? 'قالب CSV دانلود کنید' : 'Download CSV Template'}</p>
                  <p className="text-xs text-muted-foreground">{isRTL ? 'فرمت صحیح را ببینید و پر کنید' : 'Fill in the correct format'}</p>
                </div>
                <a
                  href={`/api/v1/admin/bulk-import?type=${importType}`}
                  download
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  <Download className="h-3.5 w-3.5" />
                  {isRTL ? 'دانلود' : 'Download'}
                </a>
              </div>

              {/* File upload */}
              <div>
                <label className="block text-sm font-medium mb-2">{isRTL ? 'فایل CSV را انتخاب کنید' : 'Select CSV File'}</label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-muted"
                />
              </div>

              {/* Preview */}
              {importParsed.length > 0 && !importResults && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    {isRTL ? `${importParsed.length} ردیف آماده برای وارد کردن` : `${importParsed.length} rows ready to import`}
                  </p>
                  <div className="max-h-40 overflow-auto rounded-lg border text-xs font-mono">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-muted">
                        <tr>
                          {Object.keys(importParsed[0]).map((h) => (
                            <th key={h} className="px-3 py-1.5 text-start">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importParsed.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-t">
                            {Object.values(row).map((v, j) => (
                              <td key={j} className="px-3 py-1.5 truncate max-w-[150px]">{v}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importParsed.length > 5 && (
                      <p className="px-3 py-1.5 text-muted-foreground">... and {importParsed.length - 5} more rows</p>
                    )}
                  </div>
                </div>
              )}

              {/* Results */}
              {importResults && (
                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <span className="flex items-center gap-1.5 text-green-600 font-medium">
                      <Check className="h-4 w-4" /> {importResults.ok} {isRTL ? 'موفق' : 'succeeded'}
                    </span>
                    {importResults.errors > 0 && (
                      <span className="flex items-center gap-1.5 text-red-600 font-medium">
                        <X className="h-4 w-4" /> {importResults.errors} {isRTL ? 'خطا' : 'failed'}
                      </span>
                    )}
                  </div>
                  <div className="max-h-40 overflow-auto rounded-lg border text-xs space-y-0.5 p-2">
                    {importResults.results.map((r: any, i: number) => (
                      <div key={i} className={`flex items-start gap-2 ${r.status === 'ok' ? 'text-green-700' : 'text-red-700'}`}>
                        {r.status === 'ok' ? <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" /> : <X className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
                        <span>Row {r.row}: {r.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t p-5">
              <button onClick={() => { setShowBulkImport(false); setImportParsed([]); setImportResults(null); }} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">
                {isRTL ? 'بستن' : 'Close'}
              </button>
              {importParsed.length > 0 && !importResults && (
                <button
                  onClick={handleRunImport}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {isRTL ? 'شروع وارد کردن' : 'Run Import'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
