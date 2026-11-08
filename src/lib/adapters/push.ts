export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export interface IPushNotificationService {
  sendToUser(userId: string, payload: PushPayload): Promise<{ success: boolean }>;
  broadcastToDoctorQueue(doctorId: string, payload: PushPayload): Promise<{ sentCount: number }>;
}

export class MockPushNotificationService implements IPushNotificationService {
  private log: Array<{ target: string; payload: PushPayload; sentAt: Date }> = [];

  async sendToUser(userId: string, payload: PushPayload): Promise<{ success: boolean }> {
    this.log.push({ target: `user:${userId}`, payload, sentAt: new Date() });
    return { success: true };
  }

  async broadcastToDoctorQueue(doctorId: string, payload: PushPayload): Promise<{ sentCount: number }> {
    this.log.push({ target: `doctor:${doctorId}`, payload, sentAt: new Date() });
    return { sentCount: 1 };
  }

  getRecentLogs() {
    return [...this.log];
  }
}

