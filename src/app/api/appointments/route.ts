import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';
import { adapters } from '@/lib/adapters';
import { forbiddenIfPatientMismatch, getSession } from '@/lib/security/access';
import { APP_BOOKING_FEE_INR } from '@/lib/billing/booking-fee';
import { generateDaySlots } from '@/lib/slots/slot-generator';
import {
  createSupabaseAppointment,
  getSupabaseDoctor,
  getSupabasePatientById,
  getSupabaseDoctorSchedule,
  isSupabaseDatabaseEnabled,
  listSupabaseAppointments,
  listSupabaseDoctors,
  listSupabaseFamilyMembers,
  listSupabaseHospitals,
} from '@/lib/data/supabase-repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const session = getSession(req);
    const requestedPatientId = searchParams.get('patientId') || undefined;
    if (process.env.NODE_ENV === 'production' && !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let patientId = requestedPatientId;
    let hospitalId: string | undefined;
    if (session?.role === 'patient') {
      patientId = session.subjectId;
      const accessError = forbiddenIfPatientMismatch(req, patientId);
      if (accessError) return accessError;
    } else if (session && ['doctor', 'receptionist', 'admin'].includes(session.role)) {
      hospitalId = session.hospitalId;
      if (!hospitalId || (searchParams.get('hospitalId') && searchParams.get('hospitalId') !== hospitalId)) {
        return NextResponse.json({ error: 'Hospital access denied' }, { status: 403 });
      }
      patientId = requestedPatientId;
    } else if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const doctorId = searchParams.get('doctorId') || undefined;
    const slotDate = searchParams.get('date') || undefined;
    if (isSupabaseDatabaseEnabled() && !patientId && !hospitalId) patientId = 'pat-1';
    const appointments = isSupabaseDatabaseEnabled()
      ? await listSupabaseAppointments({ hospitalId, patientId, doctorId, slotDate })
      : mockDb.getAppointments({ hospitalId, patientId: patientId || 'pat-1', doctorId, slotDate });

    const [doctors, hospitals] = isSupabaseDatabaseEnabled()
      ? await Promise.all([listSupabaseDoctors(), listSupabaseHospitals()])
      : [mockDb.getDoctors(), mockDb.getHospitals()];
    const doctorsById = new Map(doctors.map((doctor) => [doctor.id, doctor]));
    const hospitalsById = new Map(hospitals.map((hospital) => [hospital.id, hospital]));
    const enriched = appointments.map((appointment) => ({
      ...appointment,
      doctor: doctorsById.get(appointment.doctorId),
      hospital: hospitalsById.get(appointment.hospitalId),
    }));

    return NextResponse.json({ appointments: enriched });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load appointments' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      hospitalId,
      doctorId,
      patientId: requestedPatientId,
      familyMemberId,
      slotDate,
      slotStartTime,
      slotEndTime,
      notes,
    } = body;

    if (!hospitalId || !doctorId || !slotDate || !slotStartTime) {
      return NextResponse.json({ error: 'Missing mandatory booking details' }, { status: 400 });
    }

    const session = getSession(req);
    if (process.env.NODE_ENV === 'production' && (!session || session.role !== 'patient')) {
      return NextResponse.json({ error: 'Patient authentication required' }, { status: 401 });
    }
    const patientId = session?.role === 'patient'
      ? session.subjectId
      : requestedPatientId || 'pat-1';
    const accessError = forbiddenIfPatientMismatch(req, patientId);
    if (accessError) return accessError;

    const doctor = isSupabaseDatabaseEnabled()
      ? await getSupabaseDoctor(doctorId)
      : mockDb.getDoctorById(doctorId);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const patient = isSupabaseDatabaseEnabled()
      ? await getSupabasePatientById(patientId)
      : mockDb.getPatientById(patientId);
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    if (doctor.hospitalId !== hospitalId) {
      return NextResponse.json({ error: 'Doctor and hospital do not match' }, { status: 400 });
    }
    const familyMembers = isSupabaseDatabaseEnabled()
      ? await listSupabaseFamilyMembers(patientId)
      : mockDb.getFamilyMembers(patientId);
    if (familyMemberId && !familyMembers.some((member) => member.id === familyMemberId)) {
      return NextResponse.json({ error: 'Family member does not belong to patient' }, { status: 403 });
    }

    if (isSupabaseDatabaseEnabled()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(slotDate) || !/^\d{2}:\d{2}$/.test(slotStartTime)) {
        return NextResponse.json({ error: 'Invalid appointment date or time' }, { status: 400 });
      }
      const schedule = await getSupabaseDoctorSchedule(doctorId);
      const existing = await listSupabaseAppointments({ doctorId, slotDate });
      const availableSlots = generateDaySlots(
        schedule,
        slotDate,
        existing.filter((appointment) => appointment.state !== 'CANCELLED').map((appointment) => appointment.slotStartTime),
      );
      const slot = availableSlots.find((candidate) => candidate.startTime === slotStartTime && candidate.isAvailable);
      if (!slot || (slotEndTime && slot.endTime !== slotEndTime)) {
        return NextResponse.json({ error: 'That appointment slot is no longer available' }, { status: 409 });
      }
    }

    const order = await adapters.payment.createOrder({
      appointmentId: 'temp',
      amountInInr: APP_BOOKING_FEE_INR,
      patientPhone: patient.phone,
    });
    const verified = await adapters.payment.verifyPayment({
      orderId: order.orderId,
      paymentId: `pay_mock_${Date.now()}`,
      signature: 'mock_signature_valid',
    });
    if (!verified) {
      return NextResponse.json({ error: 'Booking fee payment could not be verified' }, { status: 402 });
    }

    const appointment = isSupabaseDatabaseEnabled()
      ? await createSupabaseAppointment({
          hospitalId,
          doctorId,
          patientId,
          familyMemberId: familyMemberId || undefined,
          slotDate,
          slotStartTime,
          slotEndTime: slotEndTime || slotStartTime,
          amountPaid: APP_BOOKING_FEE_INR,
          notes: notes || undefined,
        })
      : mockDb.createAppointment({
          hospitalId,
          doctorId,
          patientId,
          familyMemberId: familyMemberId || undefined,
          slotDate,
          slotStartTime,
          slotEndTime: slotEndTime || slotStartTime,
          state: 'BOOKED',
          isWalkIn: false,
          paymentStatus: 'PAID',
          paymentMethod: 'ONLINE_MOCK',
          amountPaid: APP_BOOKING_FEE_INR,
          notes: notes || undefined,
        });

    // Dispatch WhatsApp & SMS confirmation mock
    await adapters.whatsapp.sendTokenMessage({
      phone: patient.phone,
      patientName: patient.fullName,
      doctorName: doctor.fullName,
      tokenNumber: appointment.tokenNumber,
      slotTime: `${appointment.slotDate} at ${appointment.slotStartTime}`,
      qrUrl: `http://localhost:3000/patient/queue/${appointment.id}`,
    });

    return NextResponse.json({
      success: true,
      appointment,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to book appointment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
