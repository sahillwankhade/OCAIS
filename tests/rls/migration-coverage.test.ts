import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schema = readFileSync('supabase/migrations/001_initial_schema.sql', 'utf8');
const rls = readFileSync('supabase/migrations/002_row_level_security.sql', 'utf8');
const seedCompletion = readFileSync(
  'supabase/migrations/004_foundation_seed_completion.sql',
  'utf8'
);

const tables = [
  'hospitals',
  'doctors',
  'patients',
  'family_members',
  'appointments',
  'doctor_schedules',
  'clinic_holidays',
  'audit_logs',
];

describe('Supabase foundation migrations', () => {
  it('enables RLS for every schema table', () => {
    for (const table of tables) {
      expect(rls).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
    }
  });

  it('defines tenant or privacy policies for every schema table', () => {
    for (const table of tables) {
      expect(rls).toMatch(new RegExp(`CREATE POLICY "[^"]+"\\s+ON ${table}\\s`));
    }
  });

  it('seeds schedules and holidays after the core seed data', () => {
    expect(schema).toContain('CREATE TABLE doctor_schedules');
    expect(schema).toContain('CREATE TABLE clinic_holidays');
    expect(seedCompletion).toContain('INSERT INTO doctor_schedules');
    expect(seedCompletion).toContain('INSERT INTO clinic_holidays');
  });

  it('preserves patient as a valid JWT role value', () => {
    expect(rls).toContain("NULLIF(current_setting('request.jwt.claim.role', true), '');");
  });
});
