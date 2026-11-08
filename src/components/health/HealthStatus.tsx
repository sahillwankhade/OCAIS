'use client';

import { useEffect, useState } from 'react';

type Health = { status: string; supabase: string; realtime: string; mode: string };

export function HealthStatus({ appName }: { appName: string }) {
  const [health, setHealth] = useState<Health | null>(null);
  useEffect(() => {
    fetch('/api/health').then((response) => response.json()).then(setHealth).catch(() => setHealth({
      status: 'unhealthy', supabase: 'unreachable', realtime: 'unknown', mode: 'unknown',
    }));
  }, []);
  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <h1 className="text-2xl font-bold">{appName} health</h1>
      <p className="mt-2 text-slate-600">Deployment readiness and service connectivity.</p>
      {!health ? <p className="mt-6">Checking services...</p> : (
        <dl className="mt-6 max-w-lg space-y-3 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex justify-between"><dt>Status</dt><dd className="font-bold">{health.status}</dd></div>
          <div className="flex justify-between"><dt>Supabase</dt><dd>{health.supabase}</dd></div>
          <div className="flex justify-between"><dt>Realtime</dt><dd>{health.realtime}</dd></div>
          <div className="flex justify-between"><dt>Runtime mode</dt><dd>{health.mode}</dd></div>
        </dl>
      )}
    </main>
  );
}
