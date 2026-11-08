'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Hospital = { id: string; name: string };
type Staff = { id: string; fullName: string; role: string };

export default function HospitalLoginPage() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [hospitalId, setHospitalId] = useState('hosp-sahyadri');
  const [role, setRole] = useState<'doctor' | 'receptionist' | 'admin'>('doctor');
  const [staffId, setStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/hospitals').then((res) => res.json()).then((data) => setHospitals(data.hospitals || [])).catch(() => setError('Unable to load hospitals'));
  }, []);

  useEffect(() => {
    fetch(`/api/dashboard/staff?hospitalId=${hospitalId}`).then((res) => res.json()).then((data) => {
      const members = (data.staff || []).filter((member: Staff) => member.role === role);
      setStaff(members);
      setStaffId(members[0]?.id || '');
    }).catch(() => setError('Unable to load hospital staff'));
  }, [hospitalId, role]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/hospital/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitalId, role, staffId, pin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <p className="text-sm font-bold text-teal-700">One Click AIS</p>
          <h1 className="text-2xl font-black text-slate-900">Hospital Portal Login</h1>
          <p className="text-sm text-slate-500 mt-1">Select your hospital first, then sign in as doctor, receptionist, or hospital admin.</p>
        </div>
        {error ? <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm">{error}</div> : null}
        <label className="block text-sm font-bold text-slate-700">Hospital
          <select value={hospitalId} onChange={(event) => setHospitalId(event.target.value)} className="mt-1 w-full border rounded-xl p-3">
            {hospitals.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}
          </select>
        </label>
        <label className="block text-sm font-bold text-slate-700">Login as
          <select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className="mt-1 w-full border rounded-xl p-3">
            <option value="doctor">Doctor</option>
            <option value="receptionist">Receptionist</option>
            <option value="admin">Hospital Admin</option>
          </select>
        </label>
        <label className="block text-sm font-bold text-slate-700">Staff account
          <select value={staffId} onChange={(event) => setStaffId(event.target.value)} className="mt-1 w-full border rounded-xl p-3">
            {staff.map((member) => <option key={member.id} value={member.id}>{member.fullName}</option>)}
          </select>
        </label>
        <label className="block text-sm font-bold text-slate-700">PIN
          <input required minLength={6} type="password" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="Enter PIN" className="mt-1 w-full border rounded-xl p-3" />
        </label>
        <button disabled={loading || !staffId} className="w-full bg-teal-700 text-white rounded-xl p-3 font-bold disabled:bg-slate-300">{loading ? 'Signing in...' : 'Sign in to hospital'}</button>
        <p className="text-xs text-slate-500">Development demo PIN: 123456</p>
      </form>
    </main>
  );
}
