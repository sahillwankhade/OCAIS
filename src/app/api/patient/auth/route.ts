import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';
import { adapters } from '@/lib/adapters';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, phone, otp, fullName, age, gender, bloodGroup } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    if (action === 'SEND_OTP') {
      const result = await adapters.sms.sendOtp(phone);
      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully',
        mockOtp: result.mockOtp, // Sent in mock mode for instant developer convenience
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

      return NextResponse.json({
        success: true,
        isNewUser,
        patient,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

