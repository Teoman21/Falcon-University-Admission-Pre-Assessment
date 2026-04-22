// lib/db.ts
// PostgreSQL via Neon serverless — replaces the JSON file DB
import { neon } from '@neondatabase/serverless'

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

function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  return neon(url)
}

export async function initDb(): Promise<void> {
  const sql = getDb()
  await sql`
    CREATE TABLE IF NOT EXISTS applicants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_name TEXT NOT NULL DEFAULT 'Anonymous',
      program TEXT,
      outcome TEXT,
      rule_summary TEXT,
      transcript JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS knowledge_base (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

export async function getAllApplicants(): Promise<Applicant[]> {
  const sql = getDb()
  await initDb()
  const rows = await sql`
    SELECT id, student_name, program, outcome, rule_summary, transcript, created_at
    FROM applicants
    ORDER BY created_at DESC
  `
  return rows.map(r => ({
    id: r.id,
    studentName: r.student_name,
    program: r.program,
    outcome: r.outcome,
    ruleSummary: r.rule_summary,
    transcript: r.transcript as Message[],
    createdAt: r.created_at,
  }))
}

export async function getApplicantById(id: string): Promise<Applicant | undefined> {
  const sql = getDb()
  await initDb()
  const rows = await sql`
    SELECT id, student_name, program, outcome, rule_summary, transcript, created_at
    FROM applicants
    WHERE id = ${id}
  `
  if (!rows[0]) return undefined
  const r = rows[0]
  return {
    id: r.id,
    studentName: r.student_name,
    program: r.program,
    outcome: r.outcome,
    ruleSummary: r.rule_summary,
    transcript: r.transcript as Message[],
    createdAt: r.created_at,
  }
}

export async function saveApplicant(
  data: Omit<Applicant, 'id' | 'createdAt'>
): Promise<Applicant> {
  const sql = getDb()
  await initDb()
  const rows = await sql`
    INSERT INTO applicants (student_name, program, outcome, rule_summary, transcript)
    VALUES (
      ${data.studentName},
      ${data.program},
      ${data.outcome},
      ${data.ruleSummary},
      ${JSON.stringify(data.transcript)}
    )
    RETURNING id, student_name, program, outcome, rule_summary, transcript, created_at
  `
  const r = rows[0]
  return {
    id: r.id,
    studentName: r.student_name,
    program: r.program,
    outcome: r.outcome,
    ruleSummary: r.rule_summary,
    transcript: r.transcript as Message[],
    createdAt: r.created_at,
  }
}

export async function saveKnowledgeBase(content: string): Promise<void> {
  const sql = getDb()
  await initDb()
  // Keep only one record — upsert pattern
  await sql`DELETE FROM knowledge_base`
  await sql`INSERT INTO knowledge_base (content) VALUES (${content})`
}

export async function getKnowledgeBase(): Promise<string | null> {
  const sql = getDb()
  await initDb()
  const rows = await sql`SELECT content FROM knowledge_base ORDER BY updated_at DESC LIMIT 1`
  return rows[0]?.content ?? null
}
