'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PatientHeader } from '@/components/patient/PatientHeader';
import { useI18n } from '@/lib/i18n/context';
import { Patient, FamilyMember } from '@/lib/types';
import {
  User,
  Users,
  Plus,
  Shield,
  FileText,
  Phone,
  Copy,
  Check,
  ChevronRight,
  LogOut,
} from 'lucide-react';

export default function PatientProfilePage() {
  const { t } = useI18n();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [copiedPrn, setCopiedPrn] = useState(false);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newRelationship, setNewRelationship] = useState<
    'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'OTHER'
  >('CHILD');
  const [newAge, setNewAge] = useState('8');
  const [newGender, setNewGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('FEMALE');
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/patient/profile');
      const data = await res.json();
      setPatient(data.patient);
      setFamilyMembers(data.familyMembers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleCopyPrn = () => {
    if (!patient?.prn) return;
    navigator.clipboard.writeText(patient.prn);
    setCopiedPrn(true);
    setTimeout(() => setCopiedPrn(false), 2000);
  };

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName || !patient) return;

    try {
      const res = await fetch('/api/patient/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_FAMILY',
          patientId: patient.id,
          fullName: newFamilyName,
          relationship: newRelationship,
          age: newAge,
          gender: newGender,
        }),
      });

      if (res.ok) {
        setShowAddFamily(false);
        setNewFamilyName('');
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !patient) {
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

  return (
    <>
      <PatientHeader title="Patient Profile" showBack />

      <main className="flex-1 p-4 flex flex-col gap-5">
        {/* Patient Digital Health ID Card */}
        <div className="bg-gradient-to-br from-teal-800 to-teal-950 text-white rounded-3xl p-5 shadow-lg border border-teal-700 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-teal-300">
              One Click AIS • Health ID
            </span>
            <span className="text-xs bg-teal-600/70 text-teal-100 font-bold px-2.5 py-0.5 rounded-full">
              Verified
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-teal-700/80 border border-teal-500/50 flex items-center justify-center font-bold text-xl text-teal-100">
              {patient.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-black leading-tight text-white">{patient.fullName}</h2>
              <p className="text-xs text-teal-200 mt-0.5">
                {patient.age} yrs • {patient.gender} • Blood Group: {patient.bloodGroup || 'O+'}
              </p>
              <p className="text-xs text-teal-300 flex items-center gap-1 mt-0.5 font-mono">
                <Phone className="w-3 h-3" /> +91 {patient.phone}
              </p>
            </div>
          </div>

          {/* PRN Badge & Copy */}
          <div className="mt-5 pt-3 border-t border-teal-700/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-teal-300 block">
                Permanent Registration Number (PRN)
              </span>
              <span className="text-sm font-mono font-bold tracking-wide text-white">
                {patient.prn}
              </span>
            </div>

            <button
              onClick={handleCopyPrn}
              className="p-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-teal-100 flex items-center gap-1 text-xs transition"
              title="Copy PRN"
            >
              {copiedPrn ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Family Members Section */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">Family Members & Dependents</h3>
            </div>

            <button
              onClick={() => setShowAddFamily(!showAddFamily)}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          </div>

          {showAddFamily && (
            <form
              onSubmit={handleAddFamilyMember}
              className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex flex-col gap-3"
            >
              <h4 className="text-xs font-bold text-teal-950 uppercase">Add New Dependent</h4>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  placeholder="e.g. Diya Patil"
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-medium outline-none bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Relation</label>
                  <select
                    value={newRelationship}
                    onChange={(e) =>
                      setNewRelationship(
                        e.target.value as 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'OTHER'
                      )
                    }
                    className="w-full py-2 px-2 border border-slate-300 rounded-xl text-xs font-medium outline-none bg-white"
                  >
                    <option value="CHILD">Child</option>
                    <option value="SPOUSE">Spouse</option>
                    <option value="PARENT">Parent</option>
                    <option value="SIBLING">Sibling</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    className="w-full py-2 px-2 border border-slate-300 rounded-xl text-xs font-medium outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
                    className="w-full py-2 px-2 border border-slate-300 rounded-xl text-xs font-medium outline-none bg-white"
                  >
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setShowAddFamily(false)}
                  className="py-1.5 px-3 text-xs text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-3 bg-teal-700 text-white rounded-xl text-xs font-bold"
                >
                  Save Member
                </button>
              </div>
            </form>
          )}

          <div className="flex flex-col gap-2">
            {familyMembers.map((fam) => (
              <div
                key={fam.id}
                className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <span className="text-sm font-bold text-slate-900 block">{fam.fullName}</span>
                  <span className="text-xs text-slate-500">
                    {fam.relationship} • {fam.age} yrs • {fam.gender}
                  </span>
                </div>
                <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
                  Dependent
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Security & DPDP Compliance Settings */}
        <section className="flex flex-col gap-2 pt-2 border-t border-slate-200">
          <Link
            href="/patient/privacy"
            className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-teal-700" />
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  Data Privacy & Consent (DPDP Act)
                </span>
                <span className="text-xs text-slate-500">
                  Manage health data processing permissions
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            href="/patient/login"
            className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between hover:bg-rose-50 hover:border-rose-200 transition text-rose-700"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-bold">Switch Account / Sign Out</span>
            </div>
          </Link>
        </section>
      </main>
    </>
  );
}
