// app/api/results/route.ts
import { NextResponse } from 'next/server'
import { getAllApplicants } from '@/lib/db'

export async function GET() {
  try {
    const applicants = await getAllApplicants()
    return NextResponse.json(applicants)
  } catch (err) {
    console.error('Results error:', err)
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
  }
}
