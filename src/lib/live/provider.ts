export type LiveClassProvider = 'disabled' | 'jitsi' | 'bigbluebutton';

export function sanitizeLiveRoomName(roomName: string) {
  return roomName
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function normalizeProvider(value: string | null | undefined): LiveClassProvider {
  const normalized = (value || '').trim().toLowerCase();

  if (normalized === 'disabled' || normalized === 'none' || normalized === 'off') {
    return 'disabled';
  }

  if (normalized === 'bbb' || normalized === 'bigbluebutton') {
    return 'bigbluebutton';
  }

  return 'jitsi';
}

export function getLiveClassProvider(): LiveClassProvider {
  const enabled = (process.env.NEXT_PUBLIC_ENABLE_LIVE_CLASSES || 'true').trim().toLowerCase();
  if (enabled === 'false') {
    return 'disabled';
  }

  return normalizeProvider(process.env.NEXT_PUBLIC_LIVE_CLASS_PROVIDER);
}

export function areLiveClassesEnabled() {
  return getLiveClassProvider() !== 'disabled';
}

export function isJitsiLiveProvider() {
  return getLiveClassProvider() === 'jitsi';
}

export function getLiveClassProviderLabel(locale: string, provider = getLiveClassProvider()) {
  const isRTL = locale === 'fa';

  if (provider === 'bigbluebutton') {
    return isRTL ? 'BigBlueButton' : 'BigBlueButton';
  }

  if (provider === 'disabled') {
    return isRTL ? 'غیرفعال' : 'Disabled';
  }

  return isRTL ? 'Jitsi / 8x8' : 'Jitsi / 8x8';
}

export function humanizeLiveRoomName(roomName: string) {
  return sanitizeLiveRoomName(roomName)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getLiveClassAvailabilityMessage(locale: string, provider = getLiveClassProvider()) {
  const isRTL = locale === 'fa';

  if (provider === 'disabled') {
    return isRTL
      ? 'کلاس زنده در این محیط با متغیر تنظیمات غیرفعال شده است.'
      : 'Live classes are disabled in this environment by configuration.';
  }

  if (provider === 'bigbluebutton') {
    return isRTL
      ? 'BigBlueButton به‌عنوان ارائه‌دهنده فعال انتخاب شده است. کافی است یکپارچه‌سازی آن اضافه شود و همین مسیرها دوباره استفاده خواهند شد.'
      : 'BigBlueButton is selected as the active provider. Once its integration is added, these same routes will continue to work.';
  }

  return isRTL
    ? 'کلاس زنده با Jitsi / 8x8 فعال است.'
    : 'Live classes are enabled with Jitsi / 8x8.';
}

export function buildLiveClassPath(
  locale: string,
  roomName: string,
  options?: { role?: 'moderator' | 'participant'; title?: string },
) {
  const safeRoomName = sanitizeLiveRoomName(roomName);
  if (!safeRoomName) {
    return '';
  }

  const path = `/${locale}/live/${safeRoomName}`;
  const params = new URLSearchParams();

  if (options?.role === 'moderator') {
    params.set('role', 'moderator');
  }

  if (options?.title?.trim()) {
    params.set('title', options.title.trim());
  }

  const queryString = params.toString();
  if (queryString) {
    return `${path}?${queryString}`;
  }

  return path;
}

export function buildCourseLiveRoomName(courseId: string) {
  return sanitizeLiveRoomName(`danesh-course-${courseId}-live`);
}

export function buildLessonLiveRoomName(courseId: string, lessonId: string) {
  return sanitizeLiveRoomName(`danesh-course-${courseId}-lesson-${lessonId}-live`);
}