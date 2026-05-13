'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ExternalLink, RefreshCcw, Video } from 'lucide-react';
import {
  type JitsiBootstrapPayload,
  type LiveClassRole,
  buildJitsiMeetingUrl,
  getDefaultLiveDisplayName,
} from '@/lib/live/jitsi';

type JitsiMeetEmbedProps = {
  roomName: string;
  title: string;
  locale: string;
  role?: LiveClassRole;
  displayName?: string;
  email?: string | null;
};

type BootstrapState =
  | { status: 'loading'; error: null; payload: null }
  | { status: 'error'; error: string; payload: null }
  | { status: 'ready'; error: null; payload: JitsiBootstrapPayload };

const externalApiLoaders = new Map<string, Promise<void>>();

function loadExternalApiScript(domain: string) {
  const existingLoader = externalApiLoaders.get(domain);
  if (existingLoader) {
    return existingLoader;
  }

  const loader = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not available.'));
      return;
    }

    if (window.JitsiMeetExternalAPI) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://${domain}/external_api.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load the Jitsi meeting script.'));
    document.body.appendChild(script);
  });

  externalApiLoaders.set(domain, loader);
  return loader;
}

export default function JitsiMeetEmbed({
  roomName,
  title,
  locale,
  role = 'participant',
  displayName,
  email,
}: JitsiMeetEmbedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<{ dispose?: () => void } | null>(null);
  const [state, setState] = useState<BootstrapState>({ status: 'loading', error: null, payload: null });
  const [reloadToken, setReloadToken] = useState(0);
  const [sessionState, setSessionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const normalizedDisplayName = useMemo(
    () => displayName?.trim() || getDefaultLiveDisplayName(role, locale),
    [displayName, locale, role],
  );

  const normalizedEmail = useMemo(() => email?.trim() || null, [email]);
  const fallbackMeetingUrl = useMemo(() => buildJitsiMeetingUrl(roomName), [roomName]);

  useEffect(() => {
    if (!roomName) {
      setState({ status: 'error', error: locale === 'fa' ? 'نام اتاق معتبر نیست.' : 'The room name is not valid.', payload: null });
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      roomName,
      role,
      locale,
      displayName: normalizedDisplayName,
    });

    if (normalizedEmail) {
      params.set('email', normalizedEmail);
    }

    setState({ status: 'loading', error: null, payload: null });
    setSessionState('connecting');

    fetch(`/api/v1/live/jitsi?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            data?.error || (locale === 'fa' ? 'بارگذاری تنظیمات کلاس زنده ناموفق بود.' : 'Failed to load the live class configuration.'),
          );
        }

        setState({ status: 'ready', error: null, payload: data as JitsiBootstrapPayload });
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: 'error',
          error: error instanceof Error ? error.message : locale === 'fa' ? 'خطای ناشناخته رخ داد.' : 'An unexpected error occurred.',
          payload: null,
        });
      });

    return () => controller.abort();
  }, [locale, normalizedDisplayName, normalizedEmail, reloadToken, role, roomName]);

  useEffect(() => {
    if (state.status !== 'ready' || state.payload.mode === 'jaas-incomplete' || !containerRef.current) {
      return;
    }

    let disposed = false;

    const initializeMeeting = async () => {
      try {
        await loadExternalApiScript(state.payload.domain);

        if (disposed || !containerRef.current || !window.JitsiMeetExternalAPI) {
          return;
        }

        apiRef.current?.dispose?.();
        containerRef.current.innerHTML = '';

        apiRef.current = new window.JitsiMeetExternalAPI(state.payload.domain, {
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          roomName: state.payload.apiRoomName,
          jwt: state.payload.jwt || undefined,
          userInfo: {
            displayName: state.payload.displayName,
            email: state.payload.email || undefined,
          },
          configOverwrite: state.payload.configOverwrite,
          interfaceConfigOverwrite: state.payload.interfaceConfigOverwrite,
        });

        const nextApi = apiRef.current as {
          addListener?: (eventName: string, listener: (...args: unknown[]) => void) => void;
          removeListener?: (eventName: string, listener: (...args: unknown[]) => void) => void;
          dispose?: () => void;
        } | null;

        const markConnected = () => setSessionState('connected');
        const markDisconnected = () => setSessionState('disconnected');

        nextApi?.addListener?.('videoConferenceJoined', markConnected);
        nextApi?.addListener?.('videoConferenceLeft', markDisconnected);
        nextApi?.addListener?.('readyToClose', markDisconnected);
        nextApi?.addListener?.('conferenceFailed', markDisconnected);
      } catch (error) {
        if (disposed) {
          return;
        }

        setState({
          status: 'error',
          error:
            error instanceof Error
              ? error.message
              : locale === 'fa'
                ? 'بارگذاری جلسه زنده ناموفق بود.'
                : 'Failed to load the live session.',
          payload: null,
        });
      }
    };

    initializeMeeting();

    return () => {
      disposed = true;
      apiRef.current?.dispose?.();
      apiRef.current = null;
    };
  }, [locale, state]);

  const handleReconnect = () => {
    apiRef.current?.dispose?.();
    apiRef.current = null;
    setReloadToken((value) => value + 1);
  };

  if (state.status === 'loading') {
    return (
      <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className="flex min-h-[560px] flex-col items-center justify-center gap-4 bg-muted/20 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Video className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {locale === 'fa' ? 'در حال آماده‌سازی کلاس...' : 'Preparing your classroom...'}
            </h3>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              {locale === 'fa'
                ? 'اتصال صدا و تصویر، ابزارهای جلسه و فضای کلاس در حال بارگذاری است.'
                : 'We are loading the classroom, media permissions, and meeting tools for this session.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="overflow-hidden rounded-2xl border border-destructive/30 bg-destructive/5 shadow-sm">
        <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Video className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {locale === 'fa' ? 'اتصال به کلاس انجام نشد' : 'We could not connect to the classroom'}
            </h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {locale === 'fa'
                ? 'لطفاً یک‌بار صفحه را نوسازی کنید. اگر مشکل ادامه داشت، کلاس را در پنجره جدید باز کنید.'
                : 'Please refresh once. If the problem continues, open the class in a new tab and try again.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <RefreshCcw className="h-4 w-4" />
              {locale === 'fa' ? 'نوسازی صفحه' : 'Refresh page'}
            </button>
            {fallbackMeetingUrl ? (
              <a
                href={fallbackMeetingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <ExternalLink className="h-4 w-4" />
                {locale === 'fa' ? 'باز کردن در پنجره جدید' : 'Open in new tab'}
              </a>
            ) : null}
          </div>

        </div>
      </div>
    );
  }

  if (state.payload.mode === 'jaas-incomplete') {
    return (
      <div className="overflow-hidden rounded-2xl border border-amber-400/40 bg-amber-50/80 shadow-sm dark:bg-amber-950/20">
        <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 px-6 text-center">
          <div>
            <h3 className="text-base font-semibold text-foreground">{locale === 'fa' ? 'کلاس در حال آماده‌سازی است' : 'The classroom is still being prepared'}</h3>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {locale === 'fa'
                ? 'سامانه کلاس زنده به‌زودی در دسترس خواهد بود. لطفاً چند دقیقه بعد دوباره تلاش کنید یا از مدیر سامانه بخواهید وضعیت کلاس را بررسی کند.'
                : 'The live classroom will be available shortly. Please try again in a few minutes or ask your platform administrator to review the session status.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
      {state.payload.warning ? (
        <div className="border-b border-amber-400/30 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
          {locale === 'fa'
            ? 'کلاس با مسیر جایگزین بارگذاری شد. اگر مشکلی در صدا یا تصویر دیدید، یک‌بار صفحه را نوسازی کنید.'
            : 'The classroom loaded using a fallback path. If audio or video feels off, refresh the page once.'}
        </div>
      ) : null}
      <div className="relative">
        <div ref={containerRef} title={title} className="live-class-embed min-h-[72vh] w-full bg-muted/20 lg:min-h-[78vh]" />
        {sessionState === 'disconnected' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 p-6 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border bg-card p-6 text-center shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {locale === 'fa' ? 'اتصال کلاس قطع شد' : 'The live session was disconnected'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {locale === 'fa'
                  ? 'به‌جای نمایش یک قاب خالی، می‌توانید دوباره به کلاس وصل شوید یا جلسه را در پنجره جدید باز کنید.'
                  : 'Instead of leaving an empty frame, you can reconnect to the class or reopen it in a new tab.'}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReconnect}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <RefreshCcw className="h-4 w-4" />
                  {locale === 'fa' ? 'اتصال دوباره' : 'Reconnect'}
                </button>
                {fallbackMeetingUrl ? (
                  <a
                    href={fallbackMeetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {locale === 'fa' ? 'باز کردن در پنجره جدید' : 'Open in new tab'}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
