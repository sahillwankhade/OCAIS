import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';
import { getSession, requireSession } from '@/lib/security/access';
import {
  getSupabaseDoctor,
  isSupabaseDatabaseEnabled,
  updateSupabaseDoctor,
} from '@/lib/data/supabase-repository';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await context.params;
  const doctor = isSupabaseDatabaseEnabled()
    ? await getSupabaseDoctor(doctorId)
    : mockDb.getDoctorById(doctorId);
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

  const session = getSession(req);
  if (process.env.NODE_ENV === 'production' && session
    && ['doctor', 'receptionist', 'admin'].includes(session.role)
    && session.hospitalId !== doctor.hospitalId) {
    return NextResponse.json({ error: 'Hospital access denied' }, { status: 403 });
  }
  return NextResponse.json({ doctor });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await context.params;
  const doctor = isSupabaseDatabaseEnabled()
    ? await getSupabaseDoctor(doctorId)
    : mockDb.getDoctorById(doctorId);
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  const session = requireSession(req, ['admin', 'doctor']);
  if (session instanceof NextResponse) return session;
  if (session.hospitalId && session.hospitalId !== doctor.hospitalId) {
    return NextResponse.json({ error: 'Hospital access denied' }, { status: 403 });
  }
  const updates = await req.json();
  const mappedUpdates = {
    ...updates,
    experienceYears:
      updates.experienceYears === undefined ? doctor.experienceYears : Number(updates.experienceYears),
    consultationFee:
      updates.consultationFee === undefined ? doctor.consultationFee : Number(updates.consultationFee),
    avgConsultDurationMinutes:
      updates.avgConsultDurationMinutes === undefined
        ? doctor.avgConsultDurationMinutes
        : Number(updates.avgConsultDurationMinutes),
  };
  const updated = isSupabaseDatabaseEnabled()
    ? await updateSupabaseDoctor(doctorId, mappedUpdates)
    : mockDb.updateDoctor(doctorId, mappedUpdates);
  return NextResponse.json({ doctor: updated });
}
