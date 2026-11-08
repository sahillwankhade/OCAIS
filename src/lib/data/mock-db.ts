import {
  Hospital,
  Doctor,
  Patient,
  FamilyMember,
  Appointment,
  AppointmentState,
  QueueEstimate,
  StaffMember,
  DigitalForm,
} from '../types';
import { assertValidTransition } from '../state-machine/appointment-state';
import { verifyQRPayload, generateQRPayload } from '../security/qr-token';
import { calculateQueueEstimate } from '../queue/eta-calculator';
import { DoctorSchedule } from '../slots/slot-generator';

export interface AuditLogEntry {
  id: string;
  hospitalId?: string;
  userId?: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  oldState?: string;
  newState?: string;
  timestamp: string;
}

class InMemoryDatabase {
  private hospitals: Map<string, Hospital> = new Map();
  private doctors: Map<string, Doctor> = new Map();
  private patients: Map<string, Patient> = new Map();
  private familyMembers: Map<string, FamilyMember> = new Map();
  private appointments: Map<string, Appointment> = new Map();
  private schedules: Map<string, DoctorSchedule> = new Map();
  private holidays: Map<string, string[]> = new Map();
  private auditLogs: AuditLogEntry[] = [];
  private staff: Map<string, StaffMember> = new Map();
  private forms: Map<string, DigitalForm> = new Map();

  constructor() {
    this.seedInitialData();
  }

  public resetToSeed() {
    this.hospitals.clear();
    this.doctors.clear();
    this.patients.clear();
    this.familyMembers.clear();
    this.appointments.clear();
    this.schedules.clear();
    this.holidays.clear();
    this.auditLogs = [];
    this.staff.clear();
    this.forms.clear();
    this.seedInitialData();
  }

  private seedInitialData() {
    const today = new Date().toISOString().split('T')[0];

    // Seed Hospitals
    const hosp1: Hospital = {
      id: 'hosp-sahyadri',
      name: 'Sahyadri Care Hospital',
      address: 'Plot 14, Karve Road, Deccan Gymkhana',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411004',
      phone: '+91-20-67215000',
      email: 'care@sahyadri-demo.in',
      openingTime: '08:00',
      closingTime: '20:00',
      departments: ['General Medicine', 'Pediatrics', 'Orthopedics', 'Cardiology', 'ENT'],
      createdAt: new Date().toISOString(),
      isSponsored: true,
      sponsorLabel: 'Sponsored partner',
    };
    const hosp2: Hospital = {
      id: 'hosp-arogya',
      name: 'Arogya Multi-Specialty Clinic',
      address: 'Building 4B, Swami Vivekananda Road, Dadar West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400028',
      phone: '+91-22-24308899',
      email: 'appointments@arogya-demo.in',
      openingTime: '09:00',
      closingTime: '21:00',
      departments: ['General Medicine', 'Cardiology', 'Dermatology', 'Gynecology'],
      createdAt: new Date().toISOString(),
      isSponsored: false,
    };
    this.hospitals.set(hosp1.id, hosp1);
    this.hospitals.set(hosp2.id, hosp2);

    // Seed Doctors
    const docs: Doctor[] = [
      {
        id: 'doc-sharma',
        hospitalId: 'hosp-sahyadri',
        fullName: 'Dr. Rajesh Sharma',
        specialization: 'General Medicine',
        qualifications: 'MBBS, MD (Medicine)',
        experienceYears: 14,
        cabinNumber: 'Cabin 101',
        consultationFee: 500,
        avgConsultDurationMinutes: 10,
        isAvailable: true,
        isPaused: false,
        delayMinutes: 0,
      },
      {
        id: 'doc-kulkarni',
        hospitalId: 'hosp-sahyadri',
        fullName: 'Dr. Sneha Kulkarni',
        specialization: 'Pediatrics',
        qualifications: 'MBBS, DCH, DNB (Pediatrics)',
        experienceYears: 9,
        cabinNumber: 'Cabin 102',
        consultationFee: 600,
        avgConsultDurationMinutes: 12,
        isAvailable: true,
        isPaused: false,
        delayMinutes: 0,
      },
      {
        id: 'doc-deshmukh',
        hospitalId: 'hosp-arogya',
        fullName: 'Dr. Amit Deshmukh',
        specialization: 'Orthopedics',
        qualifications: 'MBBS, MS (Ortho), Fellowship Joint Replacement',
        experienceYears: 16,
        cabinNumber: 'Cabin 201',
        consultationFee: 800,
        avgConsultDurationMinutes: 15,
        isAvailable: true,
        isPaused: false,
        delayMinutes: 0,
      },
      {
        id: 'doc-nair',
        hospitalId: 'hosp-arogya',
        fullName: 'Dr. Priya Nair',
        specialization: 'Cardiology',
        qualifications: 'MBBS, MD, DM (Cardiology)',
        experienceYears: 11,
        cabinNumber: 'Cabin 202',
        consultationFee: 1000,
        avgConsultDurationMinutes: 15,
        isAvailable: true,
        isPaused: false,
        delayMinutes: 0,
      },
    ];
    for (const d of docs) {
      this.doctors.set(d.id, d);
      this.schedules.set(d.id, {
        doctorId: d.id,
        shifts: [{ shiftStart: '09:00', shiftEnd: '13:00', slotDurationMinutes: 15 }],
        holidays: [],
        emergencyLockedSlotIds: [],
      });
      this.holidays.set(d.hospitalId, []);
    }

    // Seed Patients
    const pats: Patient[] = [
      {
        id: 'pat-1',
        phone: '9820011111',
        prn: 'PRN-2026-0001',
        fullName: 'Aarav Patil',
        age: 32,
        gender: 'MALE',
        bloodGroup: 'B+',
        address: 'Kothrud, Pune',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'pat-2',
        phone: '9820022222',
        prn: 'PRN-2026-0002',
        fullName: 'Ananya Deshmukh',
        age: 28,
        gender: 'FEMALE',
        bloodGroup: 'O+',
        address: 'Shivajinagar, Pune',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'pat-3',
        phone: '9820033333',
        prn: 'PRN-2026-0003',
        fullName: 'Ramesh Joshi',
        age: 64,
        gender: 'MALE',
        bloodGroup: 'A+',
        address: 'Dadar, Mumbai',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'pat-4',
        phone: '9820044444',
        prn: 'PRN-2026-0004',
        fullName: 'Sunita Kulkarni',
        age: 58,
        gender: 'FEMALE',
        bloodGroup: 'AB+',
        address: 'Aundh, Pune',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'pat-5',
        phone: '9820055555',
        prn: 'PRN-2026-0005',
        fullName: 'Vikram Shinde',
        age: 41,
        gender: 'MALE',
        bloodGroup: 'O-',
        address: 'Viman Nagar, Pune',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'pat-6',
        phone: '9820066666',
        prn: 'PRN-2026-0006',
        fullName: 'Pooja Mehta',
        age: 25,
        gender: 'FEMALE',
        bloodGroup: 'B+',
        address: 'Bandra, Mumbai',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'pat-7',
        phone: '9820077777',
        prn: 'PRN-2026-0007',
        fullName: 'Sanjay Gokhale',
        age: 49,
        gender: 'MALE',
        bloodGroup: 'A-',
        address: 'Hadapsar, Pune',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'pat-8',
        phone: '9820088888',
        prn: 'PRN-2026-0008',
        fullName: 'Meena Iyer',
        age: 37,
        gender: 'FEMALE',
        bloodGroup: 'O+',
        address: 'Andheri, Mumbai',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'pat-9',
        phone: '9820099999',
        prn: 'PRN-2026-0009',
        fullName: 'Rohit Kamat',
        age: 19,
        gender: 'MALE',
        bloodGroup: 'B-',
        address: 'Baner, Pune',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'pat-10',
        phone: '9820010101',
        prn: 'PRN-2026-0010',
        fullName: 'Kavita Bhosale',
        age: 52,
        gender: 'FEMALE',
        bloodGroup: 'AB-',
        address: 'Parel, Mumbai',
        createdAt: new Date().toISOString(),
      },
    ];
    for (const p of pats) {
      this.patients.set(p.id, p);
    }

    // Seed Family Members
    const f1: FamilyMember = {
      id: 'fam-1',
      primaryPatientId: 'pat-1',
      fullName: 'Diya Patil',
      relationship: 'CHILD',
      age: 4,
      gender: 'FEMALE',
    };
    const f2: FamilyMember = {
      id: 'fam-2',
      primaryPatientId: 'pat-1',
      fullName: 'Priyanka Patil',
      relationship: 'SPOUSE',
      age: 30,
      gender: 'FEMALE',
    };
    const f3: FamilyMember = {
      id: 'fam-3',
      primaryPatientId: 'pat-3',
      fullName: 'Vandana Joshi',
      relationship: 'SPOUSE',
      age: 61,
      gender: 'FEMALE',
    };
    this.familyMembers.set(f1.id, f1);
    this.familyMembers.set(f2.id, f2);
    this.familyMembers.set(f3.id, f3);

    // Seed Appointments in ALL 7 States for Dr. Sharma
    const appointmentsList: Appointment[] = [
      {
        id: 'apt-completed-11',
        hospitalId: 'hosp-sahyadri',
        doctorId: 'doc-sharma',
        patientId: 'pat-5',
        tokenNumber: 11,
        slotDate: today,
        slotStartTime: '09:30',
        slotEndTime: '09:45',
        state: 'COMPLETED',
        isWalkIn: false,
        paymentStatus: 'PAID',
        paymentMethod: 'ONLINE_MOCK',
        amountPaid: 500,
        consultationStartTime: new Date(Date.now() - 25 * 60000).toISOString(),
        consultationEndTime: new Date(Date.now() - 15 * 60000).toISOString(),
        actualDurationMinutes: 10,
        notes: 'Routine hypertension follow-up. BP 124/82. Prescription renewed.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'apt-inconsult-12',
        hospitalId: 'hosp-sahyadri',
        doctorId: 'doc-sharma',
        patientId: 'pat-2',
        tokenNumber: 12,
        slotDate: today,
        slotStartTime: '09:45',
        slotEndTime: '10:00',
        state: 'IN_CONSULT',
        isWalkIn: false,
        paymentStatus: 'PAID',
        paymentMethod: 'ONLINE_MOCK',
        amountPaid: 500,
        consultationStartTime: new Date(Date.now() - 5 * 60000).toISOString(),
        notes: 'Viral fever with mild sore throat.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'apt-checkedin-14',
        hospitalId: 'hosp-sahyadri',
        doctorId: 'doc-sharma',
        patientId: 'pat-1',
        tokenNumber: 14,
        slotDate: today,
        slotStartTime: '10:15',
        slotEndTime: '10:30',
        state: 'CHECKED_IN',
        isWalkIn: false,
        paymentStatus: 'PAID',
        paymentMethod: 'ONLINE_MOCK',
        amountPaid: 500,
        notes: 'Seasonal allergy and chest congestion.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'apt-booked-15',
        hospitalId: 'hosp-sahyadri',
        doctorId: 'doc-sharma',
        patientId: 'pat-4',
        tokenNumber: 15,
        slotDate: today,
        slotStartTime: '10:30',
        slotEndTime: '10:45',
        state: 'BOOKED',
        isWalkIn: false,
        paymentStatus: 'PAID',
        paymentMethod: 'ONLINE_MOCK',
        amountPaid: 500,
        notes: 'Knee pain follow-up.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'apt-skipped-10',
        hospitalId: 'hosp-sahyadri',
        doctorId: 'doc-sharma',
        patientId: 'pat-7',
        tokenNumber: 10,
        slotDate: today,
        slotStartTime: '09:15',
        slotEndTime: '09:30',
        state: 'SKIPPED',
        isWalkIn: false,
        paymentStatus: 'PAID',
        paymentMethod: 'ONLINE_MOCK',
        amountPaid: 500,
        notes: 'Patient was briefly outside when called.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'apt-noshow-9',
        hospitalId: 'hosp-sahyadri',
        doctorId: 'doc-sharma',
        patientId: 'pat-9',
        tokenNumber: 9,
        slotDate: today,
        slotStartTime: '09:00',
        slotEndTime: '09:15',
        state: 'NO_SHOW',
        isWalkIn: false,
        paymentStatus: 'PENDING',
        paymentMethod: 'CASH',
        amountPaid: 500,
        notes: 'Did not arrive during slot.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'apt-cancelled-13',
        hospitalId: 'hosp-sahyadri',
        doctorId: 'doc-sharma',
        patientId: 'pat-10',
        tokenNumber: 13,
        slotDate: today,
        slotStartTime: '10:00',
        slotEndTime: '10:15',
        state: 'CANCELLED',
        isWalkIn: false,
        paymentStatus: 'REFUNDED',
        paymentMethod: 'ONLINE_MOCK',
        amountPaid: 500,
        notes: 'Patient cancelled due to urgent travel.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'apt-walkin-1',
        hospitalId: 'hosp-arogya',
        doctorId: 'doc-deshmukh',
        patientId: 'pat-3',
        tokenNumber: 1,
        slotDate: today,
        slotStartTime: '11:00',
        slotEndTime: '11:15',
        state: 'CHECKED_IN',
        isWalkIn: true,
        paymentStatus: 'PAID',
        paymentMethod: 'CASH',
        amountPaid: 800,
        notes: 'Walk-in emergency sprain assessment.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const apt of appointmentsList) {
      // Attach signed QR payload
      const qrPayloadObj = generateQRPayload({
        appointmentId: apt.id,
        doctorId: apt.doctorId,
        hospitalId: apt.hospitalId,
        tokenNumber: apt.tokenNumber,
        slotDate: apt.slotDate,
      });
      apt.qrPayload = JSON.stringify(qrPayloadObj);
      this.appointments.set(apt.id, apt);
    }

    this.staff.set('staff-admin-1', {
      id: 'staff-admin-1', hospitalId: 'hosp-sahyadri', fullName: 'Meera Joshi',
      role: 'admin', phone: '9820099999', presentToday: true, lastAttendanceAt: new Date().toISOString(),
    });
    this.staff.set('staff-reception-1', {
      id: 'staff-reception-1', hospitalId: 'hosp-sahyadri', fullName: 'Kiran Pawar',
      role: 'receptionist', phone: '9820088888', presentToday: false,
    });
    for (const doctor of this.getDoctors('hosp-sahyadri')) {
      this.staff.set(`staff-${doctor.id}`, {
        id: `staff-${doctor.id}`, hospitalId: doctor.hospitalId, fullName: doctor.fullName,
        role: 'doctor', phone: '', presentToday: doctor.isAvailable,
      });
    }
    this.forms.set('form-consent', {
      id: 'form-consent', hospitalId: 'hosp-sahyadri', name: 'OPD Consent',
      description: 'Consent for consultation and digital records.', required: true, active: true,
    });
    this.forms.set('form-history', {
      id: 'form-history', hospitalId: 'hosp-sahyadri', name: 'Medical History',
      description: 'Symptoms, medications, allergies and prior conditions.', required: false, active: true,
    });
  }

  // Hospital queries
  getHospitals(): Hospital[] {
    return Array.from(this.hospitals.values());
  }

  getHospitalById(id: string): Hospital | undefined {
    return this.hospitals.get(id);
  }

  getStaff(hospitalId: string): StaffMember[] {
    return [...this.staff.values()].filter((member) => member.hospitalId === hospitalId);
  }

  toggleStaffAttendance(id: string): StaffMember | undefined {
    const member = this.staff.get(id);
    if (!member) return undefined;
    const updated = { ...member, presentToday: !member.presentToday, lastAttendanceAt: new Date().toISOString() };
    this.staff.set(id, updated);
    return updated;
  }

  getDigitalForms(hospitalId: string): DigitalForm[] {
    return [...this.forms.values()].filter((form) => form.hospitalId === hospitalId);
  }

  // Doctor queries
  getDoctors(hospitalId?: string): Doctor[] {
    const all = Array.from(this.doctors.values());
    if (hospitalId) {
      return all.filter((d) => d.hospitalId === hospitalId);
    }
    return all;
  }

  getDoctorById(id: string): Doctor | undefined {
    return this.doctors.get(id);
  }

  updateDoctor(id: string, updates: Partial<Doctor>): Doctor | undefined {
    const doc = this.doctors.get(id);
    if (!doc) return undefined;
    const updated = { ...doc, ...updates };
    this.doctors.set(id, updated);
    return updated;
  }

  updateHospital(id: string, updates: Partial<Hospital>): Hospital | undefined {
    const hospital = this.hospitals.get(id);
    if (!hospital) return undefined;
    const updated = { ...hospital, ...updates };
    this.hospitals.set(id, updated);
    return updated;
  }

  createDoctor(doctor: Omit<Doctor, 'id'>): Doctor {
    const id = `doc-${Date.now()}`;
    const created = { ...doctor, id };
    this.doctors.set(id, created);
    this.schedules.set(id, {
      doctorId: id,
      shifts: [{ shiftStart: '09:00', shiftEnd: '13:00', slotDurationMinutes: 15 }],
      holidays: [],
      emergencyLockedSlotIds: [],
    });
    return created;
  }

  getDoctorSchedule(doctorId: string): DoctorSchedule {
    return (
      this.schedules.get(doctorId) || {
        doctorId,
        shifts: [{ shiftStart: '09:00', shiftEnd: '13:00', slotDurationMinutes: 15 }],
        holidays: [],
        emergencyLockedSlotIds: [],
      }
    );
  }

  updateDoctorSchedule(doctorId: string, schedule: Omit<DoctorSchedule, 'doctorId'>): DoctorSchedule {
    const updated = { doctorId, ...schedule };
    this.schedules.set(doctorId, updated);
    return updated;
  }

  getHospitalHolidays(hospitalId: string): string[] {
    return [...(this.holidays.get(hospitalId) || [])];
  }

  updateHospitalHolidays(hospitalId: string, holidays: string[]): string[] {
    const unique = [...new Set(holidays)].sort();
    this.holidays.set(hospitalId, unique);
    for (const doctor of this.getDoctors(hospitalId)) {
      const schedule = this.getDoctorSchedule(doctor.id);
      this.updateDoctorSchedule(doctor.id, { ...schedule, holidays: unique });
    }
    return unique;
  }

  // Patient queries
  getPatients(): Patient[] {
    return Array.from(this.patients.values());
  }

  getPatientById(id: string): Patient | undefined {
    return this.patients.get(id);
  }

  getPatientByPhone(phone: string): Patient | undefined {
    return Array.from(this.patients.values()).find((p) => p.phone === phone);
  }

  getPatientByPrn(prn: string): Patient | undefined {
    return Array.from(this.patients.values()).find((p) => p.prn.toLowerCase() === prn.toLowerCase());
  }

  createPatient(patient: Omit<Patient, 'id' | 'prn' | 'createdAt'>): Patient {
    const id = `pat-${Date.now()}`;
    const seq = (this.patients.size + 1).toString().padStart(4, '0');
    const prn = `PRN-${new Date().getFullYear()}-${seq}`;
    const created: Patient = {
      ...patient,
      id,
      prn,
      createdAt: new Date().toISOString(),
    };
    this.patients.set(id, created);
    return created;
  }

  // Family queries
  getFamilyMembers(primaryPatientId: string): FamilyMember[] {
    return Array.from(this.familyMembers.values()).filter(
      (f) => f.primaryPatientId === primaryPatientId
    );
  }

  createFamilyMember(member: Omit<FamilyMember, 'id'>): FamilyMember {
    const id = `fam-${Date.now()}`;
    const created: FamilyMember = { ...member, id };
    this.familyMembers.set(id, created);
    return created;
  }

  // Appointment queries
  getAppointments(filters?: {
    hospitalId?: string;
    doctorId?: string;
    patientId?: string;
    slotDate?: string;
    state?: AppointmentState;
  }): Appointment[] {
    let result = Array.from(this.appointments.values());
    if (filters?.hospitalId) {
      result = result.filter((a) => a.hospitalId === filters.hospitalId);
    }
    if (filters?.doctorId) {
      result = result.filter((a) => a.doctorId === filters.doctorId);
    }
    if (filters?.patientId) {
      result = result.filter((a) => a.patientId === filters.patientId);
    }
    if (filters?.slotDate) {
      result = result.filter((a) => a.slotDate === filters.slotDate);
    }
    if (filters?.state) {
      result = result.filter((a) => a.state === filters.state);
    }
    return result.sort((a, b) => a.tokenNumber - b.tokenNumber);
  }

  getAppointmentById(id: string): Appointment | undefined {
    return this.appointments.get(id);
  }

  createAppointment(appointmentData: Omit<Appointment, 'id' | 'tokenNumber' | 'createdAt' | 'updatedAt' | 'qrPayload'>): Appointment {
    const id = `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Calculate next token number for this doctor on this day
    const existing = this.getAppointments({
      doctorId: appointmentData.doctorId,
      slotDate: appointmentData.slotDate,
    });
    const maxToken = existing.reduce((max, a) => Math.max(max, a.tokenNumber), 0);
    const tokenNumber = maxToken + 1;

    const qrPayloadObj = generateQRPayload({
      appointmentId: id,
      doctorId: appointmentData.doctorId,
      hospitalId: appointmentData.hospitalId,
      tokenNumber,
      slotDate: appointmentData.slotDate,
    });

    const appointment: Appointment = {
      ...appointmentData,
      id,
      tokenNumber,
      qrPayload: JSON.stringify(qrPayloadObj),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.appointments.set(id, appointment);
    this.logAudit({
      hospitalId: appointment.hospitalId,
      userId: appointment.patientId,
      role: 'patient',
      action: 'BOOK_APPOINTMENT',
      entityType: 'appointment',
      entityId: id,
      newState: appointment.state,
    });

    return appointment;
  }

  rescheduleAppointment(
    id: string,
    slotDate: string,
    slotStartTime: string,
    slotEndTime: string
  ): Appointment {
    const apt = this.appointments.get(id);
    if (!apt) throw new Error(`Appointment ${id} not found.`);
    if (apt.state !== 'BOOKED' && apt.state !== 'CHECKED_IN') {
      throw new Error('Only booked or checked-in appointments can be rescheduled.');
    }
    const conflict = this.getAppointments({ doctorId: apt.doctorId, slotDate }).find(
      (candidate) =>
        candidate.id !== id &&
        candidate.state !== 'CANCELLED' &&
        candidate.slotStartTime === slotStartTime
    );
    if (conflict) throw new Error('That appointment slot is no longer available.');

    const updated: Appointment = {
      ...apt,
      slotDate,
      slotStartTime,
      slotEndTime,
      updatedAt: new Date().toISOString(),
    };
    const qrPayload = generateQRPayload({
      appointmentId: updated.id,
      doctorId: updated.doctorId,
      hospitalId: updated.hospitalId,
      tokenNumber: updated.tokenNumber,
      slotDate,
    });
    updated.qrPayload = JSON.stringify(qrPayload);
    this.appointments.set(id, updated);
    this.logAudit({
      hospitalId: apt.hospitalId,
      userId: apt.patientId,
      role: 'patient',
      action: 'RESCHEDULE_APPOINTMENT',
      entityType: 'appointment',
      entityId: id,
      oldState: apt.state,
      newState: updated.state,
    });
    return updated;
  }

  /**
   * Enforces server-side appointment state transitions
   */
  updateAppointmentState(
    id: string,
    nextState: AppointmentState,
    context?: { userId?: string; role?: string; notes?: string }
  ): Appointment {
    const apt = this.appointments.get(id);
    if (!apt) throw new Error(`Appointment ${id} not found.`);

    assertValidTransition(apt.state, nextState);

    const oldState = apt.state;
    const now = new Date().toISOString();

    const updated: Appointment = {
      ...apt,
      state: nextState,
      updatedAt: now,
    };

    // Auto-record consultation timing
    if (nextState === 'IN_CONSULT') {
      updated.consultationStartTime = now;
    } else if (nextState === 'COMPLETED' && apt.consultationStartTime) {
      updated.consultationEndTime = now;
      const startMs = new Date(apt.consultationStartTime).getTime();
      const endMs = new Date(now).getTime();
      updated.actualDurationMinutes = Math.max(1, Math.round((endMs - startMs) / 60000));
    }

    if (context?.notes) {
      updated.notes = context.notes;
    }

    this.appointments.set(id, updated);

    this.logAudit({
      hospitalId: apt.hospitalId,
      userId: context?.userId,
      role: context?.role || 'system',
      action: 'STATE_TRANSITION',
      entityType: 'appointment',
      entityId: id,
      oldState,
      newState: nextState,
    });

    return updated;
  }

  /**
   * Scans a patient's HMAC QR code at the doctor's cabin:
   * 1. Validates signature, doctor match, and date match.
   * 2. Auto-completes the previous IN_CONSULT patient (recording end time and actual duration).
   * 3. Sets scanned patient to IN_CONSULT (recording start time).
   */
  scanDoctorCabinQR(
    rawQrPayload: string,
    cabinDoctorId: string,
    todayDate = new Date().toISOString().split('T')[0]
  ): { success: boolean; message: string; appointment?: Appointment } {
    const verification = verifyQRPayload(rawQrPayload, cabinDoctorId, todayDate);

    if (!verification.isValid || !verification.payload) {
      return {
        success: false,
        message: verification.error || 'Invalid or untrusted QR code.',
      };
    }

    const payload = verification.payload;
    const apt = this.getAppointmentById(payload.appointmentId);
    if (!apt) {
      return { success: false, message: 'Appointment record not found.' };
    }

    // Must be either BOOKED or CHECKED_IN
    if (apt.state !== 'BOOKED' && apt.state !== 'CHECKED_IN') {
      return {
        success: false,
        message: `Patient cannot enter consultation from status '${apt.state}'.`,
      };
    }

    // Step 2: If there is an existing patient currently IN_CONSULT with this doctor, complete them!
    const activeConsult = this.getAppointments({
      doctorId: cabinDoctorId,
      slotDate: todayDate,
      state: 'IN_CONSULT',
    });

    for (const prev of activeConsult) {
      this.updateAppointmentState(prev.id, 'COMPLETED', {
        role: 'system_qr_scan',
        notes: 'Auto-completed upon next patient scan',
      });
    }

    // If appointment was BOOKED, set to CHECKED_IN first so transition is strictly valid
    if (apt.state === 'BOOKED') {
      this.updateAppointmentState(apt.id, 'CHECKED_IN', { role: 'kiosk' });
    }

    // Step 3: Set scanned patient to IN_CONSULT
    const inConsultApt = this.updateAppointmentState(apt.id, 'IN_CONSULT', {
      role: 'scan_station',
      notes: 'Consultation initiated via cabin QR scan',
    });

    return {
      success: true,
      message: `Welcome, Token #${inConsultApt.tokenNumber}! Please proceed inside.`,
      appointment: inConsultApt,
    };
  }

  /**
   * Computes real-time dynamic queue status for a doctor
   */
  getQueueStatus(doctorId: string, targetTokenNumber: number, todayDate = new Date().toISOString().split('T')[0]): QueueEstimate {
    const doctor = this.getDoctorById(doctorId);
    if (!doctor) throw new Error(`Doctor ${doctorId} not found.`);

    const todayApts = this.getAppointments({ doctorId, slotDate: todayDate });
    const inConsult = todayApts.find((a) => a.state === 'IN_CONSULT');

    const waitingTokens = todayApts
      .filter((a) => a.state === 'CHECKED_IN' || a.state === 'BOOKED')
      .map((a) => a.tokenNumber)
      .sort((a, b) => a - b);

    return calculateQueueEstimate({
      patientToken: targetTokenNumber,
      currentInConsultPatient: inConsult
        ? {
            tokenNumber: inConsult.tokenNumber,
            consultationStartTime: inConsult.consultationStartTime || new Date().toISOString(),
          }
        : null,
      waitingTokens,
      doctor: {
        avgConsultDurationMinutes: doctor.avgConsultDurationMinutes,
        isPaused: doctor.isPaused,
        delayMinutes: doctor.delayMinutes,
      },
    });
  }

  // Audit Logs
  logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    const log: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.push(log);
  }

  getAuditLogs(hospitalId?: string): AuditLogEntry[] {
    if (hospitalId) {
      return this.auditLogs.filter((l) => l.hospitalId === hospitalId);
    }
    return [...this.auditLogs];
  }
}

// Keep mock state shared across Next.js route bundles in development.
const globalForMockDb = globalThis as typeof globalThis & {
  __ocaisMockDb?: InMemoryDatabase;
};

export const mockDb =
  globalForMockDb.__ocaisMockDb ?? (globalForMockDb.__ocaisMockDb = new InMemoryDatabase());
