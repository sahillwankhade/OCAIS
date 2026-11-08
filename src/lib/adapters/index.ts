import { ISmsService, MockSmsService, Msg91SmsService } from './sms';
import { IWhatsAppService, MockWhatsAppService } from './whatsapp';
import { IPushNotificationService, MockPushNotificationService } from './push';
import { IPaymentService, MockPaymentService, RazorpayPaymentService } from './payment';
import { IMapService, MockMapService, GoogleMapsService } from './maps';

export interface AppAdapters {
  sms: ISmsService;
  whatsapp: IWhatsAppService;
  push: IPushNotificationService;
  payment: IPaymentService;
  maps: IMapService;
}

const isMock = process.env.USE_MOCK_SERVICES !== 'false';

export const adapters: AppAdapters = {
  sms: isMock ? new MockSmsService() : new Msg91SmsService(),
  whatsapp: new MockWhatsAppService(),
  push: new MockPushNotificationService(),
  payment: isMock ? new MockPaymentService() : new RazorpayPaymentService(),
  maps: isMock || !process.env.GOOGLE_MAPS_API_KEY ? new MockMapService() : new GoogleMapsService(),
};

export * from './sms';
export * from './whatsapp';
export * from './push';
export * from './payment';
export * from './maps';
