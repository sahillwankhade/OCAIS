import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';
import { requireSession } from '@/lib/security/access';
import {
  createSupabaseDoctor,
  getSupabaseHospital,
  isSupabaseDatabaseEnabled,
} from '@/lib/data/supabase-repository';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const required = ['hospitalId', 'fullName', 'specialization', 'qualifications', 'cabinNumber'];
    if (required.some((field) => !body[field])) {
      return NextResponse.json({ error: 'Missing doctor details' }, { status: 400 });
    }
    const session = requireSession(req, ['admin']);
    if (session instanceof NextResponse) return session;
    if (session.hospitalId && session.hospitalId !== body.hospitalId) {
      return NextResponse.json({ error: 'Hospital access denied' }, { status: 403 });
    }

    if (isSupabaseDatabaseEnabled()) {
      if (!await getSupabaseHospital(body.hospitalId)) {
        return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
      }
      const doctor = await createSupabaseDoctor({
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
