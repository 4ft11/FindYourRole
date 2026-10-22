import { NextRequest, NextResponse } from 'next/server';
import { getAllPlayers } from '@/lib/campaign-data';
import { readAdventure } from '@/lib/adventure-store';
import { normalizeIdentity } from '@/lib/adventure-types';
import { cookieOptions, isSameOrigin, readerCookie, readIdentity } from '@/lib/folio-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const sayings = [
  'Never trust a tavern that keeps its spoons chained down. Ask what the spoons did.',
  'A door is just a wall that has learned to negotiate.',
  'Take the last biscuit. Fate respects initiative.',
  'If the road gives you a pebble in your boot, it is not necessarily a prophecy.',
  'Some answers improve considerably after supper.',
  'Keep a little room in your pack for something you did not expect to find.',
  'The best way to look mysterious is to forget why you entered the room.',
];
export async function GET(request: NextRequest) {
  const identity = readIdentity(request.cookies.get(readerCookie)?.value);
  const player = getAllPlayers().find((item) => identity === `reader:${item.key}`);
  if (!player) return NextResponse.json({}, { status: 401 });
  const session = await readAdventure();
  const eligible = session.active && session.players.some((name) => normalizeIdentity(name) === normalizeIdentity(player.name));
  return NextResponse.json({
    player,
    invitation: eligible ? { title: session.title, roomCode: session.roomCode, player: player.name } : null,
    omen: sayings[Math.floor(Date.now() / 86_400_000) % sayings.length],
  });
}
export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({}, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(readerCookie, '', { ...cookieOptions, maxAge: 0 });
  return response;
}
