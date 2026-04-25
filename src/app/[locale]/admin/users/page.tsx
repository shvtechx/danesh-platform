'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Trash2, UserPlus } from 'lucide-react';

interface AdminUsersPageProps {
  params: { locale: string };
}

interface DemoUser {
  id: string;
  email: string;
  roles: string[];
  profile: {
    displayName: string;
  };
}

const roleOptions = [
  { value: 'STUDENT', dashboardPath: 'dashboard' },
  { value: 'TEACHER', dashboardPath: 'teacher' },
  { value: 'SUBJECT_ADMIN', dashboardPath: 'admin' },
];

export default function AdminUsersPage({ params: { locale } }: AdminUsersPageProps) {
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'STUDENT',
  });

  const loadUsers = async () => {
    const response = await fetch('/api/v1/admin/users');
    const data = await response.json();
    setUsers(data.users || []);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async () => {
    const selectedRole = roleOptions.find((role) => role.value === form.role) || roleOptions[0];
    const id = `custom-${form.role.toLowerCase()}-${Date.now()}`;

    await fetch('/api/v1/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        email: form.email,
        password: form.password,
        profile: {
          firstName: form.firstName,
          lastName: form.lastName,
          displayName: `${form.firstName} ${form.lastName}`.trim(),
        },
        roles: [form.role],
        dashboardPath: selectedRole.dashboardPath,
      }),
    });

    setForm({ firstName: '', lastName: '', email: '', password: '', role: 'STUDENT' });
    loadUsers();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/v1/admin/users?id=${id}`, { method: 'DELETE' });
    loadUsers();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href={`/${locale}/admin`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <Arrow className="h-5 w-5" />
            <span>{isRTL ? 'بازگشت به پنل' : 'Back to panel'}</span>
          </Link>
          <h1 className="font-semibold">{isRTL ? 'مدیریت کاربران' : 'User Management'}</h1>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">{isRTL ? 'ایجاد کاربر جدید' : 'Create new user'}</h2>
          <div className="space-y-4">
            <input value={form.firstName} onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))} placeholder={isRTL ? 'نام' : 'First name'} className="w-full rounded-lg border bg-background p-3" />
            <input value={form.lastName} onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))} placeholder={isRTL ? 'نام خانوادگی' : 'Last name'} className="w-full rounded-lg border bg-background p-3" />
            <input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder={isRTL ? 'ایمیل' : 'Email'} className="w-full rounded-lg border bg-background p-3" />
            <input value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} placeholder={isRTL ? 'رمز عبور' : 'Password'} className="w-full rounded-lg border bg-background p-3" />
            <select value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))} className="w-full rounded-lg border bg-background p-3">
              <option value="STUDENT">{isRTL ? 'دانش‌آموز' : 'Student'}</option>
              <option value="TEACHER">{isRTL ? 'معلم' : 'Teacher'}</option>
              <option value="SUBJECT_ADMIN">{isRTL ? 'مدیر دروس' : 'Subject Admin'}</option>
            </select>
            <button onClick={handleCreate} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-primary-foreground hover:bg-primary/90">
              <UserPlus className="h-4 w-4" />
              {isRTL ? 'ایجاد کاربر' : 'Create User'}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">{isRTL ? 'کاربران موجود' : 'Available users'}</h2>
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div>
                  <p className="font-medium">{user.profile.displayName}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs uppercase tracking-wide text-primary">{user.roles.join(', ')}</p>
                </div>
                {user.roles[0] !== 'SUPER_ADMIN' && (
                  <button onClick={() => handleDelete(user.id)} className="rounded-lg border px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
