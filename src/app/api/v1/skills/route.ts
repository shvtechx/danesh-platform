import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveRequestUserId } from '@/lib/auth/request-user';

const prismaClient = prisma as any;

export async function GET(request: NextRequest) {
  try {
    const userId = resolveRequestUserId(request);

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId') || undefined;
    const subjectCode = searchParams.get('subject') || undefined;
    const strandId = searchParams.get('strandId') || undefined;
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
    const enrichedSkills = skills.map((skill: any) => {
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
        prerequisites: skill.prerequisites.map((p: any) => ({
          id: p.prerequisite.id,
          name: p.prerequisite.name,
          nameFA: p.prerequisite.nameFA,
          isRequired: p.isRequired,
          mastery: masteryMap.get(p.prerequisiteId) || 0,
        })),
      };
    });

    return NextResponse.json({ skills: enrichedSkills });
  } catch (error: any) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}
