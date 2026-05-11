import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { resolveRequestUserId } from '@/lib/auth/request-user';

const prismaClient = prisma as any;

export async function POST(request: NextRequest) {
  try {
    const requestUserId = resolveRequestUserId(request);

    const body = await request.json();
    const {
      code,
      name,
      nameFA,
      description,
      descriptionFA,
      subjectId,
      strandId,
      gradeBandMin,
      gradeBandMax,
      order,
    } = body;

    // Validation
    if (!code || !name || !subjectId || !gradeBandMin || !gradeBandMax) {
      return NextResponse.json(
        { error: 'Missing required fields: code, name, subjectId, gradeBandMin, gradeBandMax' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prismaClient.skill.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Skill with code "${code}" already exists` },
        { status: 409 }
      );
    }

    // Create the skill
    const skill = await prismaClient.skill.create({
      data: {
        code,
        name,
        nameFA: nameFA || null,
        description: description || null,
        descriptionFA: descriptionFA || null,
        subjectId,
        strandId: strandId || null,
        gradeBandMin,
        gradeBandMax,
        order: order || 0,
        isActive: true,
      },
      include: {
        subject: true,
      },
    });

    const strand = strandId
      ? await prismaClient.strand.findUnique({
          where: { id: strandId },
          select: {
            id: true,
            name: true,
            nameFA: true,
          },
        })
      : null;

    return NextResponse.json(
      {
        skill: {
          ...skill,
          strand,
        },
        requestUserId,
        message: 'Skill created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating skill:', error);
    return NextResponse.json(
      { error: 'Failed to create skill' },
      { status: 500 }
    );
  }
}
