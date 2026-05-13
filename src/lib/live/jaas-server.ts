import 'server-only';

import { createPrivateKey, createSign, type KeyObject } from 'node:crypto';
import { type LiveClassRole, getDefaultLiveDisplayName, sanitizeJitsiRoomName } from '@/lib/live/jitsi';

type JaaSUserIdentity = {
  userId?: string | null;
  displayName?: string | null;
  email?: string | null;
  locale?: string;
};

function normalizePrivateKey(value: string) {
  const normalized = value.replace(/\\n/g, '\n').trim();
  if (!normalized) {
    return '';
  }

  return normalized;
}

function resolveSigningKey(value: string): string | KeyObject {
  const normalized = normalizePrivateKey(value);
  if (!normalized) {
    return '';
  }

  if (normalized.includes('BEGIN PRIVATE KEY') || normalized.includes('BEGIN RSA PRIVATE KEY')) {
    return normalized;
  }

  const compactBase64 = normalized.replace(/\s+/g, '');
  const derBuffer = Buffer.from(compactBase64, 'base64');

  try {
    return createPrivateKey({
      key: derBuffer,
      format: 'der',
      type: 'pkcs8',
    });
  } catch {
    try {
      return createPrivateKey({
        key: derBuffer,
        format: 'der',
        type: 'pkcs1',
      });
    } catch {
      const wrappedBody = compactBase64.match(/.{1,64}/g)?.join('\n') || compactBase64;
      return `-----BEGIN PRIVATE KEY-----\n${wrappedBody}\n-----END PRIVATE KEY-----`;
    }
  }
}

export function getServerJaaSConfig() {
  const appId = (process.env.JITSI_JAAS_APP_ID || process.env.NEXT_PUBLIC_JAAS_APP_ID || '').trim();
  const kid = (process.env.JITSI_JAAS_KID || '').trim();
  const privateKey = resolveSigningKey(process.env.JITSI_JAAS_PRIVATE_KEY || '');
  const domain = (process.env.JITSI_JAAS_DOMAIN || process.env.NEXT_PUBLIC_JITSI_DOMAIN || (appId ? '8x8.vc' : 'meet.jit.si')).trim();

  const missingConfig: string[] = [];

  if (!appId) {
    missingConfig.push('NEXT_PUBLIC_JAAS_APP_ID');
  }

  if (!kid) {
    missingConfig.push('JITSI_JAAS_KID');
  }

  if (!privateKey) {
    missingConfig.push('JITSI_JAAS_PRIVATE_KEY');
  }

  return {
    appId,
    kid,
    privateKey,
    domain,
    missingConfig,
    isReady: missingConfig.length === 0,
  };
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString('base64url');
}

export function createJaaSJwt(options: {
  roomName: string;
  role: LiveClassRole;
  user: JaaSUserIdentity;
}) {
  const config = getServerJaaSConfig();
  if (!config.isReady) {
    return null;
  }

  const roomName = sanitizeJitsiRoomName(options.roomName);
  if (!roomName) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const isModerator = options.role === 'moderator';
  const locale = options.user.locale === 'fa' ? 'fa' : 'en';
  const displayName = options.user.displayName?.trim() || getDefaultLiveDisplayName(options.role, locale);
  const userId = options.user.userId?.trim() || `${options.role}-${roomName}`;
  const email = options.user.email?.trim() || undefined;

  const header = {
    alg: 'RS256',
    kid: config.kid,
    typ: 'JWT',
  };

  const payload = {
    aud: 'jitsi',
    iss: 'chat',
    sub: config.appId,
    room: roomName,
    iat: now,
    nbf: now - 10,
    exp: now + 60 * 60 * 2,
    context: {
      user: {
        id: userId,
        name: displayName,
        email,
        moderator: isModerator,
        'hidden-from-recorder': false,
      },
      features: {
        livestreaming: isModerator,
        recording: isModerator,
        transcription: isModerator,
        'outbound-call': false,
        'sip-outbound-call': false,
      },
    },
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign('RSA-SHA256');
  signer.update(unsignedToken);
  signer.end();

  const signature = signer.sign(config.privateKey, 'base64url');
  return `${unsignedToken}.${signature}`;
}