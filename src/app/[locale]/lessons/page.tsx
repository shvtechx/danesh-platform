'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  BookOpen, Play, Clock, CheckCircle, Lock, Star,
  Filter, Search, ChevronRight, ChevronLeft, Award
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

export default function LessonsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const lessons = [
    {
      id: 1,
      title: isRTL ? 'مقدمه‌ای بر ریاضیات' : 'Introduction to Mathematics',
      course: isRTL ? 'ریاضی پایه' : 'Basic Math',
      duration: '15 min',
      status: 'completed',
      progress: 100,
      xp: 50
    },
    {
      id: 2,
      title: isRTL ? 'معادلات درجه اول' : 'First Degree Equations',
      course: isRTL ? 'ریاضی پایه' : 'Basic Math',
      duration: '20 min',
      status: 'completed',
      progress: 100,
      xp: 75
    },
    {
      id: 3,
      title: isRTL ? 'معادلات درجه دوم' : 'Second Degree Equations',
      course: isRTL ? 'ریاضی پایه' : 'Basic Math',
      duration: '25 min',
      status: 'in-progress',
      progress: 45,
      xp: 100
    },
    {
      id: 4,
      title: isRTL ? 'توابع و نمودارها' : 'Functions and Graphs',
      course: isRTL ? 'ریاضی پایه' : 'Basic Math',
      duration: '30 min',
      status: 'locked',
      progress: 0,
      xp: 125
    },
    {
      id: 5,
      title: isRTL ? 'مقدمه‌ای بر فیزیک' : 'Introduction to Physics',
      course: isRTL ? 'فیزیک مقدماتی' : 'Basic Physics',
      duration: '20 min',
      status: 'not-started',
      progress: 0,
      xp: 60
    },
    {
      id: 6,
      title: isRTL ? 'قوانین نیوتن' : 'Newton\'s Laws',
      course: isRTL ? 'فیزیک مقدماتی' : 'Basic Physics',
      duration: '35 min',
      status: 'locked',
      progress: 0,
      xp: 150
    },
  ];

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lesson.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || lesson.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress': return <Play className="h-5 w-5 text-primary" />;
      case 'locked': return <Lock className="h-5 w-5 text-muted-foreground" />;
      default: return <BookOpen className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return isRTL ? 'تکمیل شده' : 'Completed';
      case 'in-progress': return isRTL ? 'در حال یادگیری' : 'In Progress';
      case 'locked': return isRTL ? 'قفل' : 'Locked';
      default: return isRTL ? 'شروع نشده' : 'Not Started';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        locale={locale} 
        title={isRTL ? 'درس‌ها' : 'Lessons'}
        backHref={`/${locale}/dashboard`}
        backLabel={isRTL ? 'داشبورد' : 'Dashboard'}
      />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">{isRTL ? 'تکمیل شده' : 'Completed'}</span>
            </div>
            <p className="text-2xl font-bold">{lessons.filter(l => l.status === 'completed').length}</p>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Play className="h-4 w-4" />
              <span className="text-sm">{isRTL ? 'در حال یادگیری' : 'In Progress'}</span>
            </div>
            <p className="text-2xl font-bold">{lessons.filter(l => l.status === 'in-progress').length}</p>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Lock className="h-4 w-4" />
              <span className="text-sm">{isRTL ? 'قفل شده' : 'Locked'}</span>
            </div>
            <p className="text-2xl font-bold">{lessons.filter(l => l.status === 'locked').length}</p>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 text-yellow-600 mb-1">
              <Award className="h-4 w-4" />
              <span className="text-sm">{isRTL ? 'امتیاز کسب شده' : 'XP Earned'}</span>
            </div>
            <p className="text-2xl font-bold">
              {lessons.filter(l => l.status === 'completed').reduce((sum, l) => sum + l.xp, 0)}
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'جستجوی درس...' : 'Search lessons...'}
              className="w-full ps-10 pe-4 py-2 rounded-xl border bg-background"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border bg-background text-sm"
            >
              <option value="all">{isRTL ? 'همه' : 'All'}</option>
              <option value="completed">{isRTL ? 'تکمیل شده' : 'Completed'}</option>
              <option value="in-progress">{isRTL ? 'در حال یادگیری' : 'In Progress'}</option>
              <option value="not-started">{isRTL ? 'شروع نشده' : 'Not Started'}</option>
              <option value="locked">{isRTL ? 'قفل شده' : 'Locked'}</option>
            </select>
          </div>
        </div>

        {/* Lessons List */}
        <div className="space-y-3">
          {filteredLessons.map((lesson) => (
            <div
              key={lesson.id}
              className={`bg-card border rounded-xl p-4 transition-all ${
                lesson.status === 'locked' ? 'opacity-60' : 'hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  lesson.status === 'completed' ? 'bg-green-500/10' :
                  lesson.status === 'in-progress' ? 'bg-primary/10' :
                  'bg-muted'
                }`}>
                  {getStatusIcon(lesson.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{lesson.title}</h3>
                  <p className="text-sm text-muted-foreground">{lesson.course}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {lesson.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {lesson.xp} XP
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      lesson.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                      lesson.status === 'in-progress' ? 'bg-primary/10 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {getStatusLabel(lesson.status)}
                    </span>
                  </div>
                  {lesson.status === 'in-progress' && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${lesson.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {lesson.status !== 'locked' && (
                  <Link
                    href={`/${locale}/lessons/${lesson.id}`}
                    className="p-2 rounded-lg hover:bg-muted"
                  >
                    {isRTL ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredLessons.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isRTL ? 'درسی یافت نشد' : 'No lessons found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
