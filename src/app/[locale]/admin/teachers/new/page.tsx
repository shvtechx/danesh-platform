'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Copy, Save, User, Mail, Phone, Building, FileText, Camera, Check } from 'lucide-react';
import { 
  ArrowLeft, ArrowRight
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';
import { getDepartmentForSubject, TEACHER_DEPARTMENTS } from '@/lib/admin/teacher-metadata';

interface SubjectOption {
  id: string;
  name: string;
  department: string | null;
}

export default function NewTeacherPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; email: string; password: string } | null>(null);
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);

  const departments = TEACHER_DEPARTMENTS.map((department) => ({
    id: department.id,
    name: isRTL ? department.labels.fa : department.labels.en,
  }));

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

        setSubjectOptions(subjectsFromApi.length > 0 ? subjectsFromApi : []);
      } catch {
        setSubjectOptions([]);
      }
    };

    void loadSubjects();
  }, [isRTL]);

  const subjects = subjectOptions.filter((subject) => !formData.department || subject.department === formData.department);

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
      const response = await fetch('/api/v1/admin/teachers', {
        method: 'POST',
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
        throw new Error(data.error || 'failed_to_create_teacher');
      }

      setCreatedCredentials({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        password: data.temporaryPassword,
      });
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        bio: '',
        status: 'active',
      });
      setAvatarPreview(null);
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : (isRTL ? 'ذخیره معلم انجام نشد.' : 'Unable to save the teacher.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const copyPassword = async () => {
    if (!createdCredentials?.password) return;
    try {
      await navigator.clipboard.writeText(createdCredentials.password);
    } catch {
      setSubmissionError(isRTL ? 'کپی رمز عبور انجام نشد.' : 'Unable to copy the password.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        locale={locale}
        title={isRTL ? 'افزودن معلم جدید' : 'Add New Teacher'}
        backHref={`/${locale}/admin/teachers`}
        backLabel={isRTL ? 'بازگشت به فهرست' : 'Back to teachers'}
      />

      <div className="max-w-3xl mx-auto px-4 py-6">
        {createdCredentials && (
          <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/5 p-5">
            <h2 className="mb-2 text-lg font-semibold text-green-700 dark:text-green-400">
              {isRTL ? 'حساب معلم ایجاد شد' : 'Teacher account created'}
            </h2>
            <p className="mb-3 text-sm text-muted-foreground">
              {isRTL ? 'این رمز عبور موقت را نگه دارید تا کاربر جدید بتواند وارد سامانه شود.' : 'Keep this temporary password so the new user can sign in.'}
            </p>
            <div className="space-y-2 rounded-lg border bg-background p-4 text-sm">
              <p><span className="font-medium">{isRTL ? 'نام:' : 'Name:'}</span> {createdCredentials.name}</p>
              <p><span className="font-medium">{isRTL ? 'ایمیل:' : 'Email:'}</span> {createdCredentials.email}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{isRTL ? 'رمز عبور موقت:' : 'Temporary password:'}</span>
                <span className="rounded bg-muted px-2 py-1 font-mono">{createdCredentials.password}</span>
                <button type="button" onClick={copyPassword} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-muted">
                  <Copy className="h-3 w-3" />
                  <span>{isRTL ? 'کپی' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/${locale}/admin/teachers`} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
                {isRTL ? 'رفتن به فهرست معلمان' : 'Go to teachers list'}
              </Link>
              <button type="button" onClick={() => setCreatedCredentials(null)} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">
                {isRTL ? 'ایجاد معلم دیگر' : 'Create another teacher'}
              </button>
            </div>
          </div>
        )}

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
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-12 w-12 text-primary" />
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
                  placeholder={isRTL ? 'علی' : 'Ali'}
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
                  placeholder={isRTL ? 'احمدی' : 'Ahmadi'}
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
                    placeholder="teacher@danesh.edu"
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
                    placeholder="+98 912 345 6789"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Department & Subjects */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              {isRTL ? 'گروه آموزشی و دروس' : 'Department & Subjects'}
            </h2>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                {isRTL ? 'گروه آموزشی' : 'Department'} ({isRTL ? 'اختیاری' : 'optional'})
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={`w-full p-3 rounded-lg border bg-background ${errors.department ? 'border-destructive' : ''}`}
              >
                <option value="">{isRTL ? 'انتخاب کنید...' : 'Select...'}</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              {errors.department && (
                <p className="text-xs text-destructive mt-1">{errors.department}</p>
              )}
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
              📚 {isRTL
                ? 'دروس تدریس به صورت خودکار از دوره‌های تخصیص‌یافته محاسبه می‌شوند. پس از ایجاد معلم، از صفحه جزئیات او دوره‌ها را تخصیص دهید.'
                : 'Teaching subjects are automatically determined by assigned courses. After creating the teacher, assign courses from their detail page.'}
            </div>
          </div>

          {/* Bio */}
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
                placeholder={isRTL 
                  ? 'توضیح کوتاهی درباره سوابق و تخصص معلم...'
                  : 'Brief description about teacher background and expertise...'}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                {isRTL ? 'وضعیت اولیه' : 'Initial Status'}
              </label>
              <div className="flex gap-4">
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
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Link
              href={`/${locale}/admin/teachers`}
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
              {isRTL ? 'ذخیره معلم' : 'Save Teacher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
