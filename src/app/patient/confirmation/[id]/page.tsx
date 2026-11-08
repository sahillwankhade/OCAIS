'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { PatientHeader } from '@/components/patient/PatientHeader';
import { useI18n } from '@/lib/i18n/context';
import { Appointment, Doctor, Hospital } from '@/lib/types';
import { CheckCircle2, Clock, MapPin, ArrowRight, Download, Share2, ShieldCheck } from 'lucide-react';

export default function ConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;
  const { t } = useI18n();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAppointment() {
      try {
        setLoading(true);
        const res = await fetch(`/api/appointments/${appointmentId}`);
        const data = await res.json();

        setAppointment(data.appointment);
        setDoctor(data.doctor);
        setHospital(data.hospital);

        if (data.appointment?.qrPayload) {
          const url = await QRCode.toDataURL(data.appointment.qrPayload, {
            width: 280,
            margin: 2,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          setQrDataUrl(url);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAppointment();
  }, [appointmentId]);

  if (loading || !appointment) {
    return (
      <>
        <PatientHeader showBack />
        <div className="flex-1 p-8 text-center text-slate-400 text-sm">
          <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          {t.common.loading}
        </div>
      </>
    );
  }

  return (
    <>
      <PatientHeader title={t.booking.bookingSuccess} showBack />

      <main className="flex-1 p-4 flex flex-col items-center gap-5">
        {/* Success Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">{t.booking.bookingSuccess}</h1>
          <p className="text-xs text-slate-500 mt-0.5">Appointment confirmed with doctor</p>
        </div>

        {/* Digital Token & HMAC QR Code Pass */}
        <div className="w-full bg-white border-2 border-teal-700/80 rounded-3xl p-5 shadow-lg flex flex-col items-center text-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Queue Token
              </span>
              <span className="text-3xl font-black text-teal-800 leading-none">
                #{appointment.tokenNumber}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Slot Time
              </span>
              <span className="text-sm font-bold text-slate-800">
                {appointment.slotStartTime} Today
              </span>
            </div>
          </div>

          {/* QR Code */}
          <div className="my-4 p-2 bg-slate-50 rounded-2xl border border-slate-200">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="Appointment HMAC QR Code"
                className="w-48 h-48 rounded-xl object-contain"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 px-4 leading-relaxed">
            {t.booking.qrInstruction}
          </p>

          <div className="w-full mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div className="text-left">
              <span className="font-bold text-slate-900 block">{doctor?.fullName}</span>
              <span className="text-slate-500">{doctor?.cabinNumber}</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-900 block">{hospital?.name}</span>
              <span className="text-slate-500">{hospital?.city}</span>
            </div>
          </div>
        </div>

        {/* LIVE QUEUE TRACKER BUTTON */}
        <Link
          href={`/patient/queue/${appointment.id}`}
          className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3.5 px-4 rounded-2xl transition shadow-md flex items-center justify-center gap-2 text-sm"
        >
          <span>Open Live Queue Tracker</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        {/* Safety & DPDP notice */}
        <div className="w-full p-3 bg-slate-100 rounded-xl flex items-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
          <span>Signed with tamper-proof HMAC-SHA256 for hospital cabin entry.</span>
        </div>
      </main>
    </>
  );
}

