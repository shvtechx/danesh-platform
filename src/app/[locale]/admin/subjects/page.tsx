'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Trash2, Plus } from 'lucide-react';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AdminSubjectsPageProps {
  params: { locale: string };
}

interface Subject {
  id: string;
  code: string;
  name: string;
  nameFA?: string;
  icon?: string;
  color?: string;
  description?: string;
  _count?: {
    courses: number;
    strands: number;
  };
}

export default function AdminSubjectsPage({ params: { locale } }: AdminSubjectsPageProps) {
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [form, setForm] = useState({ 
    code: '', 
    name: '', 
    nameFA: '', 
    icon: '📚', 
    color: '#3B82F6',
    description: '' 
  });

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/admin/subjects');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSubjects(data.subjects || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleCreate = async () => {
    if (!form.code || !form.name) {
      setFeedback({
        variant: 'error',
        message: isRTL ? 'کد و نام موضوع الزامی است' : 'Subject code and name are required',
      });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/v1/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.toUpperCase(),
          name: form.name,
          nameFA: form.nameFA || undefined,
          icon: form.icon || '📚',
          color: form.color || '#3B82F6',
          description: form.description || undefined,
        }),
      });

      if (response.ok) {
        setForm({ code: '', name: '', nameFA: '', icon: '📚', color: '#3B82F6', description: '' });
        setFeedback({
          variant: 'success',
          message: isRTL ? 'موضوع با موفقیت ایجاد شد.' : 'Subject created successfully.',
        });
        await loadSubjects();
      } else {
        const error = await response.json();
        setFeedback({
          variant: 'error',
          message: error.error || (isRTL ? 'خطا در ایجاد موضوع' : 'Error creating subject'),
        });
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      setFeedback({
        variant: 'error',
        message: isRTL ? 'خطا در ایجاد موضوع' : 'Error creating subject',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, subjectName: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/v1/admin/subjects?id=${id}`, { method: 'DELETE' });
      
      if (response.ok) {
        setDeleteTarget(null);
        setFeedback({
          variant: 'success',
          message: isRTL ? `موضوع «${subjectName}» حذف شد.` : `Subject "${subjectName}" was deleted.`,
        });
        await loadSubjects();
      } else {
        const error = await response.json();
        setFeedback({
          variant: 'error',
          message: error.error || (isRTL ? 'خطا در حذف موضوع' : 'Error deleting subject'),
        });
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      setFeedback({
        variant: 'error',
        message: isRTL ? 'خطا در حذف موضوع' : 'Error deleting subject',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href={`/${locale}/admin`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <Arrow className="h-5 w-5" />
            <span>{isRTL ? 'بازگشت به پنل' : 'Back to panel'}</span>
          </Link>
          <h1 className="font-semibold">{isRTL ? 'مدیریت موضوعات درسی' : 'Subject Management'}</h1>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_1.5fr]">
        {/* Create Subject Form */}
        <div className="space-y-4">
          {feedback ? <FeedbackBanner variant={feedback.variant} message={feedback.message} /> : null}
        <section className="rounded-2xl border bg-card p-6 h-fit sticky top-6">
          <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {isRTL ? 'افزودن موضوع جدید' : 'Add New Subject'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                {isRTL ? 'کد موضوع' : 'Subject Code'} *
              </label>
              <input 
                value={form.code} 
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} 
                placeholder={isRTL ? 'مثال: MATH' : 'e.g., MATH'} 
                className="w-full rounded-lg border bg-background p-3 font-mono"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                {isRTL ? 'نام (انگلیسی)' : 'Name (English)'} *
              </label>
              <input 
                value={form.name} 
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} 
                placeholder={isRTL ? 'ریاضیات' : 'Mathematics'} 
                className="w-full rounded-lg border bg-background p-3"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                {isRTL ? 'نام (فارسی)' : 'Name (Persian)'}
              </label>
              <input 
                value={form.nameFA} 
                onChange={(e) => setForm((prev) => ({ ...prev, nameFA: e.target.value }))} 
                placeholder={isRTL ? 'ریاضیات' : 'ریاضیات'} 
                className="w-full rounded-lg border bg-background p-3"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  {isRTL ? 'شمایل' : 'Icon'}
                </label>
                <input 
                  value={form.icon} 
                  onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))} 
                  placeholder="🔢" 
                  className="w-full rounded-lg border bg-background p-3 text-center text-2xl"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  {isRTL ? 'رنگ' : 'Color'}
                </label>
                <input 
                  type="color"
                  value={form.color} 
                  onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))} 
                  className="w-full rounded-lg border bg-background p-1 h-12"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                {isRTL ? 'توضیحات' : 'Description'}
              </label>
              <textarea 
                value={form.description} 
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} 
                placeholder={isRTL ? 'توضیحات موضوع' : 'Subject description'} 
                className="w-full rounded-lg border bg-background p-3 h-24 resize-none"
                disabled={loading}
              />
            </div>

            <button 
              onClick={handleCreate} 
              disabled={loading || !form.code || !form.name}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BookOpen className="h-4 w-4" />
              {loading ? (isRTL ? 'در حال ذخیره...' : 'Creating...') : (isRTL ? 'ایجاد موضوع' : 'Create Subject')}
            </button>
          </div>
        </section>
        </div>

        {/* Subjects List */}
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {isRTL ? 'موضوعات موجود' : 'Available Subjects'} 
            <span className="text-sm text-muted-foreground font-normal ml-2">
              ({subjects.length} {isRTL ? 'موضوع' : 'subjects'})
            </span>
          </h2>
          
          {loading && subjects.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {isRTL ? 'در حال بارگذاری...' : 'Loading...'}
            </p>
          ) : subjects.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {isRTL ? 'هیچ موضوعی یافت نشد' : 'No subjects found'}
            </p>
          ) : (
            <div className="grid gap-3">
              {subjects.map((subject) => (
                <div 
                  key={subject.id} 
                  className="flex items-center justify-between gap-4 rounded-xl border p-4 hover:bg-accent/50 transition-colors"
                  style={{ borderLeftColor: subject.color, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-3xl">{subject.icon || '📚'}</div>
                    <div>
                      <p className="font-medium">
                        {isRTL && subject.nameFA ? subject.nameFA : subject.name}
                      </p>
                      <p className="text-sm text-muted-foreground font-mono">{subject.code}</p>
                      {subject.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {subject.description}
                        </p>
                      )}
                      {subject._count && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {subject._count.courses} {isRTL ? 'دوره' : 'courses'} • 
                          {subject._count.strands} {isRTL ? 'رشته' : 'strands'}
                        </p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => setDeleteTarget({
                      id: subject.id,
                      name: isRTL && subject.nameFA ? subject.nameFA : subject.name,
                    })} 
                    disabled={loading}
                    className="rounded-lg border px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'حذف موضوع' : 'Delete subject'}</DialogTitle>
            <DialogDescription>
              {isRTL
                ? `آیا از حذف موضوع «${deleteTarget?.name ?? ''}» اطمینان دارید؟ این عمل قابل بازگشت نیست.`
                : `Are you sure you want to delete "${deleteTarget?.name ?? ''}"? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg border px-4 py-2 hover:bg-muted"
              disabled={loading}
            >
              {isRTL ? 'انصراف' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => deleteTarget && handleDelete(deleteTarget.id, deleteTarget.name)}
              className="rounded-lg bg-destructive px-4 py-2 text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              disabled={loading || !deleteTarget}
            >
              {loading ? (isRTL ? 'در حال حذف...' : 'Deleting...') : (isRTL ? 'حذف موضوع' : 'Delete subject')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
