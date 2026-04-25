import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: { courseId: string };
}

// GET /api/v1/courses/[courseId] - Get single course with details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      include: {
        framework: true,
        gradeLevel: true,
        subject: true,
        units: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                titleFA: true,
                sequence: true,
                phase: true,
                estimatedTime: true,
              },
              orderBy: { sequence: 'asc' },
            },
          },
          orderBy: { sequence: 'asc' },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Transform for response
    const transformedCourse = {
      id: course.id,
      title: locale === 'fa' ? (course.titleFA || course.title) : course.title,
      description: locale === 'fa' ? (course.descriptionFA || course.description) : course.description,
      coverImage: course.coverImage,
      gradeBand: course.gradeLevel.gradeBand,
      gradeLevel: course.gradeLevel,
      subject: course.subject,
      isPublished: course.isPublished,
      framework: {
        id: course.framework.id,
        code: course.framework.code,
        name: locale === 'fa' ? (course.framework.nameFA || course.framework.name) : course.framework.name,
      },
      units: course.units.map((unit: any) => ({
        id: unit.id,
        title: locale === 'fa' ? (unit.titleFA || unit.title) : unit.title,
        description: locale === 'fa' ? (unit.descriptionFA || unit.description) : unit.description,
        sequence: unit.sequence,
        lessons: unit.lessons.map((lesson: any) => ({
          id: lesson.id,
          title: locale === 'fa' ? (lesson.titleFA || lesson.title) : lesson.title,
          sequence: lesson.sequence,
          phase: lesson.phase,
          estimatedTime: lesson.estimatedTime,
        })),
      })),
      enrollmentsCount: course._count.enrollments,
      totalLessons: course.units.reduce((acc: number, unit: any) => acc + unit.lessons.length, 0),
      totalDuration: course.units.reduce(
        (acc: number, unit: any) => acc + unit.lessons.reduce((lacc: number, lesson: any) => lacc + (lesson.estimatedTime || 0), 0),
        0
      ),
    };

    return NextResponse.json(transformedCourse);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/courses/[courseId] - Update course
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // TODO: Add authentication and authorization
    const body = await request.json();

    const course = await prisma.course.update({
      where: { id: params.courseId },
      data: {
        title: body.title,
        titleFA: body.titleFA,
        description: body.description,
        descriptionFA: body.descriptionFA,
        coverImage: body.coverImage,
        frameworkId: body.frameworkId,
        gradeLevelId: body.gradeLevelId,
        subjectId: body.subjectId,
        isPublished: body.isPublished,
      },
    });

    return NextResponse.json({
      message: 'Course updated successfully',
      course,
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/courses/[courseId] - Delete course
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // TODO: Add authentication and authorization (Admin only)
    
    await prisma.course.delete({
      where: { id: params.courseId },
    });

    return NextResponse.json({
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
