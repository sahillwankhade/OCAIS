import { QueueEstimate } from '../types';

export interface DoctorQueueState {
  avgConsultDurationMinutes: number; // default 8
  isPaused: boolean;
  delayMinutes: number;
}

export interface InConsultPatientInfo {
  tokenNumber: number;
  consultationStartTime: string; // ISO date string
}

export interface CalculateETAOptions {
  patientToken: number;
  currentInConsultPatient: InConsultPatientInfo | null;
  waitingTokens: number[]; // Tokens currently waiting, in order
  doctor: DoctorQueueState;
  travelTimeMinutes?: number; // e.g. 20 min from Maps adapter
  bufferMinutes?: number; // default 10 minutes buffer
  now?: Date;
}

/**
 * Calculates doctor's average consultation duration from their last 20 consultations
 * Defaults to 8 minutes if fewer than 3 historical records exist
 */
export function calculateMovingAverageConsultDuration(
  pastDurationsMinutes: number[],
  fallbackDefault = 8
): number {
  if (!pastDurationsMinutes || pastDurationsMinutes.length === 0) {
    return fallbackDefault;
  }
  // Take at most the last 20 durations
  const sample = pastDurationsMinutes.slice(-20);
  const sum = sample.reduce((acc, curr) => acc + curr, 0);
  const avg = Math.round(sum / sample.length);
  return avg > 0 ? avg : fallbackDefault;
}

/**
 * Core dynamic queue and ETA calculation engine
 */
export function calculateQueueEstimate({
  patientToken,
  currentInConsultPatient,
  waitingTokens,
  doctor,
  travelTimeMinutes = 20,
  bufferMinutes = 10,
  now = new Date(),
}: CalculateETAOptions): QueueEstimate {
  const avgDuration = doctor.avgConsultDurationMinutes > 0 ? doctor.avgConsultDurationMinutes : 8;

  // Is this patient currently inside the cabin?
  const isInCabin = currentInConsultPatient?.tokenNumber === patientToken;

  if (isInCabin) {
    return {
      tokenNumber: patientToken,
      currentServingToken: patientToken,
      patientsAhead: 0,
      estimatedWaitMinutes: 0,
      estimatedCallTime: formatTimeHHMM(now),
      leaveHomeByTime: formatTimeHHMM(now),
      doctorStatus: doctor.isPaused ? 'PAUSED' : 'ACTIVE',
      delayMinutes: doctor.delayMinutes,
    };
  }

  // Count patients strictly ahead of this token in the waiting queue
  const patientsAhead = waitingTokens.filter((token) => token < patientToken).length;

  // Calculate remaining time for the patient currently inside the cabin
  let remainingCurrentPatientMinutes = 0;
  if (currentInConsultPatient) {
    const consultStart = new Date(currentInConsultPatient.consultationStartTime).getTime();
    const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - consultStart) / (1000 * 60)));
    remainingCurrentPatientMinutes = Math.max(0, avgDuration - elapsedMinutes);
  }

  // Estimated wait = (patients ahead * avg consult) + remaining current patient + doctor delay
  let totalWaitMinutes =
    patientsAhead * avgDuration + remainingCurrentPatientMinutes + (doctor.delayMinutes || 0);

  if (totalWaitMinutes < 0) totalWaitMinutes = 0;

  // Compute estimated call time
  const callTimestamp = new Date(now.getTime() + totalWaitMinutes * 60 * 1000);
  const estimatedCallTime = formatTimeHHMM(callTimestamp);

  // Leave home by = Estimated Call Time - Travel Time - 10 min buffer
  const totalTravelAndBufferMs = (travelTimeMinutes + bufferMinutes) * 60 * 1000;
  const leaveHomeTimestamp = new Date(callTimestamp.getTime() - totalTravelAndBufferMs);
  const leaveHomeByTime = formatTimeHHMM(leaveHomeTimestamp);

  let doctorStatus: 'ACTIVE' | 'DELAYED' | 'PAUSED' | 'OFFLINE' = 'ACTIVE';
  if (doctor.isPaused) {
    doctorStatus = 'PAUSED';
  } else if (doctor.delayMinutes > 0) {
    doctorStatus = 'DELAYED';
  }

  return {
    tokenNumber: patientToken,
    currentServingToken: currentInConsultPatient?.tokenNumber ?? null,
    patientsAhead,
    estimatedWaitMinutes: totalWaitMinutes,
    estimatedCallTime,
    leaveHomeByTime,
    doctorStatus,
    delayMinutes: doctor.delayMinutes,
  };
}

function formatTimeHHMM(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

