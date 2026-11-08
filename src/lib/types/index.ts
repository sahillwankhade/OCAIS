/**
 * Core Domain Types for One Click AIS (OCAIS)
 */

export type AppointmentState =
  | 'BOOKED'
  | 'CHECKED_IN'
  | 'IN_CONSULT'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'SKIPPED';

export type UserRole = 'patient' | 'doctor' | 'receptionist' | 'admin' | 'superadmin';

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'ONLINE_MOCK';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';

export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  openingTime: string; // e.g. "08:00"
  closingTime: string; // e.g. "20:00"
  departments: string[];
  createdAt: string;
}

export interface Doctor {
  id: string;
  hospitalId: string;
  fullName: string;
  specialization: string;
  qualifications: string;
  experienceYears: number;
  cabinNumber: string;
  consultationFee: number;
  avgConsultDurationMinutes: number; // Moving average or default 8 min
  isAvailable: boolean;
  isPaused: boolean;
  delayMinutes: number; // e.g. Doctor is delayed 15 min
  avatarUrl?: string;
}

export interface Patient {
  id: string;
  phone: string;
  prn: string; // Patient Registration Number (e.g. PRN-2026-0001)
  fullName: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  primaryPatientId: string;
  fullName: string;
  relationship: 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'OTHER';
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface Appointment {
  id: string;
  hospitalId: string;
  doctorId: string;
  patientId: string;
  familyMemberId?: string; // If booked for dependent
  tokenNumber: number; // e.g. 14
  slotDate: string; // YYYY-MM-DD
  slotStartTime: string; // HH:mm
  slotEndTime: string; // HH:mm
  state: AppointmentState;
  isWalkIn: boolean;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  consultationStartTime?: string; // ISO
  consultationEndTime?: string; // ISO
  actualDurationMinutes?: number;
  qrPayload?: string;
  notes?: string;
  prescription?: PrescriptionData;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionData {
  diagnosis: string[];
  medications: {
    name: string;
    dosage: string;
    frequency: string; // e.g. "1-0-1 after food"
    durationDays: number;
  }[];
  advice?: string;
  nextFollowUpDate?: string;
}

export interface QRPayload {
  appointmentId: string;
  doctorId: string;
  hospitalId: string;
  tokenNumber: number;
  slotDate: string;
  expiresAt: string; // ISO string
  signature: string; // HMAC-SHA256
}

export interface QueueEstimate {
  tokenNumber: number;
  currentServingToken: number | null;
  patientsAhead: number;
  estimatedWaitMinutes: number;
  estimatedCallTime: string; // HH:mm format
  leaveHomeByTime: string; // HH:mm format
  doctorStatus: 'ACTIVE' | 'DELAYED' | 'PAUSED' | 'OFFLINE';
  delayMinutes: number;
}

