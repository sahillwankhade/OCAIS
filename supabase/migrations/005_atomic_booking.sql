INSERT INTO doctor_schedules (id, doctor_id, day_of_week, shift_start, shift_end, slot_duration_minutes)
SELECT
  CONCAT(schedule.doctor_id, '-day-', day_number),
  schedule.doctor_id,
  day_number,
  schedule.shift_start,
  schedule.shift_end,
  schedule.slot_duration_minutes
FROM doctor_schedules AS schedule
CROSS JOIN generate_series(2, 6) AS day_number
WHERE schedule.day_of_week = 1
  AND schedule.id IN (
    'schedule-sharma-mon-sat',
    'schedule-kulkarni-mon-sat',
    'schedule-deshmukh-mon-sat',
    'schedule-nair-mon-sat'
  )
ON CONFLICT (id) DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_unique_token
  ON appointments (doctor_id, slot_date, token_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_active_slot
  ON appointments (doctor_id, slot_date, slot_start_time)
  WHERE state <> 'CANCELLED';

CREATE OR REPLACE FUNCTION create_appointment_with_token(
  p_id TEXT,
  p_hospital_id TEXT,
  p_doctor_id TEXT,
  p_patient_id TEXT,
  p_family_member_id TEXT,
  p_slot_date DATE,
  p_slot_start_time TEXT,
  p_slot_end_time TEXT,
  p_amount_paid INT,
  p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  next_token INT;
  doctor_hospital_id TEXT;
  appointment_row appointments;
BEGIN
  SELECT hospital_id INTO doctor_hospital_id
  FROM doctors
  WHERE id = p_doctor_id
  FOR UPDATE;

  IF doctor_hospital_id IS NULL OR doctor_hospital_id <> p_hospital_id THEN
    RAISE EXCEPTION 'Doctor and hospital do not match' USING ERRCODE = '23503';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM patients WHERE id = p_patient_id) THEN
    RAISE EXCEPTION 'Patient not found' USING ERRCODE = '23503';
  END IF;

  IF p_family_member_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM family_members
    WHERE id = p_family_member_id AND primary_patient_id = p_patient_id
  ) THEN
    RAISE EXCEPTION 'Family member does not belong to patient' USING ERRCODE = '23503';
  END IF;

  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE doctor_id = p_doctor_id
      AND slot_date = p_slot_date
      AND slot_start_time = p_slot_start_time
      AND state <> 'CANCELLED'
  ) THEN
    RAISE EXCEPTION 'That appointment slot is no longer available' USING ERRCODE = '23505';
  END IF;

  SELECT COALESCE(MAX(token_number), 0) + 1 INTO next_token
  FROM appointments
  WHERE doctor_id = p_doctor_id AND slot_date = p_slot_date;

  INSERT INTO appointments (
    id, hospital_id, doctor_id, patient_id, family_member_id,
    token_number, slot_date, slot_start_time, slot_end_time, state,
    is_walk_in, payment_status, payment_method, amount_paid, notes
  ) VALUES (
    p_id, p_hospital_id, p_doctor_id, p_patient_id, p_family_member_id,
    next_token, p_slot_date, p_slot_start_time, p_slot_end_time, 'BOOKED',
    FALSE, 'PAID', 'ONLINE_MOCK', p_amount_paid, p_notes
  )
  RETURNING * INTO appointment_row;

  RETURN to_jsonb(appointment_row);
END;
$$;

REVOKE ALL ON FUNCTION create_appointment_with_token(
  TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, INT, TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION create_appointment_with_token(
  TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, INT, TEXT
) TO service_role;
