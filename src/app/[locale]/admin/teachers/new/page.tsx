'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, ArrowRight, Save, User, Mail, Phone, 
  BookOpen, Building, FileText, Camera, X, Check
} from 'lucide-react';

export default function NewTeacherPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const router = useRouter();
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    subjects: [] as string[],
    bio: '',
    status: 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departments = [
    { id: 'math', name: isRTL ? 'گروه ریاضی' : 'Mathematics' },
    { id: 'science', name: isRTL ? 'گروه علوم' : 'Science' },
    { id: 'language', name: isRTL ? 'گروه زبان' : 'Languages' },
    { id: 'humanities', name: isRTL ? 'گروه علوم انسانی' : 'Humanities' },
    { id: 'arts', name: isRTL ? 'گروه هنر' : 'Arts' },
  ];

  const subjects = [
    { id: 'math', name: isRTL ? 'ریاضی' : 'Mathematics' },
    { id: 'physics', name: isRTL ? 'فیزیک' : 'Physics' },
    { id: 'chemistry', name: isRTL ? 'شیمی' : 'Chemistry' },
    { id: 'biology', name: isRTL ? 'زیست‌شناسی' : 'Biology' },
    { id: 'english', name: isRTL ? 'زبان انگلیسی' : 'English' },
    { id: 'persian', name: isRTL ? 'ادبیات فارسی' : 'Persian Literature' },
    { id: 'arabic', name: isRTL ? 'عربی' : 'Arabic' },
    { id: 'history', name: isRTL ? 'تاریخ' : 'History' },
    { id: 'geography', name: isRTL ? 'جغرافیا' : 'Geography' },
    { id: 'geometry', name: isRTL ? 'هندسه' : 'Geometry' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toggleSubject = (subjectId: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter(s => s !== subjectId)
        : [...prev.subjects, subjectId]
    }));
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
    if (!formData.department) {
      newErrors.department = isRTL ? 'گروه آموزشی را انتخاب کنید' : 'Please select a department';
    }
    if (formData.subjects.length === 0) {
      newErrors.subjects = isRTL ? 'حداقل یک درس انتخاب کنید' : 'Select at least one subject';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Redirect to teachers list
    router.push(`/${locale}/admin/teachers`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/${locale}/admin/teachers`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Arrow className="h-5 w-5" />
              <span>{isRTL ? 'بازگشت' : 'Back'}</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-semibold">{isRTL ? 'افزودن معلم جدید' : 'Add New Teacher'}</h1>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-12 w-12 text-primary" />
              </div>
              <button
                type="button"
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
                {isRTL ? 'گروه آموزشی' : 'Department'} *
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

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                {isRTL ? 'دروس تدریس' : 'Teaching Subjects'} *
              </label>
              <div className="flex flex-wrap gap-2">
                {subjects.map(subject => (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => toggleSubject(subject.id)}
                    className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                      formData.subjects.includes(subject.id)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted'
                    }`}
                  >
                    {formData.subjects.includes(subject.id) && (
                      <Check className="h-3 w-3 inline me-1" />
                    )}
                    {subject.name}
                  </button>
                ))}
              </div>
              {errors.subjects && (
                <p className="text-xs text-destructive mt-2">{errors.subjects}</p>
              )}
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
