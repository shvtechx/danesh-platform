export const TEACHER_DEPARTMENTS = [
  {
    id: 'math',
    labels: {
      en: 'Mathematics',
      fa: 'گروه ریاضی',
    },
  },
  {
    id: 'science',
    labels: {
      en: 'Science',
      fa: 'گروه علوم',
    },
  },
  {
    id: 'language',
    labels: {
      en: 'Languages',
      fa: 'گروه زبان',
    },
  },
  {
    id: 'humanities',
    labels: {
      en: 'Humanities',
      fa: 'گروه علوم انسانی',
    },
  },
  {
    id: 'arts',
    labels: {
      en: 'Arts',
      fa: 'گروه هنر',
    },
  },
  {
    id: 'tech',
    labels: {
      en: 'Technology',
      fa: 'گروه فناوری',
    },
  },
  {
    id: 'wellness',
    labels: {
      en: 'Wellness & PE',
      fa: 'گروه تربیت بدنی و سلامت',
    },
  },
] as const;

/**
 * Explicit mapping from DB subject codes to department IDs.
 * This is the authoritative source — if a code is listed here it wins
 * over the keyword-based fallback.
 */
const SUBJECT_CODE_TO_DEPARTMENT: Record<string, string> = {
  // Mathematics
  MATH: 'math',
  // Technology / Computing
  AI: 'tech',
  CS: 'tech',
  ROBOT: 'tech',
  // Science
  SCI: 'science',
  // Languages
  ENG: 'language',
  PER_LIT: 'language',
  // Humanities / Social
  SOC: 'humanities',
  ETHICS: 'humanities',
  ENTREP: 'humanities',
  SEL: 'humanities',
  // Arts
  ART: 'arts',
  MUS: 'arts',
  // Wellness
  PE: 'wellness',
};

export const TEACHER_SUBJECTS = [
  {
    id: 'math',
    department: 'math',
    labels: {
      en: 'Mathematics',
      fa: 'ریاضی',
    },
  },
  {
    id: 'physics',
    department: 'science',
    labels: {
      en: 'Physics',
      fa: 'فیزیک',
    },
  },
  {
    id: 'chemistry',
    department: 'science',
    labels: {
      en: 'Chemistry',
      fa: 'شیمی',
    },
  },
  {
    id: 'biology',
    department: 'science',
    labels: {
      en: 'Biology',
      fa: 'زیست‌شناسی',
    },
  },
  {
    id: 'english',
    department: 'language',
    labels: {
      en: 'English',
      fa: 'زبان انگلیسی',
    },
  },
  {
    id: 'persian',
    department: 'humanities',
    labels: {
      en: 'Persian Literature',
      fa: 'ادبیات فارسی',
    },
  },
  {
    id: 'arabic',
    department: 'language',
    labels: {
      en: 'Arabic',
      fa: 'عربی',
    },
  },
  {
    id: 'history',
    department: 'humanities',
    labels: {
      en: 'History',
      fa: 'تاریخ',
    },
  },
  {
    id: 'geography',
    department: 'humanities',
    labels: {
      en: 'Geography',
      fa: 'جغرافیا',
    },
  },
  {
    id: 'geometry',
    department: 'math',
    labels: {
      en: 'Geometry',
      fa: 'هندسه',
    },
  },
] as const;

export type TeacherDepartmentId = (typeof TEACHER_DEPARTMENTS)[number]['id'];
export type TeacherSubjectId = (typeof TEACHER_SUBJECTS)[number]['id'];

const SUBJECT_DEPARTMENT_KEYWORDS: Array<{ department: TeacherDepartmentId; keywords: string[] }> = [
  { department: 'math', keywords: ['math', 'mathematics', 'algebra', 'geometry', 'calculus', 'statistics', 'computer', 'coding', 'programming', 'artificial intelligence', 'ai'] },
  { department: 'science', keywords: ['science', 'physics', 'chemistry', 'biology', 'environment', 'astronomy'] },
  { department: 'language', keywords: ['language', 'english', 'arabic', 'french', 'german'] },
  { department: 'humanities', keywords: ['persian', 'literature', 'history', 'geography', 'social', 'civics', 'philosophy'] },
  { department: 'arts', keywords: ['art', 'arts', 'music', 'design', 'drama'] },
];

export function normalizeSubjectKey(value: string | null | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function humanizeSubjectKey(value: string | null | undefined) {
  const normalized = normalizeSubjectKey(value);
  if (!normalized) {
    return null;
  }

  return normalized
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function getLocalizedDepartmentName(departmentId: string | null | undefined, locale: string) {
  const department = TEACHER_DEPARTMENTS.find((item) => item.id === departmentId);
  if (!department) {
    return locale === 'fa' ? 'تعیین نشده' : 'Unassigned';
  }

  return locale === 'fa' ? department.labels.fa : department.labels.en;
}

export function getLocalizedSubjectName(subjectId: string | null | undefined, locale: string) {
  const normalizedSubjectId = normalizeSubjectKey(subjectId);
  const subject = TEACHER_SUBJECTS.find((item) => normalizeSubjectKey(item.id) === normalizedSubjectId);
  if (!subject) {
    return humanizeSubjectKey(subjectId) || (locale === 'fa' ? 'بدون تخصیص' : 'Unassigned');
  }

  return locale === 'fa' ? subject.labels.fa : subject.labels.en;
}

export function getDepartmentForSubject(subjectId: string | null | undefined) {
  const normalized = normalizeSubjectKey(subjectId);
  if (!normalized) return null;

  // 1. Exact uppercase code match (e.g. 'AI', 'MATH', 'PER_LIT')
  const upperCode = String(subjectId || '').trim().toUpperCase().replace(/\s+/g, '_');
  if (upperCode in SUBJECT_CODE_TO_DEPARTMENT) {
    return SUBJECT_CODE_TO_DEPARTMENT[upperCode] as string;
  }

  // 2. Normalized key match against TEACHER_SUBJECTS static list
  const staticMatch = TEACHER_SUBJECTS.find((item) => normalizeSubjectKey(item.id) === normalized);
  if (staticMatch) {
    return staticMatch.department;
  }

  // 3. Keyword-based fuzzy fallback
  for (const mapping of SUBJECT_DEPARTMENT_KEYWORDS) {
    if (mapping.keywords.some((keyword) => normalized.includes(keyword))) {
      return mapping.department;
    }
  }

  return null;
}
