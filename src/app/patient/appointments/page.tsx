'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PatientHeader } from '@/components/patient/PatientHeader';
import { useI18n } from '@/lib/i18n/context';
import { Appointment, Doctor, Hospital } from '@/lib/types';
import { getStatusBadgeInfo } from '@/lib/state-machine/appointment-state';
import { Calendar, Clock, MapPin, QrCode, ArrowRight, AlertCircle } from 'lucide-react';

export default function MyAppointmentsPage() {
  const { t } = useI18n();
  const [appointments, setAppointments] = useState<
    (Appointment & { doctor?: Doctor; hospital?: Hospital })[]
  >([]);
  const [tab, setTab] = useState<'UPCOMING' | 'PAST' | 'CANCELLED'>('UPCOMING');
  const [loading, setLoading] = useState(true);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleSlots, setRescheduleSlots] = useState<import('@/lib/slots/slot-generator').TimeSlot[]>([]);
  const [rescheduleDate, setRescheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [rescheduleMessage, setRescheduleMessage] = useState('');

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/appointments?patientId=pat-1');
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextState: 'CANCELLED', role: 'patient' }),
      });
      if (res.ok) {
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openReschedule = async (apt: Appointment & { doctor?: Doctor }) => {
    setReschedulingId(apt.id);
    setRescheduleDate(apt.slotDate);
    const res = await fetch(`/api/doctors/${apt.doctorId}/slots?date=${apt.slotDate}`);
    const data = await res.json();
    setRescheduleSlots((data.slots || []).filter((slot: import('@/lib/slots/slot-generator').TimeSlot) => slot.isAvailable));
  };

  const handleReschedule = async (apt: Appointment & { doctor?: Doctor }, slot: import('@/lib/slots/slot-generator').TimeSlot) => {
    const res = await fetch(`/api/appointments/${apt.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'RESCHEDULE',
        slotDate: rescheduleDate,
        slotStartTime: slot.startTime,
        slotEndTime: slot.endTime,
      }),
    });
    const data = await res.json();
    setRescheduleMessage(res.ok ? 'Appointment rescheduled successfully.' : data.error || 'Unable to reschedule.');
    setReschedulingId(null);
    if (res.ok) fetchAppointments();
  };

  const filtered = appointments.filter((apt) => {
    if (tab === 'UPCOMING') {
      return apt.state === 'BOOKED' || apt.state === 'CHECKED_IN' || apt.state === 'IN_CONSULT';
    }
    if (tab === 'PAST') {
      return apt.state === 'COMPLETED' || apt.state === 'NO_SHOW' || apt.state === 'SKIPPED';
    }
    return apt.state === 'CANCELLED';
  });

  return (
    <>
      <PatientHeader title="My Appointments" showBack />

      <main className="flex-1 p-4 flex flex-col gap-4">
        {/* Tab Pills */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl">
          {[
            { key: 'UPCOMING', label: 'Upcoming' },
            { key: 'PAST', label: 'Past Visits' },
            { key: 'CANCELLED', label: 'Cancelled' },
          ].map((tItem) => {
            const isSelected = tab === tItem.key;
            return (
              <button
                key={tItem.key}
                onClick={() => setTab(tItem.key as typeof tab)}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition ${
                  isSelected
                    ? 'bg-white text-teal-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tItem.label}
              </button>
            );
          })}
        </div>

        {/* Appointments List */}
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              {t.common.loading}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="font-bold text-slate-700 text-sm">No {tab.toLowerCase()} appointments</div>
              {tab === 'UPCOMING' && (
                <Link
                  href="/patient/search"
                  className="mt-3 inline-block bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Book New Appointment
                </Link>
              )}
            </div>
          ) : (
            filtered.map((apt) => {
              const badge = getStatusBadgeInfo(apt.state);
              return (
                <div
                  key={apt.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-slate-900">
                          Token #{apt.tokenNumber}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">
                        {apt.doctor?.fullName || 'Doctor'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {apt.doctor?.specialization} • {apt.doctor?.cabinNumber}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-700 block">
                        {apt.slotDate}
                      </span>
                      <span className="text-xs text-teal-700 font-semibold block">
                        {apt.slotStartTime}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {tab === 'UPCOMING' ? (
                      <>
                        <button
                          onClick={() => handleCancel(apt.id)}
                          className="py-1.5 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => openReschedule(apt)}
                          className="py-1.5 px-3 text-xs font-semibold text-teal-700 hover:bg-teal-50 rounded-lg transition"
                        >
                          Reschedule
                        </button>

                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/patient/confirmation/${apt.id}`}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            title="View QR"
                          >
                            <QrCode className="w-4 h-4" />
                          </Link>

                          <Link
                            href={`/patient/queue/${apt.id}`}
                            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                          >
                            Track Queue
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div className="w-full flex items-center justify-between text-xs text-slate-500">
                        <span>{apt.hospital?.name}</span>
                        <Link
                          href={`/patient/book/${apt.doctorId}`}
                          className="text-teal-700 font-bold hover:underline"
                        >
                          Book Again
                        </Link>
                      </div>
                    )}
                  </div>
                  {reschedulingId === apt.id ? (
                    <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
                      <label className="text-xs font-bold text-slate-700">Choose a new slot</label>
                      <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="mt-2 w-full p-2 border rounded-lg text-xs" />
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {rescheduleSlots.map((slot) => (
                          <button key={slot.slotId} type="button" onClick={() => handleReschedule(apt, slot)} className="p-2 bg-white border border-teal-200 rounded-lg text-xs font-bold text-teal-800">
                            {slot.startTime}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </main>
    </>
  );
}
