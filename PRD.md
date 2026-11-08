# Product Requirements Document (PRD): One Click AIS (OCAIS)

## Overview & Vision
"One Click AIS" is a modern, reliable, and accessible hospital and clinic appointment and live-queue management system designed specifically for the healthcare ecosystem in India. It bridges patients, clinics, hospitals, and medical practitioners through real-time queue visibility, streamlined digital check-ins, and clear multi-lingual communication.

---

## Target Audience & Apps (Monorepo: Next.js + TypeScript + Tailwind)
1. **Patient App (Mobile-First PWA)**:
   - Mobile-first, accessible, multilingual (English, Hindi, Marathi).
   - Fast 3-tap booking, PRN generation, family management, live queue tracker, digital tokens, notifications.
2. **Hospital Dashboard**:
   - Role-based portal for `admin`, `doctor`, and `receptionist`.
   - Doctor consultation console, reception desk with walk-in booking and token print/send, calendar slot management, patient history, staff management, and analytics.
3. **Scan Station (`/scan/[doctorId]`)**:
   - Dedicated kiosk page outside doctors' cabins for automated touchless or receptionist QR check-in and consultation triggering.
4. **Display Board (`/display/[doctorId]`)**:
   - High-contrast, full-screen waiting room digital signage displaying the token currently being served, next up, and queue status.
5. **Super-Admin Panel (`/admin`)**:
   - Multi-tenant management, hospital onboarding, system-wide health, and configuration.

---

## Core Patient Screens & Features
- **Onboarding & Language Selection**: English (`en`), Hindi (`hi`), Marathi (`mr`).
- **Authentication**: Phone OTP login (mock OTP `123456` in development).
- **Profile Setup & PRN**: Automated generation of Patient Registration Number (PRN).
- **Family Member Management**: Book appointments for dependents under a single primary phone account.
- **Home Screen**: Highlighting active/upcoming appointment, live queue status teaser, and nearby clinics/hospitals.
- **Search & Discovery**: Filter hospitals and doctors by specialty, distance, availability, fees, and ratings.
- **Hospital & Doctor Detail Pages**: Doctor bio, consultation fees, live queue load, available slots.
- **Slot Selection & Booking Flow**: 3-tap booking flow with date, time slot, patient selection.
- **Payment Gateway Integration**: Mock payment adapter with instant confirmation (Razorpay test ready).
- **Confirmation Screen**: Signed HMAC QR code, token number, calendar integration, directions.
- **LIVE QUEUE TRACKER**:
  - Live token number being served vs. user's token.
  - Number of patients ahead.
  - Doctor status ("In Consult", "Delayed by X min", "Paused").
  - Dynamic Estimated Wait Time ($Wait = (\text{patients ahead} \times \text{doctor avg consult time}) + \text{remaining consult time}$).
  - "Leave Home By" dynamic calculator: $\text{Estimated Call Time} - \text{Travel Time} - 10\text{ min buffer}$.
- **My Appointments**: Filter by Upcoming, Past, Cancelled; single-click cancel and reschedule with slot release.
- **Notifications & Follow-up Reminders**: Web push, WhatsApp/SMS mock triggers for delay alerts and follow-ups.
- **Rate Hospital & Doctor**: Post-consultation feedback and rating.
- **Settings & DPDP Consent**: Data privacy consent management, language switcher, profile edit.

---

## Core Hospital & Clinic Dashboard Screens
- **Login & Staff Auth**: Role-based access control (`admin`, `doctor`, `receptionist`).
- **Hospital Setup**: Department definition, working hours, shift timings, holiday calendar, doctor profiles.
- **Today Overview**: Real-time stats on today's appointments, completed, waiting, walk-ins, revenue, and queue health.
- **Doctor Consultation Console**:
  - Direct controls: **Next**, **Skip**, **Done**, **Pause**, **"I'm delayed X min"** (broadcasts alert to waiting patients).
  - Current patient card with medical history and digital prescription notes.
- **Reception Desk**:
  - Walk-in patient registration (instant PRN creation).
  - Offline booking with cash/card collection.
  - Instant token generation (printable thermal slip format or WhatsApp/SMS token dispatch).
- **Appointment Calendar & Slot Configuration**:
  - Daily/weekly slot templates, slot duration, emergency slot locks, doctor leave management.
- **Patient Directory & History**: Comprehensive patient records, past consults, uploaded documents.
- **Staff Management & Attendance**: Manage receptionist and doctor accounts, permissions, and shift schedules.
- **Reports & Analytics**:
  - Patient footfall, revenue reports, average wait times, average consultation duration, doctor performance.
- **Digital Prescriptions & Medical Notes**: Quick diagnosis tags, Rx builder, downloadable PDF/print summary.
- **Settings & Audit Logs**: Operational settings, notification templates, immutable security audit logs.

---

## Business Rules & State Machine
### Appointment States
- `BOOKED`: Appointment confirmed and slot reserved.
- `CHECKED_IN`: Patient has arrived at the clinic/hospital or verified attendance.
- `IN_CONSULT`: Doctor is currently consulting the patient.
- `COMPLETED`: Consultation finished successfully.
- `CANCELLED`: Cancelled by patient or clinic prior to consultation.
- `NO_SHOW`: Patient failed to check in during their appointment slot.
- `SKIPPED`: Patient called but absent; can be recalled or rescheduled.

### Queue & QR Code Verification
- **Valid Transitions**: Strictly enforced on server/database functions.
- **QR Consultation Trigger**:
  - QR payload contains HMAC-signed JSON: `{ appointmentId, doctorId, hospitalId, date, tokenNumber, expiresAt, signature }`.
  - Scanning QR validates HMAC key, verifies doctor, matches today's date, and verifies state `CHECKED_IN` or `BOOKED`.
  - Automatically transitions current patient to `IN_CONSULT` and records `consultation_start_time`.
  - Auto-completes previous `IN_CONSULT` patient and records `consultation_end_time` (calculating real duration).
  - Handles edge cases: first patient, last patient of day, doctor manually clicking Next/Done.
- **Wait Time & "Leave Home By" Formula**:
  - Moving average of doctor's last 20 consultation durations (default fallback: 8 minutes).
  - $ETA = (\text{Patients Ahead} \times \text{Avg Duration}) + \text{Remaining time of patient in cabin}$.
  - $\text{Leave Home By} = \text{Estimated Consultation Time} - \text{Travel Time} - 10\text{ min buffer}$.
  - Realtime recalculation upon any state change (Next, Skip, Delay, Pause).

---

## Architecture & External Services (Adapter Pattern)
All third-party services use dependency-injected interfaces with a local Mock Provider default:
- **SMS / OTP Service**: Interface `ISmsService`. Mock implementation logs OTP `123456` in development; MSG91 ready for production.
- **WhatsApp Service**: Interface `IWhatsAppService`. Mock logs interactive payloads; WhatsApp Cloud API ready.
- **Push Notification Service**: Interface `IPushNotificationService`. Web Push / Service Worker in PWA.
- **Payment Service**: Interface `IPaymentService`. Mock instant checkout with webhooks; Razorpay Test Mode ready.
- **Maps & Travel Time Service**: Interface `IMapService`. Mock Indian city matrix (e.g. Pune, Mumbai, Delhi) with fallback Haversine distance; Google Maps Distance Matrix API ready.

---

## Security, Privacy & Compliance (DPDP Act India)
- **Supabase Postgres with RLS**: Strict Row Level Security ensuring hospital staff only access their hospital's data, and patients access only their own records and family members.
- **HMAC Signatures**: Tamper-proof QR codes preventing token forgery.
- **Audit Logs (`audit_logs`)**: Centralized tracking for state transitions, cancellations, medical data access, and administrative changes.
- **DPDP Act Compliance**: Dedicated consent screens, granular data privacy policies, and patient consent audit trails.

---

## Design System & UI/UX Standards
- **Medical Theme**: Calm emerald/teal, soothing slate neutrals, high contrast ratio (WCAG AA/AAA).
- **Typography & Touch Targets**: Minimum 16px body copy, generous touch targets ($\ge 48\text{px}$) for elderly accessibility.
- **Responsive Layout**: Zero horizontal scrolling, seamless from 375px (mobile) to 1440px (desktop/kiosk).
- **Internationalization (i18n)**: English (`en`), Hindi (`hi`), Marathi (`mr`).
- **Complete States**: Every view provides Skeleton Loading, Graceful Empty States, and Actionable Error States.

