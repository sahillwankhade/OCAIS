import { AppointmentState } from '../types';

/**
 * Valid Appointment State Transitions Matrix
 */
export const VALID_TRANSITIONS: Record<AppointmentState, AppointmentState[]> = {
  BOOKED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
  CHECKED_IN: ['IN_CONSULT', 'SKIPPED', 'CANCELLED', 'NO_SHOW'],
  IN_CONSULT: ['COMPLETED'],
  SKIPPED: ['CHECKED_IN', 'NO_SHOW', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export class InvalidStateTransitionError extends Error {
  constructor(
    public readonly fromState: AppointmentState,
    public readonly toState: AppointmentState,
    public readonly reason?: string
  ) {
    super(
      `Cannot transition appointment from '${fromState}' to '${toState}'.${
        reason ? ` Reason: ${reason}` : ''
      }`
    );
    this.name = 'InvalidStateTransitionError';
  }
}

/**
 * Validates whether a state transition is permitted by business rules.
 */
export function isValidStateTransition(
  fromState: AppointmentState,
  toState: AppointmentState
): boolean {
  if (fromState === toState) {
    return true; // No-op transition
  }
  const allowed = VALID_TRANSITIONS[fromState] || [];
  return allowed.includes(toState);
}

/**
 * Asserts that a state transition is valid, throwing an InvalidStateTransitionError if illegal.
 */
export function assertValidTransition(
  fromState: AppointmentState,
  toState: AppointmentState,
  reason?: string
): void {
  if (!isValidStateTransition(fromState, toState)) {
    throw new InvalidStateTransitionError(fromState, toState, reason);
  }
}

/**
 * Returns human-readable status badge styling class and label.
 */
export function getStatusBadgeInfo(state: AppointmentState): {
  label: string;
  className: string;
  isTerminal: boolean;
} {
  const isTerminal = ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(state);
  switch (state) {
    case 'BOOKED':
      return { label: 'Booked', className: 'bg-blue-100 text-blue-800 border-blue-200', isTerminal };
    case 'CHECKED_IN':
      return { label: 'Checked In', className: 'bg-amber-100 text-amber-900 border-amber-300', isTerminal };
    case 'IN_CONSULT':
      return { label: 'In Consultation', className: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold', isTerminal };
    case 'COMPLETED':
      return { label: 'Completed', className: 'bg-slate-100 text-slate-800 border-slate-300', isTerminal };
    case 'CANCELLED':
      return { label: 'Cancelled', className: 'bg-rose-100 text-rose-800 border-rose-300', isTerminal };
    case 'NO_SHOW':
      return { label: 'No Show', className: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300', isTerminal };
    case 'SKIPPED':
      return { label: 'Skipped', className: 'bg-orange-100 text-orange-800 border-orange-300', isTerminal };
  }
}

