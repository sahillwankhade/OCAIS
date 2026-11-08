import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const configured = Boolean(supabaseUrl);
  let supabase = 'not-configured';
  if (supabaseUrl) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, { cache: 'no-store' });
      supabase = response.ok || response.status === 401 ? 'reachable' : 'unhealthy';
    } catch {
      supabase = 'unreachable';
    }
  }
  return NextResponse.json({
    status: configured && supabase !== 'unhealthy' && supabase !== 'unreachable' ? 'ok' : 'degraded',
    supabase,
    realtime: configured ? 'configured' : 'not-configured',
    mode: process.env.USE_MOCK_SERVICES === 'false' ? 'production' : 'mock',
  }, { status: configured && supabase !== 'unreachable' ? 200 : 503 });
}
