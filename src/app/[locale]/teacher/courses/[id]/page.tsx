'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
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

export default function CourseEditor({ params }: { params: { locale: string; id: string } }) {
  const { locale, id } = params;
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;
  const NavArrow = isRTL ? ChevronLeft : ChevronRight;

  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'students'>('content');
  const [showAddLesson, setShowAddLesson] = useState<string | null>(null);
  const [showAddUnit, setShowAddUnit] = useState(false);

  const courseInfo = {
    id,
    title: isRTL ? 'ریاضی پایه هشتم' : 'Grade 8 Mathematics',
    description: isRTL ? 'آموزش کامل ریاضی پایه هشتم مطابق با کتاب درسی' : 'Complete Grade 8 Math curriculum',
    grade: isRTL ? 'هشتم' : '8th',
    subject: isRTL ? 'ریاضی' : 'Math',
    students: 45,
    status: 'published' as const,
  };

  const [units, setUnits] = useState<Unit[]>([
    {
      id: 'u1',
      title: isRTL ? 'فصل ۱: اعداد صحیح' : 'Chapter 1: Integers',
      isExpanded: true,
      lessons: [
        { id: 'l1', title: isRTL ? 'معرفی اعداد صحیح' : 'Introduction to Integers', type: 'video', duration: '12:30', status: 'published', order: 1, xp: 50 },
        { id: 'l2', title: isRTL ? 'جمع و تفریق اعداد صحیح' : 'Adding & Subtracting Integers', type: 'text', duration: '15:00', status: 'published', order: 2, xp: 75 },
        { id: 'l3', title: isRTL ? 'آزمون فصل ۱' : 'Chapter 1 Quiz', type: 'quiz', duration: '10:00', status: 'published', order: 3, xp: 100 },
      ],
    },
    {
      id: 'u2',
      title: isRTL ? 'فصل ۲: کسرها' : 'Chapter 2: Fractions',
      isExpanded: false,
      lessons: [
        { id: 'l4', title: isRTL ? 'مفهوم کسر' : 'Understanding Fractions', type: 'video', duration: '15:00', status: 'published', order: 1, xp: 50 },
        { id: 'l5', title: isRTL ? 'ساده کردن کسرها' : 'Simplifying Fractions', type: 'text', duration: '12:00', status: 'draft', order: 2, xp: 60 },
      ],
    },
    {
      id: 'u3',
      title: isRTL ? 'فصل ۳: معادلات' : 'Chapter 3: Equations',
      isExpanded: false,
      lessons: [
        { id: 'l6', title: isRTL ? 'معادلات درجه اول' : 'Linear Equations', type: 'video', duration: '20:00', status: 'draft', order: 1, xp: 75 },
      ],
    },
  ]);

  const toggleUnit = (unitId: string) => {
    setUnits(units.map(u => 
      u.id === unitId ? { ...u, isExpanded: !u.isExpanded } : u
    ));
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
              <h1 className="font-semibold">{courseInfo.title}</h1>
              <p className="text-xs text-muted-foreground">
                {isRTL ? `پایه ${courseInfo.grade} - ${courseInfo.subject}` : `Grade ${courseInfo.grade} - ${courseInfo.subject}`}
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
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'بروزرسانی' : 'Update'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
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
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        className="p-2 rounded-lg hover:bg-background text-destructive"
                        onClick={(e) => { e.stopPropagation(); }}
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
                            <button className="p-2 rounded-lg hover:bg-destructive/10 text-destructive">
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
                            placeholder={isRTL ? 'عنوان درس...' : 'Lesson title...'}
                            className="w-full p-2 rounded-lg border bg-background"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <button className="flex flex-col items-center gap-1 p-3 rounded-lg border hover:border-primary/50 bg-background">
                              <Video className="h-5 w-5 text-blue-600" />
                              <span className="text-xs">{isRTL ? 'ویدیو' : 'Video'}</span>
                            </button>
                            <button className="flex flex-col items-center gap-1 p-3 rounded-lg border hover:border-primary/50 bg-background">
                              <FileText className="h-5 w-5 text-green-600" />
                              <span className="text-xs">{isRTL ? 'متن' : 'Text'}</span>
                            </button>
                            <button className="flex flex-col items-center gap-1 p-3 rounded-lg border hover:border-primary/50 bg-background">
                              <HelpCircle className="h-5 w-5 text-purple-600" />
                              <span className="text-xs">{isRTL ? 'آزمون' : 'Quiz'}</span>
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setShowAddLesson(null)}
                              className="flex-1 p-2 rounded-lg border hover:bg-background"
                            >
                              {isRTL ? 'انصراف' : 'Cancel'}
                            </button>
                            <Link
                              href={`/${locale}/teacher/content`}
                              className="flex-1 p-2 rounded-lg bg-primary text-primary-foreground text-center hover:bg-primary/90"
                            >
                              {isRTL ? 'ایجاد با AI' : 'Create with AI'}
                            </Link>
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
                    placeholder={isRTL ? 'عنوان فصل...' : 'Chapter title...'}
                    className="w-full p-3 rounded-lg border bg-background"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowAddUnit(false)}
                      className="flex-1 p-2 rounded-lg border hover:bg-muted"
                    >
                      {isRTL ? 'انصراف' : 'Cancel'}
                    </button>
                    <button className="flex-1 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
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
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                      {isRTL ? 'منتشر شده' : 'Published'}
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
                  defaultValue={courseInfo.title}
                  className="w-full p-3 rounded-lg border bg-background"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  {isRTL ? 'توضیحات' : 'Description'}
                </label>
                <textarea
                  defaultValue={courseInfo.description}
                  rows={4}
                  className="w-full p-3 rounded-lg border bg-background resize-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {isRTL ? 'پایه تحصیلی' : 'Grade Level'}
                  </label>
                  <select className="w-full p-3 rounded-lg border bg-background">
                    <option>{isRTL ? 'هفتم' : '7th'}</option>
                    <option selected>{isRTL ? 'هشتم' : '8th'}</option>
                    <option>{isRTL ? 'نهم' : '9th'}</option>
                    <option>{isRTL ? 'دهم' : '10th'}</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {isRTL ? 'موضوع' : 'Subject'}
                  </label>
                  <select className="w-full p-3 rounded-lg border bg-background">
                    <option selected>{isRTL ? 'ریاضی' : 'Mathematics'}</option>
                    <option>{isRTL ? 'علوم' : 'Science'}</option>
                    <option>{isRTL ? 'زبان انگلیسی' : 'English'}</option>
                    <option>{isRTL ? 'ادبیات فارسی' : 'Persian Literature'}</option>
                  </select>
                </div>
              </div>

              <button className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                {isRTL ? 'ذخیره تغییرات' : 'Save Changes'}
              </button>
            </div>

            <div className="bg-card border rounded-xl p-6 space-y-4">
              <h3 className="font-semibold">{isRTL ? 'تنظیمات انتشار' : 'Publishing Settings'}</h3>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">{isRTL ? 'وضعیت دوره' : 'Course Status'}</p>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'دوره برای دانش‌آموزان قابل مشاهده است' : 'Course is visible to students'}
                  </p>
                </div>
                <button className="px-4 py-2 rounded-lg bg-green-600 text-white">
                  <Unlock className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-destructive">{isRTL ? 'منطقه خطرناک' : 'Danger Zone'}</h3>
              <button className="px-4 py-2 rounded-lg border border-destructive text-destructive hover:bg-destructive hover:text-white transition-colors">
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
              <span className="text-muted-foreground">{courseInfo.students} {isRTL ? 'نفر' : 'students'}</span>
            </div>
            <div className="divide-y">
              {[
                { name: isRTL ? 'علی احمدی' : 'Ali Ahmadi', progress: 85, lastActive: isRTL ? 'امروز' : 'Today' },
                { name: isRTL ? 'سارا محمدی' : 'Sara Mohammadi', progress: 72, lastActive: isRTL ? 'دیروز' : 'Yesterday' },
                { name: isRTL ? 'محمد رضایی' : 'Mohammad Rezaei', progress: 65, lastActive: isRTL ? '۲ روز پیش' : '2 days ago' },
                { name: isRTL ? 'مریم کریمی' : 'Maryam Karimi', progress: 90, lastActive: isRTL ? 'امروز' : 'Today' },
              ].map((student, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 hover:bg-muted/50">
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
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${student.progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-10">{student.progress}%</span>
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
