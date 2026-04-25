'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { 
  ArrowLeft, ArrowRight, Edit, Trash2, Users, BookOpen,
  Mail, Phone, Calendar, Award, BarChart3, Clock, Check,
  MessageSquare, Download, Send, ChevronRight, ChevronLeft,
  GraduationCap, FileText, TrendingUp, Star
} from 'lucide-react';

export default function TeacherDetailPage({ params }: { params: { locale: string; id: string } }) {
  const { locale, id } = params;
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;
  const NavArrow = isRTL ? ChevronLeft : ChevronRight;

  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'courses' | 'activity'>('overview');

  const teacher = {
    id,
    name: isRTL ? 'دکتر علی احمدی' : 'Dr. Ali Ahmadi',
    email: 'ahmadi@danesh.edu',
    phone: '+98 912 345 6789',
    subject: isRTL ? 'ریاضی' : 'Mathematics',
    department: isRTL ? 'گروه ریاضی' : 'Math Department',
    bio: isRTL 
      ? 'دکتر احمدی با بیش از ۱۵ سال تجربه تدریس ریاضی در مقاطع مختلف، متخصص در آموزش جبر و هندسه است.'
      : 'Dr. Ahmadi has over 15 years of experience teaching mathematics at various levels, specializing in algebra and geometry.',
    status: 'active',
    joinDate: '2023-01-15',
    avatar: 'A',
    stats: {
      totalStudents: 156,
      activeCourses: 4,
      completedCourses: 8,
      avgRating: 4.8,
      totalLessons: 96,
      totalHours: 240,
    },
  };

  const students = [
    { id: 's1', name: isRTL ? 'علی محمدی' : 'Ali Mohammadi', grade: isRTL ? 'هشتم' : '8th', progress: 85, avatar: 'A' },
    { id: 's2', name: isRTL ? 'سارا احمدی' : 'Sara Ahmadi', grade: isRTL ? 'هشتم' : '8th', progress: 92, avatar: 'S' },
    { id: 's3', name: isRTL ? 'محمد رضایی' : 'Mohammad Rezaei', grade: isRTL ? 'نهم' : '9th', progress: 78, avatar: 'M' },
    { id: 's4', name: isRTL ? 'مریم کریمی' : 'Maryam Karimi', grade: isRTL ? 'هشتم' : '8th', progress: 88, avatar: 'M' },
  ];

  const courses = [
    { id: 'c1', title: isRTL ? 'ریاضی پایه هشتم' : 'Grade 8 Math', students: 45, lessons: 24, progress: 65, status: 'active' },
    { id: 'c2', title: isRTL ? 'ریاضی پایه نهم' : 'Grade 9 Math', students: 38, lessons: 20, progress: 40, status: 'active' },
    { id: 'c3', title: isRTL ? 'هندسه پایه دهم' : 'Grade 10 Geometry', students: 52, lessons: 18, progress: 85, status: 'active' },
    { id: 'c4', title: isRTL ? 'جبر پیشرفته' : 'Advanced Algebra', students: 21, lessons: 12, progress: 30, status: 'draft' },
  ];

  const activities = [
    { action: isRTL ? 'درس جدید اضافه کرد' : 'Added new lesson', course: isRTL ? 'ریاضی پایه هشتم' : 'Grade 8 Math', time: isRTL ? '۲ ساعت پیش' : '2 hours ago' },
    { action: isRTL ? 'آزمون را بررسی کرد' : 'Reviewed quiz', course: isRTL ? 'ریاضی پایه نهم' : 'Grade 9 Math', time: isRTL ? '۵ ساعت پیش' : '5 hours ago' },
    { action: isRTL ? 'به سوال دانش‌آموز پاسخ داد' : 'Answered student question', course: isRTL ? 'هندسه پایه دهم' : 'Grade 10 Geometry', time: isRTL ? 'دیروز' : 'Yesterday' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/${locale}/admin/teachers`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Arrow className="h-5 w-5" />
              <span>{isRTL ? 'بازگشت' : 'Back'}</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-semibold">{isRTL ? 'جزئیات معلم' : 'Teacher Details'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/admin/teachers/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'ویرایش' : 'Edit'}</span>
            </Link>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-white hover:bg-destructive/90">
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'حذف' : 'Delete'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Teacher Profile */}
        <div className="bg-card border rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-4xl shrink-0">
              {teacher.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{teacher.name}</h2>
                <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                  {isRTL ? 'فعال' : 'Active'}
                </span>
              </div>
              <p className="text-muted-foreground mb-4">{teacher.department} • {teacher.subject}</p>
              <p className="text-sm mb-4">{teacher.bio}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {teacher.email}
                </span>
                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {teacher.phone}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {isRTL ? 'عضویت از:' : 'Joined:'} {teacher.joinDate}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-amber-100 px-3 py-2 rounded-xl">
              <Star className="h-5 w-5 text-amber-500 fill-current" />
              <span className="font-bold text-amber-700">{teacher.stats.avgRating}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-6">
          <div className="bg-card border rounded-xl p-4 text-center">
            <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{teacher.stats.totalStudents}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? 'دانش‌آموز' : 'Students'}</p>
          </div>
          <div className="bg-card border rounded-xl p-4 text-center">
            <BookOpen className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{teacher.stats.activeCourses}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? 'دوره فعال' : 'Active Courses'}</p>
          </div>
          <div className="bg-card border rounded-xl p-4 text-center">
            <Check className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{teacher.stats.completedCourses}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? 'دوره تکمیل' : 'Completed'}</p>
          </div>
          <div className="bg-card border rounded-xl p-4 text-center">
            <FileText className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{teacher.stats.totalLessons}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? 'درس' : 'Lessons'}</p>
          </div>
          <div className="bg-card border rounded-xl p-4 text-center">
            <Clock className="h-6 w-6 text-teal-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{teacher.stats.totalHours}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? 'ساعت آموزش' : 'Hours'}</p>
          </div>
          <div className="bg-card border rounded-xl p-4 text-center">
            <Star className="h-6 w-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{teacher.stats.avgRating}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? 'امتیاز' : 'Rating'}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b mb-6">
          {(['overview', 'students', 'courses', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'overview' ? (isRTL ? 'نمای کلی' : 'Overview') :
               tab === 'students' ? (isRTL ? 'دانش‌آموزان' : 'Students') :
               tab === 'courses' ? (isRTL ? 'دوره‌ها' : 'Courses') :
               (isRTL ? 'فعالیت‌ها' : 'Activity')}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Courses */}
            <div className="bg-card border rounded-xl">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">{isRTL ? 'دوره‌های اخیر' : 'Recent Courses'}</h3>
                <button onClick={() => setActiveTab('courses')} className="text-sm text-primary hover:underline">
                  {isRTL ? 'مشاهده همه' : 'View All'}
                </button>
              </div>
              <div className="divide-y">
                {courses.slice(0, 3).map((course) => (
                  <div key={course.id} className="flex items-center gap-3 p-4">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{course.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {course.students} {isRTL ? 'دانش‌آموز' : 'students'}
                      </p>
                    </div>
                    <div className="w-20 h-2 rounded-full bg-muted">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${course.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border rounded-xl">
              <div className="p-4 border-b">
                <h3 className="font-semibold">{isRTL ? 'فعالیت‌های اخیر' : 'Recent Activity'}</h3>
              </div>
              <div className="divide-y">
                {activities.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.course} • {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-card border rounded-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">{isRTL ? 'دانش‌آموزان' : 'Students'}</h3>
              <Link
                href={`/${locale}/admin/assignments`}
                className="text-sm text-primary hover:underline"
              >
                {isRTL ? 'مدیریت تخصیص' : 'Manage Assignments'}
              </Link>
            </div>
            <div className="divide-y">
              {students.map((student) => (
                <div key={student.id} className="flex items-center gap-4 p-4 hover:bg-muted/30">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-medium text-blue-700">
                    {student.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{isRTL ? 'پایه' : 'Grade'} {student.grade}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 rounded-full bg-muted">
                      <div className="h-full bg-green-600 rounded-full" style={{ width: `${student.progress}%` }} />
                    </div>
                    <span className="text-sm font-medium w-10">{student.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="bg-card border rounded-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">{isRTL ? 'دوره‌ها' : 'Courses'}</h3>
              <Link
                href={`/${locale}/admin/courses`}
                className="text-sm text-primary hover:underline"
              >
                {isRTL ? 'تخصیص دوره جدید' : 'Assign New Course'}
              </Link>
            </div>
            <div className="divide-y">
              {courses.map((course) => (
                <div key={course.id} className="flex items-center gap-4 p-4 hover:bg-muted/30">
                  <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{course.title}</p>
                      {course.status === 'draft' && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">
                          {isRTL ? 'پیش‌نویس' : 'Draft'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {course.students} {isRTL ? 'دانش‌آموز' : 'students'} • {course.lessons} {isRTL ? 'درس' : 'lessons'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 rounded-full bg-muted">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${course.progress}%` }} />
                    </div>
                    <span className="text-sm font-medium w-10">{course.progress}%</span>
                    <NavArrow className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="bg-card border rounded-xl">
            <div className="p-4 border-b">
              <h3 className="font-semibold">{isRTL ? 'تمام فعالیت‌ها' : 'All Activity'}</h3>
            </div>
            <div className="divide-y">
              {[...activities, ...activities, ...activities].map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 hover:bg-muted/30">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.course}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
