import { describe, expect, it } from 'vitest';
import { sendDelayAlerts, sendFollowUpReminder } from '@/lib/notifications/service';
import { Doctor, Patient, Appointment } from '@/lib/types';

const doctor: Doctor = {
  id: 'doc-test',
  hospitalId: 'hosp-test',
  fullName: 'Dr. Test',
  specialization: 'General Medicine',
  qualifications: 'MBBS',
  experienceYears: 10,
  cabinNumber: '101',
  consultationFee: 500,
  avgConsultDurationMinutes: 8,
  isAvailable: true,
  isPaused: false,
  delayMinutes: 0,
};

const patient: Patient = {
  id: 'pat-test',
  phone: '9876543210',
  prn: 'PRN-TEST',
  fullName: 'Test Patient',
  age: 30,
  gender: 'OTHER',
  createdAt: new Date().toISOString(),
};

const completedAppointment: Appointment = {
  id: 'apt-test',
  hospitalId: doctor.hospitalId,
  doctorId: doctor.id,
  patientId: patient.id,
  tokenNumber: 1,
  slotDate: '2026-11-08',
  slotStartTime: '10:00',
  slotEndTime: '10:15',
  state: 'COMPLETED',
  isWalkIn: false,
  paymentStatus: 'PAID',
  paymentMethod: 'ONLINE_MOCK',
  amountPaid: 500,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Notification orchestration', () => {
  it('delivers delay alerts across SMS, WhatsApp and push', async () => {
    const result = await sendDelayAlerts(doctor, [patient], 15);

    expect(result.deliveries).toHaveLength(3);
    expect(result.successCount).toBe(3);
    expect(result.deliveries.map((delivery) => delivery.channel)).toEqual([
      'SMS',
      'WHATSAPP',
      'PUSH',
    ]);
  });

  it('delivers completed-visit follow-up reminders across all channels', async () => {
    const result = await sendFollowUpReminder(completedAppointment, doctor, patient);

    expect(result.deliveries).toHaveLength(3);
    expect(result.successCount).toBe(3);
  });
});
