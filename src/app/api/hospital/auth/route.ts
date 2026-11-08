import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';
import { createSessionCookie, SESSION_COOKIE } from '@/lib/security/access';

const configuredPin = process.env.HOSPITAL_DEMO_PIN
  || (process.env.NODE_ENV !== 'production' || process.env.E2E_TEST_MODE === 'true' ? '123456' : '');

export async function POST(req: NextRequest) {
  try {
    const { hospitalId, role, staffId, pin } = await req.json();
    const hospital = mockDb.getHospitalById(hospitalId);
    if (!hospital) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    if (!configuredPin || !['doctor', 'receptionist', 'admin'].includes(role) || !staffId || pin !== configuredPin) {
      return NextResponse.json({ error: 'Invalid hospital login details' }, { status: 401 });
    }

    const staff = mockDb.getStaff(hospitalId).find((member) => member.id === staffId && member.role === role);
    if (!staff) return NextResponse.json({ error: 'Staff account not found for this hospital' }, { status: 401 });

    const response = NextResponse.json({ success: true, role, hospitalId, staff });
    response.cookies.set(SESSION_COOKIE, createSessionCookie({
      subjectId: staff.id,
      role,
      hospitalId,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    }), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
    return response;
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Hospital login failed' }, { status: 500 });
  }
}
