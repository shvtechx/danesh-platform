import { promises as fs } from 'fs';
import path from 'path';
import { buildLiveClassPath, sanitizeLiveRoomName } from '@/lib/live/provider';

const announcementsFilePath = path.join(process.cwd(), 'data', 'live_announcements.json');
const LIVE_ANNOUNCEMENT_TTL_MS = 3 * 60 * 1000;

export type LiveAnnouncementRecord = {
  id: string;
  roomName: string;
  title: string;
  locale: string;
  teacherId: string | null;
  teacherName: string | null;
  courseId: string | null;
  lessonId: string | null;
  startedAt: string;
  updatedAt: string;
  expiresAt: string;
};

function parseLiveRoomContext(roomName: string) {
  const safeRoomName = sanitizeLiveRoomName(roomName);
  const lessonMatch = safeRoomName.match(/^danesh-course-(.+?)-lesson-(.+?)-live$/i);
  if (lessonMatch) {
    return {
      courseId: lessonMatch[1] || null,
      lessonId: lessonMatch[2] || null,
    };
  }

  const courseMatch = safeRoomName.match(/^danesh-course-(.+?)-live$/i);
  if (courseMatch) {
    return {
      courseId: courseMatch[1] || null,
      lessonId: null,
    };
  }

  return {
    courseId: null,
    lessonId: null,
  };
}

function isAnnouncementActive(announcement: LiveAnnouncementRecord, now = Date.now()) {
  return new Date(announcement.expiresAt).getTime() > now;
}

async function readStoredAnnouncements(): Promise<LiveAnnouncementRecord[]> {
  try {
    const raw = await fs.readFile(announcementsFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LiveAnnouncementRecord[]) : [];
  } catch {
    return [];
  }
}

async function writeStoredAnnouncements(announcements: LiveAnnouncementRecord[]) {
  await fs.mkdir(path.dirname(announcementsFilePath), { recursive: true });
  await fs.writeFile(announcementsFilePath, JSON.stringify(announcements, null, 2), 'utf-8');
}

async function pruneExpiredAnnouncements(announcements?: LiveAnnouncementRecord[]) {
  const records = announcements || (await readStoredAnnouncements());
  const activeAnnouncements = records.filter((announcement) => isAnnouncementActive(announcement));

  if (activeAnnouncements.length !== records.length) {
    await writeStoredAnnouncements(activeAnnouncements);
  }

  return activeAnnouncements;
}

export async function getActiveLiveAnnouncements(options?: { locale?: string; courseIds?: string[] }) {
  const locale = options?.locale?.trim() || 'en';
  const requestedCourseIds = new Set((options?.courseIds || []).filter(Boolean));
  const activeAnnouncements = await pruneExpiredAnnouncements();

  return activeAnnouncements
    .filter((announcement) => {
      if (requestedCourseIds.size === 0) {
        return true;
      }

      if (!announcement.courseId) {
        return true;
      }

      return requestedCourseIds.has(announcement.courseId);
    })
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .map((announcement) => ({
      ...announcement,
      joinPath: buildLiveClassPath(locale, announcement.roomName, { title: announcement.title }),
    }));
}

export async function upsertLiveAnnouncement(input: {
  roomName: string;
  title: string;
  locale?: string;
  teacherId?: string | null;
  teacherName?: string | null;
}) {
  const roomName = sanitizeLiveRoomName(input.roomName);
  if (!roomName) {
    throw new Error('Invalid room name');
  }

  const title = input.title.trim();
  if (!title) {
    throw new Error('Invalid live class title');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + LIVE_ANNOUNCEMENT_TTL_MS).toISOString();
  const records = await pruneExpiredAnnouncements();
  const context = parseLiveRoomContext(roomName);
  const existingRecord = records.find((announcement) => announcement.roomName === roomName);

  const announcement: LiveAnnouncementRecord = existingRecord
    ? {
        ...existingRecord,
        title,
        locale: input.locale?.trim() || existingRecord.locale || 'en',
        teacherId: input.teacherId ?? existingRecord.teacherId ?? null,
        teacherName: input.teacherName?.trim() || existingRecord.teacherName || null,
        updatedAt: now.toISOString(),
        expiresAt,
      }
    : {
        id: `live-${roomName}`,
        roomName,
        title,
        locale: input.locale?.trim() || 'en',
        teacherId: input.teacherId ?? null,
        teacherName: input.teacherName?.trim() || null,
        courseId: context.courseId,
        lessonId: context.lessonId,
        startedAt: now.toISOString(),
        updatedAt: now.toISOString(),
        expiresAt,
      };

  const nextRecords = [announcement, ...records.filter((record) => record.roomName !== roomName)];
  await writeStoredAnnouncements(nextRecords);

  return announcement;
}

export async function endLiveAnnouncement(roomName: string) {
  const safeRoomName = sanitizeLiveRoomName(roomName);
  if (!safeRoomName) {
    return false;
  }

  const records = await pruneExpiredAnnouncements();
  const nextRecords = records.filter((announcement) => announcement.roomName !== safeRoomName);

  if (nextRecords.length === records.length) {
    return false;
  }

  await writeStoredAnnouncements(nextRecords);
  return true;
}
