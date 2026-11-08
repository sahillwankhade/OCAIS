'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PatientHeader } from '@/components/patient/PatientHeader';
import { useI18n } from '@/lib/i18n/context';
import { Doctor, Hospital, Patient, FamilyMember } from '@/lib/types';
import { TimeSlot } from '@/lib/slots/slot-generator';
import { Calendar, Clock, User, CreditCard, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BookDoctorPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.doctorId as string;
  const { t } = useI18n();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('myself');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE_MOCK' | 'CASH'>('ONLINE_MOCK');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Generate next 3 days for easy date tabs
  const dates = [0, 1, 2].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return {
      iso: d.toISOString().split('T')[0],
      dayName: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      dateLabel: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    };
  });

  useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true);
        // Load doctor slots & profile
        const [slotsRes, profRes] = await Promise.all([
          fetch(`/api/doctors/${doctorId}/slots?date=${selectedDate}`),
          fetch('/api/patient/profile?patientId=pat-1'),
        ]);

        const slotsData = await slotsRes.json();
        const profData = await profRes.json();

        setDoctor(slotsData.doctor);
        setSlots(slotsData.slots || []);
        if (slotsData.slots && slotsData.slots.length > 0) {
          const firstAvailable = slotsData.slots.find((s: TimeSlot) => s.isAvailable);
          if (firstAvailable) setSelectedSlot(firstAvailable);
        }

        setPatient(profData.patient);
        setFamilyMembers(profData.familyMembers || []);

        if (slotsData.doctor?.hospitalId) {
          const hospRes = await fetch('/api/hospitals');
          const hospData = await hospRes.json();
          const found = (hospData.hospitals || []).find(
            (h: Hospital) => h.id === slotsData.doctor.hospitalId
          );
          setHospital(found || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, [doctorId, selectedDate]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select a consultation time slot');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const isFamily = selectedPatientId !== 'myself';
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId: doctor?.hospitalId,
          doctorId: doctor?.id,
          patientId: patient?.id || 'pat-1',
          familyMemberId: isFamily ? selectedPatientId : undefined,
          slotDate: selectedDate,
          slotStartTime: selectedSlot.startTime,
          slotEndTime: selectedSlot.endTime,
          paymentMethod,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Redirect directly to confirmation screen with token and QR
      router.push(`/patient/confirmation/${data.appointment.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed');
      setSubmitting(false);
    }
  };

  if (loading && !doctor) {
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
      <PatientHeader title={t.booking.bookAppointment} showBack />

      <main className="flex-1 p-4 flex flex-col gap-5">
        {/* Doctor Summary Header Card */}
        {doctor && (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-teal-950">{doctor.fullName}</h2>
              <p className="text-xs font-semibold text-teal-700">{doctor.specialization}</p>
              <p className="text-xs text-teal-800/80 mt-1">
                {hospital?.name || 'Clinic'} • {doctor.cabinNumber}
              </p>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-teal-950">
                ₹{doctor.consultationFee}
              </span>
              <span className="text-[10px] block text-teal-700">Per visit</span>
            </div>
          </div>
        )}

        {error ? (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleBooking} className="flex flex-col gap-5">
          {/* TAP 1: Select Date */}
          <section>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. {t.booking.selectDate}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {dates.map((d) => {
                const isSelected = selectedDate === d.iso;
                return (
                  <button
                    type="button"
                    key={d.iso}
                    onClick={() => setSelectedDate(d.iso)}
                    className={`p-3 rounded-2xl border text-center transition min-h-[56px] flex flex-col items-center justify-center ${
                      isSelected
                        ? 'border-teal-700 bg-teal-700 text-white font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 font-medium'
                    }`}
                  >
                    <span className="text-xs uppercase tracking-wide">{d.dayName}</span>
                    <span className="text-sm font-extrabold">{d.dateLabel}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* TAP 1: Select Time Slot */}
          <section>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              2. {t.booking.selectTimeSlot}
            </label>

            {slots.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                No slots available on this date.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-2xl">
                {slots.map((slot) => {
                  const isSelected = selectedSlot?.slotId === slot.slotId;
                  const isAvailable = slot.isAvailable;
                  return (
                    <button
                      type="button"
                      key={slot.slotId}
                      disabled={!isAvailable}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition min-h-[44px] flex items-center justify-center ${
                        !isAvailable
                          ? 'bg-slate-100 text-slate-300 cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-teal-700 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-800 hover:border-teal-600'
                      }`}
                    >
                      {slot.startTime}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* TAP 2: Select Patient (Myself or Family Member) */}
          <section>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              3. {t.booking.selectPatient}
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between p-3 border rounded-xl cursor-pointer bg-white transition hover:border-teal-500 border-slate-200">
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="patientSelect"
                    value="myself"
                    checked={selectedPatientId === 'myself'}
                    onChange={() => setSelectedPatientId('myself')}
                    className="text-teal-600 focus:ring-teal-500 h-4 w-4"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">
                      {patient?.fullName || 'Myself'}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {patient?.prn} • {patient?.age} yrs, {patient?.gender}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                  Primary
                </span>
              </label>

              {familyMembers.map((fam) => (
                <label
                  key={fam.id}
                  className="flex items-center justify-between p-3 border rounded-xl cursor-pointer bg-white transition hover:border-teal-500 border-slate-200"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="patientSelect"
                      value={fam.id}
                      checked={selectedPatientId === fam.id}
                      onChange={() => setSelectedPatientId(fam.id)}
                      className="text-teal-600 focus:ring-teal-500 h-4 w-4"
                    />
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">
                        {fam.fullName}
                      </span>
                      <span className="text-xs text-slate-500">
                        {fam.relationship} • {fam.age} yrs, {fam.gender}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Payment Method */}
          <section>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              4. Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('ONLINE_MOCK')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  paymentMethod === 'ONLINE_MOCK'
                    ? 'border-teal-700 bg-teal-50/70 text-teal-950 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <CreditCard className="w-4 h-4 text-teal-700" />
                  <span>UPI / Card (Mock)</span>
                </div>
                <span className="text-[11px] text-teal-700 font-normal">Instant token</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  paymentMethod === 'CASH'
                    ? 'border-teal-700 bg-teal-50/70 text-teal-950 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <User className="w-4 h-4 text-slate-600" />
                  <span>Pay at Clinic</span>
                </div>
                <span className="text-[11px] text-slate-500 font-normal">Cash at reception</span>
              </button>
            </div>
          </section>

          {/* TAP 3: Submit Button */}
          <div className="sticky bottom-16 bg-white/95 backdrop-blur-md pt-3 pb-1 border-t border-slate-100">
            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="w-full bg-teal-700 hover:bg-teal-800 active:bg-teal-900 disabled:bg-slate-300 text-white font-bold py-3.5 px-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating Token & QR...</span>
                </>
              ) : (
                <>
                  <span>
                    Confirm & Book for ₹{doctor?.consultationFee || 500}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}

