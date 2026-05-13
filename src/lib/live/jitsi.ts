import { isJitsiLiveProvider, sanitizeLiveRoomName } from '@/lib/live/provider';

export type LiveClassRole = 'moderator' | 'participant';

export type LiveClassMode = 'public' | 'jaas-ready' | 'jaas-incomplete';

export type JitsiBootstrapPayload = {
  mode: LiveClassMode;
  domain: string;
  roomName: string;
  apiRoomName: string;
  meetingUrl: string;
  warning?: string | null;
  role: LiveClassRole;
  displayName: string;
  email: string | null;
  jwt: string | null;
  missingConfig: string[];
  configOverwrite: Record<string, unknown>;
  interfaceConfigOverwrite: Record<string, unknown>;
};

export function getJaaSAppId() {
  return (process.env.NEXT_PUBLIC_JAAS_APP_ID || '').trim();
}

export function isJaaSEnabled() {
  return isJitsiLiveProvider() && Boolean(getJaaSAppId());
}

export function getJitsiDomain() {
  const configuredDomain = (process.env.NEXT_PUBLIC_JITSI_DOMAIN || '').trim();
  if (configuredDomain) {
    return configuredDomain;
  }

  return isJaaSEnabled() ? '8x8.vc' : 'meet.jit.si';
}

export function sanitizeJitsiRoomName(roomName: string) {
  return sanitizeLiveRoomName(roomName);
}

export function parseLiveClassRole(role: string | null | undefined): LiveClassRole {
  return role === 'moderator' ? 'moderator' : 'participant';
}

export function getLiveClassRoleFromRoles(roles: string[] = []): LiveClassRole {
  if (roles.some((role) => ['SUPER_ADMIN', 'SUBJECT_ADMIN', 'TEACHER'].includes(role))) {
    return 'moderator';
  }

  return 'participant';
}

export function getDefaultLiveDisplayName(role: LiveClassRole, locale: string) {
  if (locale === 'fa') {
    return role === 'moderator' ? 'معلم' : 'دانش‌آموز';
  }

  return role === 'moderator' ? 'Teacher' : 'Student';
}

export function buildJitsiApiRoomName(roomName: string) {
  const safeRoomName = sanitizeJitsiRoomName(roomName);
  if (!safeRoomName) return '';

  const appId = getJaaSAppId();
  if (!appId) {
    return safeRoomName;
  }

  return `${appId}/${safeRoomName}`;
}

export function buildJitsiMeetingUrl(roomName: string) {
  const domain = getJitsiDomain();
  const apiRoomName = buildJitsiApiRoomName(roomName);
  if (!apiRoomName) return '';
  return `https://${domain}/${apiRoomName}`;
}
