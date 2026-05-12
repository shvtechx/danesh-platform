import type { GradeBand } from '@/types';

export const gradeBandOrder: GradeBand[] = ['EARLY_YEARS', 'PRIMARY', 'MIDDLE', 'SECONDARY'];

export function getGradeBandIndex(gradeBand?: string | null) {
  if (!gradeBand) {
    return -1;
  }

  return gradeBandOrder.indexOf(gradeBand as GradeBand);
}

export function compareGradeBands(left?: string | null, right?: string | null) {
  const leftIndex = getGradeBandIndex(left);
  const rightIndex = getGradeBandIndex(right);

  if (leftIndex === -1 || rightIndex === -1) {
    return 0;
  }

  return leftIndex - rightIndex;
}

export function isGradeBandInRange(userGradeBand?: string | null, minBand?: string | null, maxBand?: string | null) {
  if (!userGradeBand || !minBand || !maxBand) {
    return true;
  }

  const userIndex = getGradeBandIndex(userGradeBand);
  const minIndex = getGradeBandIndex(minBand);
  const maxIndex = getGradeBandIndex(maxBand);

  if (userIndex === -1 || minIndex === -1 || maxIndex === -1) {
    return true;
  }

  return userIndex >= minIndex && userIndex <= maxIndex;
}

export function isPreviousGradeBand(candidateBand?: string | null, currentBand?: string | null) {
  const candidateIndex = getGradeBandIndex(candidateBand);
  const currentIndex = getGradeBandIndex(currentBand);

  if (candidateIndex === -1 || currentIndex === -1) {
    return false;
  }

  return currentIndex - candidateIndex === 1;
}

export function canStudentEnrollInCourse(studentGradeBand?: string | null, courseGradeBand?: string | null) {
  if (!studentGradeBand || !courseGradeBand) {
    return false;
  }

  return studentGradeBand === courseGradeBand;
}

export function shouldExposePrerequisiteSupport(args: {
  studentGradeBand?: string | null;
  prerequisiteGradeBandMax?: string | null;
  prerequisiteMastery?: number | null;
  isRequired?: boolean;
  masteryThreshold?: number;
}) {
  const {
    studentGradeBand,
    prerequisiteGradeBandMax,
    prerequisiteMastery,
    isRequired = true,
    masteryThreshold = 70,
  } = args;

  if (!isRequired) {
    return false;
  }

  if (!isPreviousGradeBand(prerequisiteGradeBandMax, studentGradeBand)) {
    return false;
  }

  return Number(prerequisiteMastery || 0) < masteryThreshold;
}
