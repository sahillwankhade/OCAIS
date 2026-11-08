'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PatientHeader } from '@/components/patient/PatientHeader';
import { useI18n } from '@/lib/i18n/context';
import { Appointment, Doctor, Hospital, QueueEstimate } from '@/lib/types';
import {
  Clock,
  Users,
  AlertTriangle,
  RotateCcw,
  Navigation,
  CheckCircle2,
  Stethoscope,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export default function LiveQueueTrackerPage() {
  const params = useParams();
  const appointmentId = params.id as string;
  const { t } = useI18n();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [queue, setQueue] = useState<QueueEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchQueueData = React.useCallback(async (showRefreshSpinner = false) => {
    try {
      if (showRefreshSpinner) setRefreshing(true);

      // Handle demo shortcut `/patient/queue/demo`
      let targetId = appointmentId;
      if (targetId === 'demo') {
        const listRes = await fetch('/api/appointments?patientId=pat-1');
        const listData = await listRes.json();
        const active = (listData.appointments || []).find(
          (a: Appointment) => a.state === 'BOOKED' || a.state === 'CHECKED_IN' || a.state === 'IN_CONSULT'
        );
        targetId = active ? active.id : 'apt-checkedin-14';
      }

      const res = await fetch(`/api/appointments/${targetId}`);
      const data = await res.json();

      setAppointment(data.appointment);
      setDoctor(data.doctor);
      setHospital(data.hospital);
      setQueue(data.queueStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    fetchQueueData();
    // Poll every 5 seconds for live queue updates
    const interval = setInterval(() => {
      fetchQueueData(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchQueueData]);

  const handleCancel = async () => {
    if (!appointment) return;
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    setCancelling(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextState: 'CANCELLED', role: 'patient' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setActionMessage('Appointment cancelled successfully.');
      fetchQueueData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

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

  const isInCabin = appointment.state === 'IN_CONSULT';
  const isCompleted = appointment.state === 'COMPLETED';
  const isCancelled = appointment.state === 'CANCELLED';

  return (
    <>
      <PatientHeader title={t.queue.liveTracker} showBack />

      <main className="flex-1 p-4 flex flex-col gap-4">
        {/* Doctor & Delay Alert Banner */}
        {doctor?.delayMinutes && doctor.delayMinutes > 0 ? (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">
                {t.queue.doctorDelayed} {doctor.delayMinutes} min
              </span>
              <p className="mt-0.5 text-amber-800/90">
                Doctor has announced a delay due to an emergency case. Wait estimates have been updated.
              </p>
            </div>
          </div>
        ) : null}

        {doctor?.isPaused ? (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-900 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">{t.queue.doctorPaused}</span>
              <p className="mt-0.5 text-rose-800/90">
                Consultations will resume shortly. Please remain nearby.
              </p>
            </div>
          </div>
        ) : null}

        {actionMessage ? (
          <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 font-medium">
            {actionMessage}
          </div>
        ) : null}

        {/* MAIN LIVE TOKEN BOARD */}
        <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-teal-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase bg-teal-600/70 text-teal-100 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              Live Consultation Queue
            </span>

            <button
              onClick={() => fetchQueueData(true)}
              disabled={refreshing}
              className="p-1.5 rounded-xl bg-teal-800/70 hover:bg-teal-700 text-teal-200 transition"
              aria-label="Refresh"
            >
              <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 divide-x divide-teal-700/60">
            {/* Now Serving */}
            <div className="text-center pr-2">
              <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider block">
                {t.queue.nowServing}
              </span>
              <div className="text-4xl sm:text-5xl font-black text-emerald-400 mt-1">
                {queue?.currentServingToken ? `#${queue.currentServingToken}` : '--'}
              </div>
              <span className="text-[11px] text-teal-200 block mt-1 font-medium">
                {doctor?.cabinNumber || 'Cabin 101'}
              </span>
            </div>

            {/* Your Token */}
            <div className="text-center pl-2">
              <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider block">
                {t.queue.yourToken}
              </span>
              <div className="text-4xl sm:text-5xl font-black text-white mt-1">
                #{appointment.tokenNumber}
              </div>
              <span className="text-[11px] text-teal-200 block mt-1 font-medium">
                Status: {appointment.state}
              </span>
            </div>
          </div>

          {/* Cabin Alert Banner if inside or up next */}
          {isInCabin ? (
            <div className="mt-6 p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl text-center text-xs text-emerald-200 font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{t.queue.inCabinNow}</span>
            </div>
          ) : queue && queue.patientsAhead === 0 ? (
            <div className="mt-6 p-3 bg-amber-500/20 border border-amber-400/40 rounded-2xl text-center text-xs text-amber-200 font-bold flex items-center justify-center gap-2 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>You are Next! Please stand by the cabin door.</span>
            </div>
          ) : null}
        </div>

        {/* ETA & LEAVE HOME BY METRICS */}
        {!isInCabin && !isCompleted && !isCancelled && queue && (
          <div className="grid grid-cols-2 gap-3">
            {/* Patients Ahead */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <Users className="w-4 h-4 text-teal-600" />
                <span>{t.queue.patientsAhead}</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {queue.patientsAhead}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5">waiting in line</span>
            </div>

            {/* Estimated Wait */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>{t.queue.estimatedWait}</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                ~{queue.estimatedWaitMinutes} <span className="text-sm font-bold text-slate-500">min</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Call: {queue.estimatedCallTime}
              </span>
            </div>

            {/* Dynamic Leave Home By Calculator */}
            <div className="col-span-2 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-emerald-800 block">
                    {t.queue.leaveHomeBy}
                  </span>
                  <div className="text-xl font-black text-emerald-950 mt-0.5">
                    {queue.leaveHomeByTime}
                  </div>
                </div>
              </div>
              <div className="text-right text-[11px] text-emerald-800">
                <span>Includes 20m drive</span>
                <span className="block text-emerald-600">+ 10m buffer</span>
              </div>
            </div>
          </div>
        )}

        {/* Doctor & Clinic Info Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-2.5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{doctor?.fullName}</h3>
                <span className="text-xs text-slate-500">
                  {doctor?.specialization} • {doctor?.cabinNumber}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>{hospital?.name}</span>
            <span className="font-medium text-slate-800">{hospital?.city}</span>
          </div>
        </div>

        {/* Action Controls: Cancel or Reschedule */}
        {!isCompleted && !isCancelled && (
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 py-3 px-4 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition min-h-[44px]"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Appointment'}
            </button>

            <Link
              href={`/patient/book/${doctor?.id}`}
              className="flex-1 py-3 px-4 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition text-center min-h-[44px] flex items-center justify-center"
            >
              Reschedule
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
