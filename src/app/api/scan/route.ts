import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { qrPayload, doctorId } = body;

    if (!qrPayload || !doctorId) {
      return NextResponse.json({ error: 'Missing qrPayload or doctorId' }, { status: 400 });
    }

    const result = mockDb.scanDoctorCabinQR(qrPayload, doctorId);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      appointment: result.appointment,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Scan processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

