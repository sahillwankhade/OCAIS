'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Camera,
  DoorOpen,
} from 'lucide-react';
import { Doctor } from '@/lib/types';

export default function CabinScanStationPage() {
  const params = useParams();
  const doctorId = params.doctorId as string;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [manualQrInput, setManualQrInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    tokenNumber?: number;
    patientName?: string;
  } | null>(null);

  const fetchDoctorInfo = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hospitals');
      const data = await res.json();
      const doc = (data.doctors || []).find((d: Doctor) => d.id === doctorId);
      setDoctor(doc || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchDoctorInfo();
  }, [fetchDoctorInfo]);

  const handleScanSubmit = async (payloadToSubmit?: string) => {
    const raw = payloadToSubmit || manualQrInput;
    if (!raw.trim()) return;

    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrPayload: raw.trim(),
          doctorId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setScanResult({
          success: false,
          message: data.error || 'Scan validation failed',
        });
      } else {
        setScanResult({
          success: true,
          message: data.message,
          tokenNumber: data.appointment?.tokenNumber,
        });
        setManualQrInput('');
      }
    } catch (err: unknown) {
      setScanResult({
        success: false,
        message: err instanceof Error ? err.message : 'Network error during scan verification',
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Demo shortcut: scan next checked-in appointment for this doctor
  const handleSimulatePatientScan = async () => {
    try {
      setIsScanning(true);
      const res = await fetch(`/api/appointments?doctorId=${doctorId}`);
      const data = await res.json();
      const nextApt = (data.appointments || []).find(
        (a: { state: string }) => a.state === 'CHECKED_IN' || a.state === 'BOOKED'
      );

      if (!nextApt || !nextApt.qrPayload) {
        setScanResult({
          success: false,
          message: 'No waiting patient with QR payload found for this cabin.',
        });
        setIsScanning(false);
        return;
      }

      await handleScanSubmit(nextApt.qrPayload);
    } catch {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 sm:p-8">
      {/* Kiosk Header */}
      <header className="max-w-xl mx-auto w-full flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center text-xl">
            +
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Cabin Touchless Check-In</h1>
            <p className="text-xs text-teal-400 font-medium">One Click AIS • Kiosk Station</p>
          </div>
        </div>

        <Link
          href={`/display/${doctorId}`}
          className="text-xs font-bold text-teal-400 hover:text-teal-300 border border-teal-500/40 px-3 py-1.5 rounded-xl transition"
        >
          View Display Board →
        </Link>
      </header>

      {/* Main Kiosk Content */}
      <main className="max-w-xl mx-auto w-full py-8 flex flex-col items-center text-center gap-6">
        {/* Doctor Cabin Card */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 w-full shadow-2xl flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center mb-3">
            <DoorOpen className="w-8 h-8" />
          </div>
          <span className="text-xs uppercase font-extrabold text-teal-400 tracking-widest block">
            {doctor?.cabinNumber || 'Cabin 101'}
          </span>
          <h2 className="text-2xl font-black text-white mt-1">
            {doctor?.fullName || 'Dr. Rajesh Sharma'}
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {doctor?.specialization || 'General Medicine'}
          </p>
        </div>

        {/* Scan Status Banner */}
        {scanResult && (
          <div
            className={`w-full p-5 rounded-2xl border text-left flex items-start gap-3 transition ${
              scanResult.success
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                : 'bg-rose-500/20 border-rose-500 text-rose-200'
            }`}
          >
            {scanResult.success ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span className="font-bold text-base block">
                {scanResult.success ? 'Verified Successfully!' : 'Scan Rejected'}
              </span>
              <p className="text-xs mt-0.5 opacity-90">{scanResult.message}</p>
              {scanResult.tokenNumber && (
                <div className="mt-2 text-2xl font-black text-emerald-300">
                  Token #{scanResult.tokenNumber} — Please Enter Cabin Now
                </div>
              )}
            </div>
          </div>
        )}

        {/* Touchless Camera / QR Code Scanner Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 w-full flex flex-col items-center gap-4">
          <div className="relative w-48 h-48 rounded-2xl border-2 border-dashed border-teal-400/60 bg-slate-900/80 flex flex-col items-center justify-center p-4">
            <Camera className="w-12 h-12 text-teal-400 mb-2 animate-pulse" />
            <span className="text-xs text-slate-400 font-medium">Hold QR to Camera</span>
            <span className="text-[10px] text-teal-500/80 mt-1">Auto-Detecting...</span>
          </div>

          <div className="w-full flex flex-col gap-2">
            <button
              onClick={handleSimulatePatientScan}
              disabled={isScanning}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-slate-950 font-black text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 min-h-[48px]"
            >
              <QrCode className="w-5 h-5" />
              <span>
                {isScanning ? 'Verifying HMAC Signature...' : 'Simulate Patient Cabin Scan'}
              </span>
            </button>
          </div>

          {/* Manual Token / QR JSON Input */}
          <div className="w-full pt-3 border-t border-slate-700">
            <details className="text-left text-xs text-slate-400 cursor-pointer">
              <summary className="font-semibold text-slate-300 hover:text-white">
                Manual Token / QR Payload Input
              </summary>
              <div className="mt-2 flex flex-col gap-2">
                <textarea
                  value={manualQrInput}
                  onChange={(e) => setManualQrInput(e.target.value)}
                  placeholder="Paste QR JSON payload here..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleScanSubmit()}
                  disabled={isScanning || !manualQrInput.trim()}
                  className="py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-xs transition"
                >
                  Verify Manual Input
                </button>
              </div>
            </details>
          </div>
        </div>
      </main>

      {/* Kiosk Footer */}
      <footer className="max-w-xl mx-auto w-full pt-4 border-t border-slate-800 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-teal-500" />
        <span>Cryptographically signed with HMAC-SHA256 • Wrong cabin scans auto-rejected</span>
      </footer>
    </div>
  );
}
