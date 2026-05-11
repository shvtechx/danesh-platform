import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { skillId: string } }
) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as any)?.id || request.headers.get('x-demo-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { skillId } = params;

    // Get mastery record
    const mastery = await prisma.skillMastery.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
      include: {
        skill: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!mastery) {
      // Return default "not started" state
      const skill = await prisma.skill.findUnique({
        where: { id: skillId },
        include: {
          subject: true,
        },
      });

      if (!skill) {
        return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
      }

      return NextResponse.json({
        skill,
        abilityEstimate: 0,
        masteryScore: 0,
        status: 'NOT_STARTED',
        questionsAttempted: 0,
        questionsCorrect: 0,
        lastPracticedAt: null,
      });
    }

    // Get recent practice history
    const recentSessions = await prisma.practiceSession.findMany({
      where: {
        userId,
        skillId,
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 5,
    });

    // Get prerequisite status
    const prerequisites = await prisma.skillPrerequisite.findMany({
      where: {
        skillId,
        isRequired: true,
      },
      include: {
        prerequisite: {
          include: {
            masteryRecords: {
              where: {
                userId,
              },
            },
          },
        },
      },
    });

    const prerequisitesMet = prerequisites.every(
      prereq =>
        prereq.prerequisite.masteryRecords[0]?.masteryScore >= 70
    );

    return NextResponse.json({
      ...mastery,
      recentSessions,
      prerequisitesMet,
      prerequisites: prerequisites.map(p => ({
        id: p.prerequisite.id,
        name: p.prerequisite.name,
        nameFA: p.prerequisite.nameFA,
        mastery: p.prerequisite.masteryRecords[0]?.masteryScore || 0,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching skill mastery:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch skill mastery' },
      { status: 500 }
    );
  }
}
