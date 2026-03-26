import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Concurrent Analyse | Newfound Agency',
  description: 'Zie hoe jij je onderscheidt van je concurrenten. Gratis analyse van je merkpositionering.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body className="antialiased relative">
        <div className="ambient-glow" />
        <div className="noise-overlay" />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}
