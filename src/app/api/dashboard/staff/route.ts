import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';

export async function GET(request: NextRequest) {
  const hospitalId = new URL(request.url).searchParams.get('hospitalId') || 'hosp-sahyadri';
  return NextResponse.json({ staff: mockDb.getStaff(hospitalId) });
}

export async function PATCH(request: NextRequest) {
  const { staffId } = await request.json();
  if (typeof staffId !== 'string') return NextResponse.json({ error: 'staffId is required' }, { status: 400 });
  const staff = mockDb.toggleStaffAttendance(staffId);
  return staff ? NextResponse.json({ staff }) : NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
}
