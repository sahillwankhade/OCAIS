-- Migration: 004_foundation_seed_completion.sql
-- Demo schedules and holidays for the foundation environment.

INSERT INTO doctor_schedules (id, doctor_id, day_of_week, shift_start, shift_end, slot_duration_minutes)
VALUES
  ('schedule-sharma-mon-sat', 'doc-sharma', 1, '09:00', '13:00', 15),
  ('schedule-kulkarni-mon-sat', 'doc-kulkarni', 1, '10:00', '14:00', 15),
  ('schedule-deshmukh-mon-sat', 'doc-deshmukh', 1, '11:00', '15:00', 15),
  ('schedule-nair-mon-sat', 'doc-nair', 1, '16:00', '20:00', 15)
ON CONFLICT (id) DO NOTHING;

INSERT INTO clinic_holidays (id, hospital_id, holiday_date, reason)
VALUES
  ('holiday-sahyadri-diwali', 'hosp-sahyadri', '2026-10-21', 'Diwali holiday'),
  ('holiday-arogya-republic-day', 'hosp-arogya', '2027-01-26', 'Republic Day')
ON CONFLICT (id) DO NOTHING;
