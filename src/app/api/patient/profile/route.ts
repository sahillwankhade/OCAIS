import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');
  const patientId = searchParams.get('patientId') || 'pat-1'; // Default to demo patient 1

  let patient = phone ? mockDb.getPatientByPhone(phone) : mockDb.getPatientById(patientId);

  if (!patient) {
    // Fallback to demo patient 1
    patient = mockDb.getPatientById('pat-1');
  }

  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  }

  const familyMembers = mockDb.getFamilyMembers(patient.id);

  return NextResponse.json({
    patient,
    familyMembers,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, patientId, fullName, relationship, age, gender } = body;

    if (action === 'ADD_FAMILY') {
      if (!patientId || !fullName || !relationship) {
        return NextResponse.json({ error: 'Missing required family details' }, { status: 400 });
      }

      const familyMember = mockDb.createFamilyMember({
        primaryPatientId: patientId,
        fullName,
        relationship,
        age: Number(age) || 20,
        gender: gender || 'MALE',
      });

      return NextResponse.json({ success: true, familyMember });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Operation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

