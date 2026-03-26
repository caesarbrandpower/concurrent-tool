'use client'

import { useState } from 'react'
import { submitEmail } from '@/app/actions'
import { AnalysisResult } from '@/types'

interface EmailGateProps {
  userUrl: string
  analysis: AnalysisResult
  onBack: () => void
}

export function EmailGate({ userUrl, analysis, onBack }: EmailGateProps) {
  const [state, setState] = useState<{ success: boolean; error?: string }>({ success: false })
  const [pending, setPending] = useState(false)
  const [email, setEmail] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    try {
      const formData = new FormData(e.currentTarget)
      const result = await submitEmail(state, formData)
      setState(result)
    } catch {
      setState({ success: false, error: 'Er ging iets mis' })
    } finally {
      setPending(false)
    }
  }

  if (state.success) {
    return (
      <div className="w-full mx-auto px-4 py-16 text-center" style={{ maxWidth: '680px' }}>
        <div className="animate-fade-in">
          <div className="w-16 h-16 border-2 border-accent rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl text-accent">✓</span>
          </div>
          <h1 className="font-heading text-white mb-4" style={{ fontSize: 'clamp(24px, 3.5vw, 40px)' }}>
            ANALYSE VERSTUURD
          </h1>
          <p className="font-body text-white/60 mb-8 max-w-md mx-auto" style={{ fontWeight: 300 }}>
            Je ontvangt binnen enkele minuten een email met je volledige analyse.
            We nemen binnen 24 uur contact met je op.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-white underline hover:text-accent transition-colors font-body text-sm"
            style={{ fontWeight: 300 }}
          >
            Start een nieuwe analyse
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mx-auto px-4 py-16" style={{ maxWidth: '780px' }}>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-10 font-body text-sm"
        style={{ fontWeight: 300 }}
      >
        ← Terug naar resultaten
      </button>

      <div className="bg-dark-light border border-white/10 rounded-btn p-8 md:p-12 animate-slide-up">
        <h1 className="font-heading text-white mb-8" style={{ fontSize: 'clamp(24px, 3.5vw, 40px)' }}>
          WAT JOU ÉCHT ANDERS MAAKT
        </h1>

        {/* Differentiators */}
        <div className="space-y-5 mb-10">
          {analysis.onderscheid.map((point, index) => (
            <div key={index} className="flex gap-4 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="w-7 h-7 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="font-body text-accent-blue text-sm font-medium">{index + 1}</span>
              </div>
              <p className="font-body text-white/80 text-lg leading-relaxed" style={{ fontWeight: 300 }}>
                {point}
              </p>
            </div>
          ))}
        </div>

        {/* Implication */}
        <div className="mb-10 pl-11">
          <p className="font-body text-white/50 italic leading-relaxed" style={{ fontWeight: 300 }}>
            {analysis.implicatie}
          </p>
        </div>

        {/* Divider */}
        <div className="gradient-line mb-10" />

        {/* CTA + email */}
        <div className="text-center">
          <p className="font-body text-white mb-2" style={{ fontWeight: 300 }}>
            Samen scherper naar je merk kijken? We helpen je graag.{' '}
            <a
              href="mailto:hello@newfound.agency"
              className="text-accent hover:text-white transition-colors"
            >
              Mail ons
            </a>
          </p>

          <p className="font-body text-white/40 text-sm mb-6" style={{ fontWeight: 300 }}>
            Of laat je email achter voor een persoonlijk advies:
          </p>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <input type="hidden" name="url" value={userUrl} />
            <input type="hidden" name="analysis" value={JSON.stringify(analysis)} />

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jouw@email.nl"
                required
                disabled={pending}
                className="flex-1 py-3.5 px-5 bg-dark border border-white/20 rounded-btn
                           text-white placeholder:text-white/50 text-sm
                           focus:outline-none focus:border-white/60 transition-all duration-300
                           disabled:opacity-50 font-body"
              />
              <button
                type="submit"
                disabled={pending || !email}
                className="py-3.5 px-7 bg-accent-blue text-white font-body font-medium rounded-btn
                           hover:brightness-110 transition-all duration-200
                           disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {pending ? 'Bezig...' : 'Verstuur'}
              </button>
            </div>

            {state.error && (
              <p className="text-red-400 text-sm mt-3 font-body animate-fade-in">{state.error}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
