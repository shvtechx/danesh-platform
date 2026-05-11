'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  BookOpen, ArrowLeft, ArrowRight, Save, X, Image as ImageIcon,
  AlertCircle, Check, Loader2, Globe, Calendar, Users,
  FileText, Video, HelpCircle, Plus, Trash2
} from 'lucide-react';

type FeedbackState = {
  variant: 'success' | 'error' | 'info';
  message: string;
} | null;

interface Subject {
  id: string;
  code: string;
  name: string;
  nameFA: string;
  icon: string;
  color: string;
}

interface Framework {
  id: string;
  code: string;
  name: string;
  nameFA: string;
}

interface GradeLevel {
  id: string;
  name: string;
  nameFA: string;
  order: number;
}

export default function NewCoursePage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const router = useRouter();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    titleFA: '',
    description: '',
    descriptionFA: '',
    code: '',
    subjectId: '',
    frameworkId: '',
    gradeLevelId: '',
    coverImage: '',
    estimatedHours: '',
    maxStudents: '',
    isPublished: false,
  });

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      // Load subjects
      const subjectsRes = await fetch('/api/v1/subjects');
      if (subjectsRes.ok) {
        const data = await subjectsRes.json();
        setSubjects(data.subjects || []);
      }

      // Mock frameworks (replace with API call when available)
      setFrameworks([
        { id: 'IRANIAN_NATIONAL', code: 'IRANIAN_NATIONAL', name: 'Iranian National Curriculum', nameFA: 'برنامه ملی ایران' },
        { id: 'IB', code: 'IB', name: 'International Baccalaureate', nameFA: 'بکالوریای بین‌المللی' },
        { id: 'US_COMMON_CORE', code: 'US_COMMON_CORE', name: 'US Common Core', nameFA: 'هسته مشترک آمریکا' },
      ]);

      // Mock grade levels (replace with API call when available)
      setGradeLevels([
        { id: 'G1', name: 'Grade 1', nameFA: 'پایه اول', order: 1 },
        { id: 'G2', name: 'Grade 2', nameFA: 'پایه دوم', order: 2 },
        { id: 'G3', name: 'Grade 3', nameFA: 'پایه سوم', order: 3 },
        { id: 'G4', name: 'Grade 4', nameFA: 'پایه چهارم', order: 4 },
        { id: 'G5', name: 'Grade 5', nameFA: 'پایه پنجم', order: 5 },
        { id: 'G6', name: 'Grade 6', nameFA: 'پایه ششم', order: 6 },
        { id: 'G7', name: 'Grade 7', nameFA: 'پایه هفتم', order: 7 },
        { id: 'G8', name: 'Grade 8', nameFA: 'پایه هشتم', order: 8 },
        { id: 'G9', name: 'Grade 9', nameFA: 'پایه نهم', order: 9 },
        { id: 'G10', name: 'Grade 10', nameFA: 'پایه دهم', order: 10 },
        { id: 'G11', name: 'Grade 11', nameFA: 'پایه یازدهم', order: 11 },
        { id: 'G12', name: 'Grade 12', nameFA: 'پایه دوازدهم', order: 12 },
      ]);
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (feedback) {
      setFeedback(null);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = isRTL ? 'عنوان دوره الزامی است' : 'Course title is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = isRTL ? 'کد دوره الزامی است' : 'Course code is required';
    }

    if (!formData.subjectId) {
      newErrors.subjectId = isRTL ? 'موضوع را انتخاب کنید' : 'Please select a subject';
    }

    if (!formData.frameworkId) {
      newErrors.frameworkId = isRTL ? 'چارچوب آموزشی را انتخاب کنید' : 'Please select a framework';
    }

    if (!formData.gradeLevelId) {
      newErrors.gradeLevelId = isRTL ? 'پایه تحصیلی را انتخاب کنید' : 'Please select a grade level';
    }

    if (!formData.description.trim()) {
      newErrors.description = isRTL ? 'توضیحات دوره الزامی است' : 'Course description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'لطفاً خطاهای فرم را برطرف کنید.' : 'Please resolve the highlighted form errors.',
      });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/v1/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
          maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/${locale}/teacher/courses/${data.course.id}`);
      } else {
        const error = await response.json();
        setFeedback({
          variant: 'error',
          message: error.error || (isRTL ? 'خطا در ایجاد دوره' : 'Error creating course'),
        });
      }
    } catch (error) {
      console.error('Error creating course:', error);
      setFeedback({
        variant: 'error',
        message: isRTL ? 'خطا در ایجاد دوره' : 'Error creating course',
      });
    } finally {
      setLoading(false);
    }
  };

  const hasUnsavedChanges = Object.values(formData).some((value) => {
    if (typeof value === 'boolean') {
      return value;
    }

    return value.trim().length > 0;
  });

  const handleCancel = () => {
    if (!hasUnsavedChanges) {
      router.push(`/${locale}/teacher/courses`);
      return;
    }

    setShowCancelDialog(true);
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
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">{isRTL ? 'ایجاد دوره جدید' : 'Create New Course'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 rounded-lg border hover:bg-muted disabled:opacity-50"
            >
              {isRTL ? 'لغو' : 'Cancel'}
            </button>
            <button
              type="submit"
              form="course-form"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{loading ? (isRTL ? 'در حال ذخیره...' : 'Creating...') : (isRTL ? 'ایجاد دوره' : 'Create Course')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {feedback ? <FeedbackBanner variant={feedback.variant} message={feedback.message} /> : null}

        <form id="course-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {isRTL ? 'اطلاعات پایه' : 'Basic Information'}
            </h2>
            
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {isRTL ? 'عنوان دوره (انگلیسی)' : 'Course Title (English)'}
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder={isRTL ? 'مثال: Grade 8 Mathematics' : 'e.g., Grade 8 Mathematics'}
                    className={`w-full px-3 py-2 rounded-lg border bg-background ${errors.title ? 'border-destructive' : ''}`}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.title}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {isRTL ? 'عنوان دوره (فارسی)' : 'Course Title (Persian)'}
                  </label>
                  <input
                    type="text"
                    name="titleFA"
                    value={formData.titleFA}
                    onChange={handleChange}
                    placeholder={isRTL ? 'مثال: ریاضی پایه هشتم' : 'e.g., ریاضی پایه هشتم'}
                    className="w-full px-3 py-2 rounded-lg border bg-background"
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {isRTL ? 'کد دوره' : 'Course Code'}
                  <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder={isRTL ? 'مثال: MATH-8-2024' : 'e.g., MATH-8-2024'}
                  className={`w-full px-3 py-2 rounded-lg border bg-background ${errors.code ? 'border-destructive' : ''}`}
                />
                {errors.code && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.code}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {isRTL ? 'موضوع' : 'Subject'}
                    <span className="text-destructive">*</span>
                  </label>
                  <select
                    name="subjectId"
                    value={formData.subjectId}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 rounded-lg border bg-background ${errors.subjectId ? 'border-destructive' : ''}`}
                  >
                    <option value="">{isRTL ? 'انتخاب کنید...' : 'Select...'}</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.icon} {isRTL && subject.nameFA ? subject.nameFA : subject.name}
                      </option>
                    ))}
                  </select>
                  {errors.subjectId && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.subjectId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {isRTL ? 'چارچوب آموزشی' : 'Framework'}
                    <span className="text-destructive">*</span>
                  </label>
                  <select
                    name="frameworkId"
                    value={formData.frameworkId}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 rounded-lg border bg-background ${errors.frameworkId ? 'border-destructive' : ''}`}
                  >
                    <option value="">{isRTL ? 'انتخاب کنید...' : 'Select...'}</option>
                    {frameworks.map(framework => (
                      <option key={framework.id} value={framework.id}>
                        {isRTL && framework.nameFA ? framework.nameFA : framework.name}
                      </option>
                    ))}
                  </select>
                  {errors.frameworkId && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.frameworkId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {isRTL ? 'پایه تحصیلی' : 'Grade Level'}
                    <span className="text-destructive">*</span>
                  </label>
                  <select
                    name="gradeLevelId"
                    value={formData.gradeLevelId}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 rounded-lg border bg-background ${errors.gradeLevelId ? 'border-destructive' : ''}`}
                  >
                    <option value="">{isRTL ? 'انتخاب کنید...' : 'Select...'}</option>
                    {gradeLevels.map(grade => (
                      <option key={grade.id} value={grade.id}>
                        {isRTL && grade.nameFA ? grade.nameFA : grade.name}
                      </option>
                    ))}
                  </select>
                  {errors.gradeLevelId && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.gradeLevelId}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {isRTL ? 'توضیحات (انگلیسی)' : 'Description (English)'}
                  <span className="text-destructive">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder={isRTL ? 'توضیحات کامل درباره دوره...' : 'Full description of the course...'}
                  className={`w-full px-3 py-2 rounded-lg border bg-background resize-none ${errors.description ? 'border-destructive' : ''}`}
                />
                {errors.description && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {isRTL ? 'توضیحات (فارسی)' : 'Description (Persian)'}
                </label>
                <textarea
                  name="descriptionFA"
                  value={formData.descriptionFA}
                  onChange={handleChange}
                  rows={4}
                  placeholder={isRTL ? 'توضیحات کامل درباره دوره به فارسی...' : 'Full description of the course in Persian...'}
                  className="w-full px-3 py-2 rounded-lg border bg-background resize-none"
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {isRTL ? 'تنظیمات اضافی' : 'Additional Settings'}
            </h2>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {isRTL ? 'ساعات تخمینی' : 'Estimated Hours'}
                  </label>
                  <input
                    type="number"
                    name="estimatedHours"
                    value={formData.estimatedHours}
                    onChange={handleChange}
                    min="1"
                    placeholder="12"
                    className="w-full px-3 py-2 rounded-lg border bg-background"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {isRTL ? 'حداکثر دانش‌آموز' : 'Max Students'}
                  </label>
                  <input
                    type="number"
                    name="maxStudents"
                    value={formData.maxStudents}
                    onChange={handleChange}
                    min="1"
                    placeholder="50"
                    className="w-full px-3 py-2 rounded-lg border bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {isRTL ? 'تصویر کاور (URL)' : 'Cover Image (URL)'}
                </label>
                <input
                  type="url"
                  name="coverImage"
                  value={formData.coverImage}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border bg-background"
                />
              </div>

              <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/30">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleChange}
                  className="h-4 w-4 rounded"
                  id="isPublished"
                />
                <label htmlFor="isPublished" className="text-sm font-medium cursor-pointer">
                  {isRTL ? 'انتشار فوری دوره (دانش‌آموزان می‌توانند دوره را ببینند)' : 'Publish immediately (students can see the course)'}
                </label>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">{isRTL ? 'نکته مهم' : 'Important Note'}</p>
                <p>
                  {isRTL 
                    ? 'پس از ایجاد دوره، می‌توانید درس‌ها، فعالیت‌ها و منابع آموزشی را به آن اضافه کنید. دوره‌های پیش‌نویس فقط برای معلمان قابل مشاهده هستند.' 
                    : 'After creating the course, you can add lessons, activities, and learning resources. Draft courses are visible only to teachers.'}
                </p>
              </div>
            </div>
          </div>
        </form>

        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isRTL ? 'لغو ایجاد دوره؟' : 'Discard course draft?'}
              </DialogTitle>
              <DialogDescription>
                {isRTL
                  ? 'تغییرات ذخیره‌نشده از بین می‌روند. اگر هنوز آماده نیستید، به ویرایش ادامه دهید.'
                  : 'Your unsaved changes will be lost. Continue editing if you are not ready to leave yet.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setShowCancelDialog(false)}
                className="rounded-lg border px-4 py-2 hover:bg-muted"
              >
                {isRTL ? 'ادامه ویرایش' : 'Keep editing'}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/${locale}/teacher/courses`)}
                className="rounded-lg bg-destructive px-4 py-2 text-destructive-foreground hover:bg-destructive/90"
              >
                {isRTL ? 'خروج بدون ذخیره' : 'Leave without saving'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </div>
  );
}
