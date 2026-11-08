import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await context.params;
  const { searchParams } = new URL(req.url);
  const token = Number(searchParams.get('token')) || 1;
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const doctor = mockDb.getDoctorById(doctorId);
  if (!doctor) {
    return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  }

  const queue = mockDb.getQueueStatus(doctorId, token, date);
  const todayAppointments = mockDb.getAppointments({ doctorId, slotDate: date });

  // Get current serving appointment details
  const inConsult = todayAppointments.find((a) => a.state === 'IN_CONSULT');
  const waitingList = todayAppointments
    .filter((a) => a.state === 'CHECKED_IN' || a.state === 'BOOKED')
    .sort((a, b) => a.tokenNumber - b.tokenNumber);

  return NextResponse.json({
    doctor,
    queue,
    inConsultAppointment: inConsult || null,
    waitingCount: waitingList.length,
    waitingList: waitingList.slice(0, 5).map((a) => ({
      tokenNumber: a.tokenNumber,
      state: a.state,
      slotStartTime: a.slotStartTime,
    })),
  });
}

