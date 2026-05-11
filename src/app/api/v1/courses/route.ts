import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createCourseSchema = z.object({
  code: z.string().min(1),
  frameworkId: z.string().min(1),
  gradeLevelId: z.string().min(1),
  subjectId: z.string().min(1),
  title: z.string().min(1),
  titleFA: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionFA: z.string().optional().nullable(),
  coverImage: z.string().url().optional().or(z.literal('')).nullable(),
  isPublished: z.boolean().optional(),
});

async function resolveFrameworkId(value: string) {
  const framework = await prisma.curriculumFramework.findFirst({
    where: {
      OR: [
        { id: value },
        { code: value },
      ],
    },
    select: {
      id: true,
    },
  });

  return framework?.id || null;
}

async function resolveGradeLevelId(value: string) {
  const gradeLevel = await prisma.gradeLevel.findFirst({
    where: {
      OR: [
        { id: value },
        { code: value },
      ],
    },
    select: {
      id: true,
    },
  });

  return gradeLevel?.id || null;
}

// GET /api/v1/courses - List all courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const frameworkId = searchParams.get('frameworkId');
    const gradeLevelId = searchParams.get('gradeLevelId');
    const subjectId = searchParams.get('subjectId');
    const search = searchParams.get('search');
    const locale = searchParams.get('locale') || 'en';
    const publishedOnly = searchParams.get('publishedOnly') !== 'false';

    // Build where clause
    const where: any = {};

    if (publishedOnly) {
      where.isPublished = true;
    }

    if (frameworkId) {
      where.frameworkId = frameworkId;
    }

    if (gradeLevelId) {
      where.gradeLevelId = gradeLevelId;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { titleFA: { contains: search, mode: 'insensitive' } },
        { descriptionFA: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch courses with pagination
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          framework: {
            select: {
              name: true,
              nameFA: true,
              code: true,
            },
          },
          gradeLevel: {
            select: {
              id: true,
              code: true,
              name: true,
              nameFA: true,
              gradeBand: true,
            },
          },
          subject: {
            select: {
              id: true,
              code: true,
              name: true,
              nameFA: true,
            },
          },
          units: {
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.count({ where }),
    ]);

    // Transform courses for response
    const transformedCourses = courses.map((course: any) => ({
      id: course.id,
      code: course.code,
      title: locale === 'fa' ? (course.titleFA || course.title) : course.title,
      description: locale === 'fa' ? (course.descriptionFA || course.description) : course.description,
      coverImage: course.coverImage,
      gradeBand: course.gradeLevel.gradeBand,
      gradeLevel: course.gradeLevel,
      subject: course.subject,
      framework: {
        code: course.framework.code,
        name: locale === 'fa' ? (course.framework.nameFA || course.framework.name) : course.framework.name,
      },
      isPublished: course.isPublished,
      unitsCount: course.units.length,
      totalLessons: course.units.reduce((total: number, unit: any) => total + (unit.lessons?.length || 0), 0),
      enrollmentsCount: course._count.enrollments,
    }));

    return NextResponse.json({
      courses: transformedCourses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST /api/v1/courses - Create a new course (Admin/Teacher only)
export async function POST(request: NextRequest) {
  try {
    const body = createCourseSchema.parse(await request.json());

    const [frameworkId, gradeLevelId] = await Promise.all([
      resolveFrameworkId(body.frameworkId),
      resolveGradeLevelId(body.gradeLevelId),
    ]);

    if (!frameworkId) {
      return NextResponse.json({ error: 'Invalid curriculum framework' }, { status: 400 });
    }

    if (!gradeLevelId) {
      return NextResponse.json({ error: 'Invalid grade level' }, { status: 400 });
    }

    const existingCourse = await prisma.course.findUnique({ where: { code: body.code } });
    if (existingCourse) {
      return NextResponse.json({ error: 'Course code already exists' }, { status: 409 });
    }

    const course = await prisma.course.create({
      data: {
        code: body.code,
        frameworkId,
        gradeLevelId,
        subjectId: body.subjectId,
        title: body.title,
        titleFA: body.titleFA,
        description: body.description,
        descriptionFA: body.descriptionFA,
        coverImage: body.coverImage || null,
        isPublished: body.isPublished ?? false,
      },
    });

    return NextResponse.json(
      { message: 'Course created successfully', course },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid course payload', details: error.errors }, { status: 400 });
    }

    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
