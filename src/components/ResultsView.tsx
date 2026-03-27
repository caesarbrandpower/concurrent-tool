'use client'

import { useState } from 'react'
import { AnalysisResult } from '@/types'
import { saveLead } from '@/lib/airtable'
import { sendAnalysisEmail } from '@/lib/email'

interface ResultsViewProps {
  url: string
  result: AnalysisResult
}

export default function ResultsView({ url, result }: ResultsViewProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailCaptured, setEmailCaptured] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    setEmailError(null)

    try {
      await saveLead(email, url)
      await sendAnalysisEmail(email, url, result)
      setEmailCaptured(true)
    } catch (error) {
      console.error('Error:', error)
      setEmailError('Er ging iets mis. Probeer het opnieuw.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="animate-slide-up">
      {/* Samenvatting header */}
      <section className="bg-dark" style={{ paddingTop: '80px', paddingBottom: '24px' }}>
        <div className="mx-auto px-4 text-center" style={{ maxWidth: '680px' }}>
          <p className="label-style text-accent mb-6">Jouw concurrentieanalyse</p>
          <h1 className="font-heading text-white" style={{ fontSize: 'clamp(32px, 4.5vw, 56px)' }}>
            WAT WE ZAGEN
          </h1>
        </div>
      </section>

      {/* Samenvatting */}
      <section className="bg-dark" style={{ paddingBottom: '64px' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '32px' }}>
            <p className="text-white font-body leading-relaxed" style={{ fontSize: '17px' }}>
              {result.samenvatting}
            </p>
          </div>
        </div>
      </section>

      {/* Concurrenten */}
      <section className="bg-dark" style={{ padding: '0 0 80px' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
          <h2 className="font-heading text-white mb-8" style={{ fontSize: 'clamp(18px, 2.5vw, 28px)', fontFamily: 'GreedCondensed, sans-serif', fontWeight: 700, textTransform: 'uppercase' as const }}>
            Jouw concurrenten
          </h2>
          <div className="space-y-4">
            {result.concurrenten.map((competitor, index) => (
              <div key={index} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '32px' }}>
                <p className="text-accent-blue font-body mb-3" style={{ fontSize: '15px', fontWeight: 400 }}>
                  {competitor.url}
                </p>
                <p className="text-white font-body mb-3 leading-relaxed" style={{ fontSize: '17px' }}>
                  {competitor.omschrijving}
                </p>
                <p className="text-white/60 font-body italic" style={{ fontSize: '15px' }}>
                  {competitor.overlap}
                </p>
                {competitor.reden && (
                  <p className="text-white/40 font-body italic mt-3" style={{ fontSize: '14px' }}>
                    Waarom deze concurrent? {competitor.reden}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kans teaser */}
      {result.kans && (
        <section className="bg-dark" style={{ padding: '0 0 80px' }}>
          <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
            <div style={{ borderLeft: '3px solid #DDB3FF', paddingLeft: '24px' }}>
              <p className="text-white/70 font-body italic leading-relaxed" style={{ fontSize: '17px' }}>
                {result.kans}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Email lead sectie */}
      <section style={{ padding: '80px 0', background: 'rgba(255,255,255,0.04)' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
          {emailCaptured ? (
            <div className="text-center animate-fade-in">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="font-heading text-white mb-2" style={{ fontSize: 'clamp(24px, 3vw, 36px)', textTransform: 'uppercase' as const }}>Verstuurd!</h3>
              <p className="text-white font-body mb-6" style={{ fontSize: '17px' }}>
                Je analyse is onderweg. Check je inbox.
              </p>

              {/* Onderscheid */}
              <div className="text-left mt-8">
                <h4 className="font-heading text-white mb-4" style={{ fontSize: 'clamp(18px, 2.5vw, 28px)', fontFamily: 'GreedCondensed, sans-serif', fontWeight: 700, textTransform: 'uppercase' as const }}>
                  Wat jou echt anders maakt
                </h4>
                <ul className="space-y-3 mb-8">
                  {result.onderscheid.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="text-white font-body" style={{ fontSize: '17px' }}>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Diagnose */}
                {result.diagnose && (
                  <div style={{ background: 'rgba(14, 110, 255, 0.08)', borderLeft: '3px solid #0E6EFF', borderRadius: '0 8px 8px 0', padding: '24px', marginBottom: '24px' }}>
                    <p className="text-white font-body italic" style={{ fontSize: '17px' }}>
                      <strong>Diagnose:</strong> {result.diagnose}
                    </p>
                  </div>
                )}

                {/* Implicatie */}
                <div style={{ background: 'rgba(14, 110, 255, 0.08)', borderLeft: '3px solid #0E6EFF', borderRadius: '0 8px 8px 0', padding: '24px', marginBottom: '24px' }}>
                  <p className="text-white font-body italic" style={{ fontSize: '17px' }}>
                    {result.implicatie}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h3 className="font-heading text-white mb-4" style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontFamily: 'GreedCondensed, sans-serif', fontWeight: 700, textTransform: 'uppercase' as const }}>
                Wat jou echt anders maakt
              </h3>
              <p className="text-white font-body mb-8 leading-relaxed" style={{ maxWidth: '560px', margin: '0 auto 32px', fontSize: '17px' }}>
                We hebben gezien waar jij verschilt. Laat je e-mailadres achter en ontvang de volledige analyse: je onderscheidende punten, diagnose en concrete aanbevelingen.
              </p>

              <div className="flex flex-col items-center gap-3 mb-8">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-white font-body" style={{ fontSize: '15px' }}>Waar jij echt verschilt</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-white font-body" style={{ fontSize: '15px' }}>Diagnose: aanbod-probleem of merk-probleem</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-white font-body" style={{ fontSize: '15px' }}>Gratis, direct in je inbox</span>
                </div>
              </div>

              <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jouw@emailadres.nl"
                  className="w-full sm:flex-1 px-4 py-3.5 border border-white/30 rounded-btn focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-white/60 transition-all font-body text-white placeholder:text-white/50"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                  required
                />

                <button
                  type="submit"
                  disabled={!email.trim() || isSubmitting}
                  className="w-full sm:w-auto px-6 py-3.5 bg-accent-blue text-white rounded-btn font-body font-medium hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 whitespace-nowrap"
                >
                  {isSubmitting ? 'Bezig...' : 'Stuur me de analyse'}
                </button>
              </form>

              {emailError && (
                <p className="mt-3 text-sm text-accent-pink font-body">{emailError}</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA — Newfound */}
      <section className="bg-dark" style={{ padding: '96px 0' }}>
        <div className="mx-auto px-4 text-center" style={{ maxWidth: '680px' }}>
          <p className="text-white font-body leading-relaxed mb-4" style={{ fontSize: '17px' }}>
            Je onderscheid is er — maar het is nog niet zichtbaar voor de mensen die jij wil bereiken. Precies daar helpen wij bij.
          </p>
          <a
            href="https://newfound.agency"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-accent-blue text-white rounded-btn font-body font-medium hover:brightness-110 transition-all duration-200"
          >
            Plan een gesprek
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-center text-sm text-white/40 font-body" style={{ fontWeight: 300 }}>
          Een product van <a href="https://newfound.agency" target="_blank" rel="noopener noreferrer" className="text-white/60 underline hover:text-white transition-colors">Newfound</a>
        </p>
      </footer>
    </div>
  )
}
