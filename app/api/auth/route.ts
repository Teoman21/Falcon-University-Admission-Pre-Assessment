// app/api/auth/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateCredentials, getSessionCookieName, getSessionValue } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!validateCredentials(username, password)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(getSessionCookieName(), getSessionValue(), {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete(getSessionCookieName())
  return response
}
