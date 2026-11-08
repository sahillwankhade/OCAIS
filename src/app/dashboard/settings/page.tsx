'use client';

import React, { useState, useEffect } from 'react';
import { useDashboardRole } from '@/components/dashboard/DashboardHeader';
import {
  Settings,
  Shield,
  Clock,
  Calendar,
  Save,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Hospital } from '@/lib/types';
import { AuditLogEntry } from '@/lib/data/mock-db';

export default function SettingsAndAuditPage() {
  const { hospitalId } = useDashboardRole();

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('20:00');
  const [holidays, setHolidays] = useState<string[]>(['2026-11-15 (Diwali Holiday)', '2026-12-25 (Christmas)']);
  const [newHoliday, setNewHoliday] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [saveMessage, setSaveMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<import('@/lib/types').Doctor[]>([]);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [doctorSpecialization, setDoctorSpecialization] = useState('General Medicine');
  const [doctorCabin, setDoctorCabin] = useState('');
  const [doctorFee, setDoctorFee] = useState('500');
  const [doctorMessage, setDoctorMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/hospitals?hospitalId=${hospitalId}`);
        const data = await res.json();
        const found = (data.hospitals || []).find((h: Hospital) => h.id === hospitalId);
        if (found) {
          setHospital(found);
          setOpeningTime(found.openingTime);
          setClosingTime(found.closingTime);
        }
        setDoctors(data.doctors || []);
        const setupRes = await fetch(`/api/hospitals?hospitalId=${hospitalId}`);
        const setupData = await setupRes.json();
        setDoctors(setupData.doctors || []);

        // Demo audit logs
        setAuditLogs([
          {
            id: 'audit-001',
            hospitalId,
            role: 'doctor',
            action: 'STATE_TRANSITION',
            entityType: 'appointment',
            entityId: 'apt-completed-11',
            oldState: 'IN_CONSULT',
            newState: 'COMPLETED',
            timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          },
          {
            id: 'audit-002',
            hospitalId,
            role: 'scan_station',
            action: 'QR_CABIN_CHECKIN',
            entityType: 'appointment',
            entityId: 'apt-inconsult-12',
            oldState: 'CHECKED_IN',
            newState: 'IN_CONSULT',
            timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          },
          {
            id: 'audit-003',
            hospitalId,
            role: 'receptionist',
            action: 'WALK_IN_REGISTRATION',
            entityType: 'patient',
            entityId: 'pat-1',
            oldState: undefined,
            newState: 'CHECKED_IN',
            timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
          },
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [hospitalId]);

  const handleSaveTimings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/hospitals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospitalId,
        openingTime,
        closingTime,
        holidays: holidays.map((holiday) => holiday.split(' ')[0]),
      }),
    });
    if (!res.ok) {
      setSaveMessage('Unable to save hospital configuration.');
      return;
    }
    setSaveMessage('Hospital operating hours and holiday calendar updated.');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleAddDoctor = async () => {
    const res = await fetch('/api/doctors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospitalId,
        fullName: doctorName,
        specialization: doctorSpecialization,
        qualifications: 'MBBS',
        cabinNumber: doctorCabin,
        consultationFee: doctorFee,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setDoctorMessage(data.error || 'Unable to add doctor.');
      return;
    }
    setDoctors((current) => [...current, data.doctor]);
    setDoctorName('');
    setDoctorCabin('');
    setShowDoctorForm(false);
    setDoctorMessage('Doctor added successfully.');
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliday.trim()) return;
    setHolidays([...holidays, newHoliday.trim()]);
    setNewHoliday('');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hospital Settings & Audit Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operating hours, holiday blackout dates, and DPDP-compliant immutable audit trails
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hospital Timings & Holidays */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-teal-700" />
            Hospital OPD Operating Hours
          </h2>

          {saveMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveTimings} className="flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Opening Time</label>
                <input
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Doctors & Cabins</h2>
                    <p className="text-xs text-slate-500">Manage doctors, consultation fees, and cabin assignments.</p>
                  </div>
                  <button type="button" onClick={() => setShowDoctorForm((visible) => !visible)} className="py-2 px-3 bg-teal-700 text-white rounded-xl text-xs font-bold">
                    {showDoctorForm ? 'Close' : 'Add Doctor'}
                  </button>
                </div>
                {doctorMessage ? <div className="p-3 bg-teal-50 rounded-xl text-xs text-teal-800">{doctorMessage}</div> : null}
                {showDoctorForm ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl">
                    <input required value={doctorName} onChange={(e) => setDoctorName(e.target.value)} placeholder="Doctor full name" className="p-2.5 border rounded-xl text-sm" />
                    <input required value={doctorCabin} onChange={(e) => setDoctorCabin(e.target.value)} placeholder="Cabin number" className="p-2.5 border rounded-xl text-sm" />
                    <input required value={doctorSpecialization} onChange={(e) => setDoctorSpecialization(e.target.value)} placeholder="Specialization" className="p-2.5 border rounded-xl text-sm" />
                    <input required type="number" value={doctorFee} onChange={(e) => setDoctorFee(e.target.value)} placeholder="Consultation fee" className="p-2.5 border rounded-xl text-sm" />
                    <button type="button" onClick={handleAddDoctor} className="sm:col-span-2 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold">Save Doctor</button>
                  </div>
                ) : null}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {doctors.map((doctor) => (
                    <div key={doctor.id} className="p-3 border border-slate-200 rounded-xl">
                      <div className="font-bold text-sm text-slate-900">{doctor.fullName}</div>
                      <div className="text-xs text-slate-500">{doctor.specialization} • {doctor.cabinNumber}</div>
                      <div className="text-xs text-teal-700 font-semibold mt-1">₹{doctor.consultationFee} per visit</div>
                    </div>
                  ))}
                </div>
              </section>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Closing Time</label>
                <input
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold outline-none"
                />
              </div>
            </div>

            {/* Holidays List */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <label className="block text-xs font-bold text-slate-700">
                Clinic Holidays & Blackout Dates
              </label>

              <div className="flex flex-col gap-1.5">
                {holidays.map((h, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between"
                  >
                    <span>{h}</span>
                    <button
                      type="button"
                      onClick={() => setHolidays(holidays.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-rose-600 text-xs font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={newHoliday}
                  onChange={(e) => setNewHoliday(e.target.value)}
                  placeholder="YYYY-MM-DD (Occasion)"
                  className="flex-1 p-2 border border-slate-300 rounded-xl text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddHoliday}
                  className="py-2 px-3 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  Add Holiday
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Hospital Configuration</span>
            </button>
          </form>
        </div>

        {/* Security & Audit Logs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-teal-700" />
              Security Audit Logs (DPDP Act Compliance)
            </h2>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Immutable Log
            </span>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-col gap-1 font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-900">{log.action}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString('en-IN')}
                  </span>
                </div>
                <div className="text-slate-600 text-[11px]">
                  Role: <strong className="text-slate-800">{log.role}</strong> • Target:{' '}
                  <span className="text-slate-700">{log.entityId}</span>
                </div>
                {log.oldState && log.newState && (
                  <div className="text-[10px] text-slate-500">
                    State transition: {log.oldState} → <strong className="text-emerald-700">{log.newState}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
