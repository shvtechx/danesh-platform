import fs from 'fs';
import path from 'path';
import {
  AUTH_STORAGE_KEY,
  ORIGINAL_USER_STORAGE_KEY,
  USER_ID_STORAGE_KEY,
  getHomeRouteForRoles,
  getPrimaryRole,
  hasPermission,
  type DemoPermission,
  type DemoRole,
} from '@/lib/auth/demo-auth-shared';

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
  PARENT: ['courses.read', 'profile.read'],
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

// Path to persist users across server restarts
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'demo-users.json');
const SUBJECTS_FILE = path.join(DATA_DIR, 'demo-subjects.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load persisted users or use initial state
function loadUsers(): DemoUserRecord[] {
  const reconcileUsers = (users: DemoUserRecord[]) => {
    const byId = new Map(users.map((user) => [user.id, user]));

    for (const initialUser of initialDemoUsers) {
      if (!byId.has(initialUser.id)) {
        byId.set(initialUser.id, initialUser);
      }
    }

    return Array.from(byId.values());
  };

  if (fs.existsSync(USERS_FILE)) {
    try {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      const reconciledUsers = reconcileUsers(JSON.parse(data));
      fs.writeFileSync(USERS_FILE, JSON.stringify(reconciledUsers, null, 2), 'utf-8');
      return reconciledUsers;
    } catch (error) {
      console.error('Failed to load persisted users, using initial state:', error);
      return [...initialDemoUsers];
    }
  }
  return [...initialDemoUsers];
}

// Load persisted subjects or use initial state
function loadSubjects(): DemoSubjectRecord[] {
  if (fs.existsSync(SUBJECTS_FILE)) {
    try {
      const data = fs.readFileSync(SUBJECTS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load persisted subjects, using initial state:', error);
      return [...initialDemoSubjects];
    }
  }
  return [...initialDemoSubjects];
}

// Save users to disk
function saveUsers(users: DemoUserRecord[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to persist users:', error);
  }
}

// Save subjects to disk
function saveSubjects(subjects: DemoSubjectRecord[]) {
  try {
    fs.writeFileSync(SUBJECTS_FILE, JSON.stringify(subjects, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to persist subjects:', error);
  }
}

let demoUsersState: DemoUserRecord[] = loadUsers();
let demoSubjectsState: DemoSubjectRecord[] = loadSubjects();

export {
  AUTH_STORAGE_KEY,
  ORIGINAL_USER_STORAGE_KEY,
  USER_ID_STORAGE_KEY,
  getHomeRouteForRoles,
  getPrimaryRole,
  hasPermission,
};

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
  saveUsers(demoUsersState); // Persist to disk
  return sanitizeDemoUser(createdUser);
}

export function removeDemoUser(id: string) {
  demoUsersState = demoUsersState.filter((user) => user.id !== id && user.roles[0] !== 'SUPER_ADMIN');
  saveUsers(demoUsersState); // Persist to disk
  
  demoSubjectsState = demoSubjectsState.map((subject) => ({
    ...subject,
    teachers: subject.teachers.filter((teacherId) => teacherId !== id),
    students: subject.students.filter((studentId) => studentId !== id),
  }));
  saveSubjects(demoSubjectsState); // Persist to disk
}

export function listDemoSubjects() {
  return demoSubjectsState;
}

export function createDemoSubject(subject: DemoSubjectRecord) {
  demoSubjectsState = [...demoSubjectsState, subject];
  saveSubjects(demoSubjectsState); // Persist to disk
  return subject;
}

export function removeDemoSubject(id: string) {
  demoSubjectsState = demoSubjectsState.filter((subject) => subject.id !== id);
  saveSubjects(demoSubjectsState); // Persist to disk
}

export function updateSubjectAssignments(subjectId: string, teachers: string[], students: string[]) {
  demoSubjectsState = demoSubjectsState.map((subject) =>
    subject.id === subjectId ? { ...subject, teachers, students } : subject,
  );
  saveSubjects(demoSubjectsState); // Persist to disk
  return demoSubjectsState.find((subject) => subject.id === subjectId) || null;
}

