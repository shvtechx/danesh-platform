import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveRequestUserId } from '@/lib/auth/request-user';
import { isGradeBandInRange, shouldExposePrerequisiteSupport } from '@/lib/learning/content-eligibility';

const prismaClient = prisma as any;

function isMeaningfulSkill(skill: {
  code?: string | null;
  name?: string | null;
  nameFA?: string | null;
  description?: string | null;
  descriptionFA?: string | null;
}) {
  const value = [skill.code, skill.name, skill.nameFA, skill.description, skill.descriptionFA]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return !/(^|\b)(test|demo|dummy|placeholder|sample)(\b|_)/i.test(value);
}

export async function GET(request: NextRequest) {
  try {
    const userId = resolveRequestUserId(request);

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId') || undefined;
    const subjectCode = searchParams.get('subject') || undefined;
    const strandId = searchParams.get('strandId') || undefined;
    const userProfile = userId
      ? await prismaClient.user.findUnique({
          where: { id: userId },
          select: {
            profile: {
              select: {
                gradeBand: true,
              },
            },
          },
        })
      : null;

    const enrolledSubjects = userId
      ? await prismaClient.courseEnrollment.findMany({
          where: { userId },
          select: {
            course: {
              select: {
                subjectId: true,
              },
            },
          },
        })
      : [];

    const preferredSubjectIds = new Set(
      enrolledSubjects.map((enrollment: any) => enrollment.course?.subjectId).filter(Boolean),
    );

    // Build where clause
    const where: any = {};
    if (subjectId) {
      where.subjectId = subjectId;
    } else if (subjectCode) {
      // If filtering by subject code, we need to join through the subject relation
      where.subject = {
        code: subjectCode,
      };
    }
    if (strandId) where.strandId = strandId;
    // Note: gradeBand fields are enums (EARLY_YEARS, PRIMARY, etc.), not numbers
    // For now, we skip grade level filtering and let the frontend handle it

    // Fetch all skills matching filters
    const skills = await prismaClient.skill.findMany({
      where: {
        ...where,
        isActive: true,
        questions: {
          some: {
            stem: {
              not: '',
            },
            options: {
              some: {},
            },
          },
        },
      },
      include: {
        subject: true,
        prerequisites: {
          include: {
            prerequisite: true,
          },
        },
        masteryRecords: {
          ...(userId
            ? {
                where: {
                  userId,
                },
              }
            : {}),
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' },
      ],
    });

    const strandIds = Array.from(
      new Set(skills.map((skill: any) => skill.strandId).filter(Boolean))
    ) as string[];

    const strands = strandIds.length
      ? await prismaClient.strand.findMany({
          where: {
            id: { in: strandIds },
          },
        })
      : [];

    const strandMap = new Map(strands.map((strand: any) => [strand.id, strand]));

    // Get all prerequisite masteries for current user
    const allPrerequisiteIds = skills.flatMap((skill: any) =>
      skill.prerequisites.map((p: any) => p.prerequisiteId)
    );

    const prerequisiteMasteries = await prismaClient.skillMastery.findMany({
      where: {
        ...(userId ? { userId } : { userId: '__no-user__' }),
        skillId: { in: allPrerequisiteIds },
      },
    });

    const masteryMap = new Map(
      prerequisiteMasteries.map((m: any) => [m.skillId, m.masteryScore])
    );

    // Enrich skills with prerequisite status
    const enrichedSkills = skills
      .map((skill: any) => {
      const mastery = skill.masteryRecords[0];
      const strand = (skill.strandId ? strandMap.get(skill.strandId) ?? null : null) as any;
      
      // Check if all required prerequisites are met
      const requiredPrereqs = skill.prerequisites.filter((p: any) => p.isRequired);
      const prerequisitesMet = requiredPrereqs.every(
        (p: any) => Number(masteryMap.get(p.prerequisiteId) || 0) >= 70
      );

      return {
        id: skill.id,
        code: skill.code,
        name: skill.name,
        nameFA: skill.nameFA,
        description: skill.description || '',
        descriptionFA: skill.descriptionFA || '',
        gradeBandMin: skill.gradeBandMin,
        gradeBandMax: skill.gradeBandMax,
        subject: {
          id: skill.subject.id,
          code: skill.subject.code,
          name: skill.subject.name,
          nameFA: skill.subject.nameFA,
        },
        strand: strand ? {
          id: strand.id,
          name: strand.name,
          nameFA: strand.nameFA,
        } : null,
        mastery: mastery ? {
          masteryScore: mastery.masteryScore,
          status: mastery.status,
          abilityEstimate: mastery.abilityEstimate,
          lastPracticedAt: mastery.lastPracticedAt,
          questionsAttempted: mastery.questionsAttempted,
          questionsCorrect: mastery.questionsCorrect,
        } : null,
        masteryStatus: mastery?.status || 'NOT_STARTED',
        prerequisitesMet,
        questionCount: skill._count?.questions || 0,
        recommendedForStudent: preferredSubjectIds.has(skill.subjectId),
        prerequisites: skill.prerequisites.map((p: any) => ({
          id: p.prerequisite.id,
          name: p.prerequisite.name,
          nameFA: p.prerequisite.nameFA,
          gradeBandMin: p.prerequisite.gradeBandMin,
          gradeBandMax: p.prerequisite.gradeBandMax,
          isRequired: p.isRequired,
          mastery: masteryMap.get(p.prerequisiteId) || 0,
        })),
      };
      })
      .filter((skill: any) => isMeaningfulSkill(skill))
      .filter((skill: any) => skill.questionCount > 0);

    const studentGradeBand = userProfile?.profile?.gradeBand || null;
    const onGradeSkillIds = new Set(
      enrichedSkills
        .filter((skill: any) => isGradeBandInRange(studentGradeBand, skill.gradeBandMin, skill.gradeBandMax))
        .map((skill: any) => skill.id),
    );

    const prerequisiteSupportIds = new Set<string>();
    enrichedSkills
      .filter((skill: any) => onGradeSkillIds.has(skill.id))
      .forEach((skill: any) => {
        skill.prerequisites.forEach((prerequisite: any) => {
          if (
            shouldExposePrerequisiteSupport({
              studentGradeBand,
              prerequisiteGradeBandMax: prerequisite.gradeBandMax,
              prerequisiteMastery: prerequisite.mastery,
              isRequired: prerequisite.isRequired,
            })
          ) {
            prerequisiteSupportIds.add(prerequisite.id);
          }
        });
      });

    const visibleSkillIds = new Set([...Array.from(onGradeSkillIds), ...Array.from(prerequisiteSupportIds)]);

    const visibleSkills = enrichedSkills
      .filter((skill: any) => visibleSkillIds.has(skill.id))
      .map((skill: any) => ({
        ...skill,
        visibilityMode: onGradeSkillIds.has(skill.id) ? 'ON_GRADE' : 'PREREQUISITE_SUPPORT',
      }))
      .sort((left: any, right: any) => {
        if (left.recommendedForStudent !== right.recommendedForStudent) {
          return left.recommendedForStudent ? -1 : 1;
        }

        if (left.visibilityMode !== right.visibilityMode) {
          return left.visibilityMode === 'ON_GRADE' ? -1 : 1;
        }

        if (left.prerequisitesMet !== right.prerequisitesMet) {
          return left.prerequisitesMet ? -1 : 1;
        }

        if ((left.subject?.name || '') !== (right.subject?.name || '')) {
          return (left.subject?.name || '').localeCompare(right.subject?.name || '');
        }

        return (left.name || '').localeCompare(right.name || '');
      });

    const availableSubjects = Array.from(
      new Map(
        visibleSkills.map((skill: any) => [
          skill.subject.id,
          {
            id: skill.subject.id,
            code: skill.subject.code,
            name: skill.subject.name,
            nameFA: skill.subject.nameFA,
          },
        ]),
      ).values(),
    );

    return NextResponse.json({
      skills: visibleSkills,
      meta: {
        studentGradeBand,
        prerequisiteSupportEnabled: true,
        availableSubjects,
      },
    });
  } catch (error: any) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}
