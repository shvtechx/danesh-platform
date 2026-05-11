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