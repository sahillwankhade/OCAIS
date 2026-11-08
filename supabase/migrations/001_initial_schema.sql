-- Migration: 001_initial_schema.sql
-- One Click AIS (OCAIS) Core Relational Schema

-- Enums
CREATE TYPE appointment_state AS ENUM (
  'BOOKED',
  'CHECKED_IN',
  'IN_CONSULT',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
  'SKIPPED'
);

CREATE TYPE user_role AS ENUM (
  'patient',
  'doctor',
  'receptionist',
  'admin',
  'superadmin'
);

CREATE TYPE gender_type AS ENUM (
  'MALE',
  'FEMALE',
  'OTHER'
);

CREATE TYPE payment_status AS ENUM (
  'PENDING',
  'PAID',
  'REFUNDED',
  'FAILED'
);

CREATE TYPE payment_method AS ENUM (
  'CASH',
  'UPI',
  'CARD',
  'ONLINE_MOCK'
);

-- 1. Hospitals Table
CREATE TABLE hospitals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  opening_time TEXT NOT NULL DEFAULT '08:00',
  closing_time TEXT NOT NULL DEFAULT '20:00',
  departments TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Doctors Table
CREATE TABLE doctors (
  id TEXT PRIMARY KEY,
  hospital_id TEXT NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  qualifications TEXT NOT NULL,
  experience_years INT NOT NULL DEFAULT 5,
  cabin_number TEXT NOT NULL,
  consultation_fee INT NOT NULL DEFAULT 500,
  avg_consult_duration_minutes INT NOT NULL DEFAULT 8,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_paused BOOLEAN NOT NULL DEFAULT FALSE,
  delay_minutes INT NOT NULL DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Patients Table (Linked to Auth / Mobile)
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  prn TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  age INT NOT NULL,
  gender gender_type NOT NULL DEFAULT 'MALE',
  blood_group TEXT,
  address TEXT,
  emergency_contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Family Members Table
CREATE TABLE family_members (
  id TEXT PRIMARY KEY,
  primary_patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  age INT NOT NULL,
  gender gender_type NOT NULL DEFAULT 'MALE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Appointments Table
CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  hospital_id TEXT NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  family_member_id TEXT REFERENCES family_members(id) ON DELETE SET NULL,
  token_number INT NOT NULL,
  slot_date DATE NOT NULL,
  slot_start_time TEXT NOT NULL,
  slot_end_time TEXT NOT NULL,
  state appointment_state NOT NULL DEFAULT 'BOOKED',
  is_walk_in BOOLEAN NOT NULL DEFAULT FALSE,
  payment_status payment_status NOT NULL DEFAULT 'PENDING',
  payment_method payment_method NOT NULL DEFAULT 'ONLINE_MOCK',
  amount_paid INT NOT NULL DEFAULT 500,
  consultation_start_time TIMESTAMPTZ,
  consultation_end_time TIMESTAMPTZ,
  actual_duration_minutes INT,
  qr_payload TEXT,
  notes TEXT,
  prescription_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Doctor Schedules Table
CREATE TABLE doctor_schedules (
  id TEXT PRIMARY KEY,
  doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
  shift_start TEXT NOT NULL,
  shift_end TEXT NOT NULL,
  slot_duration_minutes INT NOT NULL DEFAULT 15
);

-- 7. Clinic Holidays Table
CREATE TABLE clinic_holidays (
  id TEXT PRIMARY KEY,
  hospital_id TEXT NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  holiday_date DATE NOT NULL,
  reason TEXT NOT NULL
);

-- 8. Audit Logs Table
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  hospital_id TEXT REFERENCES hospitals(id) ON DELETE CASCADE,
  user_id TEXT,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_state TEXT,
  new_state TEXT,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning-fast queue lookups and calendar checks
CREATE INDEX idx_appointments_queue ON appointments (doctor_id, slot_date, state);
CREATE INDEX idx_appointments_patient ON appointments (patient_id);
CREATE INDEX idx_appointments_token ON appointments (doctor_id, slot_date, token_number);
CREATE INDEX idx_patients_prn ON patients (prn);
CREATE INDEX idx_patients_phone ON patients (phone);

