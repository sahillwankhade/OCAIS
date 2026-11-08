'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDashboardRole } from '@/components/dashboard/DashboardHeader';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Activity,
  ArrowRight,
  Stethoscope,
  QrCode,
  Tv,
} from 'lucide-react';
import { Doctor } from '@/lib/types';

interface DashboardMetrics {
  totalAppointments: number;
  inConsult: number;
  waiting: number;
  completed: number;
  revenueToday: number;
  avgConsultDurationMinutes: number;
}

interface DoctorQueueSummary {
  doctor: Doctor;
  totalToday: number;
  currentServing: number | null;
  nextUp: number | null;
  waitingCount: number;
  status: string;
}

export default function DashboardOverviewPage() {
  const { hospitalId } = useDashboardRole();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [doctorQueues, setDoctorQueues] = useState<DoctorQueueSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        setLoading(true);
        const res = await fetch(`/api/dashboard/overview?hospitalId=${hospitalId}`);
        const data = await res.json();
        setMetrics(data.metrics);
        setDoctorQueues(data.doctorQueues || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, [hospitalId]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Today&apos;s Operations Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Realtime OPD queue monitoring, consultation tracking, and revenue metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/reception"
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            + New Walk-In
          </Link>
          <Link
            href="/dashboard/consultation"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            Open Doctor Console
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: 'Total Appointments',
            value: metrics?.totalAppointments ?? 0,
            icon: Users,
            color: 'text-blue-700',
            bg: 'bg-blue-50',
          },
          {
            label: 'In Cabin Consult',
            value: metrics?.inConsult ?? 0,
            icon: Activity,
            color: 'text-emerald-700',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Waiting in Lounge',
            value: metrics?.waiting ?? 0,
            icon: Clock,
            color: 'text-amber-700',
            bg: 'bg-amber-50',
          },
          {
            label: 'Completed Today',
            value: metrics?.completed ?? 0,
            icon: CheckCircle2,
            color: 'text-slate-700',
            bg: 'bg-slate-100',
          },
          {
            label: 'Today Revenue',
            value: `₹${metrics?.revenueToday ?? 0}`,
            icon: IndianRupee,
            color: 'text-teal-700',
            bg: 'bg-teal-50',
          },
          {
            label: 'Avg Duration',
            value: `${metrics?.avgConsultDurationMinutes ?? 8}m`,
            icon: Clock,
            color: 'text-purple-700',
            bg: 'bg-purple-50',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                  {card.label}
                </span>
                <div className={`p-1.5 rounded-lg ${card.bg} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Live Doctor Queues Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-700" />
            <h2 className="text-base font-bold text-slate-900">Doctor Cabins & Active Queues</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Real-time update</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Doctor & Specialization</th>
                <th className="py-3 px-4">Cabin</th>
                <th className="py-3 px-4 text-center">Now Serving</th>
                <th className="py-3 px-4 text-center">Next Up</th>
                <th className="py-3 px-4 text-center">Waiting Count</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading queues...
                  </td>
                </tr>
              ) : doctorQueues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No active doctors for this hospital.
                  </td>
                </tr>
              ) : (
                doctorQueues.map((item) => (
                  <tr key={item.doctor.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.doctor.fullName}</div>
                      <div className="text-xs text-slate-500">{item.doctor.specialization}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {item.doctor.cabinNumber}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.currentServing ? (
                        <span className="font-extrabold text-base text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          #{item.currentServing}
                        </span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.nextUp ? (
                        <span className="font-bold text-sm text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">
                          #{item.nextUp}
                        </span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      {item.waitingCount}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'PAUSED'
                            ? 'bg-rose-100 text-rose-800'
                            : item.status === 'DELAYED'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/scan/${item.doctor.id}`}
                          title="Cabin Scan Kiosk"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                        >
                          <QrCode className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/display/${item.doctor.id}`}
                          title="Waiting Room Display Board"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                        >
                          <Tv className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/consultation?doctorId=${item.doctor.id}`}
                          className="py-1 px-2.5 bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-lg transition"
                        >
                          Console
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

