import { describe, it, expect } from 'vitest';
import {
  generateQRPayload,
  verifyQRPayload,
  serializeQRPayload,
} from '@/lib/security/qr-token';

describe('QR Token HMAC Security Engine', () => {
  const sampleParams = {
    appointmentId: 'apt-101',
    doctorId: 'doc-sharma',
    hospitalId: 'hosp-sahyadri',
    tokenNumber: 15,
    slotDate: '2026-11-10',
  };

  it('generates a signed payload and verifies successfully with matching doctor and date', () => {
    const payload = generateQRPayload(sampleParams);

    expect(payload.appointmentId).toBe('apt-101');
    expect(payload.tokenNumber).toBe(15);
    expect(payload.signature).toBeDefined();

    const result = verifyQRPayload(payload, 'doc-sharma', '2026-11-10');
    expect(result.isValid).toBe(true);
    expect(result.code).toBe('SUCCESS');
    expect(result.payload?.tokenNumber).toBe(15);
  });

  it('serializes to string and parses correctly during kiosk scan', () => {
    const payload = generateQRPayload(sampleParams);
    const serialized = serializeQRPayload(payload);

    expect(typeof serialized).toBe('string');
    const result = verifyQRPayload(serialized, 'doc-sharma', '2026-11-10');
    expect(result.isValid).toBe(true);
  });

  it('rejects tampered token data', () => {
    const payload = generateQRPayload(sampleParams);

    // Attacker modifies token number from 15 to 1 to cut the line
    const tampered = { ...payload, tokenNumber: 1 };

    const result = verifyQRPayload(tampered, 'doc-sharma', '2026-11-10');
    expect(result.isValid).toBe(false);
    expect(result.code).toBe('INVALID_SIGNATURE');
  });

  it('rejects wrong doctor scan attempts', () => {
    const payload = generateQRPayload(sampleParams);

    // Patient tries to scan at Dr. Kulkarni cabin instead of Dr. Sharma
    const result = verifyQRPayload(payload, 'doc-kulkarni', '2026-11-10');
    expect(result.isValid).toBe(false);
    expect(result.code).toBe('WRONG_DOCTOR');
  });

  it('rejects appointments scanned on the wrong day', () => {
    const payload = generateQRPayload(sampleParams);

    // Patient tries to scan tomorrow with today's token
    const result = verifyQRPayload(payload, 'doc-sharma', '2026-11-11');
    expect(result.isValid).toBe(false);
    expect(result.code).toBe('WRONG_DATE');
  });

  it('rejects expired tokens', () => {
    // Generate token with negative hours so it is expired
    const expiredPayload = generateQRPayload({
      ...sampleParams,
      expiresInHours: -1,
    });

    const result = verifyQRPayload(expiredPayload, 'doc-sharma', '2026-11-10');
    expect(result.isValid).toBe(false);
    expect(result.code).toBe('EXPIRED');
  });

  it('handles malformed JSON string safely without crashing', () => {
    const result = verifyQRPayload('not-a-valid-json-string');
    expect(result.isValid).toBe(false);
    expect(result.code).toBe('MALFORMED');
  });
});

