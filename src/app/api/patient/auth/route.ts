import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';
import { adapters } from '@/lib/adapters';
import {
  createSessionCookie,
  getSession,
  PENDING_PATIENT_COOKIE,
  SESSION_COOKIE,
} from '@/lib/security/access';
import {
  createSupabasePatient,
  getSupabasePatientByPhone,
  isSupabaseDatabaseEnabled,
} from '@/lib/data/supabase-repository';

function setPatientSession(response: NextResponse, patientId: string) {
  response.cookies.set(SESSION_COOKIE, createSessionCookie({
    subjectId: patientId,
    role: 'patient',
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  }), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
  response.cookies.set(PENDING_PATIENT_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, phone, otp, fullName, age, gender, bloodGroup } = body;

    if (typeof phone !== 'string' || !/^\d{10}$/.test(phone)) {
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

    if (action === 'CREATE_PROFILE') {
      const pendingSession = getSession(req, PENDING_PATIENT_COOKIE);
      if (!pendingSession || pendingSession.role !== 'patient' || pendingSession.subjectId !== `pending:${phone}`) {
        return NextResponse.json({ error: 'Verify your phone number before creating a profile.' }, { status: 401 });
      }
      if (typeof fullName !== 'string' || !fullName.trim()) {
        return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
      }
      const parsedAge = Number(age);
      if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
        return NextResponse.json({ error: 'Enter a valid age' }, { status: 400 });
      }

      const patient = isSupabaseDatabaseEnabled()
        ? await createSupabasePatient({
            phone,
            fullName: fullName.trim(),
            age: parsedAge,
            gender: gender || 'MALE',
            bloodGroup: bloodGroup || undefined,
          })
        : mockDb.createPatient({
            phone,
            fullName: fullName.trim(),
            age: parsedAge,
            gender: gender || 'MALE',
            bloodGroup: bloodGroup || undefined,
          });
      const response = NextResponse.json({ success: true, isNewUser: true, patient });
      setPatientSession(response, patient.id);
      return response;
    }

    if (action === 'VERIFY_OTP') {
      const isValid = await adapters.sms.verifyOtp(phone, otp);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }

      let patient = isSupabaseDatabaseEnabled()
        ? await getSupabasePatientByPhone(phone)
        : mockDb.getPatientByPhone(phone);
      const isNewUser = !patient;

      if (!patient && fullName) {
        patient = isSupabaseDatabaseEnabled()
          ? await createSupabasePatient({
              phone,
              fullName,
              age: Number(age) || 30,
              gender: gender || 'MALE',
              bloodGroup: bloodGroup || undefined,
            })
          : mockDb.createPatient({
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
        setPatientSession(response, patient.id);
      } else {
        response.cookies.set(SESSION_COOKIE, '', {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 0,
        });
        response.cookies.set(PENDING_PATIENT_COOKIE, createSessionCookie({
          subjectId: `pending:${phone}`,
          role: 'patient',
          expiresAt: Date.now() + 15 * 60 * 1000,
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
