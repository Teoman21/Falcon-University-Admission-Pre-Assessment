// lib/vectorStore.ts
// In-memory vector store with Neon DB persistence for cold-start recovery
import OpenAI from 'openai'
import { saveKnowledgeBase, getKnowledgeBase } from './db'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface Chunk {
  text: string
  embedding: number[]
}

let chunks: Chunk[] = []
let knowledgeBaseText = ''

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

function splitIntoChunks(text: string, chunkSize = 800, overlap = 150): string[] {
  const result: string[] = []
  let start = 0
  while (start < text.length) {
    result.push(text.slice(start, Math.min(start + chunkSize, text.length)))
    start += chunkSize - overlap
  }
  return result
}

async function embed(text: string): Promise<number[]> {
  const resp = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  })
  return resp.data[0].embedding
}

async function buildChunks(text: string): Promise<void> {
  const parts = splitIntoChunks(text)
  chunks = []
  for (const part of parts) {
    chunks.push({ text: part, embedding: await embed(part) })
  }
}

export function getKnowledgeBaseText(): string {
  return knowledgeBaseText
}

export async function buildVectorStore(text: string): Promise<void> {
  knowledgeBaseText = text
  await buildChunks(text)
  // Persist to DB so cold starts can recover
  await saveKnowledgeBase(text)
}

/**
 * Ensures vector store is ready — rebuilds from DB on cold start if needed.
 */
export async function ensureVectorStore(): Promise<void> {
  if (chunks.length > 0) return // already loaded
  const dbText = await getKnowledgeBase()
  if (dbText) {
    knowledgeBaseText = dbText
    await buildChunks(dbText)
  }
}

export async function retrieveContext(query: string, k = 4): Promise<string> {
  if (chunks.length === 0) return ''
  const queryEmbedding = await embed(query)
  const scored = chunks
    .map(c => ({ text: c.text, score: cosineSimilarity(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, k).map(c => c.text).join('\n\n---\n\n')
}

export function isVectorStoreReady(): boolean {
  return chunks.length > 0
}
