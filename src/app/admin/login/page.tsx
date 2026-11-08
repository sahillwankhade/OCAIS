'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
        <p className="text-sm font-bold text-teal-700">One Click AIS Platform</p>
        <h1 className="text-2xl font-black text-slate-900">Super-Admin Login</h1>
        <p className="text-sm text-slate-500">Full access to all hospitals, users, configuration, and platform data.</p>
        {error ? <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm">{error}</div> : null}
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Admin email" className="w-full border rounded-xl p-3" />
        <input required type="password" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="Admin PIN" className="w-full border rounded-xl p-3" />
        <button disabled={loading} className="w-full bg-slate-900 text-white rounded-xl p-3 font-bold disabled:bg-slate-400">{loading ? 'Signing in...' : 'Sign in as super-admin'}</button>
        <p className="text-xs text-slate-500">Development demo: admin@ocais.in / 123456</p>
      </form>
    </main>
  );
}
