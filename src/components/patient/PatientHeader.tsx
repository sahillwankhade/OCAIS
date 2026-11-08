'use client';

import React from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { SupportedLocale } from '@/lib/i18n/types';
import { Globe, Shield, ArrowLeft } from 'lucide-react';

interface PatientHeaderProps {
  title?: string;
  showBack?: boolean;
}

export function PatientHeader({ title, showBack }: PatientHeaderProps) {
  const { locale, setLocale, t } = useI18n();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack ? (
            <button
              onClick={() => window.history.back()}
              className="p-2 -ml-2 rounded-xl text-slate-700 hover:bg-slate-100 flex items-center justify-center min-h-[44px] min-w-[44px]"
              aria-label={t.common.back}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : null}

          <Link href="/patient" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center text-white font-bold text-lg">
              +
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base leading-tight block">
                {title || t.common.appName}
              </span>
              <span className="text-[11px] text-teal-700 font-medium block">
                India Health Live Queue
              </span>
            </div>
          </Link>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as SupportedLocale)}
            className="bg-transparent text-xs font-semibold text-slate-800 py-1 pr-2 outline-none cursor-pointer"
            aria-label="Language"
          >
            <option value="en">EN</option>
            <option value="hi">हिन्दी</option>
            <option value="mr">मराठी</option>
          </select>
        </div>
      </div>
    </header>
  );
}

