import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';

export async function GET(request: NextRequest) {
  const hospitalId = new URL(request.url).searchParams.get('hospitalId') || 'hosp-sahyadri';
  return NextResponse.json({ forms: mockDb.getDigitalForms(hospitalId) });
}
