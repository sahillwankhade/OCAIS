'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setReady(true);
      return;
    }
    fetch('/api/auth/session')
      .then(async (response) => {
        if (!response.ok) {
          router.replace('/admin/login');
          return null;
        }
        return response.json();
      })
      .then((data) => {
        if (data?.session?.role !== 'superadmin') router.replace('/admin/login');
      })
      .finally(() => setReady(true));
  }, [pathname, router]);

  if (!ready) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading admin portal...</div>;
  return children;
}
