'use client';

import React, { useState } from 'react';
import {
  DashboardHeader,
  DashboardRoleContext,
} from '@/components/dashboard/DashboardHeader';
import { UserRole } from '@/lib/types';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRole] = useState<UserRole>('doctor');
  const [hospitalId, setHospitalId] = useState<string>('hosp-sahyadri');

  return (
    <DashboardRoleContext.Provider
      value={{ role, setRole, hospitalId, setHospitalId }}
    >
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <DashboardHeader />
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
          {children}
        </div>
      </div>
    </DashboardRoleContext.Provider>
  );
}

