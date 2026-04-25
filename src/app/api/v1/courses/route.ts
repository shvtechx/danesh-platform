import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
    // TODO: Add authentication and authorization check
    const body = await request.json();

    const course = await prisma.course.create({
      data: {
        code: body.code,
        frameworkId: body.frameworkId,
        gradeLevelId: body.gradeLevelId,
        subjectId: body.subjectId,
        title: body.title,
        titleFA: body.titleFA,
        description: body.description,
        descriptionFA: body.descriptionFA,
        coverImage: body.coverImage,
        isPublished: false,
      },
    });

    return NextResponse.json(
      { message: 'Course created successfully', course },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
