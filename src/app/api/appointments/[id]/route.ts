import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';
import { AppointmentState } from '@/lib/types';
import { calculateQueueEstimate } from '@/lib/queue/eta-calculator';
import { forbiddenIfPatientMismatch, getSession, requireSession } from '@/lib/security/access';
import {
  getSupabaseAppointment,
  getSupabaseDoctor,
  getSupabaseHospital,
  getSupabasePatientById,
  isSupabaseDatabaseEnabled,
  listSupabaseAppointments,
  rescheduleSupabaseAppointment,
  updateSupabaseAppointmentState,
} from '@/lib/data/supabase-repository';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const apt = isSupabaseDatabaseEnabled()
    ? await getSupabaseAppointment(id)
    : mockDb.getAppointmentById(id);

  if (!apt) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  }
  const session = getSession(req);
  if (process.env.NODE_ENV === 'production' && !session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (session?.role === 'patient' && session.subjectId !== apt.patientId) {
    return NextResponse.json({ error: 'Patient access denied' }, { status: 403 });
  }
  if (session && ['doctor', 'receptionist', 'admin'].includes(session.role) && session.hospitalId !== apt.hospitalId) {
    return NextResponse.json({ error: 'Hospital access denied' }, { status: 403 });
  }
  const accessError = forbiddenIfPatientMismatch(req, apt.patientId);
  if (accessError) return accessError;

  const [doctor, hospital, patient] = isSupabaseDatabaseEnabled()
    ? await Promise.all([
        getSupabaseDoctor(apt.doctorId),
        getSupabaseHospital(apt.hospitalId),
        getSupabasePatientById(apt.patientId),
      ])
    : [
        mockDb.getDoctorById(apt.doctorId),
        mockDb.getHospitalById(apt.hospitalId),
        mockDb.getPatientById(apt.patientId),
      ];

  let queueStatus;
  if (isSupabaseDatabaseEnabled() && doctor) {
    const appointments = await listSupabaseAppointments({ doctorId: apt.doctorId, slotDate: apt.slotDate });
    const inConsult = appointments.find((appointment) => appointment.state === 'IN_CONSULT');
    const waitingTokens = appointments
      .filter((appointment) => appointment.state === 'CHECKED_IN' || appointment.state === 'BOOKED')
      .map((appointment) => appointment.tokenNumber);
    queueStatus = calculateQueueEstimate({
      patientToken: apt.tokenNumber,
      currentInConsultPatient: inConsult ? {
        tokenNumber: inConsult.tokenNumber,
        consultationStartTime: inConsult.consultationStartTime || new Date().toISOString(),
      } : null,
      waitingTokens,
      doctor: {
        avgConsultDurationMinutes: doctor.avgConsultDurationMinutes,
        isPaused: doctor.isPaused,
        delayMinutes: doctor.delayMinutes,
      },
    });
  } else {
    queueStatus = mockDb.getQueueStatus(apt.doctorId, apt.tokenNumber, apt.slotDate);
  }

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
    const apt = isSupabaseDatabaseEnabled()
      ? await getSupabaseAppointment(id)
      : mockDb.getAppointmentById(id);
    if (!apt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    if (session.role === 'patient' && session.subjectId !== apt.patientId) {
      return NextResponse.json({ error: 'Patient access denied' }, { status: 403 });
    }
    if (['doctor', 'receptionist', 'admin'].includes(session.role) && session.hospitalId !== apt.hospitalId) {
      return NextResponse.json({ error: 'Hospital access denied' }, { status: 403 });
    }

    if (body.action === 'RESCHEDULE') {
      if (!body.slotDate || !body.slotStartTime || !body.slotEndTime) {
        return NextResponse.json({ error: 'New slot details are required' }, { status: 400 });
      }
      const appointment = isSupabaseDatabaseEnabled()
        ? await rescheduleSupabaseAppointment({
            appointmentId: id,
            slotDate: body.slotDate,
            slotStartTime: body.slotStartTime,
            slotEndTime: body.slotEndTime,
          })
        : mockDb.rescheduleAppointment(id, body.slotDate, body.slotStartTime, body.slotEndTime);
      return NextResponse.json({ success: true, appointment });
    }

    if (!nextState) {
      return NextResponse.json({ error: 'nextState is required' }, { status: 400 });
    }

    const updated = isSupabaseDatabaseEnabled()
      ? await updateSupabaseAppointmentState(id, nextState, {
          userId: session.subjectId,
          role: session.role,
          notes,
        })
      : mockDb.updateAppointmentState(id, nextState, {
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
