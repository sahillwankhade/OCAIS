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
  private senderId = process.env.MSG91_SENDER_ID || '';

  private normalizePhone(phone: string) {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 ? `91${digits}` : digits;
  }

  async sendOtp(phone: string): Promise<SendOtpResult> {
    if (!this.authKey || !this.templateId) {
      return { success: false, messageId: '', error: 'MSG91 OTP credentials are not configured.' };
    }
    try {
      const response = await fetch('https://control.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          authkey: this.authKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: this.templateId,
          mobile: this.normalizePhone(phone),
          ...(this.senderId ? { sender: this.senderId } : {}),
        }),
      });
      const result = await response.json() as { type?: string; message?: string; request_id?: string };
      if (!response.ok || result.type === 'error') {
        return { success: false, messageId: '', error: result.message || 'MSG91 could not send the OTP.' };
      }
      return { success: true, messageId: result.request_id || `msg91-${Date.now()}` };
    } catch (error: unknown) {
      return {
        success: false,
        messageId: '',
        error: error instanceof Error ? error.message : 'MSG91 OTP request failed.',
      };
    }
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    if (!this.authKey) return false;
    try {
      const response = await fetch(
        `https://control.msg91.com/api/v5/otp/verify?mobile=${encodeURIComponent(this.normalizePhone(phone))}&otp=${encodeURIComponent(code)}`,
        { headers: { authkey: this.authKey } }
      );
      const result = await response.json() as { type?: string };
      return response.ok && result.type !== 'error';
    } catch {
      return false;
    }
  }

  async sendSms(phone: string, message: string): Promise<{ success: boolean; messageId: string }> {
    if (!this.authKey || !this.senderId) {
      return { success: false, messageId: '' };
    }
    return { success: false, messageId: '' };
  }
}
