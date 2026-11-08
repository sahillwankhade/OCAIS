'use client';

import React, { useState, useEffect } from 'react';
import { useDashboardRole } from '@/components/dashboard/DashboardHeader';
import { BarChart3, Users, IndianRupee, Clock, TrendingUp, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const { hospitalId } = useDashboardRole();

  const [dateRange, setDateRange] = useState('TODAY');

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            OPD patient footfall, income generated, and consultation duration benchmarks
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {['TODAY', 'THIS_WEEK', 'THIS_MONTH'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`py-1.5 px-3 text-xs font-bold rounded-lg transition ${
                dateRange === range
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {range.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Patient Footfall</span>
            <Users className="w-5 h-5 text-teal-700" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">142</div>
          <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+12% vs last week</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total OPD Income</span>
            <IndianRupee className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">₹78,500</div>
          <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>94% collected via Online Mock / UPI</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Avg Consultation Duration</span>
            <Clock className="w-5 h-5 text-purple-700" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">9.8 min</div>
          <div className="text-xs text-slate-500 mt-1">Based on doctor completion timestamps</div>
        </div>
      </div>

      {/* Specialty Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Specialty Performance & Wait Times</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Specialty</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4 text-center">Consultations</th>
                <th className="py-3 px-4 text-center">Avg Duration</th>
                <th className="py-3 px-4 text-center">Avg Queue Wait</th>
                <th className="py-3 px-4 text-right">Income</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                {
                  specialty: 'General Medicine',
                  doctor: 'Dr. Rajesh Sharma',
                  count: 42,
                  duration: '10 min',
                  wait: '14 min',
                  income: '₹21,000',
                },
                {
                  specialty: 'Pediatrics',
                  doctor: 'Dr. Sneha Kulkarni',
                  count: 36,
                  duration: '12 min',
                  wait: '18 min',
                  income: '₹21,600',
                },
                {
                  specialty: 'Orthopedics',
                  doctor: 'Dr. Amit Deshmukh',
                  count: 28,
                  duration: '15 min',
                  wait: '22 min',
                  income: '₹22,400',
                },
                {
                  specialty: 'Cardiology',
                  doctor: 'Dr. Priya Nair',
                  count: 20,
                  duration: '15 min',
                  wait: '19 min',
                  income: '₹20,000',
                },
              ].map((row) => (
                <tr key={row.doctor} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{row.specialty}</td>
                  <td className="py-3 px-4 text-slate-700">{row.doctor}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-900">{row.count}</td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-700">
                    {row.duration}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-teal-700">{row.wait}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{row.income}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

