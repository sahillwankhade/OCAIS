import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/security/access';

export async function GET(request: NextRequest) {
  const session = requireSession(request);
  if (session instanceof NextResponse) return session;
  return NextResponse.json({ session });
}
