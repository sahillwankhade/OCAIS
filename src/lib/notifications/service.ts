import { adapters } from '@/lib/adapters';
import { Appointment, Doctor, Patient } from '@/lib/types';

export interface NotificationDelivery {
  channel: 'SMS' | 'WHATSAPP' | 'PUSH';
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface NotificationBatchResult {
  deliveries: NotificationDelivery[];
  successCount: number;
}

export async function sendDelayAlerts(
  doctor: Doctor,
  patients: Patient[],
  delayMinutes: number
): Promise<NotificationBatchResult> {
  const deliveries = (
    await Promise.all(
      patients.flatMap((patient) => [
        adapters.sms
          .sendSms(
            patient.phone,
            `${doctor.fullName} is delayed by ${delayMinutes} minutes. Your One Click AIS queue estimate has been updated.`
          )
          .then((result) => ({
            channel: 'SMS' as const,
            success: result.success,
            messageId: result.messageId,
          })),
        adapters.whatsapp
          .sendDelayAlert(patient.phone, doctor.fullName, delayMinutes)
          .then((result) => ({
            channel: 'WHATSAPP' as const,
            success: result.success,
            messageId: result.messageId,
          })),
        adapters.push
          .sendToUser(patient.id, {
            title: 'Doctor delay update',
            body: `${doctor.fullName} is delayed by ${delayMinutes} minutes.`,
            url: '/patient/appointments',
          })
          .then((result) => ({
            channel: 'PUSH' as const,
            success: result.success,
          })),
      ])
    )
  );

  return {
    deliveries,
    successCount: deliveries.filter((delivery) => delivery.success).length,
  };
}

export async function sendFollowUpReminder(
  appointment: Appointment,
  doctor: Doctor,
  patient: Patient
): Promise<NotificationBatchResult> {
  const message = `Follow-up reminder: please book your next visit with ${doctor.fullName}.`;
  const deliveries = await Promise.all([
    adapters.sms.sendSms(patient.phone, message).then((result) => ({
      channel: 'SMS' as const,
      success: result.success,
      messageId: result.messageId,
    })),
    adapters.whatsapp
      .sendFollowUpReminder(patient.phone, doctor.fullName, appointment.id)
      .then((result) => ({
        channel: 'WHATSAPP' as const,
        success: result.success,
        messageId: result.messageId,
      })),
    adapters.push
      .sendToUser(patient.id, {
        title: 'Follow-up reminder',
        body: message,
        url: '/patient/search',
      })
      .then((result) => ({
        channel: 'PUSH' as const,
        success: result.success,
      })),
  ]);

  return {
    deliveries,
    successCount: deliveries.filter((delivery) => delivery.success).length,
  };
}
