import { describe, it, expect } from 'vitest';
import { generateDaySlots, DoctorSchedule } from '@/lib/slots/slot-generator';

describe('Slot Generation Engine', () => {
  const schedule: DoctorSchedule = {
    doctorId: 'doc-sharma',
    shifts: [
      { shiftStart: '09:00', shiftEnd: '11:00', slotDurationMinutes: 15 },
      { shiftStart: '17:00', shiftEnd: '18:00', slotDurationMinutes: 20 },
    ],
    holidays: ['2026-12-25'],
    emergencyLockedSlotIds: ['2026-11-10_09:00'],
  };

  it('generates correct slot times for multiple shifts', () => {
    const slots = generateDaySlots(schedule, '2026-11-10', []);

    // Shift 1: 09:00 to 11:00 in 15 min increments = 8 slots
    // Shift 2: 17:00 to 18:00 in 20 min increments = 3 slots (17:00, 17:20, 17:40)
    // Total = 11 slots
    expect(slots.length).toBe(11);
    expect(slots[0].startTime).toBe('09:00');
    expect(slots[0].endTime).toBe('09:15');
    expect(slots[7].startTime).toBe('10:45');
    expect(slots[7].endTime).toBe('11:00');
    expect(slots[8].startTime).toBe('17:00');
    expect(slots[8].endTime).toBe('17:20');
  });

  it('correctly marks already-booked slots as unavailable', () => {
    const booked = ['09:30', '17:00'];
    const slots = generateDaySlots(schedule, '2026-11-10', booked);

    const slot930 = slots.find((s) => s.startTime === '09:30');
    expect(slot930?.isAvailable).toBe(false);

    const slot915 = slots.find((s) => s.startTime === '09:15');
    expect(slot915?.isAvailable).toBe(true);
  });

  it('respects emergency slot locks', () => {
    const slots = generateDaySlots(schedule, '2026-11-10', []);
    const emergencySlot = slots.find((s) => s.slotId === '2026-11-10_09:00');

    expect(emergencySlot?.isEmergencyOnly).toBe(true);
    expect(emergencySlot?.isAvailable).toBe(false);
  });

  it('returns empty slots array on hospital holidays', () => {
    const slots = generateDaySlots(schedule, '2026-12-25', []);
    expect(slots.length).toBe(0);
  });

  it('only generates slots on configured schedule weekdays', () => {
    const weekdaySchedule = { ...schedule, daysOfWeek: [1] };
    expect(generateDaySlots(weekdaySchedule, '2026-11-10')).toHaveLength(0);
    expect(generateDaySlots(weekdaySchedule, '2026-11-09').length).toBeGreaterThan(0);
  });
});
