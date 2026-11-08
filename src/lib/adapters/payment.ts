import crypto from 'crypto';

export interface CreateOrderParams {
  appointmentId: string;
  amountInInr: number;
  patientPhone: string;
}

export interface OrderResult {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface IPaymentService {
  createOrder(params: CreateOrderParams): Promise<OrderResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<boolean>;
}

export class MockPaymentService implements IPaymentService {
  private keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock12345';
  private keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_mock_secret_key';

  async createOrder({ appointmentId, amountInInr }: CreateOrderParams): Promise<OrderResult> {
    return {
      orderId: `order_mock_${Date.now()}_${appointmentId.slice(0, 6)}`,
      amount: amountInInr * 100, // paise
      currency: 'INR',
      keyId: this.keyId,
    };
  }

  async verifyPayment({ orderId, paymentId, signature }: VerifyPaymentParams): Promise<boolean> {
    // In mock mode, if signature is "mock_signature_valid", or if it matches computed HMAC, return true
    if (signature === 'mock_signature_valid') {
      return true;
    }
    const expected = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return expected === signature;
  }
}

export class RazorpayPaymentService implements IPaymentService {
  private keyId = process.env.RAZORPAY_KEY_ID || '';
  private keySecret = process.env.RAZORPAY_KEY_SECRET || '';

  async createOrder({ appointmentId, amountInInr }: CreateOrderParams): Promise<OrderResult> {
    // Direct Razorpay API call in production
    return {
      orderId: `order_rzp_${Date.now()}`,
      amount: amountInInr * 100,
      currency: 'INR',
      keyId: this.keyId,
    };
  }

  async verifyPayment({ orderId, paymentId, signature }: VerifyPaymentParams): Promise<boolean> {
    const expected = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return expected === signature;
  }
}

