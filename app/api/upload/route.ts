// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { buildVectorStore } from '@/lib/vectorStore'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Dynamic import to avoid build issues
    const pdfParse = (await import('pdf-parse')).default
    const parsed = await pdfParse(buffer)
    const text = parsed.text

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: 'Could not extract text from PDF' }, { status: 422 })
    }

    await buildVectorStore(text)

    return NextResponse.json({
      success: true,
      pages: parsed.numpages,
      charCount: text.length,
      preview: text.slice(0, 300),
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 })
  }
}
