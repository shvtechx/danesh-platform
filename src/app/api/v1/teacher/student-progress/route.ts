import { RoleName } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { extractTeacherAssignmentState } from '../../../../../lib/admin/teacher-assignments';

const prismaClient = prisma as any;
const teacherRoleNames = [RoleName.SUPPORT_TEACHER, RoleName.TUTOR, RoleName.COUNSELOR];

function getDisplayName(user: {
  email?: string | null;
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
  } | null;
}) {
  const fullName = [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ').trim();
  return user.profile?.displayName || fullName || user.email || 'Student';
}

function buildPracticePath(skillId: string) {
  return `/student/practice/${skillId}`;
}

function normalizeSubjectKey(value?: string | null) {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  const subjectAliases: Record<string, string> = {
    math: 'math',
    mathematics: 'math',
    geometry: 'geometry',
    physics: 'physics',
    chemistry: 'chemistry',
    biology: 'biology',
    science: 'science',
    english: 'english',
    persian: 'persian',
    literature: 'persian',
    arabic: 'arabic',
    history: 'history',
    geography: 'geography',
    art: 'arts',
    arts: 'arts',
  };

  return subjectAliases[normalized] || normalized;
}

function getLocalizedSubjectName(subject: { name?: string | null; nameFA?: string | null }, locale: string) {
  return locale === 'fa' ? (subject.nameFA || subject.name || '—') : (subject.name || subject.nameFA || '—');
}

/**
 * GET /api/v1/teacher/student-progress
 * Get adaptive assessment progress for all students
 */
export async function GET(request: NextRequest) {
  try {
    const locale = new URL(request.url).searchParams.get('locale') || 'en';
    const isRTL = locale === 'fa';
    const requestUserId = request.headers.get('x-user-id') || request.headers.get('x-demo-user-id');

    let teacherSubjectCodes: string[] = [];
    let assignedStudentIds: string[] = [];
    let assignedCourseIds: string[] = [];

    if (requestUserId) {
      const teacher = await prisma.user.findUnique({
        where: { id: requestUserId },
        select: {
          userRoles: {
            where: {
              role: {
                name: {
                  in: teacherRoleNames,
                },
              },
            },
            select: {
              scope: true,
            },
          },
        },
      });

      const assignmentState = extractTeacherAssignmentState(teacher?.userRoles || []);
      teacherSubjectCodes = assignmentState.subjectCodes
        .map((subjectCode) => normalizeSubjectKey(subjectCode))
        .filter((value): value is string => Boolean(value));
      assignedStudentIds = assignmentState.assignedStudentIds;
      assignedCourseIds = assignmentState.assignedCourseIds;
    }

    const enforceTeacherScope = Boolean(requestUserId);
    const assignedStudentSet = new Set(assignedStudentIds);
    const assignedCourseSet = new Set(assignedCourseIds);

    if (enforceTeacherScope && teacherSubjectCodes.length === 0) {
      return NextResponse.json({
        success: true,
        students: [],
        generatedAt: new Date().toISOString(),
        summary: {
          totalStudents: 0,
          averageMastery: 0,
          totalPracticeSessions: 0,
          studentsWithProgress: 0,
        },
        recentSessions: [],
        courseSummaries: [],
      });
    }

    const [allStudentProgress, allSessions, allCourseSummaries] = await Promise.all([
      prismaClient.skillMastery.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                displayName: true,
              },
            },
          },
        },
        skill: {
          select: {
            id: true,
            name: true,
            nameFA: true,
            code: true,
            subject: {
              select: {
                name: true,
                nameFA: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: [
        { userId: 'asc' },
        { updatedAt: 'desc' },
      ],
      }),
      prismaClient.practiceSession.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
        skill: {
          select: {
            name: true,
            nameFA: true,
            subject: {
              select: {
                name: true,
                nameFA: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 50,
      }),
      prisma.course.findMany({
      where: {
        isPublished: true,
      },
      include: {
        subject: {
          select: {
            code: true,
            name: true,
            nameFA: true,
          },
        },
        units: {
          include: {
            lessons: {
              select: {
                id: true,
              },
            },
          },
        },
        enrollments: {
          select: {
            userId: true,
            progress: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
      }),
    ]);

    const hasAllowedSubject = (subjectCode?: string | null) => {
      if (!enforceTeacherScope) {
        return true;
      }

      const normalized = normalizeSubjectKey(subjectCode);
      return Boolean(normalized && teacherSubjectCodes.includes(normalized));
    };

    const hasAllowedStudent = (studentId?: string | null) => {
      if (!enforceTeacherScope) {
        return true;
      }

      return Boolean(studentId && assignedStudentSet.has(studentId));
    };

    const hasAllowedCourse = (courseId?: string | null) => {
      if (!enforceTeacherScope) {
        return true;
      }

      return Boolean(courseId && assignedCourseSet.has(courseId));
    };

    const studentProgress = allStudentProgress.filter((mastery: any) =>
      hasAllowedSubject(mastery.skill?.subject?.code) && hasAllowedStudent(mastery.userId),
    );

    const sessions = allSessions.filter((session: any) => hasAllowedSubject(session.skill?.subject?.code) && hasAllowedStudent(session.userId));
    const courseSummaries = allCourseSummaries
      .filter((course: any) => hasAllowedSubject(course.subject?.code) && hasAllowedCourse(course.id))
      .map((course: any) => ({
        ...course,
        enrollments: (course.enrollments || []).filter((enrollment: any) => hasAllowedStudent(enrollment.userId)),
      }));

    const scopedStudentIds = new Set<string>();
    studentProgress.forEach((mastery: any) => scopedStudentIds.add(mastery.userId));
    sessions.forEach((session: any) => scopedStudentIds.add(session.userId));
    courseSummaries.forEach((course: any) => {
      (course.enrollments || []).forEach((enrollment: any) => scopedStudentIds.add(enrollment.userId));
    });

    const studentUsers = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              name: RoleName.STUDENT,
            },
          },
        },
        ...(enforceTeacherScope
          ? {
              id: {
                in: Array.from(scopedStudentIds).filter((studentId) => assignedStudentSet.has(studentId)),
              },
            }
          : {}),
      },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true,
            gradeBand: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by student
    const studentMap = new Map<string, any>();

    for (const student of studentUsers) {
      studentMap.set(student.id, {
        studentId: student.id,
        studentName: getDisplayName(student),
        email: student.email,
        gradeBand: student.profile?.gradeBand,
        skills: [],
        recommendedSkills: [],
        strengths: [],
        totalSkills: 0,
        masteredSkills: 0,
        proficientSkills: 0,
        averageMastery: 0,
        totalPracticeTime: 0,
        totalAttempts: 0,
        recentSessions: [],
      });
    }

    for (const mastery of studentProgress) {
      const studentId = mastery.userId;
      
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          studentId,
          studentName: getDisplayName(mastery.user),
          email: mastery.user.email,
          gradeBand: null,
          skills: [],
          recommendedSkills: [],
          strengths: [],
          totalSkills: 0,
          masteredSkills: 0,
          proficientSkills: 0,
          averageMastery: 0,
          totalPracticeTime: 0,
          totalAttempts: 0,
        });
      }

      const student = studentMap.get(studentId);
      student.skills.push({
        skillId: mastery.skillId,
        skillName: isRTL ? (mastery.skill.nameFA || mastery.skill.name) : mastery.skill.name,
        skillNameFA: mastery.skill.nameFA,
        subject: getLocalizedSubjectName(mastery.skill.subject, locale),
        subjectCode: mastery.skill.subject.code,
        masteryScore: mastery.masteryScore,
        masteryStatus: mastery.status,
        currentAbility: mastery.abilityEstimate,
        totalAttempts: mastery.questionsAttempted,
        correctAttempts: mastery.questionsCorrect,
        lastPracticedAt: mastery.lastPracticedAt,
      });

      student.totalSkills++;
      if (mastery.status === 'MASTERED' || mastery.status === 'EXPERT') {
        student.masteredSkills++;
      }
      if (mastery.status === 'PROFICIENT') {
        student.proficientSkills++;
      }
      student.totalAttempts += mastery.questionsAttempted;
    }

    // Calculate averages
    Array.from(studentMap.values()).forEach((student: any) => {
      if (student.totalSkills > 0) {
        const totalMastery = student.skills.reduce((sum: number, s: any) => sum + s.masteryScore, 0);
        student.averageMastery = Math.round(totalMastery / student.totalSkills);
      }

      const rankedSkills = [...student.skills].sort((a, b) => a.masteryScore - b.masteryScore);
      const recommendedSkills = rankedSkills.filter((skill) => skill.masteryScore < 80).slice(0, 3);
      const fallbackSkills = rankedSkills.slice(0, 3);
      const strengths = [...student.skills]
        .filter((skill) => skill.masteryScore >= 80)
        .sort((a, b) => b.masteryScore - a.masteryScore)
        .slice(0, 3);

      student.recommendedSkills = (recommendedSkills.length > 0 ? recommendedSkills : fallbackSkills).map((skill: any) => ({
        ...skill,
        practicePath: buildPracticePath(skill.skillId),
      }));
      student.strengths = strengths.map((skill: any) => ({
        ...skill,
        practicePath: buildPracticePath(skill.skillId),
      }));

      // Add practice time from sessions
      const studentSessions = sessions.filter((s: any) => s.userId === student.studentId);
      student.totalPracticeTime = studentSessions.reduce(
        (sum: number, s: any) => sum + (s.durationSeconds || 0),
        0
      );
      student.recentSessions = studentSessions.slice(0, 5).map((s: any) => ({
        id: s.id,
        skillName: isRTL ? (s.skill.nameFA || s.skill.name) : s.skill.name,
        subject: getLocalizedSubjectName(s.skill.subject, locale),
        questionsAnswered: s.questionsAttempted,
        correctAnswers: s.questionsCorrect,
        startedAt: s.startedAt,
        endedAt: s.completedAt,
        totalTime: s.durationSeconds,
      }));
    });

    const students = Array.from(studentMap.values());

    // Summary stats
    const summary = {
      totalStudents: students.length,
      averageMastery: students.length > 0
        ? Math.round(students.reduce((sum, s) => sum + s.averageMastery, 0) / students.length)
        : 0,
      totalPracticeSessions: sessions.length,
      studentsWithProgress: students.filter((s) => s.totalSkills > 0).length,
    };

    return NextResponse.json({
      success: true,
      students,
      generatedAt: new Date().toISOString(),
      summary,
      recentSessions: sessions.slice(0, 20).map((s: any) => ({
        id: s.id,
        studentName: getDisplayName(s.user),
        skillName: isRTL ? (s.skill.nameFA || s.skill.name) : s.skill.name,
        subject: getLocalizedSubjectName(s.skill.subject, locale),
        questionsAnswered: s.questionsAttempted,
        correctAnswers: s.questionsCorrect,
        accuracy: s.questionsAttempted > 0
          ? Math.round((s.questionsCorrect / s.questionsAttempted) * 100)
          : 0,
        startedAt: s.startedAt,
        endedAt: s.completedAt,
        totalTime: s.durationSeconds,
      })),
      courseSummaries: courseSummaries.map((course) => {
        const totalLessons = course.units.reduce((sum: number, unit: any) => sum + unit.lessons.length, 0);
        const averageProgress = course.enrollments.length > 0
          ? Math.round(course.enrollments.reduce((sum: number, enrollment: any) => sum + enrollment.progress, 0) / course.enrollments.length)
          : 0;

        return {
          id: course.id,
          title: isRTL ? (course.titleFA || course.title) : course.title,
          subject: getLocalizedSubjectName(course.subject, locale),
          subjectCode: course.subject.code,
          students: course.enrollments.length,
          lessons: totalLessons,
          progress: averageProgress,
          updatedAt: course.updatedAt,
        };
      }),
    });
  } catch (error) {
    console.error('Error fetching student progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student progress' },
      { status: 500 }
    );
  }
}
