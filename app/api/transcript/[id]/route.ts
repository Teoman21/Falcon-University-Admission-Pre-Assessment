// app/api/transcript/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getApplicantById } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const applicant = await getApplicantById(params.id)
  if (!applicant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(applicant)
}
