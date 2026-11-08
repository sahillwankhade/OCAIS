'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Hospital as HospitalIcon,
  Stethoscope,
  Users,
  Activity,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Hospital, Doctor } from '@/lib/types';

export default function SuperAdminPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // New hospital form state
  const [showAddHospital, setShowAddHospital] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('Maharashtra');
  const [newPhone, setNewPhone] = useState('');
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hospitals');
      const data = await res.json();
      setHospitals(data.hospitals || []);
      setDoctors(data.doctors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddHospital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCity) return;

    const newHosp: Hospital = {
      id: `hosp-${Date.now()}`,
      name: newName,
      address: 'Central Healthcare Complex',
      city: newCity,
      state: newState,
      pincode: '400001',
      phone: newPhone || '+91-22-12345678',
      email: `admin@${newName.toLowerCase().replace(/\s+/g, '')}.in`,
      openingTime: '08:00',
      closingTime: '21:00',
      departments: ['General Medicine', 'Pediatrics'],
      createdAt: new Date().toISOString(),
    };

    setHospitals([...hospitals, newHosp]);
    setShowAddHospital(false);
    setNewName('');
    setNewCity('');
    setMessage(`Hospital "${newHosp.name}" onboarded successfully.`);
    setTimeout(() => setMessage(''), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 sm:p-10 flex flex-col gap-8">
      {/* Super Admin Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-950 font-black flex items-center justify-center text-2xl">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">One Click AIS • Super-Admin</h1>
            <p className="text-xs text-teal-400 font-medium">
              National Multi-Tenant Healthcare Network & System Health
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition"
          >
            Hospital Dashboard
          </Link>
          <Link
            href="/patient"
            className="py-2 px-4 bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs rounded-xl transition"
          >
            Patient App
          </Link>
        </div>
      </header>

      {message && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500 rounded-2xl text-xs text-emerald-200 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* Network Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Registered Hospitals', value: hospitals.length, icon: HospitalIcon },
          { label: 'Active Specialists', value: doctors.length, icon: Stethoscope },
          { label: 'Total Consultations', value: '1,420', icon: Activity },
          { label: 'Platform Health', value: '99.98%', icon: ShieldAlert },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                <span>{stat.label}</span>
                <Icon className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-3xl font-black text-white mt-3">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Hospital Onboarding & Management */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-white">Registered Hospital Networks</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-tenant isolated data environments with independent doctor rosters
            </p>
          </div>

          <button
            onClick={() => setShowAddHospital(!showAddHospital)}
            className="py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard New Hospital</span>
          </button>
        </div>

        {showAddHospital && (
          <form
            onSubmit={handleAddHospital}
            className="p-5 bg-slate-900 border border-slate-700 rounded-2xl flex flex-col gap-4 text-xs"
          >
            <h3 className="text-sm font-bold text-teal-400 uppercase">
              Hospital Onboarding Wizard
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Hospital Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ruby Hall Clinic"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">City</label>
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="e.g. Pune"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Official Contact Phone</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91-20-..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddHospital(false)}
                className="py-2 px-4 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-5 bg-teal-600 text-slate-950 font-black rounded-xl"
              >
                Register Hospital
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hospitals.map((hosp) => (
            <div
              key={hosp.id}
              className="p-5 bg-slate-900 border border-slate-700 rounded-2xl flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-bold text-white">{hosp.name}</h3>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Active Tenant
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {hosp.address}, {hosp.city}, {hosp.state}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{hosp.phone}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Hours: {hosp.openingTime} - {hosp.closingTime}
                </span>

                <Link
                  href={`/dashboard?hospitalId=${hosp.id}`}
                  className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1"
                >
                  <span>Open Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

