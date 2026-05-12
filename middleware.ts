import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from '@/lib/i18n/request';
import { AUTH_ROLES_COOKIE, getHomeRouteForRoles, parseRolesPayload } from '@/lib/auth/demo-auth-shared';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
});

const studentPortalRoots = new Set([
  'dashboard',
  'student',
  'courses',
  'assessments',
  'achievements',
  'leaderboard',
  'forum',
  'wellbeing',
  'quests',
  'profile',
  'settings',
  'lessons',
]);

function getRequiredPortalRole(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0];

  if (!locale || !locales.includes(locale as (typeof locales)[number])) {
    return null;
  }

  const section = segments[1];

  if (!section || ['login', 'register', 'onboarding'].includes(section)) {
    return null;
  }

  if (section === 'admin') {
    return 'ADMIN';
  }

  if (section === 'teacher') {
    return 'TEACHER';
  }

  if (section === 'parent') {
    return 'PARENT';
  }

  if (studentPortalRoots.has(section)) {
    return 'STUDENT';
  }

  return null;
}

function hasPortalAccess(requiredRole: string, roles: string[]) {
  if (requiredRole === 'ADMIN') {
    return roles.includes('SUPER_ADMIN') || roles.includes('SUBJECT_ADMIN');
  }

  return roles.includes(requiredRole);
}

export default function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);
  const requiredRole = getRequiredPortalRole(request.nextUrl.pathname);

  if (!requiredRole) {
    return intlResponse;
  }

  const segments = request.nextUrl.pathname.split('/').filter(Boolean);
  const locale = segments[0] || defaultLocale;
  const roles = parseRolesPayload(request.cookies.get(AUTH_ROLES_COOKIE)?.value);

  if (roles.length === 0) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  if (!hasPortalAccess(requiredRole, roles)) {
    return NextResponse.redirect(new URL(getHomeRouteForRoles(locale, roles), request.url));
  }

  return intlResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
