'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, ArrowRight, Save, User, Mail, Phone, 
  BookOpen, Building, FileText, Camera, Trash2, AlertTriangle, Check
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import { getDepartmentForSubject, TEACHER_DEPARTMENTS, TEACHER_SUBJECTS } from '@/lib/admin/teacher-metadata';

interface SubjectOption {
  id: string;
  name: string;
  department: string | null;
}

export default function EditTeacherPage({ 
  params: { locale, id } 
}: { 
  params: { locale: string; id: string } 
}) {
  const t = useTranslations();
  const router = useRouter();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    bio: '',
    status: 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const departments = TEACHER_DEPARTMENTS.map((department) => ({
    id: department.id,
    name: isRTL ? department.labels.fa : department.labels.en,
  }));

  const subjects = subjectOptions.filter((subject) => !formData.department || subject.department === formData.department);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const response = await fetch('/api/v1/admin/subjects', {
          cache: 'no-store',
          headers: createUserHeaders(getStoredUserId()),
        });

        if (!response.ok) {
          throw new Error('failed_to_load_subjects');
        }

        const data = await response.json();
        const subjectsFromApi = (data.subjects || []).map((subject: any) => ({
          id: String(subject.code || subject.id || ''),
          name: isRTL ? (subject.nameFA || subject.name || subject.code) : (subject.name || subject.nameFA || subject.code),
          department: getDepartmentForSubject(subject.code),
        } satisfies SubjectOption));

        setSubjectOptions(subjectsFromApi.length > 0 ? subjectsFromApi : TEACHER_SUBJECTS.map((subject) => ({
          id: subject.id,
          name: isRTL ? subject.labels.fa : subject.labels.en,
          department: subject.department,
        })));
      } catch {
        setSubjectOptions(TEACHER_SUBJECTS.map((subject) => ({
          id: subject.id,
          name: isRTL ? subject.labels.fa : subject.labels.en,
          department: subject.department,
        })));
      }
    };

    void loadSubjects();
  }, [isRTL]);

  // Load teacher data
  useEffect(() => {
    const loadTeacher = async () => {
      setIsLoading(true);
      setSubmissionError(null);

      try {
        const response = await fetch(`/api/v1/admin/teachers/${id}?locale=${locale}`, { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'failed_to_load_teacher');
        }

        setFormData({
          firstName: data.teacher.firstName || '',
          lastName: data.teacher.lastName || '',
          email: data.teacher.email || '',
          phone: data.teacher.phone || '',
          department: data.teacher.department || '',
          bio: data.teacher.bio || '',
          status: data.teacher.status || 'active',
        });
      } catch (error) {
        setSubmissionError(
          error instanceof Error
            ? error.message
            : (isRTL ? 'اطلاعات معلم بارگیری نشد.' : 'Unable to load teacher details.'),
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTeacher();
  }, [id, isRTL, locale]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = isRTL ? 'نام الزامی است' : 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = isRTL ? 'نام خانوادگی الزامی است' : 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = isRTL ? 'ایمیل الزامی است' : 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = isRTL ? 'فرمت ایمیل صحیح نیست' : 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const response = await fetch(`/api/v1/admin/teachers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          subjects: [], // auto-derived from assigned courses
          locale,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'failed_to_update_teacher');
      }

      router.push(`/${locale}/admin/teachers/${id}`);
      router.refresh();
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : (isRTL ? 'به‌روزرسانی معلم انجام نشد.' : 'Unable to update the teacher.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setSubmissionError(null);

    try {
      const response = await fetch(`/api/v1/admin/teachers/${id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'failed_to_delete_teacher');
      }

      router.push(`/${locale}/admin/teachers`);
      router.refresh();
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : (isRTL ? 'حذف معلم انجام نشد.' : 'Unable to delete the teacher.'),
      );
      setIsDeleting(false);
    }
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">{isRTL ? 'در حال بارگذاری...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        locale={locale}
        title={isRTL ? 'ویرایش معلم' : 'Edit Teacher'}
        backHref={`/${locale}/admin/teachers/${id}`}
        backLabel={isRTL ? 'بازگشت به جزئیات' : 'Back to details'}
      >
        <button
          onClick={() => setShowDeleteModal(true)}
          className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </PageHeader>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {submissionError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {submissionError}
            </div>
          )}

          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt={isRTL ? 'پیش‌نمایش تصویر معلم' : 'Teacher avatar preview'} className="h-24 w-24 rounded-full object-cover" />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-2xl font-bold">
                  {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
                </div>
              )}
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {isRTL ? 'اطلاعات شخصی' : 'Personal Information'}
            </h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  {isRTL ? 'نام' : 'First Name'} *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-lg border bg-background ${errors.firstName ? 'border-destructive' : ''}`}
                />
                {errors.firstName && (
                  <p className="text-xs text-destructive mt-1">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  {isRTL ? 'نام خانوادگی' : 'Last Name'} *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-lg border bg-background ${errors.lastName ? 'border-destructive' : ''}`}
                />
                {errors.lastName && (
                  <p className="text-xs text-destructive mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  {isRTL ? 'ایمیل' : 'Email'} *
                </label>
                <div className="relative">
                  <Mail className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full ps-10 pe-4 py-3 rounded-lg border bg-background ${errors.email ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  {isRTL ? 'شماره تماس' : 'Phone'}
                </label>
                <div className="relative">
                  <Phone className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full ps-10 pe-4 py-3 rounded-lg border bg-background"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Department */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              {isRTL ? 'گروه آموزشی' : 'Department'}
            </h2>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                {isRTL ? 'گروه آموزشی' : 'Department'} ({isRTL ? 'اختیاری' : 'optional'})
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full p-3 rounded-lg border bg-background"
              >
                <option value="">{isRTL ? 'انتخاب کنید...' : 'Select...'}</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
              📚 {isRTL
                ? 'دروس تدریس به صورت خودکار از دوره‌های تخصیص‌یافته محاسبه می‌شوند. برای تخصیص دوره به معلم، از صفحه جزئیات استفاده کنید.'
                : 'Teaching subjects are automatically determined by the courses assigned to this teacher. Use the teacher detail page to assign courses.'}
            </div>
          </div>

          {/* Bio & Status */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {isRTL ? 'درباره معلم' : 'About Teacher'}
            </h2>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                {isRTL ? 'بیوگرافی' : 'Biography'}
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full p-3 rounded-lg border bg-background resize-none"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                {isRTL ? 'وضعیت' : 'Status'}
              </label>
              <div className="flex gap-4 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={formData.status === 'active'}
                    onChange={handleChange}
                    className="text-primary"
                  />
                  <span className="text-sm">{isRTL ? 'فعال' : 'Active'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="pending"
                    checked={formData.status === 'pending'}
                    onChange={handleChange}
                    className="text-primary"
                  />
                  <span className="text-sm">{isRTL ? 'در انتظار تأیید' : 'Pending'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="inactive"
                    checked={formData.status === 'inactive'}
                    onChange={handleChange}
                    className="text-primary"
                  />
                  <span className="text-sm">{isRTL ? 'غیرفعال' : 'Inactive'}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Link
              href={`/${locale}/admin/teachers/${id}`}
              className="flex-1 px-4 py-3 rounded-lg border text-center hover:bg-muted"
            >
              {isRTL ? 'انصراف' : 'Cancel'}
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isRTL ? 'ذخیره تغییرات' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-card border rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 text-destructive mb-4">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="font-semibold text-lg">
                {isRTL ? 'حذف معلم' : 'Delete Teacher'}
              </h3>
            </div>
            <p className="text-muted-foreground mb-6">
              {isRTL 
                ? 'آیا از حذف این معلم اطمینان دارید؟ تمام دروس و اطلاعات مربوط به این معلم نیز حذف خواهند شد.'
                : 'Are you sure you want to delete this teacher? All associated courses and data will also be deleted.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border hover:bg-muted"
              >
                {isRTL ? 'انصراف' : 'Cancel'}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {isRTL ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
