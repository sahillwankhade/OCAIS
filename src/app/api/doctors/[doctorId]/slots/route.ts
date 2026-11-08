import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';
import { generateDaySlots } from '@/lib/slots/slot-generator';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await context.params;
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const doctor = mockDb.getDoctorById(doctorId);
  if (!doctor) {
    return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  }

  // Find existing booked slots for this doctor on this day
  const existingApts = mockDb.getAppointments({ doctorId, slotDate: date });
  const bookedTimes = existingApts
    .filter((a) => a.state !== 'CANCELLED')
    .map((a) => a.slotStartTime);

  const slots = generateDaySlots(mockDb.getDoctorSchedule(doctorId), date, bookedTimes);

  return NextResponse.json({
    doctor,
    date,
    slots,
  });
}
