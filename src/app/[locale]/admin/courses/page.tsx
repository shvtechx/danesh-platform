'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { 
  ArrowLeft, ArrowRight, Search, Users, GraduationCap, 
  BookOpen, Plus, X, Check, Save, Eye, Clock, Award,
  UserPlus, ChevronDown, Filter, FileText
} from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  subject: string;
  avatar: string;
  coursesCount: number;
}

interface Course {
  id: string;
  title: string;
  grade: string;
  subject: string;
  lessons: number;
  students: number;
  status: 'active' | 'draft';
}

export default function CourseAssignmentsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [searchAvailable, setSearchAvailable] = useState('');
  const [searchAssigned, setSearchAssigned] = useState('');
  const [assignedCourses, setAssignedCourses] = useState<string[]>(['c1', 'c2']);
  const [pendingChanges, setPendingChanges] = useState(false);

  const teachers: Teacher[] = [
    { id: 't1', name: isRTL ? 'دکتر احمدی' : 'Dr. Ahmadi', subject: isRTL ? 'ریاضی' : 'Math', avatar: 'A', coursesCount: 4 },
    { id: 't2', name: isRTL ? 'استاد محمدی' : 'Prof. Mohammadi', subject: isRTL ? 'فیزیک' : 'Physics', avatar: 'M', coursesCount: 3 },
    { id: 't3', name: isRTL ? 'خانم رضایی' : 'Ms. Rezaei', subject: isRTL ? 'انگلیسی' : 'English', avatar: 'R', coursesCount: 2 },
  ];

  const allCourses: Course[] = [
    { id: 'c1', title: isRTL ? 'ریاضی پایه هشتم' : 'Grade 8 Math', grade: isRTL ? 'هشتم' : '8th', subject: isRTL ? 'ریاضی' : 'Math', lessons: 24, students: 45, status: 'active' },
    { id: 'c2', title: isRTL ? 'ریاضی پایه نهم' : 'Grade 9 Math', grade: isRTL ? 'نهم' : '9th', subject: isRTL ? 'ریاضی' : 'Math', lessons: 20, students: 38, status: 'active' },
    { id: 'c3', title: isRTL ? 'هندسه پایه دهم' : 'Grade 10 Geometry', grade: isRTL ? 'دهم' : '10th', subject: isRTL ? 'هندسه' : 'Geometry', lessons: 18, students: 52, status: 'active' },
    { id: 'c4', title: isRTL ? 'فیزیک پایه هشتم' : 'Grade 8 Physics', grade: isRTL ? 'هشتم' : '8th', subject: isRTL ? 'فیزیک' : 'Physics', lessons: 16, students: 40, status: 'active' },
    { id: 'c5', title: isRTL ? 'شیمی پایه نهم' : 'Grade 9 Chemistry', grade: isRTL ? 'نهم' : '9th', subject: isRTL ? 'شیمی' : 'Chemistry', lessons: 14, students: 0, status: 'draft' },
    { id: 'c6', title: isRTL ? 'زبان انگلیسی' : 'English Language', grade: isRTL ? 'همه' : 'All', subject: isRTL ? 'زبان' : 'Language', lessons: 30, students: 120, status: 'active' },
  ];

  const availableCourses = allCourses.filter(c => !assignedCourses.includes(c.id));

  const filteredAvailable = availableCourses.filter(c =>
    c.title.toLowerCase().includes(searchAvailable.toLowerCase()) ||
    c.subject.toLowerCase().includes(searchAvailable.toLowerCase())
  );

  const filteredAssigned = allCourses
    .filter(c => assignedCourses.includes(c.id))
    .filter(c =>
      c.title.toLowerCase().includes(searchAssigned.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchAssigned.toLowerCase())
    );

  const handleAssign = (courseId: string) => {
    setAssignedCourses(prev => [...prev, courseId]);
    setPendingChanges(true);
  };

  const handleUnassign = (courseId: string) => {
    setAssignedCourses(prev => prev.filter(id => id !== courseId));
    setPendingChanges(true);
  };

  const handleSave = () => {
    // Save logic here
    setPendingChanges(false);
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
            <h1 className="font-semibold">{isRTL ? 'تخصیص دوره‌ها' : 'Course Assignments'}</h1>
          </div>
          {pendingChanges && (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Save className="h-4 w-4" />
              {isRTL ? 'ذخیره تغییرات' : 'Save Changes'}
            </button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
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
                    {teacher.coursesCount} {isRTL ? 'دوره' : 'courses'}
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
            {/* Available Courses */}
            <div className="bg-card border rounded-xl overflow-hidden">
              <div className="p-4 bg-muted/30 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    {isRTL ? 'دوره‌های موجود' : 'Available Courses'}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {availableCourses.length} {isRTL ? 'دوره' : 'courses'}
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchAvailable}
                    onChange={(e) => setSearchAvailable(e.target.value)}
                    placeholder={isRTL ? 'جستجو...' : 'Search...'}
                    className="w-full ps-10 pe-4 py-2 rounded-lg border bg-background text-sm"
                  />
                </div>
              </div>
              <div className="max-h-[500px] overflow-y-auto divide-y">
                {filteredAvailable.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>{isRTL ? 'دوره‌ای یافت نشد' : 'No courses found'}</p>
                  </div>
                ) : (
                  filteredAvailable.map((course) => (
                    <div
                      key={course.id}
                      className="p-4 hover:bg-muted/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{course.title}</h4>
                            {course.status === 'draft' && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">
                                {isRTL ? 'پیش‌نویس' : 'Draft'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {course.grade} • {course.subject}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {course.lessons} {isRTL ? 'درس' : 'lessons'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {course.students} {isRTL ? 'دانش‌آموز' : 'students'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAssign(course.id)}
                          className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 shrink-0"
                          title={isRTL ? 'تخصیص' : 'Assign'}
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Assigned Courses */}
            <div className="bg-card border rounded-xl overflow-hidden">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    {isRTL ? 'دوره‌های تخصیص داده شده' : 'Assigned Courses'}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {assignedCourses.length} {isRTL ? 'دوره' : 'courses'}
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchAssigned}
                    onChange={(e) => setSearchAssigned(e.target.value)}
                    placeholder={isRTL ? 'جستجو...' : 'Search...'}
                    className="w-full ps-10 pe-4 py-2 rounded-lg border bg-background text-sm"
                  />
                </div>
              </div>
              <div className="max-h-[500px] overflow-y-auto divide-y">
                {filteredAssigned.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>{isRTL ? 'هیچ دوره‌ای تخصیص داده نشده' : 'No courses assigned'}</p>
                  </div>
                ) : (
                  filteredAssigned.map((course) => (
                    <div
                      key={course.id}
                      className="p-4 hover:bg-muted/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{course.title}</h4>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                              {isRTL ? 'تخصیص داده شده' : 'Assigned'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {course.grade} • {course.subject}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {course.lessons} {isRTL ? 'درس' : 'lessons'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {course.students} {isRTL ? 'دانش‌آموز' : 'students'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/${locale}/admin/courses/${course.id}`}
                            className="p-2 rounded-lg hover:bg-muted"
                            title={isRTL ? 'مشاهده' : 'View'}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleUnassign(course.id)}
                            className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                            title={isRTL ? 'حذف' : 'Remove'}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {!selectedTeacher && (
          <div className="bg-muted/30 border-2 border-dashed rounded-xl p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">
              {isRTL ? 'معلمی را انتخاب کنید' : 'Select a Teacher'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isRTL 
                ? 'برای تخصیص دوره‌ها، ابتدا یک معلم را انتخاب کنید'
                : 'Choose a teacher to manage their course assignments'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
