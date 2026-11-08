import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await context.params;
  const doctor = mockDb.getDoctorById(doctorId);
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  return NextResponse.json({
    schedule: mockDb.getDoctorSchedule(doctorId),
    holidays: mockDb.getHospitalHolidays(doctor.hospitalId),
  });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await context.params;
  const doctor = mockDb.getDoctorById(doctorId);
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  const body = await req.json();
  const schedule = mockDb.updateDoctorSchedule(doctorId, {
    shifts: body.shifts || [],
    holidays: body.holidays || mockDb.getHospitalHolidays(doctor.hospitalId),
    emergencyLockedSlotIds: body.emergencyLockedSlotIds || [],
  });
  return NextResponse.json({ schedule });
}
