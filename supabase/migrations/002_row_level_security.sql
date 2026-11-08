-- Migration: 002_row_level_security.sql
-- Enables Row Level Security (RLS) on all tables to enforce strict data isolation between hospitals and patient privacy.

-- Helper function to extract user hospital from JWT claim or user_metadata
CREATE OR REPLACE FUNCTION current_user_hospital_id()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('request.jwt.claim.hospital_id', true), '');
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('request.jwt.claim.role', true), '');
END;
$$ LANGUAGE plpgsql STABLE;

-- 1. Enable RLS on all tables
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Hospitals Policies
-- Public read for hospital listing/search
CREATE POLICY "Public read for hospitals"
  ON hospitals FOR SELECT
  USING (true);

-- Hospital admins can update their own hospital details
CREATE POLICY "Admins can update own hospital"
  ON hospitals FOR UPDATE
  USING (id = current_user_hospital_id());

-- 3. Doctors Policies
-- Public read for doctor booking discovery
CREATE POLICY "Public read for doctors"
  ON doctors FOR SELECT
  USING (true);

-- Staff can update doctors in their hospital
CREATE POLICY "Staff can update hospital doctors"
  ON doctors FOR UPDATE
  USING (hospital_id = current_user_hospital_id())
  WITH CHECK (hospital_id = current_user_hospital_id());

-- 3a. Doctor schedules
CREATE POLICY "Public read for doctor schedules"
  ON doctor_schedules FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage hospital doctor schedules"
  ON doctor_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM doctors
      WHERE doctors.id = doctor_schedules.doctor_id
        AND doctors.hospital_id = current_user_hospital_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM doctors
      WHERE doctors.id = doctor_schedules.doctor_id
        AND doctors.hospital_id = current_user_hospital_id()
    )
  );

-- 3b. Clinic holidays
CREATE POLICY "Public read for clinic holidays"
  ON clinic_holidays FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage own clinic holidays"
  ON clinic_holidays FOR ALL
  USING (hospital_id = current_user_hospital_id())
  WITH CHECK (hospital_id = current_user_hospital_id());

-- 4. Patients Policies
-- Patient can read their own profile
CREATE POLICY "Patients can read own record"
  ON patients FOR SELECT
  USING (user_id = auth.uid()::text);

-- Patient can insert/update their own profile
CREATE POLICY "Patients can insert/update own record"
  ON patients FOR ALL
  USING (user_id = auth.uid()::text);

-- Hospital staff can read patient info for patients who have appointments at their hospital
CREATE POLICY "Staff can read patient info with hospital appointment"
  ON patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.patient_id = patients.id
        AND appointments.hospital_id = current_user_hospital_id()
    )
  );

-- 5. Family Members Policies
-- Patient can read/write their own dependents
CREATE POLICY "Patient can manage own family members"
  ON family_members FOR ALL
  USING (
    primary_patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()::text
    )
  );

-- Staff can read family member if they have an appointment at their hospital
CREATE POLICY "Staff can read family member for appointment"
  ON family_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.family_member_id = family_members.id
        AND appointments.hospital_id = current_user_hospital_id()
    )
  );

-- 6. Appointments Policies
-- Patient can only view their own appointments
CREATE POLICY "Patient can view own appointments"
  ON appointments FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()::text
    )
  );

-- Patient can create appointments for themselves or their family
CREATE POLICY "Patient can insert appointment"
  ON appointments FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()::text
    )
  );

-- Patient can cancel their own upcoming appointment
CREATE POLICY "Patient can cancel own appointment"
  ON appointments FOR UPDATE
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    state IN ('CANCELLED')
  );

-- Hospital staff can view and manage only appointments for their hospital
CREATE POLICY "Staff can manage appointments for their hospital"
  ON appointments FOR ALL
  USING (hospital_id = current_user_hospital_id());

-- 7. Audit Logs Policies
-- Staff can only view audit logs for their hospital
CREATE POLICY "Staff can view own hospital audit logs"
  ON audit_logs FOR SELECT
  USING (hospital_id = current_user_hospital_id());

-- System append-only for audit logs
CREATE POLICY "Allow audit log inserts"
  ON audit_logs FOR INSERT
  WITH CHECK (true);
