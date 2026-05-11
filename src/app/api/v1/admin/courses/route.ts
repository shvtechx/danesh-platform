/**
 * Admin Course Management API
 * GET  /api/v1/admin/courses         — list all courses with member counts
 * POST /api/v1/admin/courses         — create a new course
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const courses = await prisma.course.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        subject: { select: { id: true, name: true, nameFA: true, code: true } },
        gradeLevel: { select: { id: true, name: true, nameFA: true } },
        enrollments: { select: { userId: true } },
        units: {
          select: {
            lessons: { select: { id: true, isPublished: true } },
          },
        },
      },
      orderBy: { title: 'asc' },
    });

    return NextResponse.json({
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        titleFA: c.titleFA,
        code: c.code,
        isPublished: c.isPublished,
        coverImage: c.coverImage,
        subject: c.subject,
        gradeLevel: c.gradeLevel,
        enrollmentCount: c.enrollments.length,
        lessonCount: c.units.reduce((sum, u) => sum + u.lessons.length, 0),
        publishedLessonCount: c.units.reduce((sum, u) => sum + u.lessons.filter((l) => l.isPublished).length, 0),
      })),
    });
  } catch (error) {
    console.error('GET /admin/courses error:', error);
    return NextResponse.json({ error: 'Failed to load courses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, titleFA, code, subjectId, gradeLevelId, frameworkId, description } = body;

    if (!title || !subjectId || !gradeLevelId) {
      return NextResponse.json({ error: 'title, subjectId, and gradeLevelId are required' }, { status: 400 });
    }

    // Auto-generate code if not provided
    const courseCode = code || `COURSE-${Date.now()}`;

    // Check for duplicate code
    const existing = await prisma.course.findUnique({ where: { code: courseCode } });
    if (existing) {
      return NextResponse.json({ error: `Course code "${courseCode}" already exists` }, { status: 409 });
    }

    // Get a default framework if not provided
    let framework = frameworkId;
    if (!framework) {
      const defaultFramework = await prisma.curriculumFramework.findFirst();
      if (!defaultFramework) {
        return NextResponse.json({ error: 'No curriculum framework found in DB. Please seed first.' }, { status: 422 });
      }
      framework = defaultFramework.id;
    }

    const course = await prisma.course.create({
      data: {
        title,
        titleFA: titleFA || null,
        code: courseCode,
        subjectId,
        gradeLevelId,
        frameworkId: framework,
        description: description || null,
        isPublished: false,
      },
      include: {
        subject: { select: { name: true, nameFA: true } },
        gradeLevel: { select: { name: true, nameFA: true } },
      },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error('POST /admin/courses error:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
