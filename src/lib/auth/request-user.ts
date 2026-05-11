import { NextRequest } from 'next/server';

export function resolveRequestUserId(request: NextRequest) {
  const candidates = [
    request.headers.get('x-user-id'),
    request.headers.get('x-demo-user-id'),
    new URL(request.url).searchParams.get('userId'),
  ];

  for (const candidate of candidates) {
    if (candidate?.trim()) {
      return candidate.trim();
    }
  }

  return null;
}