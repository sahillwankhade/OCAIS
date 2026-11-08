import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthSession {
  subjectId: string;
  role: 'patient' | 'doctor' | 'receptionist' | 'admin' | 'superadmin';
  hospitalId?: string;
  expiresAt: number;
}

const SESSION_COOKIE = 'ocais_session';
const secret = process.env.HMAC_SECRET_KEY;

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function sign(value: string) {
  return crypto.createHmac('sha256', secret || 'development-session-secret').update(value).digest('hex');
}

export function createSessionCookie(session: AuthSession) {
  const value = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${value}.${sign(value)}`;
}

export function getSession(request: NextRequest): AuthSession | null {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [value, signature] = raw.split('.');
  const expected = sign(value);
  if (!value || !signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const session = JSON.parse(Buffer.from(value, 'base64url').toString()) as AuthSession;
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export function requireSession(request: NextRequest, roles?: AuthSession['role'][]): NextResponse | AuthSession {
  const session = getSession(request);
  if (!isProduction()) return session || { subjectId: 'demo', role: 'admin', hospitalId: 'hosp-sahyadri', expiresAt: Date.now() + 60_000 };
  if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (roles && !roles.includes(session.role)) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  return session;
}

export function forbiddenIfPatientMismatch(request: NextRequest, patientId: string): NextResponse | null {
  const session = getSession(request);
  if (!isProduction()) return null;
  if (!session || (session.role === 'patient' && session.subjectId !== patientId)) {
    return NextResponse.json({ error: 'Patient access denied' }, { status: 403 });
  }
  return null;
}

export { SESSION_COOKIE };
