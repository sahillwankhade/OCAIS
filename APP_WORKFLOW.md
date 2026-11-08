# One Click AIS (OCAIS) - Complete Application Workflow

This document explains how the One Click AIS application works from first visit through
patient booking, clinic queue management, consultation, notifications, reporting, and
administration.

## 1. Application areas

| Area | Route | Main users |
|---|---|---|
| Public launcher | `/` | Everyone |
| Patient app | `/patient` | Patients and family members |
| Patient login | `/patient/login` | Patients |
| Hospital login | `/hospital/login` | Hospital admins, doctors, receptionists |
| Hospital dashboard | `/dashboard` | Hospital admins, doctors, receptionists |
| Scan station | `/scan/[doctorId]` | Reception staff and cabin kiosk |
| Waiting-room display | `/display/[doctorId]` | Patients and clinic visitors |
| Super-admin login | `/admin/login` | Platform administrators |
| Super-admin panel | `/admin` | Platform administrators |

There are three login areas:

1. **Patient login** (`/patient/login`): mobile OTP, profile, and PRN access.
2. **Hospital login** (`/hospital/login`): the user first selects the hospital, then
   signs in as a doctor, receptionist, or hospital admin. The hospital admin controls
   accounts and access for that hospital. After login, the dashboard receives the
   hospital and role from the signed session; users cannot switch into another
   hospital or role from the browser.
3. **Super-admin login** (`/admin/login`): platform-wide access to all hospitals and
   application data.

## 2. Patient registration and login

1. The patient opens `/patient/login`.
2. The patient selects a language: English, Hindi, or Marathi.
3. The patient enters a 10-digit Indian mobile number.
4. The app calls `POST /api/patient/auth` with `SEND_OTP`.
5. In local mock mode, the OTP is `123456`.
6. In real mode, MSG91 sends an SMS OTP and verifies it.
7. The patient enters the six-digit OTP.
8. The app calls `POST /api/patient/auth` with `VERIFY_OTP`.
9. Existing patients are signed in and redirected to `/patient`.
10. New patients complete their name, age, gender, blood group, and DPDP consent.
11. The server creates a patient record and generates a PRN such as `PRN-2026-0001`.
12. A signed patient session cookie and local patient ID are stored.

### OTP configuration

Local development:

```env
USE_MOCK_SERVICES=true
```

Use OTP `123456`.

Real SMS delivery:

```env
USE_MOCK_SERVICES=false
MSG91_AUTH_KEY=...
MSG91_SENDER_ID=...
MSG91_OTP_TEMPLATE_ID=...
```

Restart the server after changing environment variables. The application does not
display or return the real OTP.

## 3. Patient home and discovery

After login, `/patient` shows:

- The current or upcoming appointment
- Queue status and token shortcut
- Popular specialties
- Nearby hospitals and clinics
- Available doctors
- A booking shortcut

`/patient/search` supports doctor and hospital discovery. Sponsored hospitals are
shown with a sponsored label and are sorted before non-sponsored listings.

## 4. Booking an appointment

The patient selects a doctor and opens `/patient/book/[doctorId]`.

The booking flow is:

1. Select an appointment date.
2. Select an available time slot.
3. Select the patient or an approved family member.
4. Review the fixed One Click AIS booking fee.
5. Confirm the booking.

The application charges only a fixed **₹20 booking fee**. The doctor's consultation
fee is not collected by One Click AIS and must be paid to the clinic separately when
applicable. There is no “Pay at Clinic” option in patient booking.

The server validates:

- Hospital and doctor relationship
- Patient session ownership
- Family-member ownership
- Slot availability
- Booking input

The server creates a `BOOKED` appointment, records the ₹20 payment, assigns a queue
token, and sends confirmation notifications through configured adapters.

## 5. Confirmation and QR code

After booking, the patient is redirected to:

```text
/patient/confirmation/[appointmentId]
```

The confirmation page displays:

- Appointment date and time
- Doctor and hospital
- Queue token
- QR code
- Booking status
- Queue-tracking link

The QR payload is signed with HMAC-SHA256 and contains the appointment, doctor,
hospital, date, token, and expiry. It cannot be safely modified without the server
secret.

## 6. My appointments

`/patient/appointments` loads the logged-in patient's appointments and supports:

- Upcoming appointments
- Past appointments
- Cancellation
- Rescheduling
- Follow-up reminder sending
- Opening the live queue

Cancellation and rescheduling are checked against the patient session and valid
appointment state transitions. Rescheduling releases the old slot and creates the
new appointment timing.

## 7. Arrival and live queue

The appointment state machine is:

```text
BOOKED -> CHECKED_IN -> IN_CONSULT -> COMPLETED
   |          |             |
   v          v             v
CANCELLED  NO_SHOW       SKIPPED
```

The server rejects invalid state transitions.

The patient opens `/patient/queue/[appointmentId]` to see:

- Current token being served
- Patient's token
- Patients ahead
- Estimated wait
- Estimated consultation call time
- Leave-home-by time
- Doctor delay or pause status
- Travel-time estimate

The estimated wait uses the doctor's average consultation duration from the last
20 consultations, with an eight-minute default. A ten-minute travel buffer is
included in the leave-home calculation.

## 8. Scan station workflow

The clinic opens `/scan/[doctorId]` on a kiosk or reception device.

1. The patient presents the QR code.
2. The scan endpoint validates the HMAC signature.
3. It rejects expired, reused, wrong-doctor, wrong-day, or unauthorized tokens.
4. The appointment changes to `IN_CONSULT`.
5. The consultation start time is recorded.
6. Any previous `IN_CONSULT` appointment is completed and its end time is recorded.
7. Waiting patients receive the updated queue state.

The final patient is completed when the doctor presses Done or when the next valid
patient is scanned.

## 9. Doctor console workflow

Doctors use `/dashboard/consultation`.

Available actions include:

- Next patient
- Skip patient
- Complete consultation
- Pause or resume the queue
- Report a 10, 15, 30, or custom-minute delay
- Add prescription notes

Queue actions are authorized for the correct hospital staff role and doctor. Delay
and pause actions notify waiting patients through the notification adapters.

## 10. Reception desk and walk-ins

Reception staff use `/dashboard/reception`.

They can:

1. Search for a patient by PRN or phone.
2. Create a new walk-in patient.
3. Select a doctor.
4. Generate a queue token.
5. Print a token slip.
6. Send token details through SMS, WhatsApp, and push notification.

Walk-ins join the same doctor queue as booked appointments. Reception records
walk-in payment and operational details separately from the patient online booking
fee flow.

## 11. Waiting-room display

The clinic displays `/display/[doctorId]` on a large screen.

It shows:

- Current token in consultation
- Next tokens
- Doctor status
- Queue pause or delay notice
- Clinic branding and high-contrast information

The display polls the queue endpoint and is designed for full-screen use.

## 12. Hospital dashboard

### Dashboard home

`/dashboard` shows today's operational overview:

- Total appointments
- Waiting patients
- Completed consultations
- Walk-ins
- Revenue
- Queue health

### Hospital settings

`/dashboard/settings` manages:

- Hospital profile
- Opening and closing hours
- Holidays
- Doctor profiles
- Cabin assignments
- Doctor consultation metadata

### Calendar

`/dashboard/calendar` manages:

- Doctor schedules
- Shift times
- Slot duration
- Emergency slot locks
- Doctor availability

Slots are generated from persisted schedules rather than hard-coded shifts.

### Patients

`/dashboard/patients` provides patient lookup and appointment history.

### Staff and forms

`/dashboard/staff` provides:

- Staff listing
- Attendance toggles
- Digital forms

### Reports

`/dashboard/reports` provides operational metrics and today’s payment totals.

## 13. Super-admin workflow

The `/admin` panel provides platform-level visibility:

- Registered hospitals
- Active specialists
- Consultation totals
- Platform health
- Hospital portal links
- Hospital onboarding interface

Hospital data is tenant-separated. Production onboarding should be connected to a
dedicated authenticated admin API before go-live.

## 14. Notifications

Notification adapters support:

- SMS
- WhatsApp
- Push notifications

Notifications are triggered for:

- OTP delivery
- Appointment confirmation
- Queue token creation
- Doctor delay
- Queue pause
- Follow-up reminders

Mock adapters log delivery locally. Real providers are selected through environment
configuration.

## 15. Data and security flow

The application uses Supabase migrations and Row Level Security for production data.
The local development runtime uses a shared mock database singleton.

Security controls include:

- Signed session cookies
- Patient ownership checks
- Staff role checks
- Hospital tenant checks
- Family-member ownership validation
- HMAC QR signatures
- Expiry and replay validation
- Audit-log support
- DPDP consent capture
- RLS policies on database tables

Sensitive production routes must not rely on client-side IDs alone. The server
validates identity, role, tenant, and resource ownership.

## 16. Payment workflow

There are two separate concepts:

1. **Patient online booking**: fixed ₹20 One Click AIS slot-booking fee.
2. **Clinic consultation fee**: not collected by the patient booking flow; the clinic
   handles it separately.

Development uses the mock payment adapter. Production should use a configured
Razorpay integration and verify payment signatures server-side.

## 17. Local development workflow

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open:

- `http://localhost:3000`
- `http://localhost:3000/patient`
- `http://localhost:3000/dashboard`
- `http://localhost:3000/admin`

Useful checks:

```powershell
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
```

Do not run `npm run build` and Playwright simultaneously because both can write to
the `.next` directory.

## 18. Typical complete journey

```text
Patient opens app
  -> enters mobile number
  -> receives and verifies OTP
  -> creates profile and PRN
  -> searches hospital and doctor
  -> selects date and slot
  -> pays ₹20 booking fee
  -> receives token and signed QR
  -> arrives at clinic
  -> scans QR at cabin
  -> enters live queue
  -> doctor consults and completes appointment
  -> patient receives follow-up reminder
  -> clinic sees reports and history
```
