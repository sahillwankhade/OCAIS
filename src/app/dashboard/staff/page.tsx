'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDashboardRole } from '@/components/dashboard/DashboardHeader';
import { CheckCircle2, Clock, Users } from 'lucide-react';
import { StaffMember, DigitalForm } from '@/lib/types';

export default function StaffPage() {
  const { hospitalId } = useDashboardRole();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [forms, setForms] = useState<DigitalForm[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const [staffResponse, formsResponse] = await Promise.all([
      fetch(`/api/dashboard/staff?hospitalId=${hospitalId}`),
      fetch(`/api/dashboard/forms?hospitalId=${hospitalId}`),
    ]);
    setStaff((await staffResponse.json()).staff || []);
    setForms((await formsResponse.json()).forms || []);
    setLoading(false);
  }, [hospitalId]);
  useEffect(() => { load(); }, [load]);
  const toggle = async (staffId: string) => {
    const response = await fetch('/api/dashboard/staff', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ staffId }),
    });
    if (response.ok) {
      const data = await response.json();
      setStaff((current) => current.map((member) => member.id === staffId ? data.staff : member));
    }
  };
  return <div className="flex flex-col gap-6">
    <div><h1 className="text-xl font-bold text-slate-900">Staff Attendance & Digital Forms</h1><p className="text-xs text-slate-500">Track today&apos;s presence and active patient intake forms.</p></div>
    <section className="bg-white border rounded-2xl p-5 shadow-sm">
      <h2 className="font-bold flex items-center gap-2"><Users className="w-4 h-4 text-teal-700" /> Staff attendance</h2>
      {loading ? <p className="py-6 text-sm text-slate-400">Loading staff...</p> : staff.length === 0 ? <p className="py-6 text-sm text-slate-400">No staff members configured.</p> :
        <div className="mt-4 grid gap-3">{staff.map((member) => <div key={member.id} className="flex items-center justify-between border rounded-xl p-3">
          <div><div className="font-bold text-sm">{member.fullName}</div><div className="text-xs text-slate-500 capitalize">{member.role}</div></div>
          <button type="button" onClick={() => toggle(member.id)} className={`min-h-[44px] px-3 rounded-xl text-xs font-bold ${member.presentToday ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{member.presentToday ? 'Present' : 'Mark present'}</button>
        </div>)}</div>}
    </section>
    <section className="bg-white border rounded-2xl p-5 shadow-sm">
      <h2 className="font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-700" /> Digital forms</h2>
      <div className="mt-4 grid gap-3">{forms.map((form) => <div key={form.id} className="border rounded-xl p-3 flex justify-between"><div><div className="font-bold text-sm">{form.name}</div><div className="text-xs text-slate-500">{form.description}</div></div><span className="text-xs font-bold text-teal-700">{form.required ? 'Required' : 'Optional'}</span></div>)}</div>
    </section>
  </div>;
}
