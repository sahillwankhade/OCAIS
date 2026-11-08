'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDashboardRole } from '@/components/dashboard/DashboardHeader';
import {
  Stethoscope,
  ChevronRight,
  UserCheck,
  SkipForward,
  CheckCircle2,
  Pause,
  Play,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Printer,
  FileText,
  User,
  Activity,
} from 'lucide-react';
import { Doctor, Appointment, Patient } from '@/lib/types';
import { getStatusBadgeInfo } from '@/lib/state-machine/appointment-state';

function DoctorConsoleContent() {
  const searchParams = useSearchParams();
  const initialDoctorId = searchParams.get('doctorId') || 'doc-sharma';
  const { hospitalId } = useDashboardRole();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId);
  const [activeDoctor, setActiveDoctor] = useState<Doctor | null>(null);
  const [inConsultAppointment, setInConsultAppointment] = useState<
    (Appointment & { patient?: Patient }) | null
  >(null);
  const [waitingQueue, setWaitingQueue] = useState<Appointment[]>([]);
  const [skippedQueue, setSkippedQueue] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Delay Modal
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [customDelay, setCustomDelay] = useState('15');

  // Digital Prescription state
  const [diagnosisTags, setDiagnosisTags] = useState<string[]>(['Acute Bronchitis', 'Mild Fever']);
  const [newTag, setNewTag] = useState('');
  const [medications, setMedications] = useState<
    { name: string; dosage: string; frequency: string; durationDays: number }[]
  >([
    { name: 'Paracetamol 650mg', dosage: '1 tab', frequency: '1-0-1 after food', durationDays: 3 },
    { name: 'Azithromycin 500mg', dosage: '1 tab', frequency: '1-0-0 before food', durationDays: 5 },
  ]);
  const [adviceNotes, setAdviceNotes] = useState('Drink warm fluids, steam inhalation twice daily.');

  const fetchConsoleData = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hospitals?hospitalId=${hospitalId}`);
      const data = await res.json();
      setDoctors(data.doctors || []);

      const doc = (data.doctors || []).find((d: Doctor) => d.id === selectedDoctorId);
      setActiveDoctor(doc || null);

      if (selectedDoctorId) {
        const aptRes = await fetch(`/api/appointments?doctorId=${selectedDoctorId}`);
        const aptData = await aptRes.json();
        const all = aptData.appointments || [];

        const active = all.find((a: Appointment) => a.state === 'IN_CONSULT');
        if (active) {
          // fetch patient profile
          const pRes = await fetch(`/api/patient/profile?patientId=${active.patientId}`);
          const pData = await pRes.json();
          setInConsultAppointment({ ...active, patient: pData.patient });
        } else {
          setInConsultAppointment(null);
        }

        setWaitingQueue(
          all.filter((a: Appointment) => a.state === 'CHECKED_IN' || a.state === 'BOOKED')
        );
        setSkippedQueue(all.filter((a: Appointment) => a.state === 'SKIPPED'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [hospitalId, selectedDoctorId]);

  useEffect(() => {
    fetchConsoleData();
  }, [fetchConsoleData]);

  const handleQueueAction = async (action: string, payload?: Record<string, unknown>) => {
    setActionLoading(true);
    setStatusMessage('');
    try {
      const res = await fetch('/api/dashboard/doctor/queue-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          doctorId: selectedDoctorId,
          ...payload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatusMessage(data.message || 'Action executed successfully.');
      fetchConsoleData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDoneWithPrescription = () => {
    handleQueueAction('DONE', {
      notes: adviceNotes,
      prescription: {
        diagnosis: diagnosisTags,
        medications,
        advice: adviceNotes,
      },
    });
  };

  const handleAddMedication = () => {
    setMedications([
      ...medications,
      { name: 'Amoxicillin 500mg', dosage: '1 cap', frequency: '1-0-1', durationDays: 5 },
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold text-slate-900">Doctor Consultation Console</h1>

      {/* Top Controls Bar: Cabin Selector & Status */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
              <label htmlFor="doctorSelect" className="text-xs font-bold text-slate-500 uppercase">
                Active Cabin:
              </label>
              <select
                id="doctorSelect"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full sm:w-auto max-w-full text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 outline-none cursor-pointer"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} ({d.cabinNumber} - {d.specialization})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Avg duration: {activeDoctor?.avgConsultDurationMinutes || 8} min • Fee: ₹
              {activeDoctor?.consultationFee || 500}
            </p>
          </div>
        </div>

        {/* Doctor Status & Delay trigger */}
        <div className="flex items-center gap-2">
          {activeDoctor?.delayMinutes ? (
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
              Delayed by {activeDoctor.delayMinutes}m
            </span>
          ) : null}

          <button
            onClick={() => setShowDelayModal(true)}
            className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <Clock className="w-4 h-4" />
            <span>Report Delay</span>
          </button>

          <button
            onClick={() => handleQueueAction('TOGGLE_PAUSE')}
            className={`py-2 px-3 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm ${activeDoctor?.isPaused
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
          >
            {activeDoctor?.isPaused ? (
              <>
                <Play className="w-4 h-4" />
                <span>Resume Queue</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Queue</span>
              </>
            )}
          </button>
        </div>
      </div>

      {statusMessage ? (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs font-semibold text-teal-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{statusMessage}</span>
        </div>
      ) : null}

      {/* Main Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: In-Cabin Patient & Prescription */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Current Patient Card */}
          <div className="bg-white border-2 border-teal-700/80 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                <span className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                  Current Patient in Cabin
                </span>
              </div>

              {inConsultAppointment ? (
                <span className="text-2xl font-black text-teal-800">
                  Token #{inConsultAppointment.tokenNumber}
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-400">Cabin Empty</span>
              )}
            </div>

            {inConsultAppointment ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {inConsultAppointment.patient?.fullName || 'Patient'}
                    </h3>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      PRN: <strong>{inConsultAppointment.patient?.prn}</strong> •{' '}
                      {inConsultAppointment.patient?.age} yrs, {inConsultAppointment.patient?.gender}{' '}
                      • Blood: {inConsultAppointment.patient?.bloodGroup || 'O+'}
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                    In Consultation
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
                  <span className="font-bold block text-slate-900 mb-0.5">Reported Symptoms:</span>
                  {inConsultAppointment.notes || 'Routine consultation and checkup.'}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm">
                No patient currently in cabin. Click &quot;Next Patient&quot; below to call the next token.
              </div>
            )}

            {/* HIGH-SPEED ACTION BUTTONS */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-3">
              <button
                onClick={() => handleQueueAction('NEXT')}
                disabled={actionLoading || waitingQueue.length === 0}
                className="py-3 px-4 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 disabled:bg-slate-200 text-white font-bold text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 min-h-[48px]"
              >
                <UserCheck className="w-5 h-5" />
                <span>Next Patient</span>
              </button>

              <button
                onClick={() => handleQueueAction('SKIP')}
                disabled={actionLoading || !inConsultAppointment}
                className="py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 text-white font-bold text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 min-h-[48px]"
              >
                <SkipForward className="w-5 h-5" />
                <span>Skip</span>
              </button>

              <button
                onClick={handleDoneWithPrescription}
                disabled={actionLoading || !inConsultAppointment}
                className="py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 text-white font-bold text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 min-h-[48px]"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Done</span>
              </button>
            </div>
          </div>

          {/* Digital Prescription Builder (Rx) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Digital Prescription & Consultation Notes (Rx)
                </h3>
              </div>
              <button
                onClick={() => window.print()}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Rx</span>
              </button>
            </div>

            {/* Diagnosis Tags */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                Clinical Diagnosis
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {diagnosisTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-semibold bg-teal-50 border border-teal-200 text-teal-800 px-2.5 py-1 rounded-lg flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => setDiagnosisTags(diagnosisTags.filter((t) => t !== tag))}
                      className="text-teal-600 hover:text-teal-900 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="+ Add diagnosis..."
                    className="text-xs py-1 px-2 border border-slate-300 rounded-lg outline-none w-32"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTag.trim()) {
                        e.preventDefault();
                        setDiagnosisTags([...diagnosisTags, newTag.trim()]);
                        setNewTag('');
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Medications List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-600 uppercase">
                  Medications (Prescription)
                </label>
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Drug
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {medications.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-12 gap-2 items-center text-xs"
                  >
                    <div className="col-span-5 font-bold text-slate-900">{med.name}</div>
                    <div className="col-span-2 text-slate-600">{med.dosage}</div>
                    <div className="col-span-3 text-slate-600">{med.frequency}</div>
                    <div className="col-span-1 text-slate-500">{med.durationDays}d</div>
                    <div className="col-span-1 text-right">
                      <button
                        onClick={() => handleRemoveMedication(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Advice & Follow-Up */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Advice & Follow-Up Instructions
              </label>
              <textarea
                value={adviceNotes}
                onChange={(e) => setAdviceNotes(e.target.value)}
                rows={2}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:border-teal-600"
              />
            </div>
          </div>
        </div>

        {/* Right Col: Waiting Queue & Skipped Queue */}
        <div className="flex flex-col gap-4">
          {/* Waiting Patients */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase">
                Up Next in Line ({waitingQueue.length})
              </span>
              <span className="text-xs text-teal-700 font-semibold">Active Queue</span>
            </div>

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {waitingQueue.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">No waiting patients</div>
              ) : (
                waitingQueue.map((apt, index) => (
                  <div
                    key={apt.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${index === 0
                      ? 'border-teal-400 bg-teal-50/60 font-bold'
                      : 'border-slate-200 bg-slate-50 font-medium'
                      }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-slate-900">
                          #{apt.tokenNumber}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-700">{apt.slotStartTime}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase">{apt.state}</span>
                    </div>

                    {index === 0 && (
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                        Next Up
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Skipped Patients & Recall */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase">
                Skipped Patients ({skippedQueue.length})
              </span>
              <span className="text-xs text-amber-700 font-semibold">Can Recall</span>
            </div>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {skippedQueue.length === 0 ? (
                <div className="py-4 text-center text-slate-400 text-xs">No skipped patients</div>
              ) : (
                skippedQueue.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">Token #{apt.tokenNumber}</span>
                      <span className="text-slate-500 block text-[10px]">
                        Called earlier: {apt.slotStartTime}
                      </span>
                    </div>

                    <button
                      onClick={() => handleQueueAction('RECALL', { appointmentId: apt.id })}
                      className="py-1 px-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition"
                    >
                      Recall
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delay Modal */}
      {showDelayModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Report Queue Delay
            </h3>
            <p className="text-xs text-slate-500">
              Announce a consultation delay. All waiting patients will immediately receive an alert and revised &quot;Leave Home By&quot; time on their live tracker.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {['10', '15', '30'].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setCustomDelay(mins)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${customDelay === mins
                    ? 'border-amber-600 bg-amber-50 text-amber-900'
                    : 'border-slate-200 bg-white text-slate-700'
                    }`}
                >
                  +{mins} min
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowDelayModal(false)}
                className="py-2 px-3 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleQueueAction('REPORT_DELAY', { delayMinutes: customDelay });
                  setShowDelayModal(false);
                }}
                className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl"
              >
                Broadcast Delay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DoctorConsolePage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 text-sm">
          <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading doctor console...
        </div>
      }
    >
      <DoctorConsoleContent />
    </React.Suspense>
  );
}
