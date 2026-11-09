import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/data';
import { forbiddenIfPatientMismatch, getSession } from '@/lib/security/access';
import {
  createSupabaseFamilyMember,
  getSupabasePatientById,
  isSupabaseDatabaseEnabled,
  listSupabaseFamilyMembers,
  patientHasHospitalAppointment,
} from '@/lib/data/supabase-repository';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');
  const session = getSession(req);
  if (process.env.NODE_ENV === 'production' && !session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  const requestedPatientId = searchParams.get('patientId');
  let patientId: string;
  if (session?.role === 'patient') {
    patientId = session.subjectId;
  } else if (session && ['doctor', 'receptionist', 'admin'].includes(session.role)
    && session.hospitalId && requestedPatientId) {
    patientId = requestedPatientId;
    if (isSupabaseDatabaseEnabled()
      && !await patientHasHospitalAppointment(patientId, session.hospitalId)) {
      return NextResponse.json({ error: 'Patient has no appointment at this hospital' }, { status: 403 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  } else {
    patientId = requestedPatientId || 'pat-1';
  }
  const accessError = forbiddenIfPatientMismatch(req, patientId);
  if (accessError) return accessError;

  const patient = isSupabaseDatabaseEnabled()
    ? await getSupabasePatientById(patientId)
    : phone ? mockDb.getPatientByPhone(phone) : mockDb.getPatientById(patientId);

  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  }

  const familyMembers = isSupabaseDatabaseEnabled()
    ? await listSupabaseFamilyMembers(patient.id)
    : mockDb.getFamilyMembers(patient.id);

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
      const session = getSession(req);
      if (process.env.NODE_ENV === 'production' && (!session || session.role !== 'patient')) {
        return NextResponse.json({ error: 'Patient authentication required' }, { status: 401 });
      }
      const effectivePatientId = session?.role === 'patient' ? session.subjectId : patientId;
      const accessError = forbiddenIfPatientMismatch(req, effectivePatientId);
      if (accessError) return accessError;

      const familyMember = isSupabaseDatabaseEnabled()
        ? await createSupabaseFamilyMember({
            primaryPatientId: effectivePatientId,
            fullName,
            relationship,
            age: Number(age) || 20,
            gender: gender || 'MALE',
          })
        : mockDb.createFamilyMember({
        primaryPatientId: effectivePatientId,
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
