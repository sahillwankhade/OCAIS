import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';
import { generateDaySlots } from '@/lib/slots/slot-generator';
import {
  getSupabaseDoctor,
  getSupabaseDoctorSchedule,
  isSupabaseDatabaseEnabled,
  listSupabaseBookedSlotTimes,
} from '@/lib/data/supabase-repository';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await context.params;
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const doctor = isSupabaseDatabaseEnabled()
      ? await getSupabaseDoctor(doctorId)
      : mockDb.getDoctorById(doctorId);
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    const bookedTimes = isSupabaseDatabaseEnabled()
      ? await listSupabaseBookedSlotTimes(doctorId, date)
      : mockDb.getAppointments({ doctorId, slotDate: date })
          .filter((appointment) => appointment.state !== 'CANCELLED')
          .map((appointment) => appointment.slotStartTime);

    const schedule = isSupabaseDatabaseEnabled()
      ? await getSupabaseDoctorSchedule(doctorId)
      : mockDb.getDoctorSchedule(doctorId);
    const slots = generateDaySlots(schedule, date, bookedTimes);

    return NextResponse.json({ doctor, date, slots });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load appointment slots' },
      { status: 500 },
    );
  }
}
