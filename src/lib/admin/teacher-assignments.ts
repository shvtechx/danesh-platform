export const SUBJECT_SCOPE_PREFIX = 'subject:';
export const STUDENT_SCOPE_PREFIX = 'student:';
export const COURSE_SCOPE_PREFIX = 'course:';

type UserRoleScopeRecord = {
  scope?: string | null;
};

function extractScopedIds(userRoles: UserRoleScopeRecord[] = [], prefix: string) {
  return Array.from(
    new Set(
      userRoles
        .map((userRole) => userRole.scope)
        .filter((scope): scope is string => Boolean(scope && scope.startsWith(prefix)))
        .map((scope) => scope.slice(prefix.length))
        .filter(Boolean),
    ),
  );
}

export function extractTeacherAssignmentState(userRoles: UserRoleScopeRecord[] = []) {
  const subjectCodes = extractScopedIds(userRoles, SUBJECT_SCOPE_PREFIX);
  const assignedStudentIds = extractScopedIds(userRoles, STUDENT_SCOPE_PREFIX);
  const assignedCourseIds = extractScopedIds(userRoles, COURSE_SCOPE_PREFIX);

  return {
    subjectCodes,
    assignedStudentIds,
    assignedCourseIds,
  };
}

export function buildScopedValues(values: string[] = [], prefix: string) {
  return Array.from(new Set(values.filter(Boolean))).map((value) => `${prefix}${value}`);
}