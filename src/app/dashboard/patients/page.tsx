'use client';

import React, { useState, useEffect } from 'react';
import { useDashboardRole } from '@/components/dashboard/DashboardHeader';
import { Search, User, FileText, Calendar, Clock, ChevronRight, Phone } from 'lucide-react';
import { Patient, Appointment } from '@/lib/types';
import { getStatusBadgeInfo } from '@/lib/state-machine/appointment-state';

export default function PatientDirectoryPage() {
  const { hospitalId } = useDashboardRole();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientHistory, setPatientHistory] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatients() {
      try {
        setLoading(true);
        const res = await fetch('/api/hospitals'); // Loads base dataset
        // Also load demo patient list
        const pRes = await fetch('/api/patient/profile?patientId=pat-1');
        const pData = await pRes.json();
        if (pData.patient) {
          setSelectedPatient(pData.patient);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, [hospitalId]);

  useEffect(() => {
    async function loadHistory() {
      if (!selectedPatient) return;
      try {
        const res = await fetch(`/api/appointments?patientId=${selectedPatient.id}`);
        const data = await res.json();
        setPatientHistory(data.appointments || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadHistory();
  }, [selectedPatient]);

  // Demo patient list for directory
  const demoPatients: Patient[] = [
    {
      id: 'pat-1',
      phone: '9820011111',
      prn: 'PRN-2026-0001',
      fullName: 'Aarav Patil',
      age: 32,
      gender: 'MALE',
      bloodGroup: 'B+',
      createdAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'pat-2',
      phone: '9820022222',
      prn: 'PRN-2026-0002',
      fullName: 'Ananya Deshmukh',
      age: 28,
      gender: 'FEMALE',
      bloodGroup: 'O+',
      createdAt: '2026-02-14T11:00:00Z',
    },
    {
      id: 'pat-3',
      phone: '9820033333',
      prn: 'PRN-2026-0003',
      fullName: 'Ramesh Joshi',
      age: 64,
      gender: 'MALE',
      bloodGroup: 'A+',
      createdAt: '2026-03-01T09:30:00Z',
    },
    {
      id: 'pat-4',
      phone: '9820044444',
      prn: 'PRN-2026-0004',
      fullName: 'Sunita Kulkarni',
      age: 58,
      gender: 'FEMALE',
      bloodGroup: 'AB+',
      createdAt: '2026-03-12T14:00:00Z',
    },
    {
      id: 'pat-5',
      phone: '9820055555',
      prn: 'PRN-2026-0005',
      fullName: 'Vikram Shinde',
      age: 41,
      gender: 'MALE',
      bloodGroup: 'O-',
      createdAt: '2026-04-05T16:00:00Z',
    },
  ];

  const filteredPatients = demoPatients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.prn.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Patient Directory & Medical History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search patient records, view PRN profiles, and inspect past consultation notes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Patient List */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, PRN or phone..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:border-teal-600"
            />
          </div>

          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
            {filteredPatients.map((p) => {
              const isSelected = selectedPatient?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between text-xs ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/70'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{p.fullName}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {p.prn} • {p.age} yrs • {p.bloodGroup}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Selected Patient Detail & Visit History */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {selectedPatient ? (
            <>
              {/* Profile Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">{selectedPatient.fullName}</h2>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {selectedPatient.prn}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 font-mono">
                    <Phone className="w-3.5 h-3.5 text-teal-600" /> +91 {selectedPatient.phone} •{' '}
                    {selectedPatient.age} yrs • {selectedPatient.gender} • Blood Group:{' '}
                    {selectedPatient.bloodGroup || 'O+'}
                  </p>
                </div>
              </div>

              {/* Visit History Timeline */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Consultation History ({patientHistory.length} Visits)
                </h3>

                <div className="flex flex-col gap-3">
                  {patientHistory.map((apt) => {
                    const badge = getStatusBadgeInfo(apt.state);
                    return (
                      <div
                        key={apt.id}
                        className="p-4 border border-slate-200 rounded-xl bg-slate-50/60 flex flex-col gap-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900">
                              Token #{apt.tokenNumber}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}>
                              {badge.label}
                            </span>
                          </div>
                          <span className="text-slate-500">
                            {apt.slotDate} at {apt.slotStartTime}
                          </span>
                        </div>

                        {apt.notes && (
                          <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-700">
                            <strong>Clinical Notes:</strong> {apt.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs">
              Select a patient from the directory to view medical history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

