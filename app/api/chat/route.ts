// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getKnowledgeBaseText, ensureVectorStore } from '@/lib/vectorStore'
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
10. YOU MUST append the following JSON block at the very END of your message when you announce the result. This is MANDATORY — the system cannot record the result without it. Use the ACTUAL values from the conversation:

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
- ALWAYS include the ELIGIBILITY_RESULT block in the same message where you announce "Meets Criteria" or "Criteria Not Met". Never announce the result without it.
- In the ELIGIBILITY_RESULT JSON, always use the student's real name from the conversation — never write the word "name" or use brackets.
- After giving the result, thank the student and let them know the admin team will be in touch.`
}

function extractFromTranscript(messages: Message[]): { studentName: string; program: string } {
  let studentName = 'Anonymous'
  let program = 'Unknown'

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    // AI asks for name → next user message is the name
    if (msg.role === 'assistant' && /your (full )?name/i.test(msg.content)) {
      const next = messages[i + 1]
      if (next?.role === 'user' && next.content.trim().length < 60) {
        studentName = next.content.trim()
      }
    }
    if (msg.role === 'user') {
      if (/business administration/i.test(msg.content)) program = 'Business Administration'
      else if (/computer science/i.test(msg.content)) program = 'Computer Science'
    }
    // Also check assistant messages that confirm the program
    if (msg.role === 'assistant') {
      if (/business administration/i.test(msg.content)) program = 'Business Administration'
      else if (/computer science/i.test(msg.content)) program = 'Computer Science'
    }
  }

  return { studentName, program }
}

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: Message[] } = await req.json()

    // Load knowledge base text from DB on cold start if needed
    await ensureVectorStore()

    const context = getKnowledgeBaseText() || FALLBACK_KNOWLEDGE

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

    const resultMatch = assistantMessage.match(/<ELIGIBILITY_RESULT>([\s\S]*?)<\/ELIGIBILITY_RESULT>/)
    const hasDecisionPhrase = /meets criteria|criteria not met/i.test(assistantMessage)
    const isDecision = !!(resultMatch || hasDecisionPhrase)
    let savedId: string | null = null

    if (isDecision) {
      const fullTranscript: Message[] = [
        ...messages,
        { role: 'assistant', content: assistantMessage },
      ]

      let studentName = 'Anonymous'
      let program = 'Unknown'
      let outcome: 'Meets Criteria' | 'Criteria Not Met' | 'Pending' = 'Pending'
      let ruleSummary = ''

      if (resultMatch) {
        try {
          const resultData = JSON.parse(resultMatch[1].trim())
          studentName = resultData.studentName || 'Anonymous'
          program = resultData.program || 'Unknown'
          outcome = resultData.outcome || 'Pending'
          ruleSummary = resultData.ruleSummary || ''
        } catch {
          // JSON malformed — fall back to transcript extraction below
          const extracted = extractFromTranscript(fullTranscript)
          studentName = extracted.studentName
          program = extracted.program
          outcome = /meets criteria/i.test(assistantMessage) ? 'Meets Criteria' : 'Criteria Not Met'
        }
      } else {
        // AI gave verbal decision without the JSON block
        const extracted = extractFromTranscript(fullTranscript)
        studentName = extracted.studentName
        program = extracted.program
        outcome = /meets criteria/i.test(assistantMessage) ? 'Meets Criteria' : 'Criteria Not Met'
      }

      try {
        const saved = await saveApplicant({ studentName, program, outcome, ruleSummary, transcript: fullTranscript })
        savedId = saved.id
      } catch (e) {
        console.error('Failed to save eligibility result:', e)
        // Don't block the response — the student still sees their result
      }
    }

    // Clean the response to remove the JSON block before sending to user
    const cleanMessage = assistantMessage
      .replace(/<ELIGIBILITY_RESULT>[\s\S]*?<\/ELIGIBILITY_RESULT>/g, '')
      .trim()

    return NextResponse.json({
      message: cleanMessage,
      isComplete: isDecision,
      applicantId: savedId,
    })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
