'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Tv,
  Clock,
  Users,
  AlertTriangle,
  Stethoscope,
  Volume2,
  RefreshCw,
  DoorOpen,
} from 'lucide-react';
import { Doctor, Appointment, QueueEstimate } from '@/lib/types';

export default function WaitingRoomDisplayBoardPage() {
  const params = useParams();
  const doctorId = params.doctorId as string;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [inConsult, setInConsult] = useState<Appointment | null>(null);
  const [queue, setQueue] = useState<QueueEstimate | null>(null);
  const [waitingList, setWaitingList] = useState<
    { tokenNumber: number; state: string; slotStartTime: string }[]
  >([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Clock ticker
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll live queue every 4 seconds
  const fetchDisplayData = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/queue/${doctorId}`);
      const data = await res.json();

      setDoctor(data.doctor);
      setQueue(data.queue);
      setInConsult(data.inConsultAppointment);
      setWaitingList(data.waitingList || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchDisplayData();
    const interval = setInterval(fetchDisplayData, 4000);
    return () => clearInterval(interval);
  }, [fetchDisplayData]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden">
      {/* Top Banner: Hospital & Cabin Info */}
      <header className="w-full flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500 text-slate-950 font-black flex items-center justify-center text-3xl">
            +
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Sahyadri Care Hospital
            </h1>
            <p className="text-sm font-bold text-teal-400 uppercase tracking-widest mt-0.5">
              OPD Waiting Lounge • Digital Queue Signage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase block tracking-wider">
              Live Time
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-white">
              {currentTime || '10:30:00'}
            </span>
          </div>

          <Link
            href={`/scan/${doctorId}`}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-2xl border border-slate-700 transition"
            title="Scan Station Kiosk"
          >
            <DoorOpen className="w-6 h-6" />
          </Link>
        </div>
      </header>

      {/* Doctor Delay / Pause Announcement Bar */}
      {doctor?.delayMinutes && doctor.delayMinutes > 0 ? (
        <div className="my-4 p-4 bg-amber-500/20 border-2 border-amber-500 rounded-2xl flex items-center justify-between text-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-amber-400 shrink-0 animate-bounce" />
            <div>
              <span className="text-base font-extrabold block">
                ANNOUNCEMENT: DOCTOR IS DELAYED BY {doctor.delayMinutes} MINUTES
              </span>
              <span className="text-xs text-amber-300">
                Next consultations will resume shortly. We apologize for the wait.
              </span>
            </div>
          </div>
          <Volume2 className="w-6 h-6 text-amber-400" />
        </div>
      ) : doctor?.isPaused ? (
        <div className="my-4 p-4 bg-rose-500/20 border-2 border-rose-500 rounded-2xl flex items-center gap-3 text-rose-200">
          <AlertTriangle className="w-7 h-7 text-rose-400 shrink-0" />
          <span className="text-base font-extrabold">
            DOCTOR HAS PAUSED CONSULTATIONS TEMPORARILY
          </span>
        </div>
      ) : null}

      {/* Main Display Area */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 my-6 items-stretch">
        {/* HUGE NOW SERVING HERO CARD (Left 7 Cols) */}
        <div className="lg:col-span-7 bg-gradient-to-br from-teal-950 via-teal-900 to-slate-900 border-4 border-teal-500/80 rounded-3xl p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 font-extrabold text-sm px-4 py-1.5 rounded-full uppercase tracking-wider">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping inline-block" />
              NOW IN CABIN
            </div>
            <span className="text-xl font-bold text-teal-200">{doctor?.cabinNumber || 'Cabin 101'}</span>
          </div>

          <div className="text-center py-6">
            <span className="text-sm uppercase tracking-widest text-teal-300 font-extrabold block">
              TOKEN NUMBER
            </span>
            <div className="text-7xl sm:text-9xl font-black text-emerald-400 tracking-tight my-2">
              {inConsult?.tokenNumber ? `#${inConsult.tokenNumber}` : '--'}
            </div>
            <span className="text-xl text-white font-bold block">
              Please enter {doctor?.cabinNumber || 'Cabin 101'}
            </span>
          </div>

          <div className="pt-6 border-t border-teal-700/60 flex items-center justify-between text-teal-200">
            <div>
              <span className="text-xs uppercase tracking-wider text-teal-400 font-bold block">
                Doctor
              </span>
              <span className="text-xl font-black text-white">
                {doctor?.fullName || 'Dr. Rajesh Sharma'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase tracking-wider text-teal-400 font-bold block">
                Specialization
              </span>
              <span className="text-base font-bold text-white">
                {doctor?.specialization || 'General Medicine'}
              </span>
            </div>
          </div>
        </div>

        {/* UP NEXT QUEUE (Right 5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border-2 border-slate-800 rounded-3xl p-8 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <span className="text-sm uppercase tracking-widest font-black text-slate-400">
              UP NEXT IN QUEUE
            </span>
            <span className="text-xs font-bold text-teal-400">
              {waitingList.length} Waiting
            </span>
          </div>

          <div className="flex flex-col gap-4 my-auto">
            {waitingList.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-bold text-base">
                No patients waiting in queue
              </div>
            ) : (
              waitingList.slice(0, 4).map((item, index) => (
                <div
                  key={item.tokenNumber}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition ${
                    index === 0
                      ? 'bg-teal-500/10 border-teal-500 text-white font-extrabold'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-6">#{index + 1}</span>
                    <span className="text-3xl font-black text-emerald-300">
                      #{item.tokenNumber}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Slot
                    </span>
                    <span className="text-sm font-mono font-bold text-white">
                      {item.slotStartTime}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
            <span>Scan your QR at the cabin door when called</span>
            <span className="font-mono text-teal-400 font-bold">Auto-Sync 4s</span>
          </div>
        </div>
      </main>

      {/* Footer Ticker */}
      <footer className="w-full pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div>
          <span>One Click AIS Live Display • Audio announcement enabled on token advance</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-teal-400 hover:underline">
            Hospital Dashboard
          </Link>
          <Link href="/patient" className="text-teal-400 hover:underline">
            Patient Mobile App
          </Link>
        </div>
      </footer>
    </div>
  );
}
