import Link from 'next/link';
import { Calendar, Stethoscope, Tv, QrCode, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-between p-4 sm:p-8">
      <header className="w-full max-w-4xl flex items-center justify-between py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center text-white font-bold text-xl">
            +
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">One Click AIS</h1>
            <p className="text-xs text-slate-500 font-medium">Healthcare Appointments & Live Queue</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-teal-100 text-teal-800 rounded-full">
          India Edition
        </span>
      </header>

      <div className="w-full max-w-4xl py-12 flex flex-col items-center text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight max-w-2xl">
          Smart Appointments, Touchless QR Check-ins & Live Queue Tracking
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-xl">
          Empowering patients with 3-tap booking, dynamic wait estimates, and &quot;Leave Home By&quot; alerts, while giving hospitals a high-speed doctor console and digital display board.
        </p>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <Link
            href="/patient"
            className="flex flex-col items-center p-6 bg-white rounded-2xl border-2 border-teal-600 shadow-sm hover:shadow-md transition text-slate-900 hover:border-teal-700"
          >
            <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 mb-3">
              <Calendar className="w-7 h-7" />
            </div>
            <span className="font-bold text-lg">Patient PWA</span>
            <span className="text-xs text-slate-500 mt-1">Book, Live Queue & QR</span>
          </Link>

          <Link
            href="/hospital/login"
            className="flex flex-col items-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition text-slate-900 hover:border-teal-600"
          >
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
              <Stethoscope className="w-7 h-7" />
            </div>
            <span className="font-bold text-lg">Hospital Portal</span>
            <span className="text-xs text-slate-500 mt-1">Hospital ID → Doctor, Reception & Admin</span>
          </Link>

          <Link
            href="/scan/doc-sharma"
            className="flex flex-col items-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition text-slate-900 hover:border-teal-600"
          >
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 mb-3">
              <QrCode className="w-7 h-7" />
            </div>
            <span className="font-bold text-lg">Scan Station</span>
            <span className="text-xs text-slate-500 mt-1">Cabin Door Kiosk</span>
          </Link>

          <Link
            href="/display/doc-sharma"
            className="flex flex-col items-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition text-slate-900 hover:border-teal-600"
          >
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-700 mb-3">
              <Tv className="w-7 h-7" />
            </div>
            <span className="font-bold text-lg">Display Board</span>
            <span className="text-xs text-slate-500 mt-1">Waiting Room Signage</span>
          </Link>
        </div>
        <Link href="/admin/login" className="mt-5 text-sm font-bold text-slate-700 hover:text-teal-700">
          Super-admin login →
        </Link>
      </div>

      <footer className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between py-6 border-t border-slate-200 text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Compliant with India Digital Personal Data Protection (DPDP) Act</span>
        </div>
        <div>
          <span>Multi-lingual: English | हिन्दी | मराठी</span>
        </div>
      </footer>
    </main>
  );
}
