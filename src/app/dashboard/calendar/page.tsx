'use client';

import React, { useState, useEffect } from 'react';
import { useDashboardRole } from '@/components/dashboard/DashboardHeader';
import { Calendar as CalendarIcon, Clock, Lock, Unlock, CheckCircle2, Stethoscope } from 'lucide-react';
import { Doctor } from '@/lib/types';
import { TimeSlot } from '@/lib/slots/slot-generator';

export default function CalendarManagementPage() {
  const { hospitalId } = useDashboardRole();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('doc-sharma');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [emergencyLockedIds, setEmergencyLockedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState('15');
  const [saveMessage, setSaveMessage] = useState('');

  const fetchSlots = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/doctors/${selectedDoctorId}/slots?date=${selectedDate}`);
      const data = await res.json();
      setSlots(data.slots || []);
      const scheduleRes = await fetch(`/api/doctors/${selectedDoctorId}/schedule`);
      const scheduleData = await scheduleRes.json();
      const firstShift = scheduleData.schedule?.shifts?.[0];
      if (firstShift) {
        setShiftStart(firstShift.shiftStart);
        setShiftEnd(firstShift.shiftEnd);
        setSlotDuration(String(firstShift.slotDurationMinutes));
      }
      setEmergencyLockedIds(scheduleData.schedule?.emergencyLockedSlotIds || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId, selectedDate]);

  useEffect(() => {
    async function loadDoctors() {
      const res = await fetch(`/api/hospitals?hospitalId=${hospitalId}`);
      const data = await res.json();
      setDoctors(data.doctors || []);
      if (data.doctors && data.doctors.length > 0) {
        setSelectedDoctorId(data.doctors[0].id);
      }
    }
    loadDoctors();
  }, [hospitalId]);

  useEffect(() => {
    if (selectedDoctorId) {
      fetchSlots();
    }
  }, [selectedDoctorId, fetchSlots]);

  const toggleEmergencyLock = (slotId: string) => {
    if (emergencyLockedIds.includes(slotId)) {
      setEmergencyLockedIds(emergencyLockedIds.filter((id) => id !== slotId));
    } else {
      setEmergencyLockedIds([...emergencyLockedIds, slotId]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Appointment Calendar & Slot Setup</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure OPD shift hours, slot durations, and emergency slot locks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Slot Grid View */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <label htmlFor="calendarDocSelect" className="text-xs font-bold text-slate-500 uppercase">
                Doctor:
              </label>
              <select
                id="calendarDocSelect"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="calendarDateInput" className="text-xs font-bold text-slate-500 uppercase">
                Date:
              </label>
              <input
                id="calendarDateInput"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Click any slot to toggle Emergency Reservation</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Available
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-slate-300 inline-block" /> Booked
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> Emergency Lock
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading slots...</div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {slots.map((slot) => {
                const isEmergency = emergencyLockedIds.includes(slot.slotId);
                return (
                  <button
                    key={slot.slotId}
                    type="button"
                    onClick={() => toggleEmergencyLock(slot.slotId)}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 text-xs font-bold min-h-[52px] ${
                      isEmergency
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : !slot.isAvailable
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:border-emerald-400'
                    }`}
                  >
                    <span>{slot.startTime}</span>
                    {isEmergency ? (
                      <Lock className="w-3 h-3 text-rose-600" />
                    ) : (
                      <span className="text-[10px] font-normal text-emerald-700">Open</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Shift Duration Controls */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            OPD Shift Parameters
          </h2>

          {saveMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveMessage}</span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Shift Start Time</label>
              <input
                type="time"
                value={shiftStart}
                onChange={(e) => setShiftStart(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Shift End Time</label>
              <input
                type="time"
                value={shiftEnd}
                onChange={(e) => setShiftEnd(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Consultation Slot Duration
              </label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold outline-none"
              >
                <option value="10">10 Minutes (Express OPD)</option>
                <option value="15">15 Minutes (Standard Clinic)</option>
                <option value="20">20 Minutes (Comprehensive Checkup)</option>
                <option value="30">30 Minutes (Super-Specialty)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={async () => {
                const res = await fetch(`/api/doctors/${selectedDoctorId}/schedule`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    shifts: [{ shiftStart, shiftEnd, slotDurationMinutes: Number(slotDuration) }],
                    emergencyLockedSlotIds: emergencyLockedIds,
                  }),
                });
                setSaveMessage(res.ok ? 'Shift schedule applied for doctor.' : 'Unable to save shift schedule.');
                setTimeout(() => setSaveMessage(''), 3000);
                fetchSlots();
              }}
              className="mt-2 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition shadow-sm"
            >
              Update Shift Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
