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

      <p style={{
        fontSize: '17px',
        color: 'rgba(255,255,255,0.8)',
        lineHeight: '1.7',
        fontFamily: 'Satoshi, sans-serif',
        margin: '0 0 24px',
      }}>
        {inzicht.tekst}
      </p>

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
      {/* Merknaam */}
      <section style={{ padding: '80px 0 24px', background: '#0f0f10' }}>
        <div className="mx-auto px-4 text-center" style={{ maxWidth: '720px' }}>
          <h1 style={{
            fontFamily: 'GreedCondensed, sans-serif',
            fontWeight: 700,
            textTransform: 'uppercase',
            fontSize: 'clamp(40px, 6vw, 72px)',
            color: '#fff',
            margin: 0,
            lineHeight: 1,
          }}>
            {result.merknaam}
          </h1>
        </div>
      </section>

      {/* Conclusie */}
      <section style={{ padding: '24px 0 32px', background: '#0f0f10' }}>
        <div className="mx-auto px-4 text-center" style={{ maxWidth: '720px' }}>
          <p className="label-style animate-hero-title" style={{ color: '#DDB3FF', marginBottom: '24px' }}>
            Jouw marktscan
          </p>
          <blockquote style={{ margin: 0, padding: 0 }}>
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
          <div className="gradient-line" style={{ marginTop: '32px', opacity: 0.4 }} />
        </div>
      </section>

      {/* Concurrenten sectie */}
      {result.concurrenten && result.concurrenten.length > 0 && (
        <section style={{ padding: '24px 0 16px', background: '#0f0f10' }}>
          <div className="mx-auto px-4" style={{ maxWidth: '680px' }}>
            <h2 style={{
              fontFamily: 'GreedCondensed, sans-serif',
              fontWeight: 700,
              textTransform: 'uppercase',
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '20px',
              letterSpacing: '0.02em',
            }}>
              Dit zijn jouw drie concurrenten
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {result.concurrenten.map((c, idx) => (
                <div
                  key={idx}
                  className="animate-fade-in"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    animationDelay: `${idx * 0.1}s`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
                    <p style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#fff',
                      fontFamily: 'Satoshi, sans-serif',
                      margin: 0,
                    }}>
                      {c.naam}
                    </p>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.35)',
                        fontFamily: 'Satoshi, sans-serif',
                        textDecoration: 'none',
                      }}
                    >
                      {c.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  </div>
                  <p style={{
                    fontSize: '15px',
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: '1.5',
                    fontFamily: 'Satoshi, sans-serif',
                    margin: '0 0 8px',
                  }}>
                    {c.omschrijving}
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(221,179,255,0.7)',
                    lineHeight: '1.5',
                    fontFamily: 'Satoshi, sans-serif',
                    margin: 0,
                    fontStyle: 'italic',
                  }}>
                    {c.reden}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Drie inzichtkaarten */}
      <section className="bg-dark" style={{ padding: '48px 0 64px' }}>
        <div className="mx-auto px-4" style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <InzichtCard inzicht={result.inzicht1} index={0} />
          <InzichtCard inzicht={result.inzicht2} index={1} />
          <InzichtCard inzicht={result.inzicht3} index={2} />
        </div>
      </section>

      {/* Gradient lijn boven e-mail sectie */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, #6366f1 30%, #a855f7 50%, #ec4899 70%, transparent 100%)', width: '100%' }} />

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
                Je marktscan is onderweg. Check je inbox.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <h3 style={{ fontFamily: 'GreedCondensed, sans-serif', fontWeight: 700, textTransform: 'uppercase', fontSize: 'clamp(24px, 3vw, 36px)', color: '#fff', marginBottom: '16px' }}>
                Ontvang je marktscan in je inbox
              </h3>
              <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.6)', fontFamily: 'Satoshi, sans-serif', maxWidth: '560px', margin: '0 auto 32px', lineHeight: '1.6' }}>
                Ontvang je volledige scan in je inbox en ga er direct mee aan de slag.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
                {[
                  'Je drie inzichten inclusief concrete acties',
                  'Overzicht van je concurrenten',
                  'Zodat je er direct mee aan de slag kunt',
                  'Gratis, direct in je inbox',
                ].map((text, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="none" stroke="#DDB3FF" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.75)', fontFamily: 'Satoshi, sans-serif' }}>{text}</span>
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

      {/* Gradient lijn onder e-mail sectie */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, #6366f1 30%, #a855f7 50%, #ec4899 70%, transparent 100%)', width: '100%' }} />

      {/* Kom in contact */}
      <section className="bg-dark" style={{ padding: '96px 0' }}>
        <div className="mx-auto px-4 text-center" style={{ maxWidth: '680px' }}>
          <h3 style={{
            fontFamily: 'GreedCondensed, sans-serif',
            fontWeight: 700,
            textTransform: 'uppercase',
            fontSize: 'clamp(24px, 3vw, 36px)',
            color: '#fff',
            marginBottom: '16px',
          }}>
            Klaar voor de volgende stap?
          </h3>
          <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.7', fontFamily: 'Satoshi, sans-serif', maxWidth: '640px', margin: '0 auto 16px' }}>
            Je onderscheid is er, maar het is nog niet zichtbaar voor de mensen die je wil bereiken.
          </p>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', fontFamily: 'Satoshi, sans-serif', maxWidth: '520px', margin: '0 auto 24px' }}>
            We denken hands-on met je mee, kijken waar de mogelijkheden liggen en komen met gerichte oplossingen. Geen groot traject nodig.
          </p>
          <a
            href="mailto:hello@newfound.agency"
            className="submit-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
          >
            Plan een gesprek
            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://newfound.agency/wp-content/uploads/2025/06/Logo_newfound.svg" alt="Newfound" style={{ height: '16px', opacity: 0.5 }} />
        <a href="/" style={{
          color: 'rgba(255,255,255,0.45)',
          fontSize: '13px',
          textDecoration: 'none',
          fontFamily: 'Satoshi, sans-serif',
        }}>
          Scan een ander merk →
        </a>
      </footer>
    </div>
  )
}
