import { describe, expect, it } from 'vitest';
import { APP_BOOKING_FEE_INR } from '@/lib/billing/booking-fee';

describe('Patient booking fee', () => {
  it('charges the fixed One Click AIS booking fee', () => {
    expect(APP_BOOKING_FEE_INR).toBe(20);
  });
});
