'use client'
// app/page.tsx — Role selection landing page
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-yellow-500/8 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      </div>
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 w-full max-w-lg px-6 text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-2xl shadow-blue-900/50 mb-6 glow-blue">
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5" />
          </svg>
        </div>

        <h1 className="text-4xl font-bold logo-shimmer mb-2">Falcon University</h1>
        <p className="text-white/40 mb-12 text-sm tracking-wide">Admission Pre-Assessment System</p>

        <p className="text-white/70 text-lg font-medium mb-8">Who are you?</p>

        <div className="grid grid-cols-2 gap-5">
          {/* Student card */}
          <button
            id="student-btn"
            onClick={() => router.push('/interview')}
            className="glass rounded-2xl p-8 flex flex-col items-center gap-4 border border-white/10
                       hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300
                       hover:-translate-y-1 active:translate-y-0 cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center
                            group-hover:bg-blue-600/40 transition-colors duration-300">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-white text-lg">Student</p>
              <p className="text-white/40 text-xs mt-1">Take the admission interview</p>
            </div>
            <div className="flex items-center gap-1 text-blue-400 text-xs font-medium group-hover:gap-2 transition-all">
              Start Interview
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>

          {/* Admin card */}
          <button
            id="admin-btn"
            onClick={() => router.push('/admin/login')}
            className="glass rounded-2xl p-8 flex flex-col items-center gap-4 border border-white/10
                       hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all duration-300
                       hover:-translate-y-1 active:translate-y-0 cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center
                            group-hover:bg-yellow-500/30 transition-colors duration-300">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-white text-lg">Admin</p>
              <p className="text-white/40 text-xs mt-1">Manage applicants & results</p>
            </div>
            <div className="flex items-center gap-1 text-yellow-400 text-xs font-medium group-hover:gap-2 transition-all">
              Sign In
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
        </div>

        <p className="text-white/20 text-xs mt-10">© 2025 Falcon University — Admission Pre-Assessment System</p>
      </div>
    </div>
  )
}
