'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Trash2 } from 'lucide-react';

interface AdminSubjectsPageProps {
  params: { locale: string };
}

interface Subject {
  id: string;
  code: string;
  name: string;
  teachers: string[];
  students: string[];
}

export default function AdminSubjectsPage({ params: { locale } }: AdminSubjectsPageProps) {
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState({ code: '', name: '' });

  const loadSubjects = async () => {
    const response = await fetch('/api/v1/admin/subjects');
    const data = await response.json();
    setSubjects(data.subjects || []);
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleCreate = async () => {
    await fetch('/api/v1/admin/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `subject-${Date.now()}`,
        code: form.code,
        name: form.name,
        teachers: [],
        students: [],
      }),
    });

    setForm({ code: '', name: '' });
    loadSubjects();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/v1/admin/subjects?id=${id}`, { method: 'DELETE' });
    loadSubjects();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href={`/${locale}/admin`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <Arrow className="h-5 w-5" />
            <span>{isRTL ? 'بازگشت به پنل' : 'Back to panel'}</span>
          </Link>
          <h1 className="font-semibold">{isRTL ? 'مدیریت موضوعات' : 'Subject Management'}</h1>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">{isRTL ? 'افزودن موضوع' : 'Add subject'}</h2>
          <div className="space-y-4">
            <input value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} placeholder={isRTL ? 'کد موضوع' : 'Subject code'} className="w-full rounded-lg border bg-background p-3" />
            <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder={isRTL ? 'نام موضوع' : 'Subject name'} className="w-full rounded-lg border bg-background p-3" />
            <button onClick={handleCreate} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-primary-foreground hover:bg-primary/90">
              <BookOpen className="h-4 w-4" />
              {isRTL ? 'ایجاد موضوع' : 'Create Subject'}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">{isRTL ? 'موضوعات موجود' : 'Available subjects'}</h2>
          <div className="space-y-3">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div>
                  <p className="font-medium">{subject.name}</p>
                  <p className="text-sm text-muted-foreground">{subject.code}</p>
                  <p className="text-xs text-muted-foreground">{subject.teachers.length} {isRTL ? 'معلم' : 'teachers'} • {subject.students.length} {isRTL ? 'دانش‌آموز' : 'students'}</p>
                </div>
                <button onClick={() => handleDelete(subject.id)} className="rounded-lg border px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
