'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ExternalLink, Home, LayoutDashboard, Users, Video } from 'lucide-react';
import LiveClassSession from '@/components/live/LiveClassSession';
import { createUserHeaders, getStoredAuthUser } from '@/lib/auth/demo-auth-shared';
import { getDefaultLiveDisplayName, getLiveClassRoleFromRoles, parseLiveClassRole, sanitizeJitsiRoomName } from '@/lib/live/jitsi';
import { buildLiveClassPath, humanizeLiveRoomName } from '@/lib/live/provider';

const LIVE_HEARTBEAT_INTERVAL_MS = 15000;

export default function LiveRoomPage({ params }: { params: { locale: string; roomName: string } }) {
  const locale = params.locale;
  const isRTL = locale === 'fa';
  const searchParams = useSearchParams();
  const roomName = sanitizeJitsiRoomName(params.roomName);
  const authUser = useMemo(() => getStoredAuthUser() as { roles?: string[]; email?: string; profile?: { displayName?: string } } | null, []);
  const defaultRole = getLiveClassRoleFromRoles(authUser?.roles || []);
  const requestedRole = parseLiveClassRole(searchParams.get('role'));
  const role = requestedRole === 'moderator' && defaultRole === 'moderator' ? 'moderator' : defaultRole;
  const requestedTitle = searchParams.get('title')?.trim();
  const displayName =
    searchParams.get('name')?.trim() ||
    authUser?.profile?.displayName?.trim() ||
    getDefaultLiveDisplayName(role, locale);
  const email = authUser?.email?.trim() || null;
  const sessionTitle = requestedTitle || humanizeLiveRoomName(roomName) || roomName;
  const pageUrl = roomName
    ? buildLiveClassPath(locale, roomName, role === 'moderator' ? { role: 'moderator', title: sessionTitle } : { title: sessionTitle })
    : '';
  const dashboardHref = role === 'moderator' ? `/${locale}/teacher` : `/${locale}/dashboard`;
  const backHref = role === 'moderator' ? `/${locale}/teacher/live-classes` : dashboardHref;
  const sessionTips = isRTL
    ? [
        'چند دقیقه زودتر وارد شوید و صدا را بررسی کنید.',
        'اگر تصویر یا صدا قطع شد، یک‌بار صفحه را نوسازی کنید.',
        'برای تمرکز بهتر، پنجره‌های اضافی مرورگر را ببندید.',
      ]
    : [
        'Join a few minutes early and check your audio.',
        'If video or audio drops, refresh the page once.',
        'Close extra browser tabs for a smoother class.',
      ];

  useEffect(() => {
    if (role !== 'moderator' || !roomName) {
      return;
    }

    const syncLiveStatus = async (state: 'live' | 'ended' = 'live') => {
      try {
        await fetch('/api/v1/live/announcements', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...createUserHeaders((authUser as { id?: string } | null)?.id || null),
          },
          body: JSON.stringify({
            roomName,
            title: sessionTitle,
            locale,
            teacherId: (authUser as { id?: string } | null)?.id || null,
            teacherName: displayName,
            state,
          }),
          keepalive: state === 'ended',
        });
      } catch {
        // Best-effort heartbeat only.
      }
    };

    syncLiveStatus('live');
    const interval = window.setInterval(() => syncLiveStatus('live'), LIVE_HEARTBEAT_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      syncLiveStatus('ended');
    };
  }, [authUser, displayName, locale, role, roomName, sessionTitle]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Video className="h-4 w-4 text-primary" />
            <span>{isRTL ? 'کلاس زنده' : 'Live classroom'}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/${locale}`} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted">
              <Home className="h-4 w-4" />
              {isRTL ? 'خانه' : 'Home'}
            </Link>
            <Link href={dashboardHref} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted">
              <LayoutDashboard className="h-4 w-4" />
              {isRTL ? 'داشبورد' : 'Dashboard'}
            </Link>
            <Link href={backHref} className="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted">
              {role === 'moderator'
                ? isRTL
                  ? 'بازگشت به کلاس‌های زنده'
                  : 'Back to live classes'
                : isRTL
                  ? 'بازگشت'
                  : 'Back'}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-6 lg:py-8">
        <div className="mb-6 rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-sky-500/10 px-6 py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Video className="h-3.5 w-3.5" />
              {role === 'moderator'
                ? isRTL
                  ? 'کلاس زنده — معلم / مدیر جلسه'
                  : 'Live class — teacher / moderator'
                : isRTL
                  ? 'کلاس زنده — دانش‌آموز / شرکت‌کننده'
                  : 'Live class — student / participant'}
            </div>
            <h1 className="mt-3 text-3xl font-bold">{sessionTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {role === 'moderator'
                ? isRTL
                  ? 'شما با نقش معلم وارد این کلاس می‌شوید. پیش از شروع، از آماده بودن صدا، تصویر و ابزارهای مورد نیاز مطمئن شوید.'
                  : 'You are entering this classroom as the teacher. Before starting, make sure your audio, video, and lesson tools are ready.'
                : isRTL
                  ? 'شما با نقش شرکت‌کننده وارد کلاس می‌شوید. لطفاً چند دقیقه زودتر آماده باشید تا کلاس به‌موقع شروع شود.'
                  : 'You are joining as a participant. Please be ready a few minutes early so class can begin on time.'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={backHref} className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted">
              {role === 'moderator'
                ? isRTL
                  ? 'بازگشت به کلاس‌های زنده'
                  : 'Back to live classes'
                : isRTL
                  ? 'بازگشت به داشبورد'
                  : 'Back to dashboard'}
            </Link>
            {pageUrl ? (
              <Link
                href={pageUrl}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <ExternalLink className="h-4 w-4" />
                {isRTL ? 'باز کردن در تب جدید' : 'Open in a new tab'}
              </Link>
            ) : null}
          </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            {roomName ? (
              <LiveClassSession roomName={roomName} title={sessionTitle} locale={locale} role={role} displayName={displayName} email={email} />
            ) : (
              <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
                {isRTL ? 'نام اتاق معتبر نیست.' : 'The room name is not valid.'}
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 text-foreground">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">{isRTL ? 'پیش از شروع یا ورود' : 'Before you start or join'}</h2>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {sessionTips.map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border bg-card p-5 shadow-sm">
              <h2 className="font-semibold text-foreground">{isRTL ? 'اطلاعات جلسه' : 'Session information'}</h2>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">{isRTL ? 'عنوان' : 'Title'}</p>
                  <p>{sessionTitle}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{isRTL ? 'نقش شما' : 'Your role'}</p>
                  <p>{role === 'moderator' ? (isRTL ? 'معلم / مدیر جلسه' : 'Teacher / moderator') : (isRTL ? 'دانش‌آموز / شرکت‌کننده' : 'Student / participant')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
