import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { resolveRequestUserId } from '@/lib/auth/request-user';
import { canStudentEnrollInCourse } from '@/lib/learning/content-eligibility';

const enrollCourseSchema = z.object({
  courseId: z.string().min(1).optional(),
  courseTitle: z.string().min(1).optional(),
  courseTitleFA: z.string().min(1).optional(),
}).refine((value) => value.courseId || value.courseTitle || value.courseTitleFA, {
  message: 'Course identifier is required',
});

/**
 * GET /api/v1/student/courses
 * Get all courses enrolled by the current student with lessons and completion status
 */
export async function GET(request: NextRequest) {
  try {
    const userId = resolveRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        userId,
      },
      include: {
        course: {
          include: {
            subject: true,
            units: {
              include: {
                lessons: {
                  include: {
                    completions: {
                      where: {
                        userId,
                      },
                    },
                  },
                  orderBy: { sequence: 'asc' },
                },
              },
              orderBy: { sequence: 'asc' },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    // Format response
    const formattedCourses = enrollments.map((enrollment) => ({
      id: enrollment.course.id,
      title: enrollment.course.title,
      titleFA: enrollment.course.titleFA,
      description: enrollment.course.description,
      descriptionFA: enrollment.course.descriptionFA,
      subject: enrollment.course.subject,
      enrollment: {
        id: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        progress: enrollment.progress,
      },
      units: enrollment.course.units.map((unit) => ({
        ...unit,
        lessons: unit.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          titleFA: lesson.titleFA,
          phase: lesson.phase,
          estimatedTime: lesson.estimatedTime,
          completion: lesson.completions[0] || null
        }))
      }))
    }));

    return NextResponse.json({ courses: formattedCourses });
  } catch (error) {
    console.error('Error fetching student courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/student/courses
 * Enroll the current student in a published course
 */
export async function POST(request: NextRequest) {
  try {
    const userId = resolveRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = enrollCourseSchema.parse(await request.json());

    const course = await prisma.course.findFirst({
      where: {
        isPublished: true,
        OR: [
          ...(body.courseId ? [{ id: body.courseId }] : []),
          ...(body.courseTitle ? [{ title: body.courseTitle }] : []),
          ...(body.courseTitleFA ? [{ titleFA: body.courseTitleFA }] : []),
        ],
      },
      select: {
        id: true,
        title: true,
        titleFA: true,
        gradeLevel: {
          select: {
            gradeBand: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        profile: {
          select: {
            gradeBand: true,
          },
        },
      },
    });

    const studentGradeBand = student?.profile?.gradeBand || null;
    if (!canStudentEnrollInCourse(studentGradeBand, course.gradeLevel?.gradeBand)) {
      return NextResponse.json(
        {
          error: 'Course grade level does not match the student placement',
          details: {
            studentGradeBand,
            courseGradeBand: course.gradeLevel?.gradeBand || null,
          },
        },
        { status: 400 },
      );
    }

    const enrollment = await prisma.courseEnrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId: course.id,
        },
      },
      update: {},
      create: {
        userId,
        courseId: course.id,
      },
    });

    return NextResponse.json(
      {
        message: 'Enrolled successfully',
        course,
        enrollment,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid enrollment payload', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error enrolling student in course:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in course' },
      { status: 500 }
    );
  }
}
