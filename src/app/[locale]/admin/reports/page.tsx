'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { 
  ArrowLeft, ArrowRight, BarChart3, Users, BookOpen, GraduationCap,
  TrendingUp, TrendingDown, Calendar, Download, Filter, RefreshCw,
  Clock, Star, Trophy, Target, ChevronDown
} from 'lucide-react';

export default function AdminReportsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [dateRange, setDateRange] = useState('month');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const stats = [
    { 
      label: isRTL ? 'کل معلمان' : 'Total Teachers', 
      value: '24', 
      change: '+3', 
      trend: 'up',
      icon: Users,
      color: 'primary'
    },
    { 
      label: isRTL ? 'کل دانش‌آموزان' : 'Total Students', 
      value: '847', 
      change: '+45', 
      trend: 'up',
      icon: GraduationCap,
      color: 'green'
    },
    { 
      label: isRTL ? 'دروس فعال' : 'Active Courses', 
      value: '56', 
      change: '+8', 
      trend: 'up',
      icon: BookOpen,
      color: 'purple'
    },
    { 
      label: isRTL ? 'ساعت تدریس' : 'Teaching Hours', 
      value: '1,234', 
      change: '+156', 
      trend: 'up',
      icon: Clock,
      color: 'orange'
    },
  ];

  const topTeachers = [
    { 
      id: 1, 
      name: isRTL ? 'علی احمدی' : 'Ali Ahmadi', 
      subject: isRTL ? 'ریاضی' : 'Mathematics',
      students: 45, 
      rating: 4.9,
      courses: 5 
    },
    { 
      id: 2, 
      name: isRTL ? 'سارا محمدی' : 'Sara Mohammadi', 
      subject: isRTL ? 'فیزیک' : 'Physics',
      students: 42, 
      rating: 4.8,
      courses: 4 
    },
    { 
      id: 3, 
      name: isRTL ? 'محمد حسینی' : 'Mohammad Hosseini', 
      subject: isRTL ? 'زبان انگلیسی' : 'English',
      students: 38, 
      rating: 4.7,
      courses: 6 
    },
    { 
      id: 4, 
      name: isRTL ? 'زهرا کریمی' : 'Zahra Karimi', 
      subject: isRTL ? 'شیمی' : 'Chemistry',
      students: 35, 
      rating: 4.7,
      courses: 3 
    },
    { 
      id: 5, 
      name: isRTL ? 'رضا موسوی' : 'Reza Mousavi', 
      subject: isRTL ? 'ادبیات' : 'Literature',
      students: 32, 
      rating: 4.6,
      courses: 4 
    },
  ];

  const departmentStats = [
    { 
      name: isRTL ? 'گروه ریاضی' : 'Mathematics', 
      teachers: 6, 
      students: 245, 
      courses: 15,
      completion: 78 
    },
    { 
      name: isRTL ? 'گروه علوم' : 'Science', 
      teachers: 8, 
      students: 312, 
      courses: 18,
      completion: 72 
    },
    { 
      name: isRTL ? 'گروه زبان' : 'Languages', 
      teachers: 5, 
      students: 180, 
      courses: 12,
      completion: 85 
    },
    { 
      name: isRTL ? 'گروه علوم انسانی' : 'Humanities', 
      teachers: 3, 
      students: 78, 
      courses: 8,
      completion: 68 
    },
    { 
      name: isRTL ? 'گروه هنر' : 'Arts', 
      teachers: 2, 
      students: 32, 
      courses: 3,
      completion: 90 
    },
  ];

  const recentActivities = [
    { 
      type: 'course', 
      action: isRTL ? 'دوره جدید اضافه شد' : 'New course added',
      detail: isRTL ? 'ریاضی پیشرفته توسط علی احمدی' : 'Advanced Math by Ali Ahmadi',
      time: isRTL ? '۲ ساعت پیش' : '2 hours ago'
    },
    { 
      type: 'student', 
      action: isRTL ? 'دانش‌آموز ثبت‌نام کرد' : 'Student enrolled',
      detail: isRTL ? '۵ دانش‌آموز در کلاس فیزیک' : '5 students in Physics class',
      time: isRTL ? '۴ ساعت پیش' : '4 hours ago'
    },
    { 
      type: 'teacher', 
      action: isRTL ? 'معلم جدید تأیید شد' : 'Teacher approved',
      detail: isRTL ? 'مریم رضایی - گروه زبان' : 'Maryam Rezaei - Languages',
      time: isRTL ? '۱ روز پیش' : '1 day ago'
    },
    { 
      type: 'course', 
      action: isRTL ? 'دوره تکمیل شد' : 'Course completed',
      detail: isRTL ? '۱۲ دانش‌آموز دوره زبان را تمام کردند' : '12 students finished English course',
      time: isRTL ? '۲ روز پیش' : '2 days ago'
    },
  ];

  const getColorClass = (color: string) => {
    switch (color) {
      case 'primary': return 'bg-primary/10 text-primary';
      case 'green': return 'bg-green-500/10 text-green-600';
      case 'purple': return 'bg-purple-500/10 text-purple-600';
      case 'orange': return 'bg-orange-500/10 text-orange-600';
      default: return 'bg-primary/10 text-primary';
    }
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
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h1 className="font-semibold">{isRTL ? 'گزارشات و آمار' : 'Reports & Analytics'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted text-sm">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'بروزرسانی' : 'Refresh'}</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'دانلود گزارش' : 'Export'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-sm border-none outline-none"
            >
              <option value="week">{isRTL ? 'هفته جاری' : 'This Week'}</option>
              <option value="month">{isRTL ? 'ماه جاری' : 'This Month'}</option>
              <option value="quarter">{isRTL ? 'سه ماهه' : 'This Quarter'}</option>
              <option value="year">{isRTL ? 'سال جاری' : 'This Year'}</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select 
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-transparent text-sm border-none outline-none"
            >
              <option value="all">{isRTL ? 'همه گروه‌ها' : 'All Departments'}</option>
              <option value="math">{isRTL ? 'ریاضی' : 'Mathematics'}</option>
              <option value="science">{isRTL ? 'علوم' : 'Science'}</option>
              <option value="language">{isRTL ? 'زبان' : 'Languages'}</option>
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-card border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${getColorClass(stat.color)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>{stat.change}</span>
                  </div>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Teachers */}
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                {isRTL ? 'برترین معلمان' : 'Top Teachers'}
              </h2>
              <Link 
                href={`/${locale}/admin/teachers`}
                className="text-sm text-primary hover:underline"
              >
                {isRTL ? 'مشاهده همه' : 'View All'}
              </Link>
            </div>
            <div className="space-y-3">
              {topTeachers.map((teacher, index) => (
                <div 
                  key={teacher.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{teacher.name}</p>
                    <p className="text-xs text-muted-foreground">{teacher.subject}</p>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">{teacher.rating}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {teacher.students} {isRTL ? 'دانش‌آموز' : 'students'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Stats */}
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                {isRTL ? 'عملکرد گروه‌ها' : 'Department Performance'}
              </h2>
            </div>
            <div className="space-y-4">
              {departmentStats.map((dept, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{dept.name}</span>
                    <span className="text-muted-foreground">{dept.completion}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${dept.completion}%` }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{dept.teachers} {isRTL ? 'معلم' : 'teachers'}</span>
                    <span>{dept.students} {isRTL ? 'دانش‌آموز' : 'students'}</span>
                    <span>{dept.courses} {isRTL ? 'دوره' : 'courses'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {isRTL ? 'فعالیت‌های اخیر' : 'Recent Activities'}
          </h2>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${
                  activity.type === 'course' ? 'bg-purple-500/10 text-purple-600' :
                  activity.type === 'student' ? 'bg-green-500/10 text-green-600' :
                  'bg-blue-500/10 text-blue-600'
                }`}>
                  {activity.type === 'course' ? <BookOpen className="h-4 w-4" /> :
                   activity.type === 'student' ? <GraduationCap className="h-4 w-4" /> :
                   <Users className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-card border rounded-xl p-6">
            <h2 className="font-semibold mb-4">
              {isRTL ? 'روند ثبت‌نام دانش‌آموزان' : 'Student Enrollment Trend'}
            </h2>
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{isRTL ? 'نمودار ثبت‌نام' : 'Enrollment Chart'}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-6">
            <h2 className="font-semibold mb-4">
              {isRTL ? 'پیشرفت دروس' : 'Course Progress'}
            </h2>
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
              <div className="text-center text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{isRTL ? 'نمودار پیشرفت' : 'Progress Chart'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
