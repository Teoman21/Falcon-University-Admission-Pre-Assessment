// lib/vectorStore.ts
// In-memory vector store — uses OpenAI embeddings directly to avoid Next.js/LangChain import issues
import OpenAI from 'openai'

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
    const end = Math.min(start + chunkSize, text.length)
    result.push(text.slice(start, end))
    start += chunkSize - overlap
  }
  return result
}

async function embed(text: string): Promise<number[]> {
  const resp = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000), // max tokens guard
  })
  return resp.data[0].embedding
}

export function getKnowledgeBaseText(): string {
  return knowledgeBaseText
}

export async function buildVectorStore(text: string): Promise<void> {
  knowledgeBaseText = text
  const parts = splitIntoChunks(text)
  chunks = []
  for (const part of parts) {
    const embedding = await embed(part)
    chunks.push({ text: part, embedding })
  }
}

export async function retrieveContext(query: string, k = 4): Promise<string> {
  if (chunks.length === 0) return ''
  const queryEmbedding = await embed(query)
  const scored = chunks.map(c => ({
    text: c.text,
    score: cosineSimilarity(queryEmbedding, c.embedding),
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored
    .slice(0, k)
    .map(c => c.text)
    .join('\n\n---\n\n')
}

export function isVectorStoreReady(): boolean {
  return chunks.length > 0
}
