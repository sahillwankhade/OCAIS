'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { PatientHeader } from '@/components/patient/PatientHeader';
import { Phone, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PatientLoginPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [step, setStep] = useState<'PHONE' | 'OTP' | 'PROFILE'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('30');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [dpdpConsent, setDpdpConsent] = useState(true);
  const [mockMode, setMockMode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/patient/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SEND_OTP', phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMockMode(data.mockMode === true);
      setStep('OTP');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/patient/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'VERIFY_OTP', phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.isNewUser) {
        setStep('PROFILE');
      } else {
        localStorage.setItem('ocais_patient_id', data.patient.id);
        router.push('/patient');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) {
      setError('Full name is required');
      return;
    }
    if (!dpdpConsent) {
      setError('Please consent to the privacy notice under India DPDP Act');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/patient/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_OTP',
          phone,
          otp,
          fullName,
          age,
          gender,
          bloodGroup,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem('ocais_patient_id', data.patient.id);
      router.push('/patient');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PatientHeader />

      <main className="flex-1 p-5 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto mb-3">
            <Phone className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t.auth.welcome}</h1>
          <p className="text-sm text-slate-500 mt-1">Instant touchless healthcare queues in India</p>
        </div>

        {error ? (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {/* Step 1: Phone Input */}
        {step === 'PHONE' && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.auth.enterPhone}
              </label>
              <div className="flex items-center border-2 border-slate-200 focus-within:border-teal-600 rounded-xl px-3 bg-white">
                <span className="text-sm font-bold text-slate-500 pr-2 border-r border-slate-200">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9820011111"
                  className="w-full py-3 px-2 text-base font-semibold text-slate-900 outline-none"
                  autoFocus
                />
              </div>
            </div>

            {mockMode ? (
              <div className="p-3 rounded-xl bg-slate-100 text-xs text-slate-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>{t.auth.mockOtpHint}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold py-3.5 px-4 rounded-xl transition shadow-md flex items-center justify-center"
            >
              {loading ? t.common.loading : t.auth.sendOtp}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.auth.enterOtp}
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full py-3.5 px-3 text-center text-2xl font-mono tracking-widest border-2 border-teal-600 rounded-xl outline-none text-slate-900 font-bold bg-white"
                autoFocus
              />
              <p className="text-xs text-slate-500 text-center mt-2">
                {t.auth.otpSentMessage} +91 {phone}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold py-3.5 px-4 rounded-xl transition shadow-md flex items-center justify-center"
            >
              {loading ? t.common.loading : t.auth.verifyOtp}
            </button>

            <button
              type="button"
              onClick={() => setStep('PHONE')}
              className="text-xs font-semibold text-slate-500 text-center hover:text-slate-800"
            >
              Change Phone Number
            </button>
          </form>
        )}

        {/* Step 3: First-time Profile & PRN Setup */}
        {step === 'PROFILE' && (
          <form onSubmit={handleCompleteProfile} className="flex flex-col gap-3.5">
            <h2 className="text-lg font-bold text-slate-900">{t.auth.profileSetupTitle}</h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.auth.fullName}</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aarav Patil"
                className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:border-teal-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.common.age}</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.common.gender}</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
                  className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:border-teal-600 bg-white"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.auth.bloodGroup}</label>
              <input
                type="text"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                placeholder="e.g. B+"
                className="w-full py-2.5 px-3 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:border-teal-600"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                id="consent"
                checked={dpdpConsent}
                onChange={(e) => setDpdpConsent(e.target.checked)}
                className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
              />
              <label htmlFor="consent" className="cursor-pointer">
                {t.auth.privacyConsent}
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold py-3.5 px-4 rounded-xl transition shadow-md flex items-center justify-center mt-2"
            >
              {loading ? t.common.loading : t.auth.completeRegistration}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
