'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PatientHeader } from '@/components/patient/PatientHeader';
import { useI18n } from '@/lib/i18n/context';
import { Calendar, Clock, MapPin, ChevronRight, Stethoscope, ArrowUpRight, Activity } from 'lucide-react';
import { Hospital, Doctor, Appointment } from '@/lib/types';
import { getStatusBadgeInfo } from '@/lib/state-machine/appointment-state';

export default function PatientHomePage() {
  const { t } = useI18n();
  const [activeAppointment, setActiveAppointment] = useState<
    (Appointment & { doctor?: Doctor; hospital?: Hospital }) | null
  >(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [aptsRes, hospRes] = await Promise.all([
          fetch('/api/appointments?patientId=pat-1'),
          fetch('/api/hospitals'),
        ]);

        const aptsData = await aptsRes.json();
        const hospData = await hospRes.json();

        setHospitals(hospData.hospitals || []);
        setDoctors(hospData.doctors || []);

        // Find active upcoming appointment
        const active = (aptsData.appointments || []).find(
          (a: Appointment) => a.state === 'BOOKED' || a.state === 'CHECKED_IN' || a.state === 'IN_CONSULT'
        );
        setActiveAppointment(active || null);
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <>
      <PatientHeader />

      <main className="flex-1 p-4 flex flex-col gap-5">
        {/* Active Live Appointment Hero Card */}
        {activeAppointment ? (
          <div className="bg-gradient-to-br from-teal-800 to-teal-950 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden border border-teal-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider uppercase bg-teal-600/60 px-3 py-1 rounded-full text-teal-100 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                Live Appointment
              </span>
              <span className="text-sm font-semibold text-teal-200">
                {activeAppointment.slotStartTime} Today
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-teal-300 font-medium">Your Token</span>
                <div className="text-4xl font-extrabold tracking-tight mt-0.5">
                  #{activeAppointment.tokenNumber}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-teal-300 font-medium">Doctor</span>
                <div className="text-lg font-bold text-white leading-tight mt-0.5">
                  {activeAppointment.doctor?.fullName || 'Dr. Rajesh Sharma'}
                </div>
                <div className="text-xs text-teal-200">
                  {activeAppointment.doctor?.cabinNumber || 'Cabin 101'}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-teal-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-teal-200">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>
                  Status: <strong>{getStatusBadgeInfo(activeAppointment.state).label}</strong>
                </span>
              </div>

              <Link
                href={`/patient/queue/${activeAppointment.id}`}
                className="bg-emerald-400 hover:bg-emerald-300 text-teal-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 transition shadow-sm"
              >
                Track Live Queue
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-teal-50 border border-teal-200 rounded-3xl p-5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-teal-950 text-base">No appointment right now</h3>
              <p className="text-xs text-teal-700 mt-1">Book your doctor in under 30 seconds</p>
            </div>
            <Link
              href="/patient/search"
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition"
            >
              Book Now
            </Link>
          </div>
        )}

        {/* 3-Tap Quick Booking Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-900">Popular Specialties</h2>
            <Link href="/patient/search" className="text-xs font-semibold text-teal-700 flex items-center">
              View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {[
              { name: 'General', label: 'Medicine', icon: Stethoscope },
              { name: 'Pediatrics', label: 'Child Care', icon: Calendar },
              { name: 'Orthopedics', label: 'Bones', icon: Activity },
              { name: 'Cardiology', label: 'Heart', icon: Clock },
            ].map((spec) => {
              const Icon = spec.icon;
              return (
                <Link
                  key={spec.name}
                  href={`/patient/search?specialty=${spec.name}`}
                  className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col items-center text-center hover:border-teal-600 transition shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-2">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 leading-tight">{spec.name}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">{spec.label}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Nearby Hospitals & Clinics */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Nearby Hospitals & Clinics</h2>
            <span className="text-xs text-slate-500 font-medium">Pune / Mumbai</span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-400 text-sm">{t.common.loading}</div>
          ) : (
            hospitals.map((hosp) => (
              <div
                key={hosp.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{hosp.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>{hosp.address}, {hosp.city}</span>
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Open {hosp.openingTime}-{hosp.closingTime}
                  </span>
                </div>

                {/* Available Doctors in Hospital */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Available Specialists Today
                  </span>
                  {doctors
                    .filter((d) => d.hospitalId === hosp.id)
                    .map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl hover:bg-teal-50/60 transition border border-slate-100"
                      >
                        <div>
                          <div className="text-sm font-bold text-slate-900">{doc.fullName}</div>
                          <div className="text-xs text-slate-600">
                            {doc.specialization} • ₹{doc.consultationFee}
                          </div>
                        </div>

                        <Link
                          href={`/patient/book/${doc.id}`}
                          className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
                        >
                          Book
                        </Link>
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </>
  );
}

