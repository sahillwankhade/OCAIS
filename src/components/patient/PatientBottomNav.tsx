'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Clock, CalendarCheck, User } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

export function PatientBottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const navItems = [
    { href: '/patient', label: 'Home', icon: Home },
    { href: '/patient/search', label: t.common.search.split(' ')[0], icon: Search },
    { href: '/patient/queue/demo', label: 'Live Queue', icon: Clock },
    { href: '/patient/appointments', label: 'Bookings', icon: CalendarCheck },
    { href: '/patient/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-2 safe-area-pb">
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/patient' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition min-h-[48px] ${
                isActive
                  ? 'text-teal-700 font-bold bg-teal-50/70'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[11px] mt-1 tracking-tight truncate max-w-full px-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

