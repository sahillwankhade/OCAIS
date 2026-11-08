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
- **Adapters**: Adapter pattern with full deterministic Mock Mode (OTP `123456`, mock Razorpay payment, mock Indian travel matrix)

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

The app defaults to mock services, including OTP `123456`, so no provider keys are required for local development.

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
