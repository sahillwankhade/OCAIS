import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';
import { sendDelayAlerts } from '@/lib/notifications/service';
import { requireSession } from '@/lib/security/access';

export async function POST(req: NextRequest) {
  try {
    const session = requireSession(req, ['doctor', 'receptionist', 'admin']);
    if (session instanceof NextResponse) return session;
    const body = await req.json();
    const { action, doctorId, delayMinutes, prescription, notes } = body;

    if (!doctorId) {
      return NextResponse.json({ error: 'doctorId is required' }, { status: 400 });
    }

    const doctor = mockDb.getDoctorById(doctorId);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }
    if (session.role === 'doctor' && session.subjectId !== doctorId) {
      return NextResponse.json({ error: 'Doctor access denied' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];
    const todayApts = mockDb.getAppointments({ doctorId, slotDate: today });
    const inConsult = todayApts.find((a) => a.state === 'IN_CONSULT');

    if (action === 'NEXT') {
      // 1. Complete existing patient in consult if any
      if (inConsult) {
        mockDb.updateAppointmentState(inConsult.id, 'COMPLETED', {
          role: 'doctor',
          notes: notes || 'Completed by doctor',
        });
      }

      // 2. Find next waiting patient (CHECKED_IN first, then BOOKED)
      const waitingList = todayApts
        .filter((a) => a.state === 'CHECKED_IN' || a.state === 'BOOKED')
        .sort((a, b) => a.tokenNumber - b.tokenNumber);

      const nextApt = waitingList[0];
      if (!nextApt) {
        return NextResponse.json({
          success: true,
          message: 'No more waiting patients in queue.',
          currentPatient: null,
        });
      }

      if (nextApt.state === 'BOOKED') {
        mockDb.updateAppointmentState(nextApt.id, 'CHECKED_IN', { role: 'doctor' });
      }

      const activeApt = mockDb.updateAppointmentState(nextApt.id, 'IN_CONSULT', {
        role: 'doctor',
        notes: 'Consultation started',
      });

      return NextResponse.json({
        success: true,
        message: `Now consulting Token #${activeApt.tokenNumber}`,
        currentPatient: activeApt,
      });
    }

    if (action === 'DONE') {
      if (!inConsult) {
        return NextResponse.json({ error: 'No patient is currently in consultation' }, { status: 400 });
      }

      const completed = mockDb.updateAppointmentState(inConsult.id, 'COMPLETED', {
        role: 'doctor',
        notes: notes || undefined,
      });

      if (prescription) {
        completed.prescription = prescription;
      }

      return NextResponse.json({
        success: true,
        message: `Consultation for Token #${completed.tokenNumber} completed.`,
        completedAppointment: completed,
      });
    }

    if (action === 'SKIP') {
      if (!inConsult) {
        return NextResponse.json({ error: 'No patient is currently in consultation' }, { status: 400 });
      }

      const skipped = mockDb.updateAppointmentState(inConsult.id, 'SKIPPED', {
        role: 'doctor',
        notes: 'Skipped - patient did not answer call',
      });

      return NextResponse.json({
        success: true,
        message: `Token #${skipped.tokenNumber} skipped.`,
        skippedAppointment: skipped,
      });
    }

    if (action === 'TOGGLE_PAUSE') {
      const updated = mockDb.updateDoctor(doctorId, { isPaused: !doctor.isPaused });
      return NextResponse.json({
        success: true,
        isPaused: updated?.isPaused,
        message: updated?.isPaused ? 'Queue paused' : 'Queue resumed',
      });
    }

    if (action === 'REPORT_DELAY') {
      const mins = Number(delayMinutes) || 0;
      mockDb.updateDoctor(doctorId, { delayMinutes: mins });

      // Notify all waiting patients through WhatsApp adapter
      const waiting = todayApts.filter(
        (a) => a.state === 'CHECKED_IN' || a.state === 'BOOKED'
      );

      const patients = waiting
        .map((appointment) => mockDb.getPatientById(appointment.patientId))
        .filter((patient): patient is NonNullable<typeof patient> => Boolean(patient));
      const notificationResult = await sendDelayAlerts(doctor, patients, mins);

      return NextResponse.json({
        success: true,
        delayMinutes: mins,
        notifiedCount: waiting.length,
        deliveryCount: notificationResult.successCount,
        message: `Delay of ${mins} minutes reported and sent to ${waiting.length} waiting patients.`,
      });
    }

    if (action === 'RECALL') {
      const { appointmentId } = body;
      const target = mockDb.getAppointmentById(appointmentId);
      if (!target || target.state !== 'SKIPPED') {
        return NextResponse.json({ error: 'Appointment not found or not in SKIPPED state' }, { status: 400 });
      }

      const recalled = mockDb.updateAppointmentState(target.id, 'CHECKED_IN', {
        role: 'doctor',
        notes: 'Patient recalled to queue',
      });

      return NextResponse.json({
        success: true,
        message: `Token #${recalled.tokenNumber} recalled to queue.`,
        appointment: recalled,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Queue action failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
