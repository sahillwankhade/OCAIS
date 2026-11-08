'use client';

import React, { useState, useEffect } from 'react';
import { useDashboardRole } from '@/components/dashboard/DashboardHeader';
import {
  ClipboardList,
  Search,
  UserPlus,
  Printer,
  Share2,
  CheckCircle2,
  Phone,
  Clock,
  IndianRupee,
  AlertCircle,
} from 'lucide-react';
import { Doctor, Patient, Appointment } from '@/lib/types';

export default function ReceptionDeskPage() {
  const { hospitalId } = useDashboardRole();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('32');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [notes, setNotes] = useState('');

  // PRN search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedPatient, setSearchedPatient] = useState<Patient | null>(null);
  const [searchNotFound, setSearchNotFound] = useState(false);

  // Token Generation Slip Result
  const [lastSlip, setLastSlip] = useState<{
    tokenNumber: number;
    hospitalName: string;
    doctorName: string;
    cabinNumber: string;
    patientName: string;
    prn: string;
    fee: number;
    time: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    async function loadDoctors() {
      try {
        const res = await fetch(`/api/hospitals?hospitalId=${hospitalId}`);
        const data = await res.json();
        setDoctors(data.doctors || []);
        if (data.doctors && data.doctors.length > 0) {
          setSelectedDoctorId(data.doctors[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadDoctors();
  }, [hospitalId]);

  const handlePrnSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setSearchNotFound(false);
      const res = await fetch(`/api/patient/profile?phone=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      if (data.patient) {
        setSearchedPatient(data.patient);
        setPhone(data.patient.phone);
        setFullName(data.patient.fullName);
        setAge(data.patient.age.toString());
        setGender(data.patient.gender);
        setBloodGroup(data.patient.bloodGroup || 'B+');
      } else {
        setSearchedPatient(null);
        setSearchNotFound(true);
      }
    } catch {
      setSearchNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWalkInToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !selectedDoctorId) {
      alert('Phone and doctor are required.');
      return;
    }
    setSubmitting(true);
    setSuccessMessage('');

    try {
      const res = await fetch('/api/dashboard/reception/walk-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId,
          doctorId: selectedDoctorId,
          phone,
          fullName: fullName || 'Walk-In Patient',
          age,
          gender,
          bloodGroup,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setLastSlip(data.slipData);
      setSuccessMessage(data.message);

      // Reset form
      setPhone('');
      setFullName('');
      setNotes('');
      setSearchedPatient(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to generate walk-in token');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reception & Walk-In Desk</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant PRN creation, walk-in token generation, offline billing, and thermal slip printing
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Search & Registration Form */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* PRN / Phone Search Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              1. Search Existing Patient (PRN or Mobile)
            </h2>
            <form onSubmit={handlePrnSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter 10-digit phone (e.g. 9820011111) or PRN-2026-..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:border-teal-600"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
              >
                {loading ? 'Searching...' : 'Lookup'}
              </button>
            </form>

            {searchedPatient && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-teal-950 block">{searchedPatient.fullName}</span>
                  <span className="text-teal-700 font-mono">
                    {searchedPatient.prn} • {searchedPatient.age} yrs • {searchedPatient.gender}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                  Verified Profile Loaded
                </span>
              </div>
            )}

            {searchNotFound && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                No patient found with this number. Enter details below to automatically generate a new PRN.
              </div>
            )}
          </div>

          {/* Walk-In Token Generator Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              2. Walk-In Registration & Consultation Token
            </h2>

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleGenerateWalkInToken} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Doctor</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.specialization} • {d.cabinNumber} • Fee: ₹{d.consultationFee})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit number"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full name"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                  <input
                    type="text"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Symptoms / Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Acute stomach pain, high fever..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {submitting ? 'Generating...' : 'Issue Walk-In Token (Collect Cash/Card)'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Col: Printable Thermal Slip Preview */}
        <div className="flex flex-col gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase">
                Thermal Slip Preview
              </span>
              <button
                onClick={() => window.print()}
                disabled={!lastSlip}
                className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1 disabled:opacity-40"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
            </div>

            {lastSlip ? (
              <div className="border border-dashed border-slate-400 p-4 rounded-xl bg-slate-50 font-mono text-xs flex flex-col gap-2 text-slate-800">
                <div className="text-center font-bold text-sm border-b border-dashed border-slate-300 pb-2">
                  ONE CLICK AIS CLINIC
                  <div className="text-[10px] font-normal">{lastSlip.hospitalName}</div>
                </div>

                <div className="text-center py-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    YOUR TOKEN NUMBER
                  </span>
                  <div className="text-4xl font-black text-slate-950 mt-0.5">
                    #{lastSlip.tokenNumber}
                  </div>
                  <span className="text-[11px] font-bold text-teal-800">
                    {lastSlip.cabinNumber}
                  </span>
                </div>

                <div className="border-t border-dashed border-slate-300 pt-2 flex flex-col gap-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Patient:</span>
                    <strong className="truncate max-w-[120px]">{lastSlip.patientName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>PRN:</span>
                    <strong>{lastSlip.prn}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Doctor:</span>
                    <strong>{lastSlip.doctorName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>{lastSlip.time} Today</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
                    <span>Paid Fee:</span>
                    <span>₹{lastSlip.fee} (Cash)</span>
                  </div>
                </div>

                <div className="text-[9px] text-center text-slate-500 pt-2 border-t border-dashed border-slate-300">
                  Track live wait on your phone:
                  <br />
                  http://localhost:3000/patient
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Generate a walk-in token to view and print the thermal slip format.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
