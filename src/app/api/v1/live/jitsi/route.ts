import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestUserId } from '@/lib/auth/request-user';
import { createJaaSJwt, getServerJaaSConfig } from '@/lib/live/jaas-server';
import { areLiveClassesEnabled, getLiveClassProvider } from '@/lib/live/provider';
import {
  type JitsiBootstrapPayload,
  type LiveClassMode,
  buildJitsiMeetingUrl,
  getDefaultLiveDisplayName,
  getJitsiDomain,
  isJaaSEnabled,
  parseLiveClassRole,
  sanitizeJitsiRoomName,
} from '@/lib/live/jitsi';

export const runtime = 'nodejs';

function normalizeOptionalValue(value: string | null) {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : null;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const locale = url.searchParams.get('locale') === 'fa' ? 'fa' : 'en';

  if (!areLiveClassesEnabled()) {
    return NextResponse.json(
      { error: locale === 'fa' ? 'کلاس زنده در این محیط غیرفعال است.' : 'Live classes are disabled in this environment.' },
      { status: 503 },
    );
  }

  if (getLiveClassProvider() !== 'jitsi') {
    return NextResponse.json(
      { error: locale === 'fa' ? 'ارائه‌دهنده فعال فعلی Jitsi نیست.' : 'The active live-class provider is not Jitsi.' },
      { status: 409 },
    );
  }

  const roomName = sanitizeJitsiRoomName(url.searchParams.get('roomName') || '');
  const role = parseLiveClassRole(url.searchParams.get('role'));

  if (!roomName) {
    return NextResponse.json(
      { error: locale === 'fa' ? 'نام اتاق الزامی است.' : 'Room name is required.' },
      { status: 400 },
    );
  }

  const serverConfig = getServerJaaSConfig();
  const displayName = normalizeOptionalValue(url.searchParams.get('displayName')) || getDefaultLiveDisplayName(role, locale);
  const email = normalizeOptionalValue(url.searchParams.get('email'));
  const userId = resolveRequestUserId(request) || undefined;
  const preferredMode: LiveClassMode = isJaaSEnabled()
    ? serverConfig.isReady
      ? 'jaas-ready'
      : 'jaas-incomplete'
    : 'public';
  let mode = preferredMode;
  let domain = serverConfig.domain || getJitsiDomain();
  let apiRoomName = serverConfig.appId ? `${serverConfig.appId}/${roomName}` : roomName;
  let meetingUrl = buildJitsiMeetingUrl(roomName);
  let jwt: string | null = null;
  let warning: string | null = null;

  if (preferredMode === 'jaas-ready') {
    try {
      jwt = createJaaSJwt({
        roomName,
        role,
        user: {
          userId,
          displayName,
          email,
          locale,
        },
      });
    } catch {
      mode = 'public';
      domain = 'meet.jit.si';
      apiRoomName = roomName;
      meetingUrl = `https://meet.jit.si/${roomName}`;
      warning = locale === 'fa'
        ? 'توکن امن JaaS با کلید فعلی ساخته نشد، بنابراین کلاس فعلاً با حالت عمومی Jitsi اجرا می‌شود.'
        : 'The secure JaaS token could not be created with the current key, so the class is running in public Jitsi mode for now.';
    }
  }

  const payload: JitsiBootstrapPayload = {
    mode,
    domain,
    roomName,
    apiRoomName,
    meetingUrl,
    warning,
    role,
    displayName,
    email,
    jwt: mode === 'jaas-ready' ? jwt : null,
    missingConfig: mode === 'jaas-incomplete' ? serverConfig.missingConfig : [],
    configOverwrite: {
      prejoinConfig: {
        enabled: true,
      },
      subject: ' ',
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      enableNoAudioDetection: true,
      enableNoisyMicDetection: true,
      disableModeratorIndicator: false,
      ...(mode === 'jaas-ready' && serverConfig.appId
        ? {
            brandingRoomAlias: roomName,
          }
        : {}),
    },
    interfaceConfigOverwrite: {
      MOBILE_APP_PROMO: false,
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      DEFAULT_REMOTE_DISPLAY_NAME: locale === 'fa' ? 'شرکت‌کننده' : 'Participant',
      DEFAULT_LOCAL_DISPLAY_NAME: displayName,
    },
  };

  return NextResponse.json(payload);
}