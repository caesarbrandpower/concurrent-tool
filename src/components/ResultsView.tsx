'use client'

import { useState } from 'react'
import { AnalysisResult, Inzicht } from '@/types'
import { saveLead } from '@/lib/airtable'
import { sendAnalysisEmail } from '@/lib/email'

interface ResultsViewProps {
  url: string
  result: AnalysisResult
}

function InzichtCard({ inzicht, index }: { inzicht: Inzicht; index: number }) {
  const isLast = index === 2

  return (
    <div
      className="animate-slide-up"
      style={{
        background: isLast ? 'rgba(14,110,255,0.06)' : 'rgba(255,255,255,0.04)',
        border: isLast ? '1px solid rgba(14,110,255,0.25)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '36px 32px',
        animationDelay: `${(index + 1) * 0.15}s`,
      }}
    >
      {/* Inzicht nummer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: isLast ? 'rgba(14,110,255,0.15)' : 'rgba(255,255,255,0.08)',
          fontSize: '13px',
          fontWeight: 700,
          color: isLast ? '#4a9eff' : 'rgba(255,255,255,0.5)',
          fontFamily: 'Satoshi, sans-serif',
        }}>
          {index + 1}
        </span>
        <h3 style={{
          fontFamily: 'GreedCondensed, sans-serif',
          fontWeight: 700,
          textTransform: 'uppercase',
          fontSize: 'clamp(18px, 2.5vw, 24px)',
          color: '#fff',
          margin: 0,
        }}>
          {inzicht.titel}
        </h3>
      </div>

      {/* Tekst */}
      <p style={{
        fontSize: '17px',
        color: 'rgba(255,255,255,0.8)',
        lineHeight: '1.7',
        fontFamily: 'Satoshi, sans-serif',
        margin: '0 0 24px',
      }}>
        {inzicht.tekst}
      </p>

      {/* Actie blok */}
      <div style={{
        background: isLast ? 'rgba(14,110,255,0.08)' : 'rgba(255,255,255,0.04)',
        border: isLast ? '1px solid rgba(14,110,255,0.15)' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: '10px',
        padding: '16px 20px',
      }}>
        <p style={{
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: isLast ? '#4a9eff' : 'rgba(255,255,255,0.4)',
          fontFamily: 'Satoshi, sans-serif',
          marginBottom: '6px',
        }}>
          Wat je nu kunt doen:
        </p>
        <p style={{
          fontSize: '15px',
          color: '#fff',
          lineHeight: '1.5',
          fontFamily: 'Satoshi, sans-serif',
          margin: 0,
          fontWeight: 400,
        }}>
          {inzicht.actie}
        </p>
      </div>
    </div>
  )
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
      {/* Conclusie: grote quote bovenaan */}
      <section style={{ padding: '80px 0 64px', background: '#0f0f10' }}>
        <div className="mx-auto px-4 text-center" style={{ maxWidth: '720px' }}>
          <p className="label-style animate-hero-title" style={{ color: '#DDB3FF', marginBottom: '24px' }}>
            Jouw marktscan
          </p>
          <blockquote style={{
            margin: 0,
            padding: 0,
          }}>
            <p style={{
              fontFamily: 'GreedCondensed, sans-serif',
              fontWeight: 700,
              textTransform: 'uppercase',
              fontSize: 'clamp(28px, 5vw, 48px)',
              lineHeight: 1.1,
              color: '#ffffff',
              margin: 0,
            }}>
              {result.conclusie}
            </p>
          </blockquote>
          <div className="gradient-line" style={{ marginTop: '48px', opacity: 0.4 }} />
        </div>
      </section>

      {/* Drie inzichtkaarten */}
      <section className="bg-dark" style={{ padding: '48px 0 64px' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <InzichtCard inzicht={result.inzicht1} index={0} />
          <InzichtCard inzicht={result.inzicht2} index={1} />
          <InzichtCard inzicht={result.inzicht3} index={2} />
        </div>
      </section>

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
                Bewaar je marktscan
              </h3>
              <p style={{ fontSize: '17px', color: '#fff', fontFamily: 'Satoshi, sans-serif', maxWidth: '560px', margin: '0 auto 32px', lineHeight: '1.6' }}>
                Ontvang je volledige marktscan in je inbox. Gratis, direct.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
                {['Je conclusie en drie inzichten', 'Concrete acties per inzicht', 'Gratis, direct in je inbox'].map((text, i) => (
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
