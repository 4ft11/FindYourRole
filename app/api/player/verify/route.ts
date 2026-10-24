import { NextRequest, NextResponse } from 'next/server';
import { findPlayerByName } from '@/lib/campaign-data';
import { cookieOptions, isSameOrigin, readerCookie, signIdentity } from '@/lib/folio-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({}, { status: 403 });
  const body = await request.json().catch(() => ({})) as { name?: string };
  if (typeof body.name !== 'string' || !body.name.trim()) return NextResponse.json({ kind: 'missing' }, { status: 400 });
  const result = findPlayerByName(body.name);
  if (result.kind === 'unknown') return NextResponse.json({ kind: 'unknown' }, { status: 404 });
  if (!result.player) return NextResponse.json({ kind: 'unknown' }, { status: 404 });
  const response = NextResponse.json({ kind: 'matched', player: result.player });
  const token = signIdentity(`reader:${result.player.key}`);
  if (token) response.cookies.set(readerCookie, token, cookieOptions);
  return response;
}
