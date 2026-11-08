import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';
import { sendFollowUpReminder } from '@/lib/notifications/service';
import { requireSession } from '@/lib/security/access';

export async function POST(request: NextRequest) {
  try {
    const { appointmentId } = await request.json();
    if (typeof appointmentId !== 'string' || !appointmentId) {
      return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 });
    }

    const appointment = mockDb.getAppointmentById(appointmentId);
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    const session = requireSession(request, ['patient', 'doctor', 'receptionist', 'admin']);
    if (session instanceof NextResponse) return session;
    if (session.role === 'patient' && session.subjectId !== appointment.patientId) {
      return NextResponse.json({ error: 'Patient access denied' }, { status: 403 });
    }
    if (appointment.state !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Follow-up reminders are available after a completed consultation.' },
        { status: 400 }
      );
    }

    const doctor = mockDb.getDoctorById(appointment.doctorId);
    const patient = mockDb.getPatientById(appointment.patientId);
    if (!doctor || !patient) {
      return NextResponse.json({ error: 'Appointment participants not found' }, { status: 404 });
    }

    const result = await sendFollowUpReminder(appointment, doctor, patient);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Follow-up reminder failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
