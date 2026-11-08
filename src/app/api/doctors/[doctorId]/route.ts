import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await context.params;
  const doctor = mockDb.getDoctorById(doctorId);
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  const updates = await req.json();
  const updated = mockDb.updateDoctor(doctorId, {
    ...updates,
    experienceYears:
      updates.experienceYears === undefined ? doctor.experienceYears : Number(updates.experienceYears),
    consultationFee:
      updates.consultationFee === undefined ? doctor.consultationFee : Number(updates.consultationFee),
    avgConsultDurationMinutes:
      updates.avgConsultDurationMinutes === undefined
        ? doctor.avgConsultDurationMinutes
        : Number(updates.avgConsultDurationMinutes),
  });
  return NextResponse.json({ doctor: updated });
}
