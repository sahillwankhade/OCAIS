import crypto from 'crypto';
import { QRPayload } from '../types';

const DEFAULT_SECRET = process.env.HMAC_SECRET_KEY || (
  process.env.NODE_ENV === 'production' ? '' : 'dev-secret-key-change-in-production-ocais-2026'
);

export interface GenerateQRParams {
  appointmentId: string;
  doctorId: string;
  hospitalId: string;
  tokenNumber: number;
  slotDate: string; // YYYY-MM-DD
  expiresInHours?: number; // Defaults to 18 hours (day of appointment)
  secretKey?: string;
}

export interface VerificationResult {
  isValid: boolean;
  code?: 'INVALID_SIGNATURE' | 'EXPIRED' | 'WRONG_DOCTOR' | 'WRONG_DATE' | 'MALFORMED' | 'SUCCESS';
  error?: string;
  payload?: QRPayload;
}

/**
 * Computes deterministic HMAC-SHA256 signature for token payload
 */
function createSignature(
  data: Omit<QRPayload, 'signature'>,
  secretKey: string
): string {
  const serialized = `${data.appointmentId}|${data.doctorId}|${data.hospitalId}|${data.tokenNumber}|${data.slotDate}|${data.expiresAt}`;
  return crypto.createHmac('sha256', secretKey).update(serialized).digest('hex');
}

/**
 * Generates an HMAC-signed QR payload object
 */
export function generateQRPayload({
  appointmentId,
  doctorId,
  hospitalId,
  tokenNumber,
  slotDate,
  expiresInHours = 18,
  secretKey = DEFAULT_SECRET,
}: GenerateQRParams): QRPayload {
  if (!secretKey) throw new Error('HMAC_SECRET_KEY is required in production.');
  // Expiry defaults to end of slot day
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + expiresInHours);

  const unsigned: Omit<QRPayload, 'signature'> = {
    appointmentId,
    doctorId,
    hospitalId,
    tokenNumber,
    slotDate,
    expiresAt: expiryDate.toISOString(),
  };

  const signature = createSignature(unsigned, secretKey);

  return {
    ...unsigned,
    signature,
  };
}

/**
 * Serializes the QR payload into a compact JSON string suitable for QR code generation
 */
export function serializeQRPayload(payload: QRPayload): string {
  return JSON.stringify(payload);
}

/**
 * Parses and verifies an incoming QR string or payload against doctor, date, and tamper-proof HMAC
 */
export function verifyQRPayload(
  rawOrPayload: string | QRPayload,
  expectedDoctorId?: string,
  expectedDate?: string, // YYYY-MM-DD
  secretKey = DEFAULT_SECRET
): VerificationResult {
  if (!secretKey) {
    return { isValid: false, code: 'INVALID_SIGNATURE', error: 'QR signing is not configured.' };
  }
  let payload: QRPayload;

  try {
    if (typeof rawOrPayload === 'string') {
      payload = JSON.parse(rawOrPayload);
    } else {
      payload = rawOrPayload;
    }
  } catch {
    return {
      isValid: false,
      code: 'MALFORMED',
      error: 'Invalid QR code format. Not a valid JSON payload.',
    };
  }

  // Basic required fields check
  if (
    !payload.appointmentId ||
    !payload.doctorId ||
    !payload.hospitalId ||
    !payload.tokenNumber ||
    !payload.slotDate ||
    !payload.expiresAt ||
    !payload.signature
  ) {
    return {
      isValid: false,
      code: 'MALFORMED',
      error: 'Incomplete QR code payload. Missing required fields.',
    };
  }

  // 1. Verify HMAC Signature
  const expectedSig = createSignature(
    {
      appointmentId: payload.appointmentId,
      doctorId: payload.doctorId,
      hospitalId: payload.hospitalId,
      tokenNumber: payload.tokenNumber,
      slotDate: payload.slotDate,
      expiresAt: payload.expiresAt,
    },
    secretKey
  );

  const sigBuffer = Buffer.from(payload.signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSig, 'utf8');

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return {
      isValid: false,
      code: 'INVALID_SIGNATURE',
      error: 'Tampered or unauthorized QR code signature.',
    };
  }

  // 2. Verify Expiry
  const now = new Date();
  const expiry = new Date(payload.expiresAt);
  if (now > expiry) {
    return {
      isValid: false,
      code: 'EXPIRED',
      error: 'This QR code token has expired.',
    };
  }

  // 3. Verify Doctor Match if supplied
  if (expectedDoctorId && payload.doctorId !== expectedDoctorId) {
    return {
      isValid: false,
      code: 'WRONG_DOCTOR',
      error: `QR code is for a different doctor cabin. Expected ${expectedDoctorId}, received ${payload.doctorId}.`,
    };
  }

  // 4. Verify Date Match if supplied
  if (expectedDate && payload.slotDate !== expectedDate) {
    return {
      isValid: false,
      code: 'WRONG_DATE',
      error: `QR code is valid for ${payload.slotDate}, not for today (${expectedDate}).`,
    };
  }

  return {
    isValid: true,
    code: 'SUCCESS',
    payload,
  };
}
