import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hospitalId = searchParams.get('hospitalId') || 'hosp-sahyadri';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const hospital = mockDb.getHospitalById(hospitalId);
  if (!hospital) {
    return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
  }

  const doctors = mockDb.getDoctors(hospitalId);
  const todayAppointments = mockDb.getAppointments({ hospitalId, slotDate: date });

  const total = todayAppointments.length;
  const inConsult = todayAppointments.filter((a) => a.state === 'IN_CONSULT').length;
  const waiting = todayAppointments.filter(
    (a) => a.state === 'CHECKED_IN' || a.state === 'BOOKED'
  ).length;
  const completed = todayAppointments.filter((a) => a.state === 'COMPLETED').length;
  const revenue = todayAppointments
    .filter((a) => a.paymentStatus === 'PAID')
    .reduce((sum, a) => sum + a.amountPaid, 0);

  // Calculate hospital average consult duration
  const completedDurations = todayAppointments
    .filter((a) => a.state === 'COMPLETED' && a.actualDurationMinutes)
    .map((a) => a.actualDurationMinutes as number);

  const avgConsultDuration =
    completedDurations.length > 0
      ? Math.round(completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length)
      : 10;

  // Breakdown by doctor
  const doctorQueues = doctors.map((doc) => {
    const docApts = todayAppointments.filter((a) => a.doctorId === doc.id);
    const activePatient = docApts.find((a) => a.state === 'IN_CONSULT');
    const nextPatient = docApts.find(
      (a) => a.state === 'CHECKED_IN' || a.state === 'BOOKED'
    );
    return {
      doctor: doc,
      totalToday: docApts.length,
      currentServing: activePatient?.tokenNumber || null,
      nextUp: nextPatient?.tokenNumber || null,
      waitingCount: docApts.filter(
        (a) => a.state === 'CHECKED_IN' || a.state === 'BOOKED'
      ).length,
      status: doc.isPaused ? 'PAUSED' : doc.delayMinutes > 0 ? 'DELAYED' : 'ACTIVE',
    };
  });

  return NextResponse.json({
    hospital,
    date,
    metrics: {
      totalAppointments: total,
      inConsult,
      waiting,
      completed,
      revenueToday: revenue,
      avgConsultDurationMinutes: avgConsultDuration,
    },
    doctorQueues,
  });
}

