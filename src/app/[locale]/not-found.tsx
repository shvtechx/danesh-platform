'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';

export default function NotFound() {
  const params = useParams<{ locale?: string | string[] }>();
  const localeParam = params?.locale;
  const locale = Array.isArray(localeParam) ? localeParam[0] : localeParam || 'en';
  const dashboardHref = useMemo(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('danesh_auth_user') : null;
      if (raw) {
        const user = JSON.parse(raw);
        const role = (user.roles?.[0] || user.role || '').toLowerCase();
        if (role === 'admin') return `/${locale}/admin`;
        if (role === 'teacher') return `/${locale}/teacher`;
        if (role === 'parent') return `/${locale}/parent`;
        if (role === 'student') return `/${locale}/student`;
      }
    } catch {}
    return `/${locale}`;
  }, [locale]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="text-9xl font-bold text-primary/20 mb-4">404</div>
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Page Not Found
        </h1>
        <p className="text-muted-foreground mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href={dashboardHref}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
