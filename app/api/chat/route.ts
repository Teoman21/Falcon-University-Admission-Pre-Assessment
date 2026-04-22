// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { retrieveContext, isVectorStoreReady, getKnowledgeBaseText, ensureVectorStore } from '@/lib/vectorStore'
import { saveApplicant } from '@/lib/db'
import type { Message } from '@/lib/db'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Fallback knowledge base embedded directly for demo when no PDF is uploaded
const FALLBACK_KNOWLEDGE = `
Falcon University Admission Requirements

Programs Available:
1. Business Administration (BBA)
2. Computer Science (BS)

Business Administration Requirements:
- Minimum GPA: 3.0 out of 4.0 (or equivalent)
- SAT Score: 1100+ or ACT Score: 22+
- Required courses: Mathematics (pre-calculus or higher), English Composition
- Work experience: Not required but preferred
- English proficiency: TOEFL 80+ or IELTS 6.5+ for international students
- Personal statement required
- Two letters of recommendation

Computer Science Requirements:
- Minimum GPA: 3.2 out of 4.0 (or equivalent)  
- SAT Score: 1200+ or ACT Score: 25+
- Required courses: Mathematics (Calculus preferred), Physics or Chemistry
- Programming experience: Preferred but not required
- English proficiency: TOEFL 85+ or IELTS 7.0+ for international students
- Personal statement required
- Two letters of recommendation

Evaluation Process:
- The admissions officer will ask for: name, program of interest, GPA, standardized test scores, and relevant coursework
- Based on the requirements above, determine if the student meets the criteria
- Provide a clear, empathetic response with the outcome
`

function buildSystemPrompt(context: string): string {
  const kb = context || FALLBACK_KNOWLEDGE

  return `You are an AI Admissions Officer for Falcon University. Your role is to conduct a friendly, professional eligibility pre-assessment interview.

KNOWLEDGE BASE / REQUIREMENTS:
${kb}

YOUR INTERVIEW PROCESS:
1. Greet the student warmly and introduce yourself as Falcon University's AI Admissions Officer.
2. Ask for their full name.
3. Ask which program they are interested in: Business Administration or Computer Science.
4. Ask for their GPA (on a 4.0 scale).
5. Ask for their SAT or ACT score.
6. Ask about relevant coursework (math, science, etc.).
7. Once you have enough information, evaluate eligibility based STRICTLY on the requirements in the knowledge base above.
8. Announce the result clearly: either "Meets Criteria" or "Criteria Not Met".
9. Provide a brief explanation of the decision.
10. When you have made your final eligibility decision, append the following JSON block at the very END of your message. Replace every field with the ACTUAL values from the conversation — do NOT use placeholder text like [name] or [program]:

<ELIGIBILITY_RESULT>
{"studentName":"ACTUAL_STUDENT_NAME","program":"ACTUAL_PROGRAM","outcome":"Meets Criteria OR Criteria Not Met","ruleSummary":"ACTUAL 1-2 sentence reason based on their GPA, test scores, and coursework"}
</ELIGIBILITY_RESULT>

Example of a correct block:
<ELIGIBILITY_RESULT>
{"studentName":"Maria Lopez","program":"Computer Science","outcome":"Meets Criteria","ruleSummary":"Maria has a 3.5 GPA and a 1280 SAT score, both meeting the Computer Science thresholds of 3.2 GPA and 1200 SAT."}
</ELIGIBILITY_RESULT>

IMPORTANT RULES:
- Be warm, professional, and encouraging.
- Only ask ONE question at a time.
- Do NOT include the ELIGIBILITY_RESULT block until you have collected: name, program, GPA, test score, and coursework.
- In the ELIGIBILITY_RESULT JSON, always use the student's real name from the conversation — never write the word "name" or use brackets.
- After giving the result, thank the student and let them know the admin team will be in touch.`
}

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: Message[] } = await req.json()

    // Build the last 4 messages as query for RAG
    const recentText = messages
      .slice(-4)
      .map(m => m.content)
      .join(' ')

    // Rebuild vector store from DB on cold start if needed
    await ensureVectorStore()

    let context = ''
    if (isVectorStoreReady()) {
      context = await retrieveContext(recentText)
    } else {
      context = getKnowledgeBaseText() || FALLBACK_KNOWLEDGE
    }

    const systemPrompt = buildSystemPrompt(context)

    const openaiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 800,
    })

    const assistantMessage = completion.choices[0].message.content || ''

    // Parse eligibility result if present
    const resultMatch = assistantMessage.match(/<ELIGIBILITY_RESULT>([\s\S]*?)<\/ELIGIBILITY_RESULT>/)
    let savedId: string | null = null

    if (resultMatch) {
      try {
        const resultData = JSON.parse(resultMatch[1].trim())
        const fullTranscript: Message[] = [
          ...messages,
          { role: 'assistant', content: assistantMessage },
        ]
        const saved = await saveApplicant({
          studentName: resultData.studentName || 'Anonymous',
          program: resultData.program || 'Unknown',
          outcome: resultData.outcome || 'Pending',
          ruleSummary: resultData.ruleSummary || '',
          transcript: fullTranscript,
        })
        savedId = saved.id
      } catch (e) {
        console.error('Failed to save eligibility result:', e)
        return NextResponse.json({ error: 'Failed to save result to database' }, { status: 500 })
      }
    }

    // Clean the response to remove the JSON block before sending to user
    const cleanMessage = assistantMessage
      .replace(/<ELIGIBILITY_RESULT>[\s\S]*?<\/ELIGIBILITY_RESULT>/g, '')
      .trim()

    return NextResponse.json({
      message: cleanMessage,
      isComplete: !!resultMatch,
      applicantId: savedId,
    })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
