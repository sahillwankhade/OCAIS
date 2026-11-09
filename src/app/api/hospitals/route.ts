import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';
import { getSession, requireSession } from '@/lib/security/access';
import {
  isSupabaseDatabaseEnabled,
  listSupabaseDoctors,
  listSupabaseHospitals,
  replaceSupabaseHospitalHolidays,
  updateSupabaseHospital,
} from '@/lib/data/supabase-repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    const specialty = searchParams.get('specialty')?.toLowerCase() || '';
    const hospitalId = searchParams.get('hospitalId');
    const session = getSession(req);
    if (process.env.NODE_ENV === 'production' && session && ['doctor', 'receptionist', 'admin'].includes(session.role)
      && hospitalId && hospitalId !== session.hospitalId) {
      return NextResponse.json({ error: 'Hospital access denied' }, { status: 403 });
    }

    const [allHospitals, doctors] = isSupabaseDatabaseEnabled()
      ? await Promise.all([listSupabaseHospitals(), listSupabaseDoctors(hospitalId || undefined)])
      : [mockDb.getHospitals(), mockDb.getDoctors(hospitalId || undefined)];
    const hospitals = allHospitals.filter((hospital) => !hospitalId || hospital.id === hospitalId);

    // Attach doctors to hospital records for convenient client browsing
    const enrichedHospitals = hospitals.map((hosp) => ({
      ...hosp,
      doctors: doctors.filter((doc) => doc.hospitalId === hosp.id),
    }));

    let filtered = enrichedHospitals;

    if (query) {
      filtered = filtered.filter(
        (h) =>
          h.name.toLowerCase().includes(query) ||
          h.city.toLowerCase().includes(query) ||
          h.doctors.some(
            (d) =>
              d.fullName.toLowerCase().includes(query) ||
              d.specialization.toLowerCase().includes(query)
          )
      );
    }

    if (specialty) {
      filtered = filtered.filter((h) =>
        h.doctors.some((d) => d.specialization.toLowerCase().includes(specialty))
      );
    }

    return NextResponse.json({
      hospitals: filtered,
      doctors,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load hospitals' },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { hospitalId, openingTime, closingTime, address, phone, email, holidays } = body;
    if (!hospitalId) return NextResponse.json({ error: 'hospitalId is required' }, { status: 400 });
    const session = requireSession(req, ['admin']);
    if (session instanceof NextResponse) return session;
    if (session.hospitalId && session.hospitalId !== hospitalId) {
      return NextResponse.json({ error: 'Hospital access denied' }, { status: 403 });
    }
    if (typeof openingTime !== 'undefined' && !/^\d{2}:\d{2}$/.test(openingTime)) {
      return NextResponse.json({ error: 'Invalid opening time' }, { status: 400 });
    }
    if (typeof closingTime !== 'undefined' && !/^\d{2}:\d{2}$/.test(closingTime)) {
      return NextResponse.json({ error: 'Invalid closing time' }, { status: 400 });
    }
    if (isSupabaseDatabaseEnabled()) {
      const hospital = await updateSupabaseHospital(hospitalId, {
        openingTime,
        closingTime,
        address,
        phone,
        email,
      });
      if (!hospital) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
      const mappedHolidays = Array.isArray(holidays)
        ? holidays.map((date: string) => ({ date }))
        : undefined;
      const savedHolidays = mappedHolidays
        ? await replaceSupabaseHospitalHolidays(hospitalId, mappedHolidays)
        : undefined;
      return NextResponse.json({ hospital, ...(savedHolidays ? { holidays: savedHolidays } : {}) });
    }
    const hospital = mockDb.updateHospital(hospitalId, {
      openingTime,
      closingTime,
      address,
      phone,
      email,
    });
    if (!hospital) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    if (Array.isArray(holidays)) mockDb.updateHospitalHolidays(hospitalId, holidays);
    return NextResponse.json({
      hospital,
      holidays: mockDb.getHospitalHolidays(hospitalId),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update hospital' },
      { status: 400 }
    );
  }
}
