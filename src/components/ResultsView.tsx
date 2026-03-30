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
      {/* Wijziging 2 — Merknaam bovenin: wit, geen gradient */}
      <section className="bg-dark" style={{ paddingTop: '64px', paddingBottom: '8px' }}>
        <div className="mx-auto px-4 text-center" style={{ maxWidth: '680px' }}>
          <p style={{
            fontSize: '13px',
            fontWeight: 400,
            fontStyle: 'italic',
            textTransform: 'none',
            letterSpacing: '0.02em',
            color: 'rgba(255,255,255,0.4)',
            marginBottom: '12px',
            fontFamily: 'KansasNew, serif'
          }}>
            Jouw marktscan
          </p>
          <h1 style={{
            fontFamily: 'GreedCondensed, sans-serif',
            fontWeight: 700,
            textTransform: 'uppercase',
            fontSize: 'clamp(48px, 8vw, 96px)',
            color: '#ffffff',
            margin: 0,
            lineHeight: 1
          }}>
            {result.jouwSite.naam}
          </h1>
        </div>
      </section>

      {/* Wijziging 3 — Scoreboard: verticale kaarten */}
      {result.scoreboard && (
        <section className="bg-dark" style={{ padding: '48px 0 64px' }}>
          <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>

            {/* Jouw kaart */}
            <div style={{ background: 'rgba(46,124,246,0.08)', border: '1px solid rgba(46,124,246,0.2)', borderRadius: '12px', padding: '28px 32px', marginBottom: '12px' }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#2e7cf6', fontFamily: 'Satoshi, sans-serif', marginBottom: '20px' }}>
                {result.jouwSite.naam}
              </p>
              {[
                { label: 'Kernbelofte', value: result.scoreboard.jij.kernbelofte },
                { label: 'Aanbod', value: result.scoreboard.jij.aanbod },
                { label: 'Toon', value: result.scoreboard.jij.toon },
                { label: 'Onderscheid', value: result.scoreboard.jij.onderscheid },
              ].map((row, i) => (
                <div key={i} style={{ marginBottom: i < 3 ? '14px' : 0 }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', fontFamily: 'Satoshi, sans-serif', margin: '0 0 4px' }}>
                    {row.label}
                  </p>
                  <p style={{ fontSize: '15px', color: '#fff', fontFamily: 'Satoshi, sans-serif', margin: 0, lineHeight: '1.4' }}>
                    {row.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Concurrent kaarten */}
            {result.scoreboard.concurrenten.map((c, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '28px 32px', marginBottom: idx < result.scoreboard.concurrenten.length - 1 ? '12px' : 0 }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontFamily: 'Satoshi, sans-serif', marginBottom: '20px' }}>
                  {c.naam}
                </p>
                {[
                  { label: 'Kernbelofte', value: c.kernbelofte, overlap: c.kernbelofteOverlap },
                  { label: 'Aanbod', value: c.aanbod, overlap: c.aanbodOverlap },
                  { label: 'Toon', value: c.toon, overlap: false },
                  { label: 'Onderscheid', value: c.onderscheid, overlap: false },
                ].map((row, i) => (
                  <div key={i} style={{
                    marginBottom: i < 3 ? '14px' : 0,
                    ...(row.overlap ? { borderLeft: '2px solid #8463ff', paddingLeft: '12px' } : {})
                  }}>
                    <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: row.overlap ? 'rgba(132,99,255,0.6)' : 'rgba(255,255,255,0.35)', fontFamily: 'Satoshi, sans-serif', margin: '0 0 4px' }}>
                      {row.label}{row.overlap ? ' · overlap' : ''}
                    </p>
                    <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', fontFamily: 'Satoshi, sans-serif', margin: 0, lineHeight: '1.4' }}>
                      {row.value}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Intro */}
      <section className="bg-dark" style={{ paddingTop: '48px', paddingBottom: '48px' }}>
        <div className="mx-auto px-4 text-center" style={{ maxWidth: '600px' }}>
          <p className="text-white/70 font-body leading-relaxed" style={{ fontSize: '18px', lineHeight: '1.7' }}>
            {result.intro}
          </p>
        </div>
      </section>

      {/* Jouw website */}
      <section className="bg-dark" style={{ padding: '48px 0 64px' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
          <h2 style={{ fontFamily: 'GreedCondensed, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: 'clamp(18px, 2.5vw, 28px)', color: '#fff', marginBottom: '32px' }}>
            Jouw website
          </h2>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '32px' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#2e7cf6', fontFamily: 'Satoshi, sans-serif', marginBottom: '16px' }}>
              {result.jouwSite.naam}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {result.jouwSite.watGoedGaat.map((item, index) => (
                <li key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <svg style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '4px' }} fill="none" stroke="#4ade80" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ fontSize: '16px', color: '#fff', fontFamily: 'Satoshi, sans-serif' }}>{item}</span>
                </li>
              ))}
            </ul>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', fontFamily: 'Satoshi, sans-serif' }}>
              {result.jouwSite.samenvatting}
            </p>
          </div>
        </div>
      </section>

      {/* Wijziging 5 — Concurrenten: labels Satoshi wit, geen gradient, geen cursief */}
      <section className="bg-dark" style={{ padding: '0 0 64px' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
          <h2 style={{ fontFamily: 'GreedCondensed, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: 'clamp(18px, 2.5vw, 28px)', color: '#fff', marginBottom: '32px' }}>
            Jouw concurrenten
          </h2>
          <div className="space-y-4">
            {result.concurrenten.map((competitor, index) => (
              <div key={index} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '32px' }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#2e7cf6', fontFamily: 'Satoshi, sans-serif', marginBottom: '4px' }}>
                  {competitor.naam}
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Satoshi, sans-serif', marginBottom: '12px' }}>
                  {competitor.url}
                </p>
                {/* omschrijving */}
                <p style={{ fontSize: '16px', color: '#ffffff', lineHeight: '1.6', marginBottom: '20px', fontFamily: 'Satoshi, sans-serif' }}>
                  {competitor.omschrijving}
                </p>

                {/* overlap */}
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', fontFamily: 'Satoshi, sans-serif' }}>
                    Overlap met jou
                  </p>
                  <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5', fontFamily: 'Satoshi, sans-serif' }}>
                    {competitor.overlap}
                  </p>
                </div>

                {/* reden */}
                {competitor.reden && (
                  <div style={{ marginTop: '14px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', fontFamily: 'Satoshi, sans-serif' }}>
                      Waarom concurrent
                    </p>
                    <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5', fontFamily: 'Satoshi, sans-serif' }}>
                      {competitor.reden}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wijziging 4 — Conclusie: vaste koptekst + dynamische subtitel */}
      <section className="bg-dark" style={{ padding: '0 0 64px' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
          <h2 style={{ fontFamily: 'GreedCondensed, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: 'clamp(22px, 3vw, 32px)', color: '#fff', marginBottom: '8px' }}>
            Conclusie
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', fontFamily: 'Satoshi, sans-serif', marginBottom: '24px', fontStyle: 'normal' }}>
            {result.vergelijkingTitel}
          </p>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '32px' }}>
            <p style={{ fontSize: '17px', color: '#fff', lineHeight: '1.6', fontFamily: 'Satoshi, sans-serif' }}>
              {result.vergelijking}
            </p>
          </div>
        </div>
      </section>

      {/* Wijziging 6 — Wat beter kan: rode cirkels, geen cursief */}
      <section className="bg-dark" style={{ padding: '0 0 64px' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
          <h2 style={{ fontFamily: 'GreedCondensed, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: 'clamp(18px, 2.5vw, 28px)', color: '#fff', marginBottom: '32px' }}>
            Wat beter kan
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {result.watBeterKan.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                  <svg width="10" height="10" fill="none" stroke="#f87171" viewBox="0 0 24 24" strokeWidth={3}>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <p style={{ fontSize: '16px', color: '#ffffff', lineHeight: '1.6', margin: 0, fontFamily: 'Satoshi, sans-serif' }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kans blockquote */}
      {result.kans && (
        <section className="bg-dark" style={{ padding: '0 0 80px' }}>
          <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
            <div style={{ borderLeft: '3px solid #8463ff', paddingLeft: '24px' }}>
              <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', fontFamily: 'Satoshi, sans-serif' }}>
                {result.kans}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Implicatie */}
      {result.implicatie && (
        <section className="bg-dark" style={{ padding: '0 0 64px' }}>
          <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
            <div style={{ borderLeft: '3px solid #2e7cf6', paddingLeft: '24px' }}>
              <p style={{ fontSize: '17px', color: '#fff', lineHeight: '1.6', fontFamily: 'Satoshi, sans-serif' }}>
                {result.implicatie}
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
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(14,110,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="#0E6EFF" viewBox="0 0 24 24" strokeWidth={2}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 style={{ fontFamily: 'GreedCondensed, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: 'clamp(24px, 3vw, 36px)', color: '#fff', marginBottom: '8px' }}>Verstuurd!</h3>
              <p style={{ fontSize: '17px', color: '#fff', fontFamily: 'Satoshi, sans-serif' }}>
                Je analyse is onderweg. Check je inbox.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <h3 style={{ fontFamily: 'GreedCondensed, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: 'clamp(24px, 3vw, 36px)', color: '#fff', marginBottom: '16px' }}>
                Bewaar je analyse
              </h3>
              <p style={{ fontSize: '17px', color: '#fff', fontFamily: 'Satoshi, sans-serif', maxWidth: '560px', margin: '0 auto 32px', lineHeight: '1.6' }}>
                Ontvang je volledige concurrentieanalyse als overzicht in je inbox. Gratis, direct.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
                {['Jouw sterke punten op een rij', 'De kans die jouw concurrenten laten liggen', 'Gratis, direct in je inbox'].map((text, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="none" stroke="#4ade80" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ fontSize: '15px', color: '#fff', fontFamily: 'Satoshi, sans-serif' }}>{text}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleEmailSubmit} className="input-row" style={{ maxWidth: '520px', margin: '0 auto' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jouw@emailadres.nl"
                  className="url-input"
                  required
                />
                <button
                  type="submit"
                  disabled={!email.trim() || isSubmitting}
                  className="submit-btn"
                  style={{ opacity: (!email.trim() || isSubmitting) ? 0.4 : 1 }}
                >
                  {isSubmitting ? 'Bezig...' : 'Verstuur'}
                </button>
              </form>

              {emailError && (
                <p className="mt-3 text-sm" style={{ color: '#f87171', fontFamily: 'Satoshi, sans-serif' }}>{emailError}</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-dark" style={{ padding: '96px 0' }}>
        <div className="mx-auto px-4 text-center" style={{ maxWidth: '680px' }}>
          <p style={{ fontSize: '17px', color: '#fff', lineHeight: '1.6', fontFamily: 'Satoshi, sans-serif', marginBottom: '16px' }}>
            Je onderscheid is er, maar het is nog niet zichtbaar voor de mensen die jij wil bereiken. Precies daar helpen wij bij.
          </p>
          <a
            href="https://newfound.agency"
            target="_blank"
            rel="noopener noreferrer"
            className="submit-btn"
            style={{ display: 'inline-block', textDecoration: 'none' }}
          >
            Plan een gesprek
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-center" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Satoshi, sans-serif', fontWeight: 300 }}>
          Een product van <a href="https://newfound.agency" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'underline' }}>Newfound</a>
        </p>
      </footer>
    </div>
  )
}
