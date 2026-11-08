import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';
import { adapters } from '@/lib/adapters';
import { createSessionCookie, SESSION_COOKIE } from '@/lib/security/access';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, phone, otp, fullName, age, gender, bloodGroup } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    if (action === 'SEND_OTP') {
      if (process.env.NODE_ENV === 'production' && process.env.USE_MOCK_SERVICES !== 'false' && process.env.E2E_TEST_MODE !== 'true') {
        return NextResponse.json({ error: 'Real OTP provider is required in production.' }, { status: 503 });
      }
      const result = await adapters.sms.sendOtp(phone);
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Unable to send OTP.' }, { status: 502 });
      }
      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully',
        mockMode: process.env.USE_MOCK_SERVICES !== 'false',
        ...(process.env.NODE_ENV !== 'production' && result.mockOtp ? { mockOtp: result.mockOtp } : {}),
      });
    }

    if (action === 'VERIFY_OTP') {
      const isValid = await adapters.sms.verifyOtp(phone, otp);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }

      // Check if patient exists
      let patient = mockDb.getPatientByPhone(phone);
      const isNewUser = !patient;

      if (!patient && fullName) {
        patient = mockDb.createPatient({
          phone,
          fullName,
          age: Number(age) || 30,
          gender: gender || 'MALE',
          bloodGroup: bloodGroup || undefined,
        });
      }

      const response = NextResponse.json({
        success: true,
        isNewUser,
        patient,
      });
      if (patient) {
        response.cookies.set(SESSION_COOKIE, createSessionCookie({
          subjectId: patient.id,
          role: 'patient',
          expiresAt: Date.now() + 8 * 60 * 60 * 1000,
        }), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
      }
      return response;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
