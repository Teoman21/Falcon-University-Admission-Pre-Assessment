'use client'
// app/interview/page.tsx
import { useState, useEffect, useRef, FormEvent } from 'react'
import type { Message } from '@/lib/db'

type ChatMessage = Message & { id: string }

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0 shadow-lg">
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
        </svg>
      </div>
      <div className="glass px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex items-center gap-1.5">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  )
}

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isAssistant = msg.role === 'assistant'
  return (
    <div className={`flex items-end gap-2 chat-bubble ${isAssistant ? '' : 'flex-row-reverse'}`}>
      {isAssistant && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0 shadow-lg">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
          </svg>
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isAssistant
            ? 'glass text-white/90 rounded-bl-sm'
            : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm shadow-lg shadow-blue-900/40'
        }`}
      >
        {msg.content}
      </div>
      {!isAssistant && (
        <div className="w-8 h-8 rounded-full bg-slate-600/80 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
          </svg>
        </div>
      )}
    </div>
  )
}

export default function InterviewPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  async function startInterview() {
    setHasStarted(true)
    setIsLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      })
      const data = await res.json()
      const greeting: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
      }
      setMessages([greeting])
    } catch {
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'I apologize, I\'m having trouble connecting. Please refresh and try again.',
      }
      setMessages([errMsg])
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  async function sendMessage(e?: FormEvent) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || isLoading || isComplete) return

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
      }
      setMessages(prev => [...prev, assistantMsg])
      if (data.isComplete) {
        setIsComplete(true)
      }
    } catch {
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute -top-60 -right-60 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-60 -left-60 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(59,130,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Header */}
      <header className="glass-dark border-b border-white/8 relative z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5"/>
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Falcon University</h1>
              <p className="text-xs text-white/40">Admission Pre-Assessment</p>
            </div>
          </div>
          {isComplete && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 animate-fade-in">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-emerald-400 text-xs font-medium">Interview Complete</span>
            </div>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 relative z-10 flex flex-col max-w-3xl mx-auto w-full px-4 py-6">
        {!hasStarted ? (
          /* Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-fade-in">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center shadow-2xl shadow-blue-900/50 mb-8 glow-blue">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Welcome to Falcon University</h2>
            <p className="text-white/50 max-w-md mb-2 leading-relaxed">
              Our AI admissions officer will guide you through a short eligibility pre-assessment for your program of interest.
            </p>
            <p className="text-white/30 text-sm mb-10 max-w-sm">
              The interview takes approximately 3–5 minutes. Please have your academic information ready.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-10 w-full max-w-sm">
              {[
                { icon: '🎓', label: 'GPA' },
                { icon: '📝', label: 'Test Scores' },
                { icon: '📚', label: 'Coursework' },
              ].map(item => (
                <div key={item.label} className="glass rounded-xl px-3 py-3 text-center">
                  <div className="text-xl mb-1">{item.icon}</div>
                  <div className="text-xs text-white/40">{item.label}</div>
                </div>
              ))}
            </div>
            <button
              id="begin-interview-btn"
              onClick={startInterview}
              className="btn-primary text-base px-10 py-4"
            >
              Begin Interview
            </button>
          </div>
        ) : (
          /* Chat Interface */
          <div className="flex flex-col flex-1">
            <div className="flex-1 space-y-4 pb-4 overflow-y-auto">
              {messages.map(msg => (
                <ChatBubble key={msg.id} msg={msg} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="mt-4">
              {isComplete ? (
                <div className="glass rounded-2xl p-6 text-center animate-slide-up">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <p className="text-white font-semibold mb-1">Assessment Complete</p>
                  <p className="text-white/40 text-sm">Your results have been recorded. You may close this window.</p>
                </div>
              ) : (
                <form onSubmit={sendMessage} className="flex gap-3">
                  <input
                    ref={inputRef}
                    id="chat-input"
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type your response..."
                    disabled={isLoading || isComplete}
                    className="input-field flex-1"
                    autoComplete="off"
                  />
                  <button
                    id="send-btn"
                    type="submit"
                    disabled={isLoading || !input.trim() || isComplete}
                    className="w-12 h-12 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 flex-shrink-0"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                    </svg>
                  </button>
                </form>
              )}
              <p className="text-center text-white/15 text-xs mt-3">
                Falcon University — AI Admission Pre-Assessment System
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
