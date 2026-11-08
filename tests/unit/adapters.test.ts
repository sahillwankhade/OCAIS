import { describe, it, expect } from 'vitest';
import {
  MockSmsService,
  MockPaymentService,
  MockMapService,
  MockWhatsAppService,
} from '@/lib/adapters';

describe('External Service Adapters (Mock Mode)', () => {
  describe('SMS & OTP Adapter', () => {
    const sms = new MockSmsService();

    it('sends OTP with code 123456 in mock mode', async () => {
      const res = await sms.sendOtp('9876543210');
      expect(res.success).toBe(true);
      expect(res.mockOtp).toBe('123456');
    });

    it('validates 123456 and rejects incorrect OTP', async () => {
      expect(await sms.verifyOtp('9876543210', '123456')).toBe(true);
      expect(await sms.verifyOtp('9876543210', '000000')).toBe(false);
      expect(await sms.verifyOtp('9876543210', '654321')).toBe(false);
    });
  });

  describe('Payment Adapter', () => {
    const payment = new MockPaymentService();

    it('creates a mock Razorpay-compatible order with paise conversion', async () => {
      const order = await payment.createOrder({
        appointmentId: 'apt-999',
        amountInInr: 500,
        patientPhone: '9876543210',
      });

      expect(order.orderId).toContain('order_mock_');
      expect(order.amount).toBe(50000); // 500 INR in paise
      expect(order.currency).toBe('INR');
      expect(order.keyId).toBeDefined();
    });

    it('verifies mock payment signatures successfully', async () => {
      const verified = await payment.verifyPayment({
        orderId: 'order_123',
        paymentId: 'pay_456',
        signature: 'mock_signature_valid',
      });
      expect(verified).toBe(true);
    });
  });

  describe('Maps & Travel Time Adapter', () => {
    const map = new MockMapService();

    it('computes distance and travel time for coordinates', async () => {
      // Pune station (18.5284, 73.8744) to Kothrud (18.5074, 73.8077) ~7.5km
      const estimate = await map.calculateTravelTime(
        { lat: 18.5284, lng: 73.8744 },
        { lat: 18.5074, lng: 73.8077 }
      );

      expect(estimate.distanceKm).toBeGreaterThan(5);
      expect(estimate.durationMinutes).toBeGreaterThan(10);
      expect(estimate.provider).toBe('MOCK');
    });

    it('returns reasonable fallback for string queries', async () => {
      const estimate = await map.calculateTravelTime('Home', 'Sahyadri Hospital');
      expect(estimate.durationMinutes).toBe(20);
      expect(estimate.distanceKm).toBe(7.5);
    });
  });

  describe('WhatsApp Notification Adapter', () => {
    const whatsapp = new MockWhatsAppService();

    it('logs token dispatch and delay alerts', async () => {
      const tokenRes = await whatsapp.sendTokenMessage({
        phone: '9876543210',
        patientName: 'Aarav Patil',
        doctorName: 'Dr. Sharma',
        tokenNumber: 14,
        slotTime: '10:30',
        qrUrl: 'https://example.com/qr',
      });
      expect(tokenRes.success).toBe(true);

      const delayRes = await whatsapp.sendDelayAlert('9876543210', 'Dr. Sharma', 15);
      expect(delayRes.success).toBe(true);

      const logs = whatsapp.getRecentLogs();
      expect(logs.length).toBe(2);
      expect(logs[0].type).toBe('TOKEN_DISPATCH');
      expect(logs[1].type).toBe('DELAY_ALERT');
    });
  });
});

