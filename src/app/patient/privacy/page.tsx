'use client';

import React from 'react';
import { PatientHeader } from '@/components/patient/PatientHeader';
import { ShieldCheck, Lock, Eye, FileCheck, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <>
      <PatientHeader title="Privacy & Data Protection" showBack />

      <main className="flex-1 p-5 flex flex-col gap-5 text-slate-800">
        <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-200 rounded-2xl">
          <ShieldCheck className="w-8 h-8 text-teal-700 shrink-0" />
          <div>
            <h1 className="text-base font-bold text-teal-950">
              India DPDP Act (2023) Compliance
            </h1>
            <p className="text-xs text-teal-800 mt-0.5">
              Digital Personal Data Protection Act compliance summary
            </p>
          </div>
        </div>

        <section className="flex flex-col gap-4 text-xs leading-relaxed text-slate-600">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-700" />
              1. What Health Data We Collect
            </h2>
            <p>
              Under One Click AIS, we collect only necessary data to process your queue tokens, namely your full name, age, phone number, medical specialization consulted, and consultation token timestamps.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Eye className="w-4 h-4 text-teal-700" />
              2. Strict Hospital Data Isolation (RLS)
            </h2>
            <p>
              Your appointments and medical notes are protected by database Row Level Security. Only authorized staff at the specific hospital where you booked can access your queue token. No other hospital can view your visits.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-teal-700" />
              3. Right to Withdraw Consent & Erasure
            </h2>
            <p>
              As a Data Principal under Indian law, you have the right to request a copy of your visit records, rectify information, or request deletion of non-clinical appointment logs.
            </p>
          </div>
        </section>

        <div className="p-4 bg-slate-100 rounded-2xl text-xs text-slate-700 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Your consent is actively recorded and timestamped in system audit logs.</span>
        </div>
      </main>
    </>
  );
}

