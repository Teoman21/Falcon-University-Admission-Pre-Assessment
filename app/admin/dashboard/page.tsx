'use client'
// app/admin/dashboard/page.tsx
import { useState, useEffect, useRef, useCallback, DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { Applicant, Message } from '@/lib/db'

// ─── Transcript Drawer ────────────────────────────────────────────────────────
function TranscriptDrawer({
  applicant,
  onClose,
}: {
  applicant: Applicant
  onClose: () => void
}) {
  const outcomeClass =
    applicant.outcome === 'Meets Criteria' ? 'badge-success' : 'badge-error'

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer-panel shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">{applicant.studentName}</h2>
            <p className="text-white/50 text-sm mt-0.5">{applicant.program}</p>
            <span className={`${outcomeClass} mt-2 inline-block`}>{applicant.outcome}</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Rule Summary */}
        {applicant.ruleSummary && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-white/5 border border-white/8">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1">Decision Rationale</p>
            <p className="text-white/80 text-sm">{applicant.ruleSummary}</p>
          </div>
        )}

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">
            Conversation Transcript
          </p>
          {applicant.transcript.map((msg: Message, i: number) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                  </svg>
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'assistant'
                    ? 'bg-white/8 text-white/90 rounded-tl-sm'
                    : 'bg-blue-600/80 text-white rounded-tr-sm'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0 ml-2 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10 text-center">
          <p className="text-white/25 text-xs">
            Interview completed {new Date(applicant.createdAt).toLocaleString()}
          </p>
        </div>
      </aside>
    </>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'idle'
    message: string
  }>({ type: 'idle', message: '' })
  const [isDragOver, setIsDragOver] = useState(false)
  const [pdfUploaded, setPdfUploaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch('/api/results')
      if (res.ok) {
        const data = await res.json()
        setApplicants(data)
      }
    } catch {
      // silent fail for background poll
    }
  }, [])

  useEffect(() => {
    fetchResults()
    pollIntervalRef.current = setInterval(fetchResults, 8000)
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [fetchResults])

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  async function uploadFile(file: File) {
    if (!file || file.type !== 'application/pdf') {
      setUploadStatus({ type: 'error', message: 'Please upload a valid PDF file.' })
      return
    }
    setUploading(true)
    setUploadStatus({ type: 'idle', message: '' })
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setPdfUploaded(true)
        setUploadStatus({
          type: 'success',
          message: `✓ "${file.name}" loaded — ${data.pages} pages, ${data.charCount.toLocaleString()} characters indexed.`,
        })
      } else {
        setUploadStatus({ type: 'error', message: data.error || 'Upload failed.' })
      }
    } catch {
      setUploadStatus({ type: 'error', message: 'Network error. Please try again.' })
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(true)
  }

  // Computed stats
  const totalApplicants = applicants.length
  const eligible = applicants.filter(a => a.outcome === 'Meets Criteria').length
  const notEligible = applicants.filter(a => a.outcome === 'Criteria Not Met').length

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="glass-dark border-b border-white/8 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5"/>
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Falcon University</h1>
              <p className="text-xs text-white/40">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="relative w-2 h-2">
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                <div className="relative w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <span className="text-emerald-400 text-xs font-medium">Live</span>
            </div>
            <button onClick={handleLogout} className="btn-danger text-sm">
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">Total Applicants</p>
            <p className="text-4xl font-bold text-white">{totalApplicants}</p>
            <p className="text-white/30 text-xs">All interviews completed</p>
          </div>
          <div className="stat-card">
            <p className="text-emerald-400/80 text-xs font-semibold uppercase tracking-widest">Meets Criteria</p>
            <p className="text-4xl font-bold text-emerald-400">{eligible}</p>
            <p className="text-white/30 text-xs">Eligible to proceed</p>
          </div>
          <div className="stat-card">
            <p className="text-red-400/80 text-xs font-semibold uppercase tracking-widest">Criteria Not Met</p>
            <p className="text-4xl font-bold text-red-400">{notEligible}</p>
            <p className="text-white/30 text-xs">Did not qualify</p>
          </div>
        </div>

        {/* Action Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <h2 className="font-semibold text-white">Knowledge Base</h2>
            </div>

            <div
              className={`upload-zone ${isDragOver ? 'dragover' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
                id="pdf-upload-input"
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <svg className="animate-spin w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <p className="text-white/60 text-sm">Processing PDF...</p>
                </div>
              ) : pdfUploaded ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <p className="text-emerald-400 font-medium text-sm">PDF Indexed</p>
                  <p className="text-white/30 text-xs">Click to replace</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                  <div>
                    <p className="text-white/60 font-medium">Drop PDF here or click to upload</p>
                    <p className="text-white/30 text-xs mt-1">Admissions requirements document</p>
                  </div>
                  <button id="upload-btn" className="btn-primary text-sm mt-2" onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}>
                    Upload Requirements PDF
                  </button>
                </div>
              )}
            </div>

            {uploadStatus.type !== 'idle' && (
              <div className={`mt-3 px-4 py-2.5 rounded-xl text-sm animate-fade-in ${
                uploadStatus.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}>
                {uploadStatus.message}
              </div>
            )}
          </div>

          {/* Start Interview */}
          <div className="glass rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <h2 className="font-semibold text-white">Student Interview</h2>
            </div>
            <div className="space-y-4">
              <p className="text-white/50 text-sm leading-relaxed">
                Launch the AI-powered interview session. The chatbot will guide the student through an eligibility assessment based on the uploaded requirements.
              </p>
              <div className="space-y-2 text-xs text-white/30">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  AI greets and interviews the student
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  RAG retrieves relevant requirements
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Eligibility result saved automatically
                </div>
              </div>
              <button
                id="start-interview-btn"
                onClick={() => window.open('/interview', '_blank')}
                className="btn-gold w-full flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Start Interview
              </button>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <h2 className="font-semibold text-white">Applicant Results</h2>
              <span className="px-2 py-0.5 rounded-full text-xs bg-white/8 text-white/50">
                {totalApplicants} total
              </span>
            </div>
            <button
              onClick={fetchResults}
              title="Refresh"
              className="text-white/30 hover:text-white/70 transition-colors p-2 hover:bg-white/5 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-widest">Student Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-widest">Program</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-widest">Outcome</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-widest">Rule Summary</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-widest">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-white/30 uppercase tracking-widest">Transcript</th>
                </tr>
              </thead>
              <tbody>
                {applicants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-white/20">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                      </svg>
                      <p className="text-sm">No interviews completed yet</p>
                      <p className="text-xs mt-1 text-white/15">Start an interview to see results here</p>
                    </td>
                  </tr>
                ) : (
                  applicants
                    .slice()
                    .reverse()
                    .map(applicant => (
                      <tr key={applicant.id} className="table-row">
                        <td className="px-6 py-4">
                          <span className="font-medium text-white">{applicant.studentName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white/60 text-sm">{applicant.program}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={applicant.outcome === 'Meets Criteria' ? 'badge-success' : 'badge-error'}>
                            {applicant.outcome}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white/50 text-sm max-w-xs block truncate">{applicant.ruleSummary}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white/30 text-xs">
                            {new Date(applicant.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedApplicant(applicant)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/40 transition-all"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Transcript Drawer */}
      {selectedApplicant && (
        <TranscriptDrawer
          applicant={selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
        />
      )}
    </div>
  )
}
