import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';
import { getSession, requireSession } from '@/lib/security/access';
import {
  getSupabaseDoctor,
  getSupabaseDoctorSchedule,
  isSupabaseDatabaseEnabled,
  replaceSupabaseDoctorSchedule,
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
  const schedule = isSupabaseDatabaseEnabled()
    ? await getSupabaseDoctorSchedule(doctorId)
    : mockDb.getDoctorSchedule(doctorId);
  const holidays = isSupabaseDatabaseEnabled()
    ? schedule.holidays || []
    : mockDb.getHospitalHolidays(doctor.hospitalId);
  return NextResponse.json({
    schedule,
    holidays,
  });
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
  const body = await req.json();
  const shifts = Array.isArray(body.shifts) ? body.shifts : [];
  const schedule = isSupabaseDatabaseEnabled()
    ? await replaceSupabaseDoctorSchedule(doctorId, shifts)
    : mockDb.updateDoctorSchedule(doctorId, {
        shifts,
        holidays: body.holidays || mockDb.getHospitalHolidays(doctor.hospitalId),
        emergencyLockedSlotIds: body.emergencyLockedSlotIds || [],
      });
  return NextResponse.json({ schedule });
}
