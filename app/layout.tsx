// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Falcon University — Admission Pre-Assessment',
  description: 'AI-powered admission eligibility pre-assessment system for Falcon University applicants.',
  keywords: 'Falcon University, admission, eligibility, pre-assessment, AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="bg-falcon-900 text-white antialiased min-h-screen">{children}</body>
    </html>
  )
}
