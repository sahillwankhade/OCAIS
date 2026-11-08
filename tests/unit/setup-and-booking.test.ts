import { beforeEach, describe, expect, it } from 'vitest';
import { mockDb } from '@/lib/data/mock-db';

describe('Hospital setup and patient booking workflows', () => {
  beforeEach(() => {
    mockDb.resetToSeed();
  });

  it('updates hospital hours and propagates holidays to doctor schedules', () => {
    mockDb.updateHospital('hosp-sahyadri', { openingTime: '07:30', closingTime: '21:00' });
    const holidays = mockDb.updateHospitalHolidays('hosp-sahyadri', ['2026-12-25']);

    expect(mockDb.getHospitalById('hosp-sahyadri')?.openingTime).toBe('07:30');
    expect(holidays).toEqual(['2026-12-25']);
    expect(mockDb.getDoctorSchedule('doc-sharma').holidays).toEqual(['2026-12-25']);
  });

  it('creates a doctor with a default schedule', () => {
    const doctor = mockDb.createDoctor({
      hospitalId: 'hosp-sahyadri',
      fullName: 'Dr. Demo Rao',
      specialization: 'ENT',
      qualifications: 'MBBS',
      experienceYears: 4,
      cabinNumber: 'Cabin 103',
      consultationFee: 450,
      avgConsultDurationMinutes: 8,
      isAvailable: true,
      isPaused: false,
      delayMinutes: 0,
    });

    expect(mockDb.getDoctorById(doctor.id)?.fullName).toBe('Dr. Demo Rao');
    expect(mockDb.getDoctorSchedule(doctor.id).shifts[0].slotDurationMinutes).toBe(15);
  });

  it('reschedules a booked appointment and refreshes its signed QR date', () => {
    const appointment = mockDb.getAppointmentById('apt-booked-15');
    expect(appointment?.state).toBe('BOOKED');

    const updated = mockDb.rescheduleAppointment(
      'apt-booked-15',
      '2026-11-12',
      '11:00',
      '11:15'
    );

    expect(updated.slotDate).toBe('2026-11-12');
    expect(updated.slotStartTime).toBe('11:00');
    expect(updated.qrPayload).toContain('2026-11-12');
  });
});
