'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/session')
      .then(async (response) => {
        if (!response.ok) {
          router.replace('/hospital/login');
          return null;
        }
        return response.json();
      })
      .then((data) => {
        if (data?.session && ['doctor', 'receptionist', 'admin'].includes(data.session.role)) {
          setRole(data.session.role);
          if (data.session.hospitalId) setHospitalId(data.session.hospitalId);
        } else if (data) {
          router.replace('/hospital/login');
        }
      })
      .finally(() => setReady(true));
  }, [router]);

  if (!ready) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading hospital portal...</div>;
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
