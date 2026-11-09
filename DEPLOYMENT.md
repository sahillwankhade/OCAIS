# OCAIS Deployment Guide - Option A

Option A hosts the patient and hospital surfaces online from one repository and
uses one shared Supabase backend. The two Vercel projects use the same codebase
but different domains, environment variables, and entry routes.

## GitHub setup

Protect `main`, use `staging` for testing, and use feature branches such as
`feature/deployment-prep`. Add repository secrets at **Settings -> Secrets and
variables -> Actions -> New repository secret**:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HMAC_SECRET_KEY`
- `MSG91_AUTH_KEY`
- `MSG91_SENDER_ID`
- `MSG91_OTP_TEMPLATE_ID`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `GOOGLE_MAPS_API_KEY`
- `WHATSAPP_API_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `HOSPITAL_DEMO_PIN`
- `SUPERADMIN_EMAIL`
- `SUPERADMIN_PIN`

Never put these values in Git, client-side code, or `.env.example`.

## Supabase

For development:

```powershell
supabase start
supabase db reset
```

For production, create one Supabase project, link it, apply migrations with
`supabase db push`, enable Auth and Realtime, confirm RLS, and load only
non-production seed data.

The Next.js API uses `NEXT_PUBLIC_SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` on the server when `USE_MOCK_SERVICES=false`.
The service-role key bypasses RLS, so it must never be used in browser code.
Patient API routes verify the signed application session and enforce patient or
hospital ownership before accessing rows. The current patient/staff login uses
the app's signed-cookie session, not Supabase Auth; RLS policies are therefore
not the authorization boundary for these service-role API calls. Do not expose
the service-role key to client code. Use only the publishable key in browser
clients, and do not query these tables directly from the browser.

Patient/appointment persistence is wired to Supabase, but paid production booking
is blocked until Razorpay checkout and server-side signature verification are
implemented and tested. Do not mark an appointment paid without a verified
provider signature.

## Vercel projects

Create two Vercel projects from the same GitHub repository:

### Patient project

- Name: `ocais-patient`
- Production branch: `main`
- Root directory: repository root
- Build command: `npm run build:patient`
- Domain: `app.example.com`
- Health URL: `/health`
- Entry route: `/patient`

### Hospital project

- Name: `ocais-hospital`
- Production branch: `main`
- Root directory: repository root
- Build command: `npm run build:hospital`
- Domain: `hospital.example.com`
- Health URL: `/hospital/health`
- Entry route: `/hospital/login`

Both projects use the same Supabase variables. Preview deployments should use
`staging` and a separate Supabase development project. Add edge rewrites or
middleware so each domain opens its intended entry route.

## Domains and DNS

Add each domain in Vercel, create the DNS records Vercel provides, wait for TLS,
set `NEXT_PUBLIC_APP_URL` per project, and verify HTTPS login, booking, QR,
queue polling, and both health pages.

## PWA and Trusted Web Activity

Patient manifest: `/patient-manifest.json`. Hospital manifest:
`/hospital-manifest.json`. Service worker: `/sw.js`.

For Android packaging, replace the fingerprint and package name in
`public/.well-known/assetlinks.json`, host it over HTTPS on the patient domain,
then build a signed Trusted Web Activity with Bubblewrap or Android Studio before
Play Store submission.

## Release verification

```powershell
npm ci
npm run lint
npm run typecheck
npm run test:unit
npm run build:patient
npm run check:client-secrets
npm run build:hospital
npm run check:client-secrets
npm run test:e2e
```

Run builds and Playwright sequentially because both use `.next`.

For a local production smoke test, install `cross-env` or set the variables in
your shell, then run `npm run start` in one terminal and
`npm run test:e2e:production` in another. This uses explicit test-mode mock
providers while still exercising the production session and route guards.
