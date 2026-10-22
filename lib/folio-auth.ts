import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

export const guideCookie = 'rumerianne-guide';
export const readerCookie = 'rumerianne-reader';
export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/', maxAge: 60 * 60 * 24 * 30 };

function secret() {
  return process.env.WAYFARER_DM_KEY?.trim() || (process.env.NODE_ENV !== 'production' ? 'wayfarer-local' : '');
}

export function signIdentity(identity: string) {
  if (!secret()) return '';
  const payload = Buffer.from(JSON.stringify({ identity, expires: Date.now() + cookieOptions.maxAge * 1000 })).toString('base64url');
  return `${payload}.${createHmac('sha256', secret()).update(payload).digest('base64url')}`;
}

export function readIdentity(token?: string) {
  if (!token || !secret()) return null;
  try {
    const [payload, signature] = token.split('.');
    const expected = createHmac('sha256', secret()).update(payload).digest();
    const supplied = Buffer.from(signature, 'base64url');
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { identity: string; expires: number };
    return parsed.expires > Date.now() && typeof parsed.identity === 'string' ? parsed.identity : null;
  } catch { return null; }
}

export function isGuideSession(request: NextRequest) {
  return readIdentity(request.cookies.get(guideCookie)?.value) === 'guide';
}

export function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    const source = new URL(origin);
    return source.host === request.headers.get('host') && (source.protocol === 'https:' || (process.env.NODE_ENV !== 'production' && source.protocol === 'http:'));
  } catch { return false; }
}
