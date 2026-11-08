-- Migration: 003_seed_data.sql
-- Realistic Demo Data for Indian Hospitals, Doctors, Patients and Appointments in all 7 states.

-- 1. Seed 2 Hospitals
INSERT INTO hospitals (id, name, address, city, state, pincode, phone, email, opening_time, closing_time, departments)
VALUES
  (
    'hosp-sahyadri',
    'Sahyadri Care Hospital',
    'Plot 14, Karve Road, Deccan Gymkhana',
    'Pune',
    'Maharashtra',
    '411004',
    '+91-20-67215000',
    'care@sahyadri-demo.in',
    '08:00',
    '20:00',
    ARRAY['General Medicine', 'Pediatrics', 'Orthopedics', 'Cardiology', 'ENT']
  ),
  (
    'hosp-arogya',
    'Arogya Multi-Specialty Clinic',
    'Building 4B, Swami Vivekananda Road, Dadar West',
    'Mumbai',
    'Maharashtra',
    '400028',
    '+91-22-24308899',
    'appointments@arogya-demo.in',
    '09:00',
    '21:00',
    ARRAY['General Medicine', 'Cardiology', 'Dermatology', 'Gynecology']
  )
ON CONFLICT (id) DO NOTHING;

-- 2. Seed 4 Doctors
INSERT INTO doctors (id, hospital_id, full_name, specialization, qualifications, experience_years, cabin_number, consultation_fee, avg_consult_duration_minutes, is_available, is_paused, delay_minutes)
VALUES
  (
    'doc-sharma',
    'hosp-sahyadri',
    'Dr. Rajesh Sharma',
    'General Medicine',
    'MBBS, MD (Medicine)',
    14,
    'Cabin 101',
    500,
    10,
    TRUE,
    FALSE,
    0
  ),
  (
    'doc-kulkarni',
    'hosp-sahyadri',
    'Dr. Sneha Kulkarni',
    'Pediatrics',
    'MBBS, DCH, DNB (Pediatrics)',
    9,
    'Cabin 102',
    600,
    12,
    TRUE,
    FALSE,
    0
  ),
  (
    'doc-deshmukh',
    'hosp-arogya',
    'Dr. Amit Deshmukh',
    'Orthopedics',
    'MBBS, MS (Ortho), Fellowship Joint Replacement',
    16,
    'Cabin 201',
    800,
    15,
    TRUE,
    FALSE,
    10
  ),
  (
    'doc-nair',
    'hosp-arogya',
    'Dr. Priya Nair',
    'Cardiology',
    'MBBS, MD, DM (Cardiology)',
    11,
    'Cabin 202',
    1000,
    15,
    TRUE,
    FALSE,
    0
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Seed 10 Patients with PRNs
INSERT INTO patients (id, user_id, phone, prn, full_name, age, gender, blood_group, address)
VALUES
  ('pat-1', 'usr-pat-1', '9820011111', 'PRN-2026-0001', 'Aarav Patil', 32, 'MALE', 'B+', 'Kothrud, Pune'),
  ('pat-2', 'usr-pat-2', '9820022222', 'PRN-2026-0002', 'Ananya Deshmukh', 28, 'FEMALE', 'O+', 'Shivajinagar, Pune'),
  ('pat-3', 'usr-pat-3', '9820033333', 'PRN-2026-0003', 'Ramesh Joshi', 64, 'MALE', 'A+', 'Dadar, Mumbai'),
  ('pat-4', 'usr-pat-4', '9820044444', 'PRN-2026-0004', 'Sunita Kulkarni', 58, 'FEMALE', 'AB+', 'Aundh, Pune'),
  ('pat-5', 'usr-pat-5', '9820055555', 'PRN-2026-0005', 'Vikram Shinde', 41, 'MALE', 'O-', 'Viman Nagar, Pune'),
  ('pat-6', 'usr-pat-6', '9820066666', 'PRN-2026-0006', 'Pooja Mehta', 25, 'FEMALE', 'B+', 'Bandra, Mumbai'),
  ('pat-7', 'usr-pat-7', '9820077777', 'PRN-2026-0007', 'Sanjay Gokhale', 49, 'MALE', 'A-', 'Hadapsar, Pune'),
  ('pat-8', 'usr-pat-8', '9820088888', 'PRN-2026-0008', 'Meena Iyer', 37, 'FEMALE', 'O+', 'Andheri, Mumbai'),
  ('pat-9', 'usr-pat-9', '9820099999', 'PRN-2026-0009', 'Rohit Kamat', 19, 'MALE', 'B-', 'Baner, Pune'),
  ('pat-10', 'usr-pat-10', '9820010101', 'PRN-2026-0010', 'Kavita Bhosale', 52, 'FEMALE', 'AB-', 'Parel, Mumbai')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Family Members
INSERT INTO family_members (id, primary_patient_id, full_name, relationship, age, gender)
VALUES
  ('fam-1', 'pat-1', 'Diya Patil', 'CHILD', 4, 'FEMALE'),
  ('fam-2', 'pat-1', 'Priyanka Patil', 'SPOUSE', 30, 'FEMALE'),
  ('fam-3', 'pat-3', 'Vandana Joshi', 'SPOUSE', 61, 'FEMALE')
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Appointments in ALL 7 STATES for Today
-- Current date placeholder: CURRENT_DATE
INSERT INTO appointments (
  id,
  hospital_id,
  doctor_id,
  patient_id,
  token_number,
  slot_date,
  slot_start_time,
  slot_end_time,
  state,
  is_walk_in,
  payment_status,
  payment_method,
  amount_paid,
  consultation_start_time,
  consultation_end_time,
  actual_duration_minutes,
  notes
)
VALUES
  -- 1. COMPLETED: Token 11 (Completed 15 min ago)
  (
    'apt-demo-completed-11',
    'hosp-sahyadri',
    'doc-sharma',
    'pat-5',
    11,
    CURRENT_DATE,
    '09:30',
    '09:45',
    'COMPLETED',
    FALSE,
    'PAID',
    'ONLINE_MOCK',
    500,
    NOW() - INTERVAL '25 minutes',
    NOW() - INTERVAL '15 minutes',
    10,
    'Routine hypertension follow-up. BP 124/82. Prescription renewed.'
  ),
  -- 2. IN_CONSULT: Token 12 (Currently in cabin with Dr. Sharma)
  (
    'apt-demo-inconsult-12',
    'hosp-sahyadri',
    'doc-sharma',
    'pat-2',
    12,
    CURRENT_DATE,
    '09:45',
    '10:00',
    'IN_CONSULT',
    FALSE,
    'PAID',
    'ONLINE_MOCK',
    500,
    NOW() - INTERVAL '5 minutes',
    NULL,
    NULL,
    'Viral fever with mild sore throat.'
  ),
  -- 3. CHECKED_IN: Token 14 (Waiting in lounge, scanned QR at reception)
  (
    'apt-demo-checkedin-14',
    'hosp-sahyadri',
    'doc-sharma',
    'pat-1',
    14,
    CURRENT_DATE,
    '10:15',
    '10:30',
    'CHECKED_IN',
    FALSE,
    'PAID',
    'ONLINE_MOCK',
    500,
    NULL,
    NULL,
    NULL,
    'Seasonal allergy and chest congestion.'
  ),
  -- 4. BOOKED: Token 15 (On the way, not yet checked in)
  (
    'apt-demo-booked-15',
    'hosp-sahyadri',
    'doc-sharma',
    'pat-4',
    15,
    CURRENT_DATE,
    '10:30',
    '10:45',
    'BOOKED',
    FALSE,
    'PAID',
    'ONLINE_MOCK',
    500,
    NULL,
    NULL,
    NULL,
    'Knee pain follow-up.'
  ),
  -- 5. SKIPPED: Token 10 (Called earlier, patient was briefly outside)
  (
    'apt-demo-skipped-10',
    'hosp-sahyadri',
    'doc-sharma',
    'pat-7',
    10,
    CURRENT_DATE,
    '09:15',
    '09:30',
    'SKIPPED',
    FALSE,
    'PAID',
    'ONLINE_MOCK',
    500,
    NULL,
    NULL,
    NULL,
    'Patient missed first call, can be recalled.'
  ),
  -- 6. NO_SHOW: Token 9 (Never arrived for 09:00 slot)
  (
    'apt-demo-noshow-9',
    'hosp-sahyadri',
    'doc-sharma',
    'pat-9',
    9,
    CURRENT_DATE,
    '09:00',
    '09:15',
    'NO_SHOW',
    FALSE,
    'PENDING',
    'CASH',
    500,
    NULL,
    NULL,
    NULL,
    'No show recorded after 20 minute grace period.'
  ),
  -- 7. CANCELLED: Token 13 (Cancelled 1 hour prior)
  (
    'apt-demo-cancelled-13',
    'hosp-sahyadri',
    'doc-sharma',
    'pat-10',
    13,
    CURRENT_DATE,
    '10:00',
    '10:15',
    'CANCELLED',
    FALSE,
    'REFUNDED',
    'ONLINE_MOCK',
    500,
    NULL,
    NULL,
    NULL,
    'Patient cancelled due to urgent travel.'
  ),
  -- Walk-In in Arogya Clinic
  (
    'apt-demo-walkin-1',
    'hosp-arogya',
    'doc-deshmukh',
    'pat-3',
    1,
    CURRENT_DATE,
    '11:00',
    '11:15',
    'CHECKED_IN',
    TRUE,
    'PAID',
    'CASH',
    800,
    NULL,
    NULL,
    NULL,
    'Walk-in emergency sprain assessment.'
  )
ON CONFLICT (id) DO NOTHING;

