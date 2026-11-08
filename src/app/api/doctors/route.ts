import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const required = ['hospitalId', 'fullName', 'specialization', 'qualifications', 'cabinNumber'];
    if (required.some((field) => !body[field])) {
      return NextResponse.json({ error: 'Missing doctor details' }, { status: 400 });
    }
    const doctor = mockDb.createDoctor({
      hospitalId: body.hospitalId,
      fullName: body.fullName,
      specialization: body.specialization,
      qualifications: body.qualifications,
      experienceYears: Number(body.experienceYears) || 5,
      cabinNumber: body.cabinNumber,
      consultationFee: Number(body.consultationFee) || 500,
      avgConsultDurationMinutes: Number(body.avgConsultDurationMinutes) || 8,
      isAvailable: body.isAvailable !== false,
      isPaused: false,
      delayMinutes: 0,
    });
    return NextResponse.json({ doctor }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create doctor' },
      { status: 400 }
    );
  }
}
