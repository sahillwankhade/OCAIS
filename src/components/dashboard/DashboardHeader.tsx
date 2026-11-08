'use client';

import React, { createContext, useContext, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  LayoutDashboard,
  Stethoscope,
  ClipboardList,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Shield,
  Hospital,
} from 'lucide-react';
import { UserRole } from '@/lib/types';

interface DashboardRoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  hospitalId: string;
  setHospitalId: (id: string) => void;
}

export const DashboardRoleContext = createContext<DashboardRoleContextType>({
  role: 'doctor',
  setRole: () => {},
  hospitalId: 'hosp-sahyadri',
  setHospitalId: () => {},
});

export function useDashboardRole() {
  return useContext(DashboardRoleContext);
}

export function DashboardHeader() {
  const pathname = usePathname();
  const { role, setRole, hospitalId, setHospitalId } = useDashboardRole();

  const navLinks = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/consultation', label: 'Doctor Console', icon: Stethoscope },
    { href: '/dashboard/reception', label: 'Reception Desk', icon: ClipboardList },
    { href: '/dashboard/calendar', label: 'Calendar & Slots', icon: Calendar },
    { href: '/dashboard/patients', label: 'Patient Directory', icon: Users },
    { href: '/dashboard/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { href: '/dashboard/staff', label: 'Staff & Forms', icon: Users },
    { href: '/dashboard/settings', label: 'Settings & Audit', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      {/* Top Bar with Hospital Branding & Role Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-800 text-white font-bold flex items-center justify-center text-lg">
              +
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base leading-tight block">
                One Click AIS
              </span>
              <span className="text-[11px] font-semibold text-teal-800 block">
                Hospital Command Center
              </span>
            </div>
          </Link>

          {/* Hospital Selector */}
          <div className="hidden sm:flex items-center gap-1.5 ml-4 pl-4 border-l border-slate-200">
            <Hospital className="w-4 h-4 text-slate-400" />
            <select
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer"
            >
              <option value="hosp-sahyadri">Sahyadri Care Hospital (Pune)</option>
              <option value="hosp-arogya">Arogya Clinic (Mumbai)</option>
            </select>
          </div>
        </div>

        {/* Demo Role Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Role:</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {(['doctor', 'receptionist', 'admin'] as UserRole[]).map((r) => {
              const isSelected = role === r;
              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg capitalize transition ${
                    isSelected
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>

          <Link
            href="/patient"
            className="text-xs font-bold text-teal-700 hover:text-teal-800 ml-2 px-2.5 py-1 rounded-lg border border-teal-200 hidden md:inline"
          >
            Switch to Patient App →
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto scrollbar-none py-1.5">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isActive
                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
