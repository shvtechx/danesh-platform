'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  BookOpen, ArrowLeft, ArrowRight, Plus, Edit, Trash2, Eye,
  Users, FileText, Clock, ChevronRight, ChevronLeft, Settings,
  GripVertical, Video, Image, HelpCircle, Save, Send, X,
  Sparkles, Play, Lock, Unlock, MoreVertical
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'activity';
  duration: string;
  status: 'published' | 'draft';
  order: number;
  xp: number;
}

interface Unit {
  id: string;
  title: string;
  lessons: Lesson[];
  isExpanded: boolean;
}

interface CourseEditorInfo {
  id: string;
  title: string;
  description: string;
  grade: string;
  subject: string;
  students: number;
  status: 'published' | 'draft';
}

type FeedbackState = {
  variant: 'success' | 'error' | 'info';
  message: string;
} | null;

type PendingAction =
  | { type: 'delete-unit'; unitId: string; title: string }
  | { type: 'delete-lesson'; unitId: string; lessonId: string; title: string }
  | { type: 'delete-course' }
  | null;

const TEACHER_COURSE_EDITOR_STORAGE_KEY = 'danesh.teacher.course-editor';

export default function CourseEditor({ params }: { params: { locale: string; id: string } }) {
  const { locale, id } = params;
  const t = useTranslations();
  const router = useRouter();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;
  const NavArrow = isRTL ? ChevronLeft : ChevronRight;

  const storageKey = useMemo(() => `${TEACHER_COURSE_EDITOR_STORAGE_KEY}.${locale}.${id}`, [id, locale]);

  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'students'>('content');
  const [showAddLesson, setShowAddLesson] = useState<string | null>(null);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState<'video' | 'text' | 'quiz'>('video');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [renameUnitState, setRenameUnitState] = useState<{ unitId: string; title: string } | null>(null);
  const [isCourseVisible, setIsCourseVisible] = useState(true);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [courseInfo, setCourseInfo] = useState<CourseEditorInfo | null>(null);
  const [studentSnapshots, setStudentSnapshots] = useState<Array<{ id: string; name: string; progress: number; lastActive: string }>>([]);
  const [courseSettings, setCourseSettings] = useState({
    title: '',
    description: '',
    grade: '',
    subject: '',
  });

  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setIsLoadingCourse(true);
        const response = await fetch(`/api/v1/courses/${id}?locale=${locale}`, {
          headers: createUserHeaders(getStoredUserId()),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || 'failed_to_load_course');
        }

        const nextCourseInfo: CourseEditorInfo = {
          id: data.id,
          title: data.title || (isRTL ? 'بدون عنوان' : 'Untitled course'),
          description: data.description || '',
          grade: locale === 'fa'
            ? (data.gradeLevel?.nameFA || data.gradeLevel?.name || '—')
            : (data.gradeLevel?.name || data.gradeLevel?.nameFA || '—'),
          subject: locale === 'fa'
            ? (data.subject?.nameFA || data.subject?.name || '—')
            : (data.subject?.name || data.subject?.nameFA || '—'),
          students: data.enrollmentsCount || 0,
          status: data.isPublished ? 'published' : 'draft',
        };

        const nextUnits: Unit[] = (data.units || []).map((unit: any, unitIndex: number) => ({
          id: unit.id,
          title: unit.title,
          isExpanded: unitIndex === 0,
          lessons: (unit.lessons || []).map((lesson: any, lessonIndex: number) => ({
            id: lesson.id,
            title: lesson.title,
            type: 'text',
            duration: lesson.estimatedTime ? `${lesson.estimatedTime}:00` : '0:00',
            status: 'published',
            order: lesson.sequence || lessonIndex + 1,
            xp: 50,
          })),
        }));

        setCourseInfo(nextCourseInfo);
        setCourseSettings({
          title: nextCourseInfo.title,
          description: nextCourseInfo.description,
          grade: nextCourseInfo.grade,
          subject: nextCourseInfo.subject,
        });
        setUnits(nextUnits);
      } catch {
        setCourseInfo(null);
        setUnits([]);
        setFeedback({
          variant: 'error',
          message: isRTL ? 'بارگذاری اطلاعات دوره ممکن نبود.' : 'Course details could not be loaded.',
        });
      } finally {
        setIsLoadingCourse(false);
      }
    };

    void loadCourse();
  }, [id, isRTL, locale]);

  useEffect(() => {
    if (isLoadingCourse) return;

    try {
      const storedState = window.localStorage.getItem(storageKey);
      if (!storedState) return;

      const parsed = JSON.parse(storedState) as {
        units?: Unit[];
        courseSettings?: typeof courseSettings;
        isCourseVisible?: boolean;
      };

      if (Array.isArray(parsed.units)) setUnits(parsed.units);
      if (parsed.courseSettings) setCourseSettings((prev) => ({ ...prev, ...parsed.courseSettings }));
      if (typeof parsed.isCourseVisible === 'boolean') setIsCourseVisible(parsed.isCourseVisible);
    } catch {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'بارگذاری تغییرات ذخیره‌شده ممکن نبود.' : 'Saved course changes could not be loaded.',
      });
    }
  }, [isLoadingCourse, isRTL, storageKey]);

  useEffect(() => {
    const loadStudentSnapshots = async () => {
      try {
        const response = await fetch(`/api/v1/teacher/student-progress?locale=${locale}`, {
          headers: createUserHeaders(getStoredUserId()),
        });

        if (!response.ok) return;
        const data = await response.json();
        const nextStudents = (data.students || []).slice(0, 8).map((student: any) => ({
          id: student.studentId,
          name: student.studentName,
          progress: student.averageMastery || 0,
          lastActive: student.recentSessions?.[0]?.startedAt
            ? new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
                month: 'short',
                day: 'numeric',
              }).format(new Date(student.recentSessions[0].startedAt))
            : (locale === 'fa' ? 'بدون فعالیت' : 'No activity'),
        }));
        setStudentSnapshots(nextStudents);
      } catch {
        setStudentSnapshots([]);
      }
    };

    void loadStudentSnapshots();
  }, [locale]);

  const persistCourseState = (nextState?: {
    units?: Unit[];
    courseSettings?: typeof courseSettings;
    isCourseVisible?: boolean;
  }) => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        units: nextState?.units ?? units,
        courseSettings: nextState?.courseSettings ?? courseSettings,
        isCourseVisible: nextState?.isCourseVisible ?? isCourseVisible,
        updatedAt: new Date().toISOString(),
      }),
    );
  };

  const toggleUnit = (unitId: string) => {
    setUnits(units.map(u => 
      u.id === unitId ? { ...u, isExpanded: !u.isExpanded } : u
    ));
  };

  const handleAddUnit = () => {
    if (!newUnitTitle.trim()) return;
    const newUnit: Unit = {
      id: `u${Date.now()}`,
      title: newUnitTitle,
      lessons: [],
      isExpanded: true,
    };
    const nextUnits = [...units, newUnit];
    setUnits(nextUnits);
    persistCourseState({ units: nextUnits });
    setNewUnitTitle('');
    setShowAddUnit(false);
    setFeedback({
      variant: 'success',
      message: isRTL ? 'فصل جدید ذخیره شد.' : 'New chapter saved.',
    });
  };

  const handleDeleteUnit = (unitId: string) => {
    const unit = units.find((item) => item.id === unitId);
    if (!unit) return;

    setPendingAction({ type: 'delete-unit', unitId, title: unit.title });
  };

  const handleRenameUnit = (unitId: string) => {
    const currentUnit = units.find((unit) => unit.id === unitId);
    if (!currentUnit) return;

    setRenameUnitState({ unitId, title: currentUnit.title });
  };

  const handleConfirmRenameUnit = () => {
    if (!renameUnitState?.title.trim()) return;

    const nextUnits = units.map((unit) =>
        unit.id === renameUnitState.unitId ? { ...unit, title: renameUnitState.title.trim() } : unit,
      );
    setUnits(nextUnits);
    persistCourseState({ units: nextUnits });
    setFeedback({
      variant: 'success',
      message: isRTL ? 'عنوان فصل به‌روزرسانی شد.' : 'Chapter title updated.',
    });
    setRenameUnitState(null);
  };

  const handleAddLesson = (unitId: string) => {
    if (!newLessonTitle.trim()) return;
    const newLesson: Lesson = {
      id: `l${Date.now()}`,
      title: newLessonTitle,
      type: newLessonType,
      duration: '0:00',
      status: 'draft',
      order: units.find(u => u.id === unitId)?.lessons.length || 0,
      xp: 50,
    };
    const nextUnits = units.map(u => 
      u.id === unitId ? { ...u, lessons: [...u.lessons, newLesson] } : u
    );
    setUnits(nextUnits);
    persistCourseState({ units: nextUnits });
    setNewLessonTitle('');
    setShowAddLesson(null);
    setFeedback({
      variant: 'success',
      message: isRTL ? 'درس جدید ذخیره شد.' : 'New lesson saved.',
    });
  };

  const handleDeleteLesson = (unitId: string, lessonId: string) => {
    const unit = units.find((item) => item.id === unitId);
    const lesson = unit?.lessons.find((item) => item.id === lessonId);
    if (!unit || !lesson) return;

    setPendingAction({ type: 'delete-lesson', unitId, lessonId, title: lesson.title });
  };

  const handleUpdateCourse = async () => {
    persistCourseState();
    setFeedback({
      variant: 'success',
      message: isRTL ? 'دوره با موفقیت به‌روزرسانی شد.' : 'Course updated successfully.',
    });
  };

  const handleSaveCourseSettings = () => {
    persistCourseState();
    setFeedback({
      variant: 'success',
      message: isRTL ? 'تنظیمات ذخیره شد.' : 'Settings saved.',
    });
  };

  const handleDeleteCourse = () => {
    setPendingAction({ type: 'delete-course' });
  };

  const toggleCourseVisibility = () => {
    const nextVisibility = !isCourseVisible;
    setIsCourseVisible(nextVisibility);
    persistCourseState({ isCourseVisible: nextVisibility });
    setFeedback({
      variant: 'success',
      message: isCourseVisible
        ? (isRTL ? 'دوره از دید دانش‌آموزان پنهان شد.' : 'Course hidden from students.')
        : (isRTL ? 'دوره برای دانش‌آموزان قابل مشاهده شد.' : 'Course is now visible to students.'),
    });
  };

  const handleConfirmAction = () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'delete-unit') {
      const nextUnits = units.filter((unit) => unit.id !== pendingAction.unitId);
      setUnits(nextUnits);
      persistCourseState({ units: nextUnits });
      setFeedback({
        variant: 'success',
        message: isRTL ? 'فصل حذف شد.' : 'Chapter deleted.',
      });
    }

    if (pendingAction.type === 'delete-lesson') {
      const nextUnits = units.map((unit) =>
          unit.id === pendingAction.unitId
            ? { ...unit, lessons: unit.lessons.filter((lesson) => lesson.id !== pendingAction.lessonId) }
            : unit,
        );
      setUnits(nextUnits);
      persistCourseState({ units: nextUnits });
      setFeedback({
        variant: 'success',
        message: isRTL ? 'درس حذف شد.' : 'Lesson deleted.',
      });
    }

    if (pendingAction.type === 'delete-course') {
      window.localStorage.removeItem(storageKey);
      setFeedback({
        variant: 'success',
        message: isRTL ? 'دوره حذف شد. در حال بازگشت به فهرست دوره‌ها...' : 'Course deleted. Returning to course list...',
      });
      window.setTimeout(() => {
        router.push(`/${locale}/teacher/courses`);
      }, 500);
    }

    setPendingAction(null);
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'text': return <FileText className="h-4 w-4" />;
      case 'quiz': return <HelpCircle className="h-4 w-4" />;
      default: return <Play className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/${locale}/teacher/courses`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Arrow className="h-5 w-5" />
              <span>{isRTL ? 'بازگشت' : 'Back'}</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="font-semibold">{courseSettings.title || courseInfo?.title || (isRTL ? 'دوره' : 'Course')}</h1>
              <p className="text-xs text-muted-foreground">
                {isRTL
                  ? `${courseSettings.grade || courseInfo?.grade || '—'} - ${courseSettings.subject || courseInfo?.subject || '—'}`
                  : `${courseSettings.grade || courseInfo?.grade || '—'} - ${courseSettings.subject || courseInfo?.subject || '—'}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/courses/${id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'پیش‌نمایش' : 'Preview'}</span>
            </Link>
            <button 
              onClick={handleUpdateCourse}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'بروزرسانی' : 'Update'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {feedback ? <FeedbackBanner className="mb-6" variant={feedback.variant} message={feedback.message} /> : null}

        {isLoadingCourse ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : !courseInfo ? (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
            {isRTL ? 'دوره‌ای برای ویرایش پیدا نشد.' : 'No course was found for editing.'}
          </div>
        ) : (
          <>
        {/* Tabs */}
        <div className="flex gap-2 border-b mb-6">
          {(['content', 'settings', 'students'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'content' ? (isRTL ? 'محتوا' : 'Content') :
               tab === 'settings' ? (isRTL ? 'تنظیمات' : 'Settings') :
               (isRTL ? 'دانش‌آموزان' : 'Students')}
            </button>
          ))}
        </div>

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Units & Lessons */}
            <div className="lg:col-span-2 space-y-4">
              {units.map((unit) => (
                <div key={unit.id} className="bg-card border rounded-xl overflow-hidden">
                  {/* Unit Header */}
                  <div 
                    className="flex items-center gap-3 p-4 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => toggleUnit(unit.id)}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <div className={`transition-transform ${unit.isExpanded ? 'rotate-90' : ''}`}>
                      <NavArrow className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{unit.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {unit.lessons.length} {isRTL ? 'درس' : 'lessons'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        className="p-2 rounded-lg hover:bg-background"
                        onClick={(e) => { 
                          e.stopPropagation();
                          handleRenameUnit(unit.id);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        className="p-2 rounded-lg hover:bg-background text-destructive"
                        onClick={(e) => { 
                          e.stopPropagation();
                          handleDeleteUnit(unit.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Lessons List */}
                  {unit.isExpanded && (
                    <div className="p-4 pt-0 space-y-2">
                      {unit.lessons.map((lesson) => (
                        <div 
                          key={lesson.id}
                          className="flex items-center gap-3 p-3 bg-background rounded-lg border hover:border-primary/50 group"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100" />
                          <div className={`p-2 rounded-lg ${
                            lesson.type === 'video' ? 'bg-blue-100 text-blue-600' :
                            lesson.type === 'quiz' ? 'bg-purple-100 text-purple-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {getLessonIcon(lesson.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{lesson.title}</span>
                              {lesson.status === 'draft' && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">
                                  {isRTL ? 'پیش‌نویس' : 'Draft'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {lesson.duration}
                              </span>
                              <span className="flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                {lesson.xp} XP
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/${locale}/teacher/courses/${id}/lessons/${lesson.id}/edit`}
                              className="p-2 rounded-lg hover:bg-muted"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/${locale}/courses/${id}/lessons/${lesson.id}`}
                              className="p-2 rounded-lg hover:bg-muted"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button 
                              onClick={() => handleDeleteLesson(unit.id, lesson.id)}
                              className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add Lesson Button */}
                      <button
                        onClick={() => setShowAddLesson(unit.id)}
                        className="w-full p-3 border-2 border-dashed rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/50 flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {isRTL ? 'افزودن درس' : 'Add Lesson'}
                      </button>

                      {/* Add Lesson Modal */}
                      {showAddLesson === unit.id && (
                        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{isRTL ? 'درس جدید' : 'New Lesson'}</h4>
                            <button 
                              onClick={() => setShowAddLesson(null)}
                              className="p-1 hover:bg-background rounded"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={newLessonTitle}
                            onChange={(e) => setNewLessonTitle(e.target.value)}
                            placeholder={isRTL ? 'عنوان درس...' : 'Lesson title...'}
                            className="w-full p-2 rounded-lg border bg-background"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <button 
                              onClick={() => setNewLessonType('video')}
                              className={`flex flex-col items-center gap-1 p-3 rounded-lg border hover:border-primary/50 bg-background ${newLessonType === 'video' ? 'border-primary bg-primary/5' : ''}`}
                            >
                              <Video className="h-5 w-5 text-blue-600" />
                              <span className="text-xs">{isRTL ? 'ویدیو' : 'Video'}</span>
                            </button>
                            <button 
                              onClick={() => setNewLessonType('text')}
                              className={`flex flex-col items-center gap-1 p-3 rounded-lg border hover:border-primary/50 bg-background ${newLessonType === 'text' ? 'border-primary bg-primary/5' : ''}`}
                            >
                              <FileText className="h-5 w-5 text-green-600" />
                              <span className="text-xs">{isRTL ? 'متن' : 'Text'}</span>
                            </button>
                            <button 
                              onClick={() => setNewLessonType('quiz')}
                              className={`flex flex-col items-center gap-1 p-3 rounded-lg border hover:border-primary/50 bg-background ${newLessonType === 'quiz' ? 'border-primary bg-primary/5' : ''}`}
                            >
                              <HelpCircle className="h-5 w-5 text-purple-600" />
                              <span className="text-xs">{isRTL ? 'آزمون' : 'Quiz'}</span>
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setShowAddLesson(null);
                                setNewLessonTitle('');
                              }}
                              className="flex-1 p-2 rounded-lg border hover:bg-background"
                            >
                              {isRTL ? 'انصراف' : 'Cancel'}
                            </button>
                            <button
                              onClick={() => handleAddLesson(unit.id)}
                              disabled={!newLessonTitle.trim()}
                              className="flex-1 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                              {isRTL ? 'افزودن' : 'Add'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Add Unit Button */}
              <button
                onClick={() => setShowAddUnit(true)}
                className="w-full p-4 border-2 border-dashed rounded-xl text-muted-foreground hover:text-foreground hover:border-primary/50 flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                {isRTL ? 'افزودن فصل جدید' : 'Add New Chapter'}
              </button>

              {/* Add Unit Modal */}
              {showAddUnit && (
                <div className="bg-card border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{isRTL ? 'فصل جدید' : 'New Chapter'}</h4>
                    <button 
                      onClick={() => setShowAddUnit(false)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newUnitTitle}
                    onChange={(e) => setNewUnitTitle(e.target.value)}
                    placeholder={isRTL ? 'عنوان فصل...' : 'Chapter title...'}
                    className="w-full p-3 rounded-lg border bg-background"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setShowAddUnit(false);
                        setNewUnitTitle('');
                      }}
                      className="flex-1 p-2 rounded-lg border hover:bg-muted"
                    >
                      {isRTL ? 'انصراف' : 'Cancel'}
                    </button>
                    <button 
                      onClick={handleAddUnit}
                      disabled={!newUnitTitle.trim()}
                      className="flex-1 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isRTL ? 'افزودن' : 'Add'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Course Info Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-card border rounded-xl p-4">
                <h3 className="font-semibold mb-4">{isRTL ? 'آمار دوره' : 'Course Stats'}</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{isRTL ? 'فصل‌ها' : 'Chapters'}</span>
                    <span className="font-medium">{units.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{isRTL ? 'درس‌ها' : 'Lessons'}</span>
                    <span className="font-medium">{units.reduce((sum, u) => sum + u.lessons.length, 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{isRTL ? 'دانش‌آموزان' : 'Students'}</span>
                    <span className="font-medium">{courseInfo.students}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{isRTL ? 'وضعیت' : 'Status'}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${courseInfo.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {courseInfo.status === 'published' ? (isRTL ? 'منتشر شده' : 'Published') : (isRTL ? 'پیش‌نویس' : 'Draft')}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Tools */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold">{isRTL ? 'ابزارهای AI' : 'AI Tools'}</h3>
                </div>
                <div className="space-y-2">
                  <Link
                    href={`/${locale}/teacher/content`}
                    className="block p-3 rounded-lg bg-background border hover:border-primary/50"
                  >
                    <div className="font-medium text-sm">{isRTL ? 'تولید درس' : 'Generate Lesson'}</div>
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? 'محتوای درس با AI' : 'AI-powered content'}
                    </p>
                  </Link>
                  <Link
                    href={`/${locale}/teacher/content?tab=quiz`}
                    className="block p-3 rounded-lg bg-background border hover:border-primary/50"
                  >
                    <div className="font-medium text-sm">{isRTL ? 'تولید آزمون' : 'Generate Quiz'}</div>
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? 'سوالات چهارگزینه‌ای' : 'Multiple choice questions'}
                    </p>
                  </Link>
                </div>
              </div>

              {/* Help */}
              <div className="bg-card border rounded-xl p-4">
                <h3 className="font-semibold mb-3">{isRTL ? 'راهنما' : 'Help'}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• {isRTL ? 'فصل‌ها را با کشیدن مرتب کنید' : 'Drag to reorder chapters'}</li>
                  <li>• {isRTL ? 'روی درس کلیک کنید تا ویرایش شود' : 'Click lesson to edit'}</li>
                  <li>• {isRTL ? 'از AI برای تولید سریع استفاده کنید' : 'Use AI for quick generation'}</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-card border rounded-xl p-6 space-y-4">
              <h3 className="font-semibold">{isRTL ? 'اطلاعات پایه' : 'Basic Information'}</h3>
              
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  {isRTL ? 'عنوان دوره' : 'Course Title'}
                </label>
                <input
                  type="text"
                  value={courseSettings.title}
                  onChange={(e) => setCourseSettings({...courseSettings, title: e.target.value})}
                  className="w-full p-3 rounded-lg border bg-background"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  {isRTL ? 'توضیحات' : 'Description'}
                </label>
                <textarea
                  value={courseSettings.description}
                  onChange={(e) => setCourseSettings({...courseSettings, description: e.target.value})}
                  rows={4}
                  className="w-full p-3 rounded-lg border bg-background resize-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {isRTL ? 'پایه تحصیلی' : 'Grade Level'}
                  </label>
                  <select 
                    value={courseSettings.grade}
                    onChange={(e) => setCourseSettings({...courseSettings, grade: e.target.value})}
                    className="w-full p-3 rounded-lg border bg-background"
                  >
                    <option>{isRTL ? 'هفتم' : '7th'}</option>
                    <option>{isRTL ? 'هشتم' : '8th'}</option>
                    <option>{isRTL ? 'نهم' : '9th'}</option>
                    <option>{isRTL ? 'دهم' : '10th'}</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {isRTL ? 'موضوع' : 'Subject'}
                  </label>
                  <select 
                    value={courseSettings.subject}
                    onChange={(e) => setCourseSettings({...courseSettings, subject: e.target.value})}
                    className="w-full p-3 rounded-lg border bg-background"
                  >
                    <option>{isRTL ? 'ریاضی' : 'Mathematics'}</option>
                    <option>{isRTL ? 'علوم' : 'Science'}</option>
                    <option>{isRTL ? 'زبان انگلیسی' : 'English'}</option>
                    <option>{isRTL ? 'ادبیات فارسی' : 'Persian Literature'}</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleSaveCourseSettings}
                className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isRTL ? 'ذخیره تغییرات' : 'Save Changes'}
              </button>
            </div>

            <div className="bg-card border rounded-xl p-6 space-y-4">
              <h3 className="font-semibold">{isRTL ? 'تنظیمات انتشار' : 'Publishing Settings'}</h3>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">{isRTL ? 'وضعیت دوره' : 'Course Status'}</p>
                  <p className="text-sm text-muted-foreground">
                    {isCourseVisible
                      ? (isRTL ? 'دوره برای دانش‌آموزان قابل مشاهده است' : 'Course is visible to students')
                      : (isRTL ? 'دوره در حال حاضر فقط برای معلمان قابل مشاهده است' : 'Course is currently visible only to teachers')}
                  </p>
                </div>
                <button onClick={toggleCourseVisibility} className={`px-4 py-2 rounded-lg text-white ${isCourseVisible ? 'bg-green-600' : 'bg-slate-600'}`}>
                  {isCourseVisible ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-destructive">{isRTL ? 'منطقه خطرناک' : 'Danger Zone'}</h3>
              <button 
                onClick={handleDeleteCourse}
                className="px-4 py-2 rounded-lg border border-destructive text-destructive hover:bg-destructive hover:text-white transition-colors"
              >
                {isRTL ? 'حذف دوره' : 'Delete Course'}
              </button>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-card border rounded-xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">{isRTL ? 'دانش‌آموزان ثبت‌نام شده' : 'Enrolled Students'}</h3>
              <span className="text-muted-foreground">{studentSnapshots.length} {isRTL ? 'نفر' : 'students'}</span>
            </div>
            {studentSnapshots.length > 0 ? (
              <div className="divide-y">
                {studentSnapshots.map((student) => (
                  <div key={student.id} className="flex items-center gap-4 p-4 hover:bg-muted/50">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-medium text-primary">
                      {student.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? 'آخرین فعالیت:' : 'Last active:'} {student.lastActive}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-muted">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${student.progress}%` }} />
                      </div>
                      <span className="text-sm font-medium w-10">{student.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                {isRTL ? 'هنوز دانش‌آموز واقعی برای این نما ثبت نشده است.' : 'No real students are available for this view yet.'}
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>

      <Dialog open={Boolean(renameUnitState)} onOpenChange={(open) => !open && setRenameUnitState(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'تغییر عنوان فصل' : 'Rename chapter'}</DialogTitle>
            <DialogDescription>
              {isRTL ? 'عنوان جدید فصل را وارد کنید.' : 'Enter the new chapter title.'}
            </DialogDescription>
          </DialogHeader>
          <input
            type="text"
            value={renameUnitState?.title ?? ''}
            onChange={(e) => setRenameUnitState((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
            className="w-full rounded-lg border bg-background p-3"
            placeholder={isRTL ? 'عنوان فصل...' : 'Chapter title...'}
          />
          <DialogFooter>
            <button type="button" onClick={() => setRenameUnitState(null)} className="rounded-lg border px-4 py-2 hover:bg-muted">
              {isRTL ? 'انصراف' : 'Cancel'}
            </button>
            <button type="button" onClick={handleConfirmRenameUnit} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90" disabled={!renameUnitState?.title.trim()}>
              {isRTL ? 'ذخیره' : 'Save'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.type === 'delete-course'
                ? (isRTL ? 'حذف دوره' : 'Delete course')
                : pendingAction?.type === 'delete-unit'
                  ? (isRTL ? 'حذف فصل' : 'Delete chapter')
                  : (isRTL ? 'حذف درس' : 'Delete lesson')}
            </DialogTitle>
            <DialogDescription>
              {pendingAction?.type === 'delete-course'
                ? (isRTL ? 'آیا از حذف این دوره اطمینان دارید؟ این عمل قابل بازگشت نیست.' : 'Are you sure you want to delete this course? This action cannot be undone.')
                : pendingAction?.type === 'delete-unit'
                  ? (isRTL ? `آیا از حذف فصل «${pendingAction.title}» اطمینان دارید؟` : `Are you sure you want to delete "${pendingAction.title}"?`)
                  : (isRTL ? `آیا از حذف درس «${pendingAction?.type === 'delete-lesson' ? pendingAction.title : ''}» اطمینان دارید؟` : `Are you sure you want to delete "${pendingAction?.type === 'delete-lesson' ? pendingAction.title : ''}"?`)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" onClick={() => setPendingAction(null)} className="rounded-lg border px-4 py-2 hover:bg-muted">
              {isRTL ? 'انصراف' : 'Cancel'}
            </button>
            <button type="button" onClick={handleConfirmAction} className="rounded-lg bg-destructive px-4 py-2 text-destructive-foreground hover:bg-destructive/90">
              {isRTL ? 'تأیید حذف' : 'Confirm delete'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
