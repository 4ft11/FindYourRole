import { NextRequest, NextResponse } from 'next/server';
import { findPlayerByIdentity } from '@/lib/campaign-data';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as { name?: string; role?: string };
  if (!body.name?.trim() || !body.role?.trim()) return NextResponse.json({ kind: 'missing' }, { status: 400 });
  const result = findPlayerByIdentity(body.name, body.role);
  if (result.kind === 'unknown') return NextResponse.json({ kind: 'unknown' }, { status: 404 });
  if (result.kind === 'conflict') return NextResponse.json({ kind: 'conflict' }, { status: 409 });
  if (!result.player) return NextResponse.json({ kind: 'unknown' }, { status: 404 });
  return NextResponse.json({ kind: 'matched', player: result.player });
}
