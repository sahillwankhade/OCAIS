import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.toLowerCase() || '';
  const specialty = searchParams.get('specialty')?.toLowerCase() || '';
  const hospitalId = searchParams.get('hospitalId');

  const hospitals = mockDb.getHospitals().filter((hospital) => !hospitalId || hospital.id === hospitalId);
  const doctors = mockDb.getDoctors(hospitalId || undefined);

  // Attach doctors to hospital records for convenient client browsing
  const enrichedHospitals = hospitals.map((hosp) => {
    const hospDoctors = doctors.filter((doc) => doc.hospitalId === hosp.id);
    return {
      ...hosp,
      doctors: hospDoctors,
    };
  });

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
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { hospitalId, openingTime, closingTime, address, phone, email, holidays } = body;
    if (!hospitalId) return NextResponse.json({ error: 'hospitalId is required' }, { status: 400 });
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
