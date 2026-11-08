import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie, SESSION_COOKIE } from '@/lib/security/access';

export async function POST(req: NextRequest) {
  const { email, pin } = await req.json();
  const configuredEmail = process.env.SUPERADMIN_EMAIL || (process.env.NODE_ENV === 'production' ? '' : 'admin@ocais.in');
  const configuredPin = process.env.SUPERADMIN_PIN || (process.env.NODE_ENV === 'production' ? '' : '123456');
  if (!configuredEmail || !configuredPin || email !== configuredEmail || pin !== configuredPin) {
    return NextResponse.json({ error: 'Invalid super-admin credentials' }, { status: 401 });
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, createSessionCookie({
    subjectId: 'superadmin-1',
    role: 'superadmin',
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  }), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
  return response;
}
