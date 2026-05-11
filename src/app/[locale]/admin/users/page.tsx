'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Check, Copy, Eye, EyeOff,
  KeyRound, RefreshCw, Trash2, UserPlus, X,
} from 'lucide-react';

interface AdminUsersPageProps {
  params: { locale: string };
}

interface DemoUser {
  id: string;
  email: string;
  status?: string;
  roles: string[];
  profile: {
    firstName?: string;
    lastName?: string;
    displayName: string;
  };
}

const ROLE_LABELS: Record<string, { en: string; fa: string; color: string }> = {
  SUPER_ADMIN: { en: 'Super Admin', fa: 'مدیر ارشد', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  SUBJECT_ADMIN: { en: 'Subject Admin', fa: 'مدیر دروس', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  TEACHER: { en: 'Teacher', fa: 'معلم', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  STUDENT: { en: 'Student', fa: 'دانش‌آموز', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  PARENT: { en: 'Parent', fa: 'والدین', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
};

function RoleBadge({ role, isRTL }: { role: string; isRTL: boolean }) {
  const meta = ROLE_LABELS[role] || { en: role, fa: role, color: 'bg-muted text-muted-foreground' };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
      {isRTL ? meta.fa : meta.en}
    </span>
  );
}

interface ResetModalProps {
  user: DemoUser;
  isRTL: boolean;
  onClose: () => void;
}

function ResetPasswordModal({ user, isRTL, onClose }: ResetModalProps) {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [manualPassword, setManualPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ newPassword: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleReset = async () => {
    if (mode === 'manual' && manualPassword.length < 8) {
      setError(isRTL ? 'رمز عبور باید حداقل ۸ کاراکتر باشد' : 'Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...(mode === 'manual' && manualPassword.trim() ? { newPassword: manualPassword.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : (isRTL ? 'خطایی رخ داد' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">
              {isRTL ? 'بازنشانی رمز عبور' : 'Reset Password'}
            </h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User info */}
        <div className="mb-5 rounded-xl border bg-muted/30 p-3">
          <p className="font-medium">{user.profile.displayName}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {user.roles.map((r) => <RoleBadge key={r} role={r} isRTL={isRTL} />)}
          </div>
        </div>

        {result ? (
          /* Success state */
          <div className="space-y-4">
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300">
                <Check className="h-4 w-4" />
                {isRTL ? 'رمز عبور با موفقیت بازنشانی شد' : 'Password reset successfully'}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {isRTL ? 'رمز عبور جدید را برای کاربر ارسال کنید:' : 'Share this new password with the user:'}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border bg-background px-4 py-3">
              <code className="flex-1 font-mono text-base tracking-wider">
                {showPassword ? result.newPassword : '●'.repeat(result.newPassword.length)}
              </code>
              <button onClick={() => setShowPassword((v) => !v)} className="rounded p-1 hover:bg-muted">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button onClick={() => handleCopy(result.newPassword)} className="rounded p-1 hover:bg-muted">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {isRTL
                ? '⚠️ این رمز را کپی و در جایی امن ذخیره کنید. بعد از بستن این پنجره قابل بازیابی نیست.'
                : '⚠️ Copy this password now. It will not be shown again after you close this dialog.'}
            </p>
            <button onClick={onClose} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {isRTL ? 'بستن' : 'Close'}
            </button>
          </div>
        ) : (
          /* Input state */
          <div className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>
            )}

            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('auto')}
                className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${mode === 'auto' ? 'border-primary bg-primary/10 font-medium text-primary' : 'hover:bg-muted'}`}
              >
                <RefreshCw className="mb-1 mx-auto h-4 w-4" />
                {isRTL ? 'تولید خودکار' : 'Auto-generate'}
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${mode === 'manual' ? 'border-primary bg-primary/10 font-medium text-primary' : 'hover:bg-muted'}`}
              >
                <KeyRound className="mb-1 mx-auto h-4 w-4" />
                {isRTL ? 'رمز دستی' : 'Set manually'}
              </button>
            </div>

            {mode === 'manual' && (
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={manualPassword}
                  onChange={(e) => setManualPassword(e.target.value)}
                  placeholder={isRTL ? 'رمز عبور جدید (حداقل ۸ کاراکتر)' : 'New password (min 8 characters)'}
                  className="w-full rounded-xl border bg-background px-4 py-3 pe-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 end-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}

            {mode === 'auto' && (
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? 'یک رمز عبور تصادفی ۱۲ کاراکتری امن تولید می‌شود و پس از بازنشانی نمایش داده می‌شود.'
                  : 'A secure 12-character random password will be generated and shown to you after the reset.'}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 rounded-xl border px-4 py-2.5 text-sm hover:bg-muted">
                {isRTL ? 'انصراف' : 'Cancel'}
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                {isRTL ? 'بازنشانی رمز' : 'Reset Password'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
  const [feedback, setFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [resetTarget, setResetTarget] = useState<DemoUser | null>(null);
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

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async () => {
    const selectedRole = roleOptions.find((r) => r.value === form.role) || roleOptions[0];
    const id = `custom-${form.role.toLowerCase()}-${Date.now()}`;
    const response = await fetch('/api/v1/admin/users', {
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
    const data = await response.json();
    if (!response.ok) {
      setFeedback(data.error || (isRTL ? 'ایجاد کاربر انجام نشد.' : 'Unable to create user.'));
      return;
    }
    setFeedback(
      data.temporaryPassword
        ? `${isRTL ? 'رمز عبور موقت:' : 'Temporary password:'} ${data.temporaryPassword}`
        : (isRTL ? 'کاربر ایجاد شد.' : 'User created.'),
    );
    setForm({ firstName: '', lastName: '', email: '', password: '', role: 'STUDENT' });
    loadUsers();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/v1/admin/users?id=${id}`, { method: 'DELETE' });
    loadUsers();
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return !q
      || u.email.toLowerCase().includes(q)
      || u.profile.displayName.toLowerCase().includes(q)
      || u.roles.some((r) => r.toLowerCase().includes(q));
  });

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
        {/* Create user */}
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">{isRTL ? 'ایجاد کاربر جدید' : 'Create New User'}</h2>
          {feedback && (
            <div className="mb-4 flex items-start justify-between gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
              <span>{feedback}</span>
              <button onClick={() => setFeedback(null)} className="shrink-0 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} placeholder={isRTL ? 'نام' : 'First name'} className="w-full rounded-lg border bg-background p-3 text-sm" />
              <input value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} placeholder={isRTL ? 'نام خانوادگی' : 'Last name'} className="w-full rounded-lg border bg-background p-3 text-sm" />
            </div>
            <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder={isRTL ? 'ایمیل' : 'Email'} className="w-full rounded-lg border bg-background p-3 text-sm" />
            <input value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder={isRTL ? 'رمز عبور (خالی = خودکار)' : 'Password (leave blank to auto-generate)'} className="w-full rounded-lg border bg-background p-3 text-sm" type="password" />
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className="w-full rounded-lg border bg-background p-3 text-sm">
              <option value="STUDENT">{isRTL ? 'دانش‌آموز' : 'Student'}</option>
              <option value="TEACHER">{isRTL ? 'معلم' : 'Teacher'}</option>
              <option value="SUBJECT_ADMIN">{isRTL ? 'مدیر دروس' : 'Subject Admin'}</option>
            </select>
            <button onClick={handleCreate} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm text-primary-foreground hover:bg-primary/90">
              <UserPlus className="h-4 w-4" />
              {isRTL ? 'ایجاد کاربر' : 'Create User'}
            </button>
          </div>
        </section>

        {/* User list */}
        <section className="rounded-2xl border bg-card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{isRTL ? 'کاربران' : 'Users'}</h2>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{users.length}</span>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRTL ? 'جستجو بر اساس نام، ایمیل یا نقش...' : 'Search by name, email or role...'}
            className="mb-4 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <div className="max-h-[560px] space-y-2 overflow-y-auto pe-1">
            {filteredUsers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{isRTL ? 'کاربری یافت نشد.' : 'No users found.'}</p>
            ) : filteredUsers.map((user) => {
              const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
              return (
                <div key={user.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{user.profile.displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {user.roles.map((r) => <RoleBadge key={r} role={r} isRTL={isRTL} />)}
                    </div>
                  </div>
                  {!isSuperAdmin && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => setResetTarget(user)}
                        title={isRTL ? 'بازنشانی رمز عبور' : 'Reset password'}
                        className="rounded-lg border p-2 text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        title={isRTL ? 'حذف کاربر' : 'Delete user'}
                        className="rounded-lg border p-2 text-muted-foreground hover:border-destructive hover:bg-destructive/5 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {resetTarget && (
        <ResetPasswordModal user={resetTarget} isRTL={isRTL} onClose={() => setResetTarget(null)} />
      )}
    </div>
  );
}
