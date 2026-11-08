import { describe, expect, it } from 'vitest';
import { mockDb } from '@/lib/data';

describe('Reports and staff domain data', () => {
  it('returns today appointments and payment totals for a hospital', () => {
    const appointments = mockDb.getAppointments({ hospitalId: 'hosp-sahyadri' });
    expect(appointments.length).toBeGreaterThan(0);
    expect(appointments.filter((appointment) => appointment.paymentStatus === 'PAID').length).toBeGreaterThan(0);
  });

  it('toggles staff attendance without crossing hospital boundaries', () => {
    const before = mockDb.getStaff('hosp-sahyadri').find((member) => member.id === 'staff-reception-1');
    expect(before).toBeDefined();
    const updated = mockDb.toggleStaffAttendance('staff-reception-1');
    expect(updated?.presentToday).toBe(!before?.presentToday);
    expect(mockDb.getStaff('hosp-arogya').some((member) => member.id === 'staff-reception-1')).toBe(false);
  });

  it('exposes active digital forms', () => {
    expect(mockDb.getDigitalForms('hosp-sahyadri')).toHaveLength(2);
  });
});
