export type DemoRole = 'SUPER_ADMIN' | 'SUBJECT_ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';

export type DemoPermission =
  | 'users.create'
  | 'users.read'
  | 'users.update'
  | 'users.delete'
  | 'roles.manage'
  | 'subjects.create'
  | 'subjects.read'
  | 'subjects.update'
  | 'subjects.delete'
  | 'subjects.assign'
  | 'teachers.read'
  | 'teachers.assignSubjects'
  | 'teachers.manage'
  | 'students.read'
  | 'students.assign'
  | 'courses.read'
  | 'courses.update.assigned'
  | 'lessons.update.assigned'
  | 'system.settings'
  | 'impersonate.all'
  | 'wellbeing.submit'
  | 'profile.read';

export const AUTH_STORAGE_KEY = 'danesh.auth.user';
export const USER_ID_STORAGE_KEY = 'danesh.userId';
export const ORIGINAL_USER_STORAGE_KEY = 'danesh.auth.originalUser';
export const AUTH_ROLES_COOKIE = 'danesh.auth.roles';
export const AUTH_USER_ID_COOKIE = 'danesh.auth.uid';

const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;

function setBrowserCookie(name: string, value: string, maxAge = AUTH_COOKIE_MAX_AGE_SECONDS) {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearBrowserCookie(name: string) {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function parseRolesPayload(raw: string | null | undefined) {
  if (!raw) {
    return [] as string[];
  }

  const decoded = (() => {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();

  try {
    const parsed = JSON.parse(decoded);
    if (Array.isArray(parsed)) {
      return parsed.filter((value): value is string => typeof value === 'string');
    }
  } catch {
    // Ignore JSON parse failure and fall back to comma-separated parsing.
  }

  return decoded
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function persistAuthSession(user: { id?: string | null; roles?: string[] } | null | undefined) {
  if (typeof window === 'undefined' || !user?.id) {
    return;
  }

  window.localStorage.setItem(USER_ID_STORAGE_KEY, user.id);
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));

  const roles = Array.isArray(user.roles) ? user.roles : [];
  setBrowserCookie(AUTH_ROLES_COOKIE, JSON.stringify(roles));
  setBrowserCookie(AUTH_USER_ID_COOKIE, user.id);
}

export function clearAuthSession() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(USER_ID_STORAGE_KEY);
    window.localStorage.removeItem(ORIGINAL_USER_STORAGE_KEY);
  }

  clearBrowserCookie(AUTH_ROLES_COOKIE);
  clearBrowserCookie(AUTH_USER_ID_COOKIE);
}

export function getStoredUserId() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(USER_ID_STORAGE_KEY);
}

export function getStoredAuthUser(): { roles?: string[] } | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function createUserHeaders(userId?: string | null): Record<string, string> {
  if (!userId) {
    return {};
  }

  return {
    'x-user-id': userId,
    'x-demo-user-id': userId,
  };
}

export function getPrimaryRole(roles: string[] = []) {
  if (roles.includes('SUPER_ADMIN')) return 'SUPER_ADMIN';
  if (roles.includes('SUBJECT_ADMIN')) return 'SUBJECT_ADMIN';
  if (roles.includes('TEACHER')) return 'TEACHER';
  if (roles.includes('PARENT')) return 'PARENT';
  return 'STUDENT';
}

export function getHomeRouteForRoles(locale: string, roles: string[] = []) {
  const primaryRole = getPrimaryRole(roles);
  if (primaryRole === 'SUPER_ADMIN' || primaryRole === 'SUBJECT_ADMIN') {
    return `/${locale}/admin`;
  }
  if (primaryRole === 'TEACHER') {
    return `/${locale}/teacher`;
  }
  if (primaryRole === 'PARENT') {
    return `/${locale}/parent`;
  }
  return `/${locale}/dashboard`;
}

export function hasPermission(user: { permissions?: string[] } | null | undefined, permission: DemoPermission) {
  return Boolean(user?.permissions?.includes(permission));
}