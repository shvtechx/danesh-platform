'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
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
}

interface Student {
  id: string;
  name: string;
  grade: string;
  avatar: string;
  email: string;
}

export default function AssignmentsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [searchAvailable, setSearchAvailable] = useState('');
  const [searchAssigned, setSearchAssigned] = useState('');
  const [assignedStudents, setAssignedStudents] = useState<string[]>(['s1', 's2', 's3']);
  const [pendingChanges, setPendingChanges] = useState(false);

  const teachers: Teacher[] = [
    { id: 't1', name: isRTL ? 'دکتر احمدی' : 'Dr. Ahmadi', subject: isRTL ? 'ریاضی' : 'Math', avatar: 'A', studentsCount: 45 },
    { id: 't2', name: isRTL ? 'استاد محمدی' : 'Prof. Mohammadi', subject: isRTL ? 'فیزیک' : 'Physics', avatar: 'M', studentsCount: 38 },
    { id: 't3', name: isRTL ? 'خانم رضایی' : 'Ms. Rezaei', subject: isRTL ? 'انگلیسی' : 'English', avatar: 'R', studentsCount: 52 },
  ];

  const allStudents: Student[] = [
    { id: 's1', name: isRTL ? 'علی احمدی' : 'Ali Ahmadi', grade: isRTL ? 'هشتم' : '8th', avatar: 'A', email: 'ali@student.com' },
    { id: 's2', name: isRTL ? 'سارا محمدی' : 'Sara Mohammadi', grade: isRTL ? 'هشتم' : '8th', avatar: 'S', email: 'sara@student.com' },
    { id: 's3', name: isRTL ? 'محمد رضایی' : 'Mohammad Rezaei', grade: isRTL ? 'نهم' : '9th', avatar: 'M', email: 'mohammad@student.com' },
    { id: 's4', name: isRTL ? 'مریم کریمی' : 'Maryam Karimi', grade: isRTL ? 'هشتم' : '8th', avatar: 'M', email: 'maryam@student.com' },
    { id: 's5', name: isRTL ? 'حسین جعفری' : 'Hossein Jafari', grade: isRTL ? 'نهم' : '9th', avatar: 'H', email: 'hossein@student.com' },
    { id: 's6', name: isRTL ? 'زهرا نوری' : 'Zahra Nouri', grade: isRTL ? 'هفتم' : '7th', avatar: 'Z', email: 'zahra@student.com' },
    { id: 's7', name: isRTL ? 'امیر حسینی' : 'Amir Hosseini', grade: isRTL ? 'هشتم' : '8th', avatar: 'A', email: 'amir@student.com' },
    { id: 's8', name: isRTL ? 'نازنین اکبری' : 'Nazanin Akbari', grade: isRTL ? 'نهم' : '9th', avatar: 'N', email: 'nazanin@student.com' },
  ];

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
    setAssignedStudents(prev => [...prev, studentId]);
    setPendingChanges(true);
  };

  const handleUnassign = (studentId: string) => {
    setAssignedStudents(prev => prev.filter(id => id !== studentId));
    setPendingChanges(true);
  };

  const handleAssignAll = () => {
    setAssignedStudents(allStudents.map(s => s.id));
    setPendingChanges(true);
  };

  const handleUnassignAll = () => {
    setAssignedStudents([]);
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
            <h1 className="font-semibold">{isRTL ? 'تخصیص دانش‌آموزان' : 'Student Assignments'}</h1>
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
                    {teacher.studentsCount} {isRTL ? 'دانش‌آموز' : 'students'}
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
