'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PatientHeader } from '@/components/patient/PatientHeader';
import { useI18n } from '@/lib/i18n/context';
import { Search, MapPin, Stethoscope, Clock } from 'lucide-react';
import { Doctor, Hospital } from '@/lib/types';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialSpecialty = searchParams.get('specialty') || '';
  const { t } = useI18n();

  const [query, setQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const specialties = [
    'All',
    'General Medicine',
    'Pediatrics',
    'Orthopedics',
    'Cardiology',
  ];

  useEffect(() => {
    async function loadDirectory() {
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
    }
    loadDirectory();
  }, []);

  const filteredDoctors = doctors.filter((doc) => {
    const matchesQuery =
      doc.fullName.toLowerCase().includes(query.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(query.toLowerCase());

    const matchesSpecialty =
      !selectedSpecialty ||
      selectedSpecialty === 'All' ||
      doc.specialization.toLowerCase().includes(selectedSpecialty.toLowerCase());

    return matchesQuery && matchesSpecialty;
  });

  return (
    <>
      <PatientHeader title="Find Doctor & Clinic" showBack />

      <main className="flex-1 p-4 flex flex-col gap-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.common.search}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:border-teal-600 shadow-sm"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {specialties.map((spec) => {
            const isSelected =
              selectedSpecialty === spec || (!selectedSpecialty && spec === 'All');
            return (
              <button
                key={spec}
                onClick={() => setSelectedSpecialty(spec === 'All' ? '' : spec)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition min-h-[36px] ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {spec}
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {filteredDoctors.length} Specialists Available Today
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              {t.common.loading}
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
              <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="font-bold text-slate-700 text-base">No doctors found</div>
              <div className="text-xs text-slate-500 mt-1">Try clearing search filters or search another specialty</div>
            </div>
          ) : (
            filteredDoctors.map((doc) => {
              const hosp = hospitals.find((h) => h.id === doc.hospitalId);
              return (
                <div
                  key={doc.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-teal-500 transition flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {doc.fullName}
                      </h3>
                      <div className="text-xs font-semibold text-teal-700 mt-0.5">
                        {doc.specialization} • {doc.experienceYears}+ years exp
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{hosp?.name || 'Clinic'}, {hosp?.city}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold text-slate-900">
                        ₹{doc.consultationFee}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">Consultation Fee</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Avg consult: {doc.avgConsultDurationMinutes} min</span>
                    </div>

                    <Link
                      href={`/patient/book/${doc.id}`}
                      className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm"
                    >
                      Book Slot
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </>
  );
}

export default function PatientSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 text-sm">
          <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading directory...
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
