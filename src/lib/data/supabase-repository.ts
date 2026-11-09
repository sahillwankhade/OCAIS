import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { assertValidTransition } from '@/lib/state-machine/appointment-state';
import { generateQRPayload } from '@/lib/security/qr-token';
import type {
  Appointment,
  AppointmentState,
  Doctor,
  FamilyMember,
  Hospital,
  Patient,
  PrescriptionData,
} from '@/lib/types';
import type { DoctorSchedule } from '@/lib/slots/slot-generator';

type Row = Record<string, unknown>;

if (typeof window !== 'undefined') {
  throw new Error('The Supabase service-role client must only be imported on the server.');
}

function isRow(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toRows(value: unknown): Row[] {
  if (!Array.isArray(value) || !value.every(isRow)) {
    throw new Error('Supabase returned an invalid row set.');
  }
  return value;
}

function toRow(value: unknown): Row {
  if (!isRow(value)) throw new Error('Supabase returned an invalid row.');
  return value;
}

function stringValue(row: Row, key: string): string {
  const value = row[key];
  if (typeof value !== 'string') throw new Error(`Supabase row is missing ${key}.`);
  return value;
}

function nullableString(row: Row, key: string): string | undefined {
  const value = row[key];
  return typeof value === 'string' ? value : undefined;
}

function numberValue(row: Row, key: string, fallback = 0): number {
  const value = row[key];
  return typeof value === 'number' ? value : fallback;
}

function booleanValue(row: Row, key: string): boolean {
  return row[key] === true;
}

function stringArray(row: Row, key: string): string[] {
  const value = row[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function mapHospital(row: Row): Hospital {
  return {
    id: stringValue(row, 'id'),
    name: stringValue(row, 'name'),
    address: stringValue(row, 'address'),
    city: stringValue(row, 'city'),
    state: stringValue(row, 'state'),
    pincode: stringValue(row, 'pincode'),
    phone: stringValue(row, 'phone'),
    email: stringValue(row, 'email'),
    openingTime: stringValue(row, 'opening_time'),
    closingTime: stringValue(row, 'closing_time'),
    departments: stringArray(row, 'departments'),
    createdAt: stringValue(row, 'created_at'),
  };
}

function mapDoctor(row: Row): Doctor {
  return {
    id: stringValue(row, 'id'),
    hospitalId: stringValue(row, 'hospital_id'),
    fullName: stringValue(row, 'full_name'),
    specialization: stringValue(row, 'specialization'),
    qualifications: stringValue(row, 'qualifications'),
    experienceYears: numberValue(row, 'experience_years'),
    cabinNumber: stringValue(row, 'cabin_number'),
    consultationFee: numberValue(row, 'consultation_fee'),
    avgConsultDurationMinutes: numberValue(row, 'avg_consult_duration_minutes', 8),
    isAvailable: booleanValue(row, 'is_available'),
    isPaused: booleanValue(row, 'is_paused'),
    delayMinutes: numberValue(row, 'delay_minutes'),
    avatarUrl: nullableString(row, 'avatar_url'),
  };
}

function mapPatient(row: Row): Patient {
  return {
    id: stringValue(row, 'id'),
    phone: stringValue(row, 'phone'),
    prn: stringValue(row, 'prn'),
    fullName: stringValue(row, 'full_name'),
    age: numberValue(row, 'age'),
    gender: stringValue(row, 'gender') as Patient['gender'],
    bloodGroup: nullableString(row, 'blood_group'),
    address: nullableString(row, 'address'),
    emergencyContact: nullableString(row, 'emergency_contact'),
    createdAt: stringValue(row, 'created_at'),
  };
}

function mapFamilyMember(row: Row): FamilyMember {
  return {
    id: stringValue(row, 'id'),
    primaryPatientId: stringValue(row, 'primary_patient_id'),
    fullName: stringValue(row, 'full_name'),
    relationship: stringValue(row, 'relationship') as FamilyMember['relationship'],
    age: numberValue(row, 'age'),
    gender: stringValue(row, 'gender') as FamilyMember['gender'],
  };
}

function mapAppointment(row: Row): Appointment {
  const prescription = row.prescription_json;
  return {
    id: stringValue(row, 'id'),
    hospitalId: stringValue(row, 'hospital_id'),
    doctorId: stringValue(row, 'doctor_id'),
    patientId: stringValue(row, 'patient_id'),
    familyMemberId: nullableString(row, 'family_member_id'),
    tokenNumber: numberValue(row, 'token_number'),
    slotDate: stringValue(row, 'slot_date'),
    slotStartTime: stringValue(row, 'slot_start_time'),
    slotEndTime: stringValue(row, 'slot_end_time'),
    state: stringValue(row, 'state') as AppointmentState,
    isWalkIn: booleanValue(row, 'is_walk_in'),
    paymentStatus: stringValue(row, 'payment_status') as Appointment['paymentStatus'],
    paymentMethod: stringValue(row, 'payment_method') as Appointment['paymentMethod'],
    amountPaid: numberValue(row, 'amount_paid'),
    consultationStartTime: nullableString(row, 'consultation_start_time'),
    consultationEndTime: nullableString(row, 'consultation_end_time'),
    actualDurationMinutes: typeof row.actual_duration_minutes === 'number' ? row.actual_duration_minutes : undefined,
    qrPayload: nullableString(row, 'qr_payload'),
    notes: nullableString(row, 'notes'),
    prescription: isRow(prescription) ? prescription as unknown as PrescriptionData : undefined,
    createdAt: stringValue(row, 'created_at'),
    updatedAt: stringValue(row, 'updated_at'),
  };
}

function createSupabasePublicClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !publishableKey) {
    throw new Error('Public Supabase access requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
  }
  return createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function createSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey || serviceRoleKey.startsWith('mock_')) {
    throw new Error('Supabase patient and booking operations require a valid server-only SUPABASE_SERVICE_ROLE_KEY.');
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function isSupabaseDatabaseEnabled(): boolean {
  return process.env.USE_MOCK_SERVICES === 'false';
}

function throwOnError(error: { message: string; code?: string } | null, operation: string): void {
  if (error) {
    const failure = new Error(`${operation} failed: ${error.message}`);
    Object.assign(failure, { code: error.code });
    throw failure;
  }
}

export async function listSupabaseHospitals(hospitalId?: string): Promise<Hospital[]> {
  const client = createSupabasePublicClient();
  let query = client.from('hospitals').select('*').order('name');
  if (hospitalId) query = query.eq('id', hospitalId);
  const { data, error } = await query;
  throwOnError(error, 'Loading hospitals');
  return toRows(data).map(mapHospital);
}

export async function listSupabaseDoctors(hospitalId?: string): Promise<Doctor[]> {
  const client = createSupabasePublicClient();
  let query = client.from('doctors').select('*').order('full_name');
  if (hospitalId) query = query.eq('hospital_id', hospitalId);
  const { data, error } = await query;
  throwOnError(error, 'Loading doctors');
  return toRows(data).map(mapDoctor);
}

export async function getSupabaseHospital(hospitalId: string): Promise<Hospital | undefined> {
  const { data, error } = await createSupabasePublicClient()
    .from('hospitals').select('*').eq('id', hospitalId).maybeSingle();
  throwOnError(error, 'Loading hospital');
  return data ? mapHospital(toRow(data)) : undefined;
}

export async function getSupabaseDoctor(doctorId: string): Promise<Doctor | undefined> {
  const { data, error } = await createSupabasePublicClient()
    .from('doctors').select('*').eq('id', doctorId).maybeSingle();
  throwOnError(error, 'Loading doctor');
  return data ? mapDoctor(toRow(data)) : undefined;
}

export async function updateSupabaseHospital(
  hospitalId: string,
  updates: Partial<Pick<Hospital, 'openingTime' | 'closingTime' | 'address' | 'phone' | 'email'>>,
): Promise<Hospital | undefined> {
  const patch: Row = {};
  if (updates.openingTime !== undefined) patch.opening_time = updates.openingTime;
  if (updates.closingTime !== undefined) patch.closing_time = updates.closingTime;
  if (updates.address !== undefined) patch.address = updates.address;
  if (updates.phone !== undefined) patch.phone = updates.phone;
  if (updates.email !== undefined) patch.email = updates.email;
  const { data, error } = await createSupabaseAdminClient()
    .from('hospitals').update(patch).eq('id', hospitalId).select('*').maybeSingle();
  throwOnError(error, 'Updating hospital');
  return data ? mapHospital(toRow(data)) : undefined;
}

export async function replaceSupabaseHospitalHolidays(
  hospitalId: string,
  holidays: Array<{ date: string; reason?: string }>,
): Promise<string[]> {
  const client = createSupabaseAdminClient();
  const { data: current, error: readError } = await client
    .from('clinic_holidays').select('id, holiday_date').eq('hospital_id', hospitalId);
  throwOnError(readError, 'Loading hospital holidays');
  const currentRows = toRows(current);
  const wantedDates = [...new Set(holidays.map(({ date }) => date))];
  const currentDates = currentRows.map((row) => stringValue(row, 'holiday_date'));
  const removeIds = currentRows
    .filter((row) => !wantedDates.includes(stringValue(row, 'holiday_date')))
    .map((row) => stringValue(row, 'id'));
  if (removeIds.length) {
    const { error } = await client.from('clinic_holidays').delete().in('id', removeIds);
    throwOnError(error, 'Removing hospital holidays');
  }
  const newRows = holidays
    .filter(({ date }, index) => !currentDates.includes(date) && holidays.findIndex((entry) => entry.date === date) === index)
    .map(({ date, reason }) => ({
      id: randomUUID(),
      hospital_id: hospitalId,
      holiday_date: date,
      reason: reason || 'Clinic holiday',
    }));
  if (newRows.length) {
    const { error } = await client.from('clinic_holidays').insert(newRows);
    throwOnError(error, 'Saving hospital holidays');
  }
  return wantedDates.sort();
}

export async function updateSupabaseDoctor(
  doctorId: string,
  updates: Partial<Doctor>,
): Promise<Doctor | undefined> {
  const patch: Row = {};
  if (updates.fullName !== undefined) patch.full_name = updates.fullName;
  if (updates.specialization !== undefined) patch.specialization = updates.specialization;
  if (updates.qualifications !== undefined) patch.qualifications = updates.qualifications;
  if (updates.experienceYears !== undefined) patch.experience_years = updates.experienceYears;
  if (updates.cabinNumber !== undefined) patch.cabin_number = updates.cabinNumber;
  if (updates.consultationFee !== undefined) patch.consultation_fee = updates.consultationFee;
  if (updates.avgConsultDurationMinutes !== undefined) patch.avg_consult_duration_minutes = updates.avgConsultDurationMinutes;
  if (updates.isAvailable !== undefined) patch.is_available = updates.isAvailable;
  if (updates.isPaused !== undefined) patch.is_paused = updates.isPaused;
  if (updates.delayMinutes !== undefined) patch.delay_minutes = updates.delayMinutes;
  if (updates.avatarUrl !== undefined) patch.avatar_url = updates.avatarUrl;
  const { data, error } = await createSupabaseAdminClient()
    .from('doctors').update(patch).eq('id', doctorId).select('*').maybeSingle();
  throwOnError(error, 'Updating doctor');
  return data ? mapDoctor(toRow(data)) : undefined;
}

export async function createSupabaseDoctor(input: Omit<Doctor, 'id'>): Promise<Doctor> {
  const row = {
    id: randomUUID(),
    hospital_id: input.hospitalId,
    full_name: input.fullName,
    specialization: input.specialization,
    qualifications: input.qualifications,
    experience_years: input.experienceYears,
    cabin_number: input.cabinNumber,
    consultation_fee: input.consultationFee,
    avg_consult_duration_minutes: input.avgConsultDurationMinutes,
    is_available: input.isAvailable,
    is_paused: input.isPaused,
    delay_minutes: input.delayMinutes,
    avatar_url: input.avatarUrl || null,
  };
  const { data, error } = await createSupabaseAdminClient()
    .from('doctors').insert(row).select('*').single();
  throwOnError(error, 'Creating doctor');
  return mapDoctor(toRow(data));
}

export async function replaceSupabaseDoctorSchedule(
  doctorId: string,
  shifts: DoctorSchedule['shifts'],
): Promise<DoctorSchedule> {
  const client = createSupabaseAdminClient();
  const { error: deleteError } = await client.from('doctor_schedules').delete().eq('doctor_id', doctorId);
  throwOnError(deleteError, 'Replacing doctor schedule');
  if (shifts.length) {
    const rows = [1, 2, 3, 4, 5, 6].flatMap((dayOfWeek) => shifts.map((shift) => ({
      id: randomUUID(),
      doctor_id: doctorId,
      day_of_week: dayOfWeek,
      shift_start: shift.shiftStart,
      shift_end: shift.shiftEnd,
      slot_duration_minutes: shift.slotDurationMinutes,
    })));
    const { error } = await client.from('doctor_schedules').insert(rows);
    throwOnError(error, 'Saving doctor schedule');
  }
  return getSupabaseDoctorSchedule(doctorId);
}

export async function getSupabasePatientByPhone(phone: string): Promise<Patient | undefined> {
  const { data, error } = await createSupabaseAdminClient()
    .from('patients').select('*').eq('phone', phone).maybeSingle();
  throwOnError(error, 'Loading patient');
  return data ? mapPatient(toRow(data)) : undefined;
}

export async function getSupabasePatientById(patientId: string): Promise<Patient | undefined> {
  const { data, error } = await createSupabaseAdminClient()
    .from('patients').select('*').eq('id', patientId).maybeSingle();
  throwOnError(error, 'Loading patient');
  return data ? mapPatient(toRow(data)) : undefined;
}

export async function patientHasHospitalAppointment(patientId: string, hospitalId: string): Promise<boolean> {
  const { data, error } = await createSupabaseAdminClient()
    .from('appointments').select('id')
    .eq('patient_id', patientId)
    .eq('hospital_id', hospitalId)
    .limit(1);
  throwOnError(error, 'Checking hospital patient access');
  return toRows(data).length > 0;
}

export async function createSupabasePatient(input: {
  phone: string;
  fullName: string;
  age: number;
  gender: Patient['gender'];
  bloodGroup?: string;
}): Promise<Patient> {
  const client = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await client
    .from('patients').select('*').eq('phone', input.phone).maybeSingle();
  throwOnError(existingError, 'Checking patient account');
  if (existing) return mapPatient(toRow(existing));

  const id = randomUUID();
  const { data, error } = await client.from('patients').insert({
    id,
    phone: input.phone,
    prn: `PRN-${new Date().getFullYear()}-${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`,
    full_name: input.fullName,
    age: input.age,
    gender: input.gender,
    blood_group: input.bloodGroup || null,
  }).select('*').single();
  throwOnError(error, 'Creating patient account');
  return mapPatient(toRow(data));
}

export async function listSupabaseFamilyMembers(patientId: string): Promise<FamilyMember[]> {
  const { data, error } = await createSupabaseAdminClient()
    .from('family_members').select('*').eq('primary_patient_id', patientId).order('created_at');
  throwOnError(error, 'Loading family members');
  return toRows(data).map(mapFamilyMember);
}

export async function createSupabaseFamilyMember(input: Omit<FamilyMember, 'id'>): Promise<FamilyMember> {
  const { data, error } = await createSupabaseAdminClient().from('family_members').insert({
    id: randomUUID(),
    primary_patient_id: input.primaryPatientId,
    full_name: input.fullName,
    relationship: input.relationship,
    age: input.age,
    gender: input.gender,
  }).select('*').single();
  throwOnError(error, 'Adding family member');
  return mapFamilyMember(toRow(data));
}

export async function getSupabaseDoctorSchedule(doctorId: string): Promise<DoctorSchedule> {
  const client = createSupabasePublicClient();
  const [{ data: scheduleRows, error: scheduleError }, { data: doctor, error: doctorError }] = await Promise.all([
    client.from('doctor_schedules').select('*').eq('doctor_id', doctorId).order('day_of_week'),
    client.from('doctors').select('hospital_id').eq('id', doctorId).maybeSingle(),
  ]);
  throwOnError(scheduleError, 'Loading doctor schedule');
  throwOnError(doctorError, 'Loading doctor hospital');
  const rows = toRows(scheduleRows);
  if (!doctor) throw new Error('Doctor not found.');
  const hospitalId = stringValue(toRow(doctor), 'hospital_id');
  const { data: holidayRows, error: holidayError } = await client
    .from('clinic_holidays').select('holiday_date').eq('hospital_id', hospitalId);
  throwOnError(holidayError, 'Loading hospital holidays');
  const holidays = toRows(holidayRows).map((row) => stringValue(row, 'holiday_date'));
  return {
    doctorId,
    shifts: [...new Map(rows.map((row) => {
      const shift = {
        shiftStart: stringValue(row, 'shift_start'),
        shiftEnd: stringValue(row, 'shift_end'),
        slotDurationMinutes: numberValue(row, 'slot_duration_minutes', 15),
      };
      return [`${shift.shiftStart}-${shift.shiftEnd}-${shift.slotDurationMinutes}`, shift];
    })).values()],
    daysOfWeek: [...new Set(rows.map((row) => numberValue(row, 'day_of_week')))],
    holidays,
    emergencyLockedSlotIds: [],
  };
}

export async function listSupabaseAppointments(filters: {
  hospitalId?: string;
  doctorId?: string;
  patientId?: string;
  slotDate?: string;
} = {}): Promise<Appointment[]> {
  const client = createSupabaseAdminClient();
  let query = client.from('appointments').select('*').order('token_number');
  if (filters.hospitalId) query = query.eq('hospital_id', filters.hospitalId);
  if (filters.doctorId) query = query.eq('doctor_id', filters.doctorId);
  if (filters.patientId) query = query.eq('patient_id', filters.patientId);
  if (filters.slotDate) query = query.eq('slot_date', filters.slotDate);
  const { data, error } = await query;
  throwOnError(error, 'Loading appointments');
  return toRows(data).map(mapAppointment);
}

export async function listSupabaseBookedSlotTimes(doctorId: string, slotDate: string): Promise<string[]> {
  const { data, error } = await createSupabasePublicClient().rpc('get_booked_slot_times', {
    p_doctor_id: doctorId,
    p_slot_date: slotDate,
  });
  throwOnError(error, 'Loading booked slot times');
  return toRows(data).map((row) => stringValue(row, 'slot_start_time'));
}

export async function getSupabaseAppointment(appointmentId: string): Promise<Appointment | undefined> {
  const { data, error } = await createSupabaseAdminClient()
    .from('appointments').select('*').eq('id', appointmentId).maybeSingle();
  throwOnError(error, 'Loading appointment');
  return data ? mapAppointment(toRow(data)) : undefined;
}

export async function createSupabaseAppointment(input: {
  hospitalId: string;
  doctorId: string;
  patientId: string;
  familyMemberId?: string;
  slotDate: string;
  slotStartTime: string;
  slotEndTime: string;
  amountPaid: number;
  notes?: string;
}): Promise<Appointment> {
  const client = createSupabaseAdminClient();
  const appointmentId = randomUUID();
  const { data, error } = await client.rpc('create_appointment_with_token', {
    p_id: appointmentId,
    p_hospital_id: input.hospitalId,
    p_doctor_id: input.doctorId,
    p_patient_id: input.patientId,
    p_family_member_id: input.familyMemberId || null,
    p_slot_date: input.slotDate,
    p_slot_start_time: input.slotStartTime,
    p_slot_end_time: input.slotEndTime,
    p_amount_paid: input.amountPaid,
    p_notes: input.notes || null,
  });
  throwOnError(error, 'Booking appointment');

  const appointment = mapAppointment(toRow(data));
  const qrPayload = JSON.stringify(generateQRPayload({
    appointmentId: appointment.id,
    doctorId: appointment.doctorId,
    hospitalId: appointment.hospitalId,
    tokenNumber: appointment.tokenNumber,
    slotDate: appointment.slotDate,
  }));
  const { data: updated, error: qrError } = await client
    .from('appointments').update({ qr_payload: qrPayload }).eq('id', appointment.id).select('*').single();
  throwOnError(qrError, 'Saving appointment QR token');
  return mapAppointment(toRow(updated));
}

export async function updateSupabaseAppointmentState(
  appointmentId: string,
  nextState: AppointmentState,
  actor: { userId: string; role: string; notes?: string },
): Promise<Appointment> {
  const client = createSupabaseAdminClient();
  const current = await getSupabaseAppointment(appointmentId);
  if (!current) throw new Error(`Appointment ${appointmentId} not found.`);
  assertValidTransition(current.state, nextState);

  const now = new Date().toISOString();
  const patch: Row = {
    state: nextState,
    updated_at: now,
    ...(actor.notes ? { notes: actor.notes } : {}),
  };
  if (nextState === 'IN_CONSULT') patch.consultation_start_time = now;
  if (nextState === 'COMPLETED') {
    patch.consultation_end_time = now;
    if (current.consultationStartTime) {
      patch.actual_duration_minutes = Math.max(
        1,
        Math.round((Date.parse(now) - Date.parse(current.consultationStartTime)) / 60000),
      );
    }
  }

  const { data, error } = await client.from('appointments')
    .update(patch).eq('id', appointmentId).eq('state', current.state).select('*').maybeSingle();
  throwOnError(error, 'Updating appointment');
  if (!data) throw new Error('Appointment state changed concurrently; reload and try again.');
  const updated = mapAppointment(toRow(data));
  const { error: auditError } = await client.from('audit_logs').insert({
    id: randomUUID(),
    hospital_id: current.hospitalId,
    user_id: actor.userId,
    role: actor.role,
    action: `APPOINTMENT_${nextState}`,
    entity_type: 'appointment',
    entity_id: appointmentId,
    old_state: current.state,
    new_state: nextState,
  });
  throwOnError(auditError, 'Writing appointment audit log');
  return updated;
}

export async function rescheduleSupabaseAppointment(input: {
  appointmentId: string;
  slotDate: string;
  slotStartTime: string;
  slotEndTime: string;
}): Promise<Appointment> {
  const client = createSupabaseAdminClient();
  const current = await getSupabaseAppointment(input.appointmentId);
  if (!current) throw new Error(`Appointment ${input.appointmentId} not found.`);
  if (current.state !== 'BOOKED' && current.state !== 'CHECKED_IN') {
    throw new Error('Only booked or checked-in appointments can be rescheduled.');
  }
  const { data: conflicts, error: conflictError } = await client.from('appointments')
    .select('id')
    .eq('doctor_id', current.doctorId)
    .eq('slot_date', input.slotDate)
    .eq('slot_start_time', input.slotStartTime)
    .neq('state', 'CANCELLED')
    .neq('id', input.appointmentId)
    .limit(1);
  throwOnError(conflictError, 'Checking appointment slot availability');
  if (toRows(conflicts).length) throw new Error('That appointment slot is no longer available.');

  const qrPayload = JSON.stringify(generateQRPayload({
    appointmentId: input.appointmentId,
    doctorId: current.doctorId,
    hospitalId: current.hospitalId,
    tokenNumber: current.tokenNumber,
    slotDate: input.slotDate,
  }));
  const { data, error } = await client.from('appointments').update({
    slot_date: input.slotDate,
    slot_start_time: input.slotStartTime,
    slot_end_time: input.slotEndTime,
    qr_payload: qrPayload,
    updated_at: new Date().toISOString(),
  }).eq('id', input.appointmentId).eq('state', current.state).select('*').maybeSingle();
  throwOnError(error, 'Rescheduling appointment');
  if (!data) throw new Error('Appointment changed concurrently; reload and try again.');

  const { error: auditError } = await client.from('audit_logs').insert({
    id: randomUUID(),
    hospital_id: current.hospitalId,
    user_id: current.patientId,
    role: 'patient',
    action: 'RESCHEDULE_APPOINTMENT',
    entity_type: 'appointment',
    entity_id: input.appointmentId,
    old_state: current.state,
    new_state: current.state,
  });
  throwOnError(auditError, 'Writing appointment audit log');
  return mapAppointment(toRow(data));
}
