// lib/db.ts
// Simple file-based JSON database for applicant results
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export interface Applicant {
  id: string
  studentName: string
  program: string
  outcome: 'Meets Criteria' | 'Criteria Not Met' | 'Pending'
  ruleSummary: string
  transcript: Message[]
  createdAt: string
}

export interface Message {
  role: 'assistant' | 'user'
  content: string
}

const DB_PATH = path.join(process.cwd(), 'data', 'results.json')

function ensureDb(): void {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify([]))
}

export function getAllApplicants(): Applicant[] {
  ensureDb()
  const raw = fs.readFileSync(DB_PATH, 'utf-8')
  return JSON.parse(raw) as Applicant[]
}

export function getApplicantById(id: string): Applicant | undefined {
  return getAllApplicants().find(a => a.id === id)
}

export function saveApplicant(data: Omit<Applicant, 'id' | 'createdAt'>): Applicant {
  ensureDb()
  const applicants = getAllApplicants()
  const newApplicant: Applicant = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    ...data,
  }
  applicants.push(newApplicant)
  fs.writeFileSync(DB_PATH, JSON.stringify(applicants, null, 2))
  return newApplicant
}
