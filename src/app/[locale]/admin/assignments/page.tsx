'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import { 
  ArrowLeft, ArrowRight, Search, Users, GraduationCap, 
  BookOpen, Plus, X, Check, ChevronDown, Filter,
  UserPlus, UserMinus, Save, ArrowLeftRight
} from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  subject: string;
  avatar: string;
  studentsCount: number;
  subjects?: string[];
  assignedStudentIds?: string[];
}

interface Student {
  id: string;
  name: string;
  grade: string;
  avatar: string;
  email: string;
}

export default function AssignmentsPage({ params: { locale } }: { params: { locale: string } }) {
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [searchAvailable, setSearchAvailable] = useState('');
  const [searchAssigned, setSearchAssigned] = useState('');
  const [teacherAssignments, setTeacherAssignments] = useState<Record<string, string[]>>({});
  const [pendingChanges, setPendingChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);

  const assignedStudents = selectedTeacher ? (teacherAssignments[selectedTeacher] || []) : [];

  useEffect(() => {
    const loadPageData = async () => {
      try {
        const [studentsResponse, teachersResponse] = await Promise.all([
          fetch('/api/v1/admin/users', {
            headers: createUserHeaders(getStoredUserId()),
          }),
          fetch(`/api/v1/admin/teachers?locale=${locale}`, {
            headers: createUserHeaders(getStoredUserId()),
          }),
        ]);

        if (!studentsResponse.ok || !teachersResponse.ok) {
          throw new Error('Failed to load assignment data');
        }

        const [studentsData, teachersData] = await Promise.all([studentsResponse.json(), teachersResponse.json()]);

        const students = (studentsData.users || [])
          .filter((user: any) => Array.isArray(user.roles) && user.roles.includes('STUDENT'))
          .map((user: any) => {
            const displayName = user.profile?.displayName || [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ') || user.email || 'Student';
            return {
              id: user.id,
              name: displayName,
              grade: isRTL ? 'دانش‌آموز' : 'Student',
              avatar: displayName[0]?.toUpperCase() || 'S',
              email: user.email || '—',
            } satisfies Student;
          });

        const teacherRecords = (teachersData.teachers || []).map((teacher: any) => ({
          id: teacher.id,
          name: teacher.name,
          subject: teacher.subject,
          avatar: teacher.avatar || teacher.name?.[0]?.toUpperCase() || 'T',
          studentsCount: teacher.students || 0,
          subjects: teacher.subjects || [],
          assignedStudentIds: teacher.assignedStudentIds || [],
        } satisfies Teacher));

        setTeachers(teacherRecords);
        setAllStudents(students);
        setTeacherAssignments(
          teacherRecords.reduce((accumulator: Record<string, string[]>, teacher: Teacher) => {
            accumulator[teacher.id] = teacher.assignedStudentIds || [];
            return accumulator;
          }, {}),
        );
      } catch {
        setFeedback({
          variant: 'error',
          message: isRTL ? 'بارگذاری معلمان و دانش‌آموزان واقعی ممکن نبود.' : 'Real teacher and student records could not be loaded.',
        });
        setTeachers([]);
        setAllStudents([]);
        setTeacherAssignments({});
      }
    };

    void loadPageData();
  }, [isRTL, locale]);

  const availableStudents = allStudents.filter(s => !assignedStudents.includes(s.id));

  const filteredAvailable = availableStudents.filter(s =>
    s.name.toLowerCase().includes(searchAvailable.toLowerCase()) ||
    s.email.toLowerCase().includes(searchAvailable.toLowerCase())
  );

  const filteredAssigned = allStudents
    .filter(s => assignedStudents.includes(s.id))
    .filter(s =>
      s.name.toLowerCase().includes(searchAssigned.toLowerCase()) ||
      s.email.toLowerCase().includes(searchAssigned.toLowerCase())
    );

  const handleAssign = (studentId: string) => {
    if (!selectedTeacher) return;
    setTeacherAssignments((prev) => ({
      ...prev,
      [selectedTeacher]: [...(prev[selectedTeacher] || []), studentId],
    }));
    setPendingChanges(true);
  };

  const handleUnassign = (studentId: string) => {
    if (!selectedTeacher) return;
    setTeacherAssignments((prev) => ({
      ...prev,
      [selectedTeacher]: (prev[selectedTeacher] || []).filter((id) => id !== studentId),
    }));
    setPendingChanges(true);
  };

  const handleAssignAll = () => {
    if (!selectedTeacher) return;
    setTeacherAssignments((prev) => ({
      ...prev,
      [selectedTeacher]: allStudents.map((student) => student.id),
    }));
    setPendingChanges(true);
  };

  const handleUnassignAll = () => {
    if (!selectedTeacher) return;
    setTeacherAssignments((prev) => ({
      ...prev,
      [selectedTeacher]: [],
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
            assignedStudentIds: teacherAssignments[selectedTeacher] || [],
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || 'failed_to_save_assignments');
        }

        setTeachers((prev) => prev.map((teacher) => (
          teacher.id === selectedTeacher
            ? {
                ...teacher,
                studentsCount: (teacherAssignments[selectedTeacher] || []).length,
                assignedStudentIds: teacherAssignments[selectedTeacher] || [],
              }
            : teacher
        )));
        setPendingChanges(false);
        setFeedback({
          variant: 'success',
          message: isRTL ? 'تخصیص دانش‌آموزان ذخیره شد.' : 'Student assignments were saved.',
        });
      } catch {
        setFeedback({
          variant: 'error',
          message: isRTL ? 'ذخیره تخصیص دانش‌آموزان انجام نشد.' : 'Unable to save student assignments.',
        });
      } finally {
        setSaving(false);
      }
    };

    void persistAssignments();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/${locale}/admin`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Arrow className="h-5 w-5" />
              <span>{isRTL ? 'بازگشت' : 'Back'}</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-semibold">{isRTL ? 'تخصیص دانش‌آموزان' : 'Student Assignments'}</h1>
          </div>
          {pendingChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Save className="h-4 w-4" />
              {saving ? (isRTL ? 'در حال ذخیره...' : 'Saving...') : (isRTL ? 'ذخیره تغییرات' : 'Save Changes')}
            </button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {feedback ? <FeedbackBanner className="mb-6" variant={feedback.variant} message={feedback.message} /> : null}

        {/* Teacher Selection */}
        <div className="bg-card border rounded-xl p-4 mb-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            {isRTL ? 'انتخاب معلم' : 'Select Teacher'}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {teachers.map((teacher) => (
              <button
                key={teacher.id}
                onClick={() => setSelectedTeacher(teacher.id)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  selectedTeacher === teacher.id
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-muted/50 hover:border-muted-foreground/30'
                }`}
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-lg">
                  {teacher.avatar}
                </div>
                <div className="text-start">
                  <p className="font-medium">{teacher.name}</p>
                  <p className="text-sm text-muted-foreground">{teacher.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(teacherAssignments[teacher.id] || []).length} {isRTL ? 'دانش‌آموز' : 'students'}
                  </p>
                </div>
                {selectedTeacher === teacher.id && (
                  <Check className="h-5 w-5 text-primary ms-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {selectedTeacher && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Available Students */}
            <div className="bg-card border rounded-xl overflow-hidden">
              <div className="p-4 bg-muted/30 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    {isRTL ? 'دانش‌آموزان موجود' : 'Available Students'}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {availableStudents.length} {isRTL ? 'نفر' : 'students'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchAvailable}
                      onChange={(e) => setSearchAvailable(e.target.value)}
                      placeholder={isRTL ? 'جستجو...' : 'Search...'}
                      className="w-full ps-10 pe-4 py-2 rounded-lg border bg-background text-sm"
                    />
                  </div>
                  <button
                    onClick={handleAssignAll}
                    className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 flex items-center gap-1"
                    title={isRTL ? 'افزودن همه' : 'Add All'}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">{isRTL ? 'همه' : 'All'}</span>
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y">
                {filteredAvailable.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>{isRTL ? 'دانش‌آموزی یافت نشد' : 'No students found'}</p>
                  </div>
                ) : (
                  filteredAvailable.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/30"
                    >
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-medium text-blue-700">
                        {student.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.grade} • {student.email}</p>
                      </div>
                      <button
                        onClick={() => handleAssign(student.id)}
                        className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
                        title={isRTL ? 'افزودن' : 'Add'}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Assigned Students */}
            <div className="bg-card border rounded-xl overflow-hidden">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    {isRTL ? 'دانش‌آموزان تخصیص داده شده' : 'Assigned Students'}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {assignedStudents.length} {isRTL ? 'نفر' : 'students'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchAssigned}
                      onChange={(e) => setSearchAssigned(e.target.value)}
                      placeholder={isRTL ? 'جستجو...' : 'Search...'}
                      className="w-full ps-10 pe-4 py-2 rounded-lg border bg-background text-sm"
                    />
                  </div>
                  <button
                    onClick={handleUnassignAll}
                    className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 flex items-center gap-1"
                    title={isRTL ? 'حذف همه' : 'Remove All'}
                  >
                    <UserMinus className="h-4 w-4" />
                    <span className="hidden sm:inline">{isRTL ? 'همه' : 'All'}</span>
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y">
                {filteredAssigned.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>{isRTL ? 'هیچ دانش‌آموزی تخصیص داده نشده' : 'No students assigned'}</p>
                  </div>
                ) : (
                  filteredAssigned.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/30"
                    >
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center font-medium text-green-700">
                        {student.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.grade} • {student.email}</p>
                      </div>
                      <button
                        onClick={() => handleUnassign(student.id)}
                        className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                        title={isRTL ? 'حذف' : 'Remove'}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {!selectedTeacher && (
          <div className="bg-muted/30 border-2 border-dashed rounded-xl p-12 text-center">
            <ArrowLeftRight className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">
              {isRTL ? 'معلمی را انتخاب کنید' : 'Select a Teacher'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isRTL 
                ? 'برای تخصیص دانش‌آموزان، ابتدا یک معلم را انتخاب کنید'
                : 'Choose a teacher to manage their student assignments'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
