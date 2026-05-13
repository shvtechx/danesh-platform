import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { resolveRequestUserId } from '@/lib/auth/request-user';
import { endLiveAnnouncement, getActiveLiveAnnouncements, upsertLiveAnnouncement } from '@/lib/live/announcements';

const heartbeatSchema = z.object({
  roomName: z.string().min(1),
  title: z.string().min(1).max(160),
  locale: z.string().optional(),
  teacherId: z.string().optional().nullable(),
  teacherName: z.string().optional().nullable(),
  state: z.enum(['live', 'ended']).optional().default('live'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale')?.trim() || 'en';
    const userId = resolveRequestUserId(request);

    let enrolledCourseIds: string[] | undefined;

    if (userId) {
      try {
        const enrollments = await prisma.courseEnrollment.findMany({
          where: { userId },
          select: { courseId: true },
        });
        enrolledCourseIds = enrollments.map((enrollment) => enrollment.courseId).filter(Boolean);
      } catch {
        enrolledCourseIds = undefined;
      }
    }

    const announcements = await getActiveLiveAnnouncements({
      locale,
      courseIds: enrolledCourseIds,
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Error fetching live announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch live announcements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = heartbeatSchema.parse(await request.json());
    const teacherId = parsed.teacherId || resolveRequestUserId(request);

    if (parsed.state === 'ended') {
      await endLiveAnnouncement(parsed.roomName);
      return NextResponse.json({ success: true, state: 'ended' });
    }

    const announcement = await upsertLiveAnnouncement({
      roomName: parsed.roomName,
      title: parsed.title,
      locale: parsed.locale,
      teacherId,
      teacherName: parsed.teacherName,
    });

    return NextResponse.json({ success: true, announcement }, { status: 201 });
  } catch (error) {
    console.error('Error updating live announcements:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to update live announcements' }, { status: 500 });
  }
}
