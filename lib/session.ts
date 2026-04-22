// lib/session.ts
// Simple cookie-based admin session
import { cookies } from 'next/headers'

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'falcon2024',
}

const SESSION_COOKIE = 'falcon_admin_session'
const SESSION_VALUE = 'authenticated'

export function validateCredentials(username: string, password: string): boolean {
  return username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE
}

export function getSessionValue(): string {
  return SESSION_VALUE
}

export function isAdminAuthenticated(): boolean {
  const cookieStore = cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  return session?.value === SESSION_VALUE
}
