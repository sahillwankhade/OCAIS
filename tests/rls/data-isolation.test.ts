import { describe, it, expect, beforeEach } from 'vitest';
import { mockDb } from '@/lib/data/mock-db';
import { generateQRPayload } from '@/lib/security/qr-token';

describe('Data Isolation & Row Level Security (RLS) Verification', () => {
  beforeEach(() => {
    mockDb.resetToSeed();
  });

  describe('Hospital Multi-Tenant Data Isolation', () => {
    it('ensures Hospital A staff can only access appointments for Hospital A', () => {
      // Query as Sahyadri Care Hospital staff
      const sahyadriApts = mockDb.getAppointments({ hospitalId: 'hosp-sahyadri' });
      expect(sahyadriApts.length).toBeGreaterThan(0);
      expect(sahyadriApts.every((a) => a.hospitalId === 'hosp-sahyadri')).toBe(true);

      // Verify no appointments from Arogya Clinic are leaked
      const arogyaLeak = sahyadriApts.find((a) => a.hospitalId === 'hosp-arogya');
      expect(arogyaLeak).toBeUndefined();
    });

    it('ensures Hospital B staff can only access appointments for Hospital B', () => {
      const arogyaApts = mockDb.getAppointments({ hospitalId: 'hosp-arogya' });
      expect(arogyaApts.length).toBeGreaterThan(0);
      expect(arogyaApts.every((a) => a.hospitalId === 'hosp-arogya')).toBe(true);

      const sahyadriLeak = arogyaApts.find((a) => a.hospitalId === 'hosp-sahyadri');
      expect(sahyadriLeak).toBeUndefined();
    });

    it('ensures audit logs are strictly partitioned by hospitalId', () => {
      mockDb.logAudit({
        hospitalId: 'hosp-sahyadri',
        userId: 'usr-staff-1',
        role: 'receptionist',
        action: 'UPDATE_TIMINGS',
        entityType: 'hospital',
        entityId: 'hosp-sahyadri',
      });

      mockDb.logAudit({
        hospitalId: 'hosp-arogya',
        userId: 'usr-staff-2',
        role: 'admin',
        action: 'ADD_DOCTOR',
        entityType: 'doctor',
        entityId: 'doc-nair',
      });

      const sahyadriLogs = mockDb.getAuditLogs('hosp-sahyadri');
      expect(sahyadriLogs.every((l) => l.hospitalId === 'hosp-sahyadri')).toBe(true);

      const arogyaLogs = mockDb.getAuditLogs('hosp-arogya');
      expect(arogyaLogs.every((l) => l.hospitalId === 'hosp-arogya')).toBe(true);
    });
  });

  describe('Patient Privacy & Medical Data Isolation', () => {
    it('ensures Patient 1 can only retrieve their own appointments', () => {
      const pat1Apts = mockDb.getAppointments({ patientId: 'pat-1' });
      expect(pat1Apts.length).toBeGreaterThan(0);
      expect(pat1Apts.every((a) => a.patientId === 'pat-1')).toBe(true);

      // Verify Patient 1 cannot access Patient 2's appointments
      const leak = pat1Apts.find((a) => a.patientId === 'pat-2');
      expect(leak).toBeUndefined();
    });

    it('ensures Patient 1 can only view their own family members', () => {
      const family1 = mockDb.getFamilyMembers('pat-1');
      expect(family1.length).toBe(2);
      expect(family1.every((f) => f.primaryPatientId === 'pat-1')).toBe(true);

      const family3 = mockDb.getFamilyMembers('pat-3');
      expect(family3.length).toBe(1);
      expect(family3.every((f) => f.primaryPatientId === 'pat-3')).toBe(true);
    });
  });

  describe('Cabin QR Security Isolation', () => {
    it('prevents scanning a QR token at the wrong doctor cabin', () => {
      const today = new Date().toISOString().split('T')[0];
      const validQr = generateQRPayload({
        appointmentId: 'apt-checkedin-14',
        doctorId: 'doc-sharma',
        hospitalId: 'hosp-sahyadri',
        tokenNumber: 14,
        slotDate: today,
      });

      // Attempt scan at Dr. Kulkarni's cabin
      const result = mockDb.scanDoctorCabinQR(JSON.stringify(validQr), 'doc-kulkarni', today);
      expect(result.success).toBe(false);
      expect(result.message).toContain('different doctor cabin');
    });

    it('successfully processes QR scan at the correct doctor cabin and auto-completes previous consult', () => {
      const today = new Date().toISOString().split('T')[0];
      // Before scan: apt-inconsult-12 is IN_CONSULT, apt-checkedin-14 is CHECKED_IN
      const prevApt = mockDb.getAppointmentById('apt-inconsult-12');
      expect(prevApt?.state).toBe('IN_CONSULT');

      const validQr = generateQRPayload({
        appointmentId: 'apt-checkedin-14',
        doctorId: 'doc-sharma',
        hospitalId: 'hosp-sahyadri',
        tokenNumber: 14,
        slotDate: today,
      });

      // Scan at Dr. Sharma cabin
      const result = mockDb.scanDoctorCabinQR(JSON.stringify(validQr), 'doc-sharma', today);
      expect(result.success).toBe(true);
      expect(result.appointment?.state).toBe('IN_CONSULT');

      // Verify previous patient was automatically transitioned to COMPLETED with consultation end time recorded
      const updatedPrevApt = mockDb.getAppointmentById('apt-inconsult-12');
      expect(updatedPrevApt?.state).toBe('COMPLETED');
      expect(updatedPrevApt?.consultationEndTime).toBeDefined();
    });
  });
});

