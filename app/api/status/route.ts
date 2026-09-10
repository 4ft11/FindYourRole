import { NextResponse } from 'next/server';
import { getRoleStatus } from '@/lib/campaign-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ status: getRoleStatus(), mode: 'manual-upload' });
}
