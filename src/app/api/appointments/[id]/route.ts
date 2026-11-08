import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';
import { AppointmentState } from '@/lib/types';
import { forbiddenIfPatientMismatch, requireSession } from '@/lib/security/access';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const apt = mockDb.getAppointmentById(id);

  if (!apt) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  }
  const accessError = forbiddenIfPatientMismatch(req, apt.patientId);
  if (accessError) return accessError;

  const doctor = mockDb.getDoctorById(apt.doctorId);
  const hospital = mockDb.getHospitalById(apt.hospitalId);
  const patient = mockDb.getPatientById(apt.patientId);

  // Compute live queue estimate
  const queueStatus = mockDb.getQueueStatus(apt.doctorId, apt.tokenNumber, apt.slotDate);

  return NextResponse.json({
    appointment: apt,
    doctor,
    hospital,
    patient,
    queueStatus,
  });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = requireSession(req, ['patient', 'doctor', 'receptionist', 'admin']);
    if (session instanceof NextResponse) return session;
    const body = await req.json();
    const { nextState, notes, userId, role } = body as {
      nextState: AppointmentState;
      notes?: string;
      userId?: string;
      role?: string;
    };
    const apt = mockDb.getAppointmentById(id);
    if (!apt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    if (session.role === 'patient' && session.subjectId !== apt.patientId) {
      return NextResponse.json({ error: 'Patient access denied' }, { status: 403 });
    }

    if (body.action === 'RESCHEDULE') {
      if (!body.slotDate || !body.slotStartTime || !body.slotEndTime) {
        return NextResponse.json({ error: 'New slot details are required' }, { status: 400 });
      }
      const appointment = mockDb.rescheduleAppointment(
        id,
        body.slotDate,
        body.slotStartTime,
        body.slotEndTime
      );
      return NextResponse.json({ success: true, appointment });
    }

    if (!nextState) {
      return NextResponse.json({ error: 'nextState is required' }, { status: 400 });
    }

    const updated = mockDb.updateAppointmentState(id, nextState, {
      userId,
      role: role || 'patient',
      notes,
    });

    return NextResponse.json({
      success: true,
      appointment: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update appointment state';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
