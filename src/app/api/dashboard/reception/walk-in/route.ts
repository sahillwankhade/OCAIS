import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';
import { adapters } from '@/lib/adapters';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      hospitalId = 'hosp-sahyadri',
      doctorId,
      phone,
      fullName,
      age,
      gender,
      bloodGroup,
      notes,
    } = body;

    if (!doctorId || !phone) {
      return NextResponse.json({ error: 'doctorId and phone are required' }, { status: 400 });
    }

    const doctor = mockDb.getDoctorById(doctorId);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Find or create patient
    let patient = mockDb.getPatientByPhone(phone);
    if (!patient) {
      patient = mockDb.createPatient({
        phone,
        fullName: fullName || 'Walk-In Patient',
        age: Number(age) || 35,
        gender: gender || 'MALE',
        bloodGroup: bloodGroup || undefined,
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    // Create walk-in appointment
    const appointment = mockDb.createAppointment({
      hospitalId,
      doctorId,
      patientId: patient.id,
      slotDate: today,
      slotStartTime: nowTime,
      slotEndTime: nowTime,
      state: 'CHECKED_IN', // Walk-ins at reception are immediately marked CHECKED_IN
      isWalkIn: true,
      paymentStatus: 'PAID',
      paymentMethod: 'CASH',
      amountPaid: doctor.consultationFee,
      notes: notes || 'Walk-in booking registered at reception desk',
    });

    const tokenMessage = {
      phone: patient.phone,
      patientName: patient.fullName,
      doctorName: doctor.fullName,
      tokenNumber: appointment.tokenNumber,
      slotTime: `Today at ${appointment.slotStartTime}`,
      qrUrl: `http://localhost:3000/patient/queue/${appointment.id}`,
    };
    const [whatsappResult, smsResult, pushResult] = await Promise.all([
      adapters.whatsapp.sendTokenMessage(tokenMessage),
      adapters.sms.sendSms(
        patient.phone,
        `Your One Click AIS walk-in token is #${appointment.tokenNumber} for ${doctor.fullName}.`
      ),
      adapters.push.sendToUser(patient.id, {
        title: 'Walk-in token generated',
        body: `Your token is #${appointment.tokenNumber} for ${doctor.fullName}.`,
        url: `/patient/queue/${appointment.id}`,
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Walk-in token #${appointment.tokenNumber} generated successfully.`,
      appointment,
      patient,
      notifications: {
        whatsapp: whatsappResult.success,
        sms: smsResult.success,
        push: pushResult.success,
      },
      slipData: {
        tokenNumber: appointment.tokenNumber,
        hospitalName: 'Sahyadri Care Hospital',
        doctorName: doctor.fullName,
        cabinNumber: doctor.cabinNumber,
        patientName: patient.fullName,
        prn: patient.prn,
        fee: doctor.consultationFee,
        time: nowTime,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Walk-in registration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
