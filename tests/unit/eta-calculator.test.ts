import { describe, it, expect } from 'vitest';
import {
  calculateQueueEstimate,
  calculateMovingAverageConsultDuration,
} from '@/lib/queue/eta-calculator';

describe('Queue ETA and Leave Home By Engine', () => {
  describe('Moving Average Calculation', () => {
    it('returns default 8 minutes if past durations array is empty', () => {
      expect(calculateMovingAverageConsultDuration([])).toBe(8);
    });

    it('calculates average of last 20 consultations accurately', () => {
      // 10 consultations of 10 min, 10 consultations of 6 min -> average is 8
      const durations = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6];
      expect(calculateMovingAverageConsultDuration(durations)).toBe(8);
    });

    it('considers only the most recent 20 if more than 20 records exist', () => {
      // 10 old records of 50 min, then 20 recent records of 10 min
      const oldRecords = Array(10).fill(50);
      const recentRecords = Array(20).fill(10);
      const all = [...oldRecords, ...recentRecords];
      expect(calculateMovingAverageConsultDuration(all)).toBe(10);
    });
  });

  describe('Queue Wait & Leave Home By Estimation', () => {
    const fixedNow = new Date('2026-11-10T10:00:00Z');

    it('calculates wait time for a patient with 2 patients ahead and an active consult in progress', () => {
      // Doctor consult average: 10 mins
      // Currently in cabin: Token 10, started 4 minutes ago -> remaining is 10 - 4 = 6 mins
      // Waiting tokens: [11, 12, 13], our patient is Token 13
      // Patients ahead of Token 13: 2 patients (Tokens 11 and 12)
      // Expected wait: (2 * 10) + 6 = 26 minutes
      const result = calculateQueueEstimate({
        patientToken: 13,
        currentInConsultPatient: {
          tokenNumber: 10,
          consultationStartTime: new Date('2026-11-10T09:56:00Z').toISOString(),
        },
        waitingTokens: [11, 12, 13],
        doctor: {
          avgConsultDurationMinutes: 10,
          isPaused: false,
          delayMinutes: 0,
        },
        travelTimeMinutes: 15,
        bufferMinutes: 10,
        now: fixedNow,
      });

      expect(result.patientsAhead).toBe(2);
      expect(result.currentServingToken).toBe(10);
      expect(result.estimatedWaitMinutes).toBe(26);

      // Call time is 10:00 + 26 min = 10:26
      // Leave home by: 10:26 - 15 min travel - 10 min buffer = 10:01
      expect(result.estimatedCallTime).toBeDefined();
      expect(result.leaveHomeByTime).toBeDefined();
    });

    it('adds doctor delay to total estimated wait', () => {
      // Same scenario but doctor announced a 15-minute delay
      const result = calculateQueueEstimate({
        patientToken: 13,
        currentInConsultPatient: null, // No one in cabin yet
        waitingTokens: [11, 12, 13],
        doctor: {
          avgConsultDurationMinutes: 10,
          isPaused: false,
          delayMinutes: 15,
        },
        travelTimeMinutes: 10,
        bufferMinutes: 10,
        now: fixedNow,
      });

      // Patients ahead = 2 (11, 12) -> 2 * 10 = 20 mins + 15 min delay = 35 mins
      expect(result.patientsAhead).toBe(2);
      expect(result.estimatedWaitMinutes).toBe(35);
      expect(result.doctorStatus).toBe('DELAYED');
      expect(result.delayMinutes).toBe(15);
    });

    it('returns zero wait when patient is currently inside the cabin', () => {
      const result = calculateQueueEstimate({
        patientToken: 10,
        currentInConsultPatient: {
          tokenNumber: 10,
          consultationStartTime: new Date('2026-11-10T09:55:00Z').toISOString(),
        },
        waitingTokens: [11, 12],
        doctor: {
          avgConsultDurationMinutes: 10,
          isPaused: false,
          delayMinutes: 0,
        },
        now: fixedNow,
      });

      expect(result.patientsAhead).toBe(0);
      expect(result.estimatedWaitMinutes).toBe(0);
      expect(result.currentServingToken).toBe(10);
    });
  });
});

