# One Click AIS (OCAIS)

> Healthcare appointments and real-time live-queue management system for India.

## Key Apps
1. **Patient Mobile-First PWA** (`/patient`): 3-tap booking, PRN generation, family member management, live queue tracking, dynamic wait time, "leave home by" calculator, and signed HMAC QR token.
2. **Hospital & Clinic Dashboard** (`/dashboard`): Role-based portal for `admin`, `doctor`, and `receptionist` with rapid walk-in token generation, doctor consultation console (Next, Skip, Done, Pause, Delayed alert), prescription notes, and reports.
3. **Scan Station Kiosk** (`/scan/[doctorId]`): Tablet kiosk outside cabins for touchless QR check-in that automatically transitions patient to `IN_CONSULT` and completes the previous patient.
4. **Digital Waiting Room Display Board** (`/display/[doctorId]`): Full-screen high-contrast live signage showing the current token in consultation, next 3 tokens, and clinic alerts.
5. **Super-Admin Portal** (`/admin`): Clinic onboarding and system health.

---

## Tech Stack
- **Framework**: Next.js 15 (App Router, Server & Client Components)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS with custom medical design tokens (WCAG AA/AAA compliant, $\ge 16\text{px}$ text, $\ge 48\text{px}$ touch targets)
- **Backend / Database**: Supabase (Postgres, Row Level Security, Realtime channels)
- **Security**: HMAC-SHA256 signed QR codes with doctor and date verification
- **i18n**: English (`en`), Hindi (`hi`), Marathi (`mr`)
- **Adapters**: Adapter pattern with deterministic local Mock Mode (OTP `123456`, mock Razorpay payment, mock Indian travel matrix)
- **Patient booking fee**: One Click AIS charges a fixed ₹20 slot-booking fee. Doctor consultation fees are not collected by the app and must be paid to the clinic separately when applicable.

---

## Getting Started

### 1. Prerequisites
- Node.js $\ge 18$
- npm $\ge 9$

### 2. Setup Environment
```bash
cp .env.example .env.local
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application launcher.

### 5. Supabase Foundation
The SQL migrations are ordered in `supabase/migrations/`:

1. `001_initial_schema.sql` creates the core tables and enums.
2. `002_row_level_security.sql` enables tenant and patient privacy policies.
3. `003_seed_data.sql` adds the demo hospitals, doctors, patients, and appointments.
4. `004_foundation_seed_completion.sql` adds demo schedules and clinic holidays.

With the Supabase CLI running locally:

```bash
supabase start
supabase db reset
```

The app defaults to mock services, including OTP `123456`, so no provider keys are required for local development. For real SMS OTPs, set `USE_MOCK_SERVICES=false`, configure MSG91, and restart the server. The OTP is then generated and delivered by MSG91; no OTP value is exposed by the app.

### Production deployment

Mock OTP, mock payment, and fallback QR secrets are development-only. Before deploying:

1. Set `NODE_ENV=production` and `USE_MOCK_SERVICES=false`.
2. Configure a cryptographically random `HMAC_SECRET_KEY`.
3. Configure Supabase URL, anon key, service role key, and real provider credentials (`MSG91_*`, Razorpay, Google Maps).
4. Apply migrations with `supabase db push` and load only non-production demo data.
5. Deploy the Next.js app to Vercel or a Node server with HTTPS enabled.
6. Confirm patient/staff authentication, RLS policies, payment webhooks, and audit logging in a staging environment before go-live.

### Login areas

- Patient: `/patient/login` with mobile OTP.
- Hospital: `/hospital/login`; select the hospital first, then sign in as doctor,
  receptionist, or hospital admin.
- Super-admin: `/admin/login` with platform-wide access.

Set `HOSPITAL_DEMO_PIN`, `SUPERADMIN_EMAIL`, and `SUPERADMIN_PIN` in production.
Do not use the development demo credentials in production.

Production startup rejects mock OTP and missing payment/HMAC credentials. Sensitive API routes require authenticated sessions and enforce patient or staff authorization.

## Release hardening

- **Performance**: queue endpoints use `Cache-Control: no-store`; live screens poll only while mounted, and production builds are verified with `npm run build`.
- **Accessibility**: semantic headings, labels, keyboard-accessible controls, visible focus states, high contrast colors, and minimum 44–48px touch targets are used throughout the implemented screens.
- **Security**: QR payloads use HMAC-SHA256, production secrets are mandatory, mock payment is disabled in production, and API authorization is enforced server-side.

---

## Verification & Testing Commands

```bash
# Run ESLint
npm run lint

# Run TypeScript type check
npm run typecheck

# Run Vitest unit & domain logic tests
npm run test:unit

# Run Playwright end-to-end flows
npm run test:e2e

# Build for production
npm run build
```
# OCAIS
# OCAIS
