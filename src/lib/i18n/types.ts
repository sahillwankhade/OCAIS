export type SupportedLocale = 'en' | 'hi' | 'mr';

export interface Translations {
  common: {
    appName: string;
    tagline: string;
    loading: string;
    submit: string;
    cancel: string;
    save: string;
    confirm: string;
    back: string;
    next: string;
    search: string;
    filter: string;
    viewDetails: string;
    phone: string;
    age: string;
    gender: string;
    prn: string;
    token: string;
    status: string;
    actions: string;
    today: string;
    error: string;
    success: string;
  };
  auth: {
    welcome: string;
    enterPhone: string;
    sendOtp: string;
    enterOtp: string;
    verifyOtp: string;
    resendOtp: string;
    otpSentMessage: string;
    mockOtpHint: string;
    profileSetupTitle: string;
    fullName: string;
    bloodGroup: string;
    completeRegistration: string;
    privacyConsent: string;
    dpdpNotice: string;
  };
  booking: {
    bookAppointment: string;
    selectDoctor: string;
    selectDate: string;
    selectTimeSlot: string;
    selectPatient: string;
    myself: string;
    addFamilyMember: string;
    consultationFee: string;
    payAndConfirm: string;
    payAtClinic: string;
    bookingSuccess: string;
    bookingConfirmed: string;
    yourTokenNumber: string;
    qrInstruction: string;
  };
  queue: {
    liveTracker: string;
    nowServing: string;
    yourToken: string;
    patientsAhead: string;
    estimatedWait: string;
    leaveHomeBy: string;
    estimatedCallTime: string;
    doctorDelayed: string;
    doctorPaused: string;
    doctorActive: string;
    inCabinNow: string;
    waitingStatus: string;
    refreshQueue: string;
  };
  doctorConsole: {
    title: string;
    cabin: string;
    nextPatient: string;
    skipPatient: string;
    doneConsultation: string;
    pauseQueue: string;
    resumeQueue: string;
    delayNotice: string;
    delay10Min: string;
    delay15Min: string;
    delay30Min: string;
    customDelay: string;
    currentPatient: string;
    noActivePatient: string;
    prescriptionTitle: string;
    addMedicine: string;
    finishAndPrint: string;
  };
  reception: {
    title: string;
    walkInRegistration: string;
    generateToken: string;
    searchByPrnOrPhone: string;
    printSlip: string;
    sendWhatsAppToken: string;
    queueOverview: string;
  };
  states: {
    BOOKED: string;
    CHECKED_IN: string;
    IN_CONSULT: string;
    COMPLETED: string;
    CANCELLED: string;
    NO_SHOW: string;
    SKIPPED: string;
  };
}

