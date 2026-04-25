export type DemoRole = 'SUPER_ADMIN' | 'SUBJECT_ADMIN' | 'TEACHER' | 'STUDENT';

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

export interface DemoUserRecord {
  id: string;
  email: string;
  password: string;
  status: 'ACTIVE';
  profile: {
    firstName: string;
    lastName: string;
    displayName: string;
  };
  roles: DemoRole[];
  permissions: DemoPermission[];
  managedSubjects?: string[];
  assignedSubjects?: string[];
  assignedStudents?: string[];
  dashboardPath: 'admin' | 'teacher' | 'dashboard';
}

export interface DemoSubjectRecord {
  id: string;
  code: string;
  name: string;
  teachers: string[];
  students: string[];
}

const permissionMatrix: Record<DemoRole, DemoPermission[]> = {
  SUPER_ADMIN: [
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'roles.manage',
    'subjects.create',
    'subjects.read',
    'subjects.update',
    'subjects.delete',
    'subjects.assign',
    'teachers.read',
    'teachers.assignSubjects',
    'teachers.manage',
    'students.read',
    'students.assign',
    'courses.read',
    'courses.update.assigned',
    'lessons.update.assigned',
    'system.settings',
    'impersonate.all',
    'profile.read',
  ],
  SUBJECT_ADMIN: [
    'subjects.read',
    'subjects.assign',
    'subjects.update',
    'teachers.read',
    'teachers.assignSubjects',
    'students.read',
    'students.assign',
    'courses.read',
    'system.settings',
    'profile.read',
  ],
  TEACHER: [
    'subjects.read',
    'courses.read',
    'courses.update.assigned',
    'lessons.update.assigned',
    'students.read',
    'profile.read',
  ],
  STUDENT: ['courses.read', 'wellbeing.submit', 'profile.read'],
};

const mergePermissions = (roles: DemoRole[]) => Array.from(new Set(roles.flatMap((role) => permissionMatrix[role])));

const initialDemoUsers: DemoUserRecord[] = [
  {
    id: 'demo-super-admin',
    email: 'superadmin@danesh.app',
    password: 'SuperAdmin@123',
    status: 'ACTIVE',
    profile: {
      firstName: 'Super',
      lastName: 'Admin',
      displayName: 'Super Administrator',
    },
    roles: ['SUPER_ADMIN'],
    permissions: mergePermissions(['SUPER_ADMIN']),
    managedSubjects: ['Mathematics', 'Physics', 'English'],
    dashboardPath: 'admin',
  },
  {
    id: 'demo-subject-admin',
    email: 'subjectadmin@danesh.app',
    password: 'SubjectAdmin@123',
    status: 'ACTIVE',
    profile: {
      firstName: 'Neda',
      lastName: 'Farhadi',
      displayName: 'Subject Administrator',
    },
    roles: ['SUBJECT_ADMIN'],
    permissions: mergePermissions(['SUBJECT_ADMIN']),
    managedSubjects: ['Mathematics', 'Physics'],
    dashboardPath: 'admin',
  },
  {
    id: 'demo-teacher-math',
    email: 'teacher.math@danesh.app',
    password: 'Teacher@123',
    status: 'ACTIVE',
    profile: {
      firstName: 'Reza',
      lastName: 'Ahmadi',
      displayName: 'Dr. Reza Ahmadi',
    },
    roles: ['TEACHER'],
    permissions: mergePermissions(['TEACHER']),
    assignedSubjects: ['Mathematics'],
    assignedStudents: ['Ali Ahmadi'],
    dashboardPath: 'teacher',
  },
  {
    id: 'demo-student-ali',
    email: 'student.ali@danesh.app',
    password: 'Student@123',
    status: 'ACTIVE',
    profile: {
      firstName: 'Ali',
      lastName: 'Ahmadi',
      displayName: 'Ali Ahmadi',
    },
    roles: ['STUDENT'],
    permissions: mergePermissions(['STUDENT']),
    assignedSubjects: ['Mathematics'],
    dashboardPath: 'dashboard',
  },
];

const initialDemoSubjects: DemoSubjectRecord[] = [
  {
    id: 'subject-math',
    code: 'MATH',
    name: 'Mathematics',
    teachers: ['demo-teacher-math'],
    students: ['demo-student-ali'],
  },
  {
    id: 'subject-physics',
    code: 'PHYS',
    name: 'Physics',
    teachers: [],
    students: [],
  },
];

let demoUsersState: DemoUserRecord[] = [...initialDemoUsers];
let demoSubjectsState: DemoSubjectRecord[] = [...initialDemoSubjects];

export const AUTH_STORAGE_KEY = 'danesh.auth.user';
export const USER_ID_STORAGE_KEY = 'danesh.userId';
export const ORIGINAL_USER_STORAGE_KEY = 'danesh.auth.originalUser';

export function sanitizeDemoUser(user: DemoUserRecord) {
  const { password, ...safeUser } = user;
  return safeUser;
}

export function authenticateDemoUser(email: string, password: string) {
  const matched = demoUsersState.find(
    (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password,
  );

  return matched ? sanitizeDemoUser(matched) : null;
}

export function getDemoUserById(id: string) {
  const matched = demoUsersState.find((user) => user.id === id);
  return matched ? sanitizeDemoUser(matched) : null;
}

export function getSwitchableAccounts() {
  return demoUsersState
    .filter((user) => user.roles[0] !== 'SUPER_ADMIN')
    .map((user) => sanitizeDemoUser(user));
}

export function listDemoUsers() {
  return demoUsersState.map((user) => sanitizeDemoUser(user));
}

export function createDemoUser(input: Omit<DemoUserRecord, 'permissions'>) {
  const createdUser: DemoUserRecord = {
    ...input,
    permissions: mergePermissions(input.roles),
  };

  demoUsersState = [...demoUsersState, createdUser];
  return sanitizeDemoUser(createdUser);
}

export function removeDemoUser(id: string) {
  demoUsersState = demoUsersState.filter((user) => user.id !== id && user.roles[0] !== 'SUPER_ADMIN');
  demoSubjectsState = demoSubjectsState.map((subject) => ({
    ...subject,
    teachers: subject.teachers.filter((teacherId) => teacherId !== id),
    students: subject.students.filter((studentId) => studentId !== id),
  }));
}

export function listDemoSubjects() {
  return demoSubjectsState;
}

export function createDemoSubject(subject: DemoSubjectRecord) {
  demoSubjectsState = [...demoSubjectsState, subject];
  return subject;
}

export function removeDemoSubject(id: string) {
  demoSubjectsState = demoSubjectsState.filter((subject) => subject.id !== id);
}

export function updateSubjectAssignments(subjectId: string, teachers: string[], students: string[]) {
  demoSubjectsState = demoSubjectsState.map((subject) =>
    subject.id === subjectId ? { ...subject, teachers, students } : subject,
  );
  return demoSubjectsState.find((subject) => subject.id === subjectId) || null;
}

export function getPrimaryRole(roles: string[] = []) {
  if (roles.includes('SUPER_ADMIN')) return 'SUPER_ADMIN';
  if (roles.includes('SUBJECT_ADMIN')) return 'SUBJECT_ADMIN';
  if (roles.includes('TEACHER')) return 'TEACHER';
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
  return `/${locale}/dashboard`;
}

export function hasPermission(user: { permissions?: string[] } | null | undefined, permission: DemoPermission) {
  return Boolean(user?.permissions?.includes(permission));
}
