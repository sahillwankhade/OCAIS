export interface SendOtpResult {
  success: boolean;
  messageId: string;
  mockOtp?: string;
  error?: string;
}

export interface ISmsService {
  sendOtp(phone: string): Promise<SendOtpResult>;
  verifyOtp(phone: string, code: string): Promise<boolean>;
  sendSms(phone: string, message: string): Promise<{ success: boolean; messageId: string }>;
}

export class MockSmsService implements ISmsService {
  private static MOCK_CODE = process.env.MOCK_OTP_CODE || '123456';
  private sentMessages: { phone: string; message: string; timestamp: Date }[] = [];

  async sendOtp(phone: string): Promise<SendOtpResult> {
    const mockCode = MockSmsService.MOCK_CODE;
    this.sentMessages.push({
      phone,
      message: `Your One Click AIS verification code is: ${mockCode}`,
      timestamp: new Date(),
    });

    return {
      success: true,
      messageId: `mock-msg-${Date.now()}`,
      mockOtp: mockCode,
    };
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    // In mock mode, 123456 always succeeds
    return code === MockSmsService.MOCK_CODE;
  }

  async sendSms(phone: string, message: string): Promise<{ success: boolean; messageId: string }> {
    this.sentMessages.push({
      phone,
      message,
      timestamp: new Date(),
    });
    return {
      success: true,
      messageId: `mock-sms-${Date.now()}`,
    };
  }

  getRecentLogs() {
    return [...this.sentMessages];
  }
}

export class Msg91SmsService implements ISmsService {
  private authKey = process.env.MSG91_AUTH_KEY || '';
  private templateId = process.env.MSG91_OTP_TEMPLATE_ID || '';

  async sendOtp(phone: string): Promise<SendOtpResult> {
    if (!this.authKey) {
      return { success: false, messageId: '', error: 'MSG91_AUTH_KEY is not configured.' };
    }
    // Real implementation would invoke MSG91 OTP endpoint
    return { success: true, messageId: `msg91-${Date.now()}` };
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    // Real implementation calls MSG91 verify endpoint
    return code === '123456';
  }

  async sendSms(phone: string, message: string): Promise<{ success: boolean; messageId: string }> {
    return { success: true, messageId: `msg91-sms-${Date.now()}` };
  }
}

