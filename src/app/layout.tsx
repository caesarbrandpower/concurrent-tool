import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Marktscan — Zie je business zoals je klant hem ziet.',
  description: 'Zie hoe jij scoort ten opzichte van je concurrent. En waar jouw kans ligt.',
  openGraph: {
    title: 'Marktscan — Zie je business zoals je klant hem ziet.',
    description: 'Zie hoe jij scoort ten opzichte van je concurrent. En waar jouw kans ligt. Voer je URL in en zie in 60 seconden waar jij staat, verliest en wint.',
    url: 'https://marktscan.newfound.agency',
    siteName: 'Marktscan',
    type: 'website',
    locale: 'nl_NL',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body className="antialiased min-h-screen font-body">
        {children}
      </body>
    </html>
  )
}
