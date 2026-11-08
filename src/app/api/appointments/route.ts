import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';
import { adapters } from '@/lib/adapters';
import { forbiddenIfPatientMismatch } from '@/lib/security/access';
import { APP_BOOKING_FEE_INR } from '@/lib/billing/booking-fee';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId') || 'pat-1';
  const accessError = forbiddenIfPatientMismatch(req, patientId);
  if (accessError) return accessError;
  const doctorId = searchParams.get('doctorId');
  const slotDate = searchParams.get('date');

  const appointments = mockDb.getAppointments({
    patientId: patientId || undefined,
    doctorId: doctorId || undefined,
    slotDate: slotDate || undefined,
  });

  // Enrich appointments with doctor & hospital information for patient UI
  const enriched = appointments.map((apt) => {
    const doctor = mockDb.getDoctorById(apt.doctorId);
    const hospital = mockDb.getHospitalById(apt.hospitalId);
    return {
      ...apt,
      doctor,
      hospital,
    };
  });

  return NextResponse.json({ appointments: enriched });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      hospitalId,
      doctorId,
      patientId = 'pat-1',
      familyMemberId,
      slotDate,
      slotStartTime,
      slotEndTime,
      notes,
    } = body;

    if (!hospitalId || !doctorId || !slotDate || !slotStartTime) {
      return NextResponse.json({ error: 'Missing mandatory booking details' }, { status: 400 });
    }

    const doctor = mockDb.getDoctorById(doctorId);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const patient = mockDb.getPatientById(patientId);
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    const accessError = forbiddenIfPatientMismatch(req, patientId);
    if (accessError) return accessError;
    if (mockDb.getDoctorById(doctorId)?.hospitalId !== hospitalId) {
      return NextResponse.json({ error: 'Doctor and hospital do not match' }, { status: 400 });
    }
    if (familyMemberId && !mockDb.getFamilyMembers(patientId).some((member) => member.id === familyMemberId)) {
      return NextResponse.json({ error: 'Family member does not belong to patient' }, { status: 403 });
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

    const appointment = mockDb.createAppointment({
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
