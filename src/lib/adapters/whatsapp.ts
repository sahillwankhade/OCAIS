export interface SendWhatsAppTokenParams {
  phone: string;
  patientName: string;
  doctorName: string;
  tokenNumber: number;
  slotTime: string;
  qrUrl: string;
}

export interface IWhatsAppService {
  sendTokenMessage(params: SendWhatsAppTokenParams): Promise<{ success: boolean; messageId: string }>;
  sendDelayAlert(
    phone: string,
    doctorName: string,
    delayMinutes: number
  ): Promise<{ success: boolean; messageId: string }>;
}

export class MockWhatsAppService implements IWhatsAppService {
  private sentMessages: Array<{ phone: string; type: string; payload: unknown; sentAt: Date }> = [];

  async sendTokenMessage(params: SendWhatsAppTokenParams): Promise<{ success: boolean; messageId: string }> {
    this.sentMessages.push({
      phone: params.phone,
      type: 'TOKEN_DISPATCH',
      payload: params,
      sentAt: new Date(),
    });
    return {
      success: true,
      messageId: `mock-wa-${Date.now()}`,
    };
  }

  async sendDelayAlert(
    phone: string,
    doctorName: string,
    delayMinutes: number
  ): Promise<{ success: boolean; messageId: string }> {
    this.sentMessages.push({
      phone,
      type: 'DELAY_ALERT',
      payload: { doctorName, delayMinutes },
      sentAt: new Date(),
    });
    return {
      success: true,
      messageId: `mock-wa-delay-${Date.now()}`,
    };
  }

  getRecentLogs() {
    return [...this.sentMessages];
  }
}

