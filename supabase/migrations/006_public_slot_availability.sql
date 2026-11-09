CREATE OR REPLACE FUNCTION get_booked_slot_times(
  p_doctor_id TEXT,
  p_slot_date DATE
)
RETURNS TABLE(slot_start_time TEXT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT DISTINCT appointments.slot_start_time
  FROM appointments
  WHERE appointments.doctor_id = p_doctor_id
    AND appointments.slot_date = p_slot_date
    AND appointments.state <> 'CANCELLED';
$$;

REVOKE ALL ON FUNCTION get_booked_slot_times(TEXT, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_booked_slot_times(TEXT, DATE) TO anon, authenticated, service_role;
