import { describe, it, expect } from 'vitest';
import {
  isValidStateTransition,
  assertValidTransition,
  InvalidStateTransitionError,
  VALID_TRANSITIONS,
} from '@/lib/state-machine/appointment-state';
import { AppointmentState } from '@/lib/types';

describe('Appointment State Machine', () => {
  it('allows valid state progression for a standard consult flow', () => {
    // BOOKED -> CHECKED_IN
    expect(isValidStateTransition('BOOKED', 'CHECKED_IN')).toBe(true);
    expect(() => assertValidTransition('BOOKED', 'CHECKED_IN')).not.toThrow();

    // CHECKED_IN -> IN_CONSULT
    expect(isValidStateTransition('CHECKED_IN', 'IN_CONSULT')).toBe(true);
    expect(() => assertValidTransition('CHECKED_IN', 'IN_CONSULT')).not.toThrow();

    // IN_CONSULT -> COMPLETED
    expect(isValidStateTransition('IN_CONSULT', 'COMPLETED')).toBe(true);
    expect(() => assertValidTransition('IN_CONSULT', 'COMPLETED')).not.toThrow();
  });

  it('allows skipping and recall back into the queue', () => {
    // CHECKED_IN -> SKIPPED
    expect(isValidStateTransition('CHECKED_IN', 'SKIPPED')).toBe(true);

    // SKIPPED -> CHECKED_IN (recall)
    expect(isValidStateTransition('SKIPPED', 'CHECKED_IN')).toBe(true);

    // SKIPPED -> NO_SHOW (if patient never returns)
    expect(isValidStateTransition('SKIPPED', 'NO_SHOW')).toBe(true);
  });

  it('allows cancellations from non-terminal states', () => {
    expect(isValidStateTransition('BOOKED', 'CANCELLED')).toBe(true);
    expect(isValidStateTransition('CHECKED_IN', 'CANCELLED')).toBe(true);
    expect(isValidStateTransition('SKIPPED', 'CANCELLED')).toBe(true);
  });

  it('rejects illegal transitions strictly', () => {
    // Cannot skip from BOOKED directly to IN_CONSULT without checking in
    expect(isValidStateTransition('BOOKED', 'IN_CONSULT')).toBe(false);
    expect(() => assertValidTransition('BOOKED', 'IN_CONSULT')).toThrow(
      InvalidStateTransitionError
    );

    // Cannot transition from COMPLETED to anything
    const terminalStates: AppointmentState[] = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];
    const allStates: AppointmentState[] = [
      'BOOKED',
      'CHECKED_IN',
      'IN_CONSULT',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW',
      'SKIPPED',
    ];

    for (const term of terminalStates) {
      for (const target of allStates) {
        if (target !== term) {
          expect(isValidStateTransition(term, target)).toBe(false);
          expect(() => assertValidTransition(term, target)).toThrow(InvalidStateTransitionError);
        }
      }
    }
  });

  it('allows idempotent no-op transitions (same state)', () => {
    expect(isValidStateTransition('BOOKED', 'BOOKED')).toBe(true);
    expect(isValidStateTransition('IN_CONSULT', 'IN_CONSULT')).toBe(true);
  });
});

