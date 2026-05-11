'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Users, TrendingUp, ArrowLeft, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { createUserHeaders, getStoredUserId } from '@/lib/auth/demo-auth-shared';

type ParentChild = {
  id: string;
  firstName: string;
  lastName: string;
  stats?: {
    totalXP?: number;
    currentLevel?: number;
    lessonsCompleted?: number;
    recentMood?: number | null;
  };
};

export default function ParentDashboardPage({ params: { locale } }: { params: { locale: string } }) {
  const isRTL = locale === 'fa';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChildren = async () => {
      try {
        const response = await fetch('/api/v1/parent/children', {
          headers: createUserHeaders(getStoredUserId()),
        });

        const data = await response.json().catch(() => ({ children: [] }));
        setChildren(data.children || []);
      } catch {
        setChildren([]);
      } finally {
        setLoading(false);
      }
    };

    void loadChildren();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        locale={locale}
        title={isRTL ? 'پنل والدین' : 'Parent Dashboard'}
        backHref={`/${locale}`}
        backLabel={isRTL ? 'خانه' : 'Home'}
      />

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 rounded-2xl border bg-card p-6">
          <h1 className="text-2xl font-semibold">{isRTL ? 'پیگیری رشد فرزند' : 'Follow your child’s growth'}</h1>
          <p className="mt-2 text-muted-foreground">
            {isRTL
              ? 'پیشرفت یادگیری، وضعیت سلامت روان و فعالیت‌های اخیر فرزندتان را در یک نما مشاهده کنید.'
              : 'Review learning progress, wellbeing signals, and recent activity in one place.'}
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
            {isRTL ? 'در حال بارگذاری...' : 'Loading...'}
          </div>
        ) : children.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center">
            <Users className="mx-auto mb-4 h-8 w-8 text-primary" />
            <h2 className="text-lg font-semibold">{isRTL ? 'هنوز فرزندی متصل نشده است' : 'No linked children yet'}</h2>
            <p className="mt-2 text-muted-foreground">
              {isRTL
                ? 'پس از اتصال حساب دانش‌آموز، خلاصه پیشرفت در اینجا نمایش داده می‌شود.'
                : 'Once a student account is linked, the progress summary will appear here.'}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href={`/${locale}/register`} className="rounded-xl bg-primary px-5 py-3 text-primary-foreground hover:bg-primary/90">
                {isRTL ? 'ایجاد حساب جدید' : 'Create another account'}
              </Link>
              <Link href={`/${locale}/settings`} className="rounded-xl border px-5 py-3 hover:bg-muted">
                {isRTL ? 'تنظیمات' : 'Settings'}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {children.map((child) => (
              <div key={child.id} className="rounded-2xl border bg-card p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{`${child.firstName} ${child.lastName}`.trim()}</h2>
                    <p className="text-sm text-muted-foreground">ID: {child.id}</p>
                  </div>
                  <Link href={`/${locale}/parent`} className="rounded-full border p-2 hover:bg-muted">
                    <Arrow className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-4 w-4" />{isRTL ? 'سطح فعلی' : 'Current level'}</span>
                    <span className="font-medium">{child.stats?.currentLevel ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{isRTL ? 'درس‌های تکمیل‌شده' : 'Lessons completed'}</span>
                    <span className="font-medium">{child.stats?.lessonsCompleted ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">XP</span>
                    <span className="font-medium">{child.stats?.totalXP ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground"><Heart className="h-4 w-4" />{isRTL ? 'حال اخیر' : 'Recent mood'}</span>
                    <span className="font-medium">{child.stats?.recentMood ?? '—'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}