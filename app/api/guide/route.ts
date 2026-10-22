import { NextRequest, NextResponse } from 'next/server';
import { isGuideAuthorized } from '@/lib/adventure-store';
import { cookieOptions, guideCookie, isGuideSession, isSameOrigin, signIdentity } from '@/lib/folio-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return NextResponse.json({ unlocked: isGuideSession(request) }, { status: isGuideSession(request) ? 200 : 401 });
}
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({}, { status: 403 });
  const body = await request.json().catch(() => ({})) as { key?: unknown };
  if (typeof body.key !== 'string' || !isGuideAuthorized(body.key)) return NextResponse.json({ error: 'The clasp does not yield.' }, { status: 401 });
  const response = NextResponse.json({ unlocked: true });
  response.cookies.set(guideCookie, signIdentity('guide'), cookieOptions);
  return response;
}
export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({}, { status: 403 });
  const response = NextResponse.json({ unlocked: false });
  response.cookies.set(guideCookie, '', { ...cookieOptions, maxAge: 0 });
  return response;
}
