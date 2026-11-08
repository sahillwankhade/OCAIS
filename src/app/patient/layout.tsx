import React from 'react';
import { I18nProvider } from '@/lib/i18n/context';
import { PatientBottomNav } from '@/components/patient/PatientBottomNav';

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl relative flex flex-col">
          {children}
          <PatientBottomNav />
        </div>
      </div>
    </I18nProvider>
  );
}

