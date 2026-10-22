import { NextRequest, NextResponse } from 'next/server';
import { findPlayerByIdentity } from '@/lib/campaign-data';
import { cookieOptions, isSameOrigin, readerCookie, signIdentity } from '@/lib/folio-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({}, { status: 403 });
  const body = await request.json().catch(() => ({})) as { name?: string; role?: string };
  if (typeof body.name !== 'string' || typeof body.role !== 'string' || !body.name.trim() || !body.role.trim()) return NextResponse.json({ kind: 'missing' }, { status: 400 });
  const result = findPlayerByIdentity(body.name, body.role);
  if (result.kind === 'unknown') return NextResponse.json({ kind: 'unknown' }, { status: 404 });
  if (result.kind === 'conflict') return NextResponse.json({ kind: 'conflict' }, { status: 409 });
  if (!result.player) return NextResponse.json({ kind: 'unknown' }, { status: 404 });
  const response = NextResponse.json({ kind: 'matched', player: result.player });
  const token = signIdentity(`reader:${result.player.key}`);
  if (token) response.cookies.set(readerCookie, token, cookieOptions);
  return response;
}
