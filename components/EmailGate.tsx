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
      <div className="text-center py-16 animate-fade-in">
        <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-6
                        shadow-[0_0_30px_rgba(132,99,255,0.3)]">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-greed text-2xl mb-4 gradient-text">
          ANALYSE VERSTUURD
        </h3>
        <p className="font-satoshi text-text-dim mb-8 max-w-md mx-auto leading-relaxed">
          Je ontvangt binnen enkele minuten een email met je volledige analyse.
          We nemen binnen 24 uur contact met je op.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-primary-bright hover:text-white transition-colors font-satoshi text-sm
                     underline underline-offset-4"
        >
          Start een nieuwe analyse
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-text-dim hover:text-text transition-colors mb-10 font-satoshi text-sm group"
      >
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 12H5m7 7l-7-7 7-7" />
        </svg>
        Terug naar resultaten
      </button>

      <div className="bg-surface rounded-2xl p-8 md:p-12 border border-border relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-bright/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />

        <div className="relative">
          <h2 className="font-greed text-3xl md:text-4xl mb-8 gradient-text">
            WAT JOU ÉCHT ANDERS MAAKT
          </h2>

          {/* Differentiators */}
          <div className="space-y-5 mb-10">
            {analysis.onderscheid.map((point, index) => (
              <div key={index} className={`flex gap-4 animate-fade-in-up stagger-${index + 1}`}>
                <div className="w-8 h-8 rounded-full gradient-bg-subtle flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="font-satoshi font-bold text-sm text-primary-bright">{index + 1}</span>
                </div>
                <p className="font-satoshi text-[17px] text-text/90 leading-relaxed">
                  {point}
                </p>
              </div>
            ))}
          </div>

          {/* Implication */}
          <div className="mb-10 pl-12">
            <p className="font-satoshi text-base text-text-dim italic leading-relaxed">
              {analysis.implicatie}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-border my-10" />

          {/* CTA section */}
          <div className="text-center">
            <p className="font-satoshi text-text leading-relaxed mb-2">
              Samen scherper naar je merk kijken? We helpen je graag.{' '}
              <a
                href="mailto:hello@newfound.agency"
                className="text-primary-bright hover:text-white transition-colors"
              >
                Mail ons
              </a>
            </p>

            <p className="font-satoshi text-text-muted text-sm mb-8">
              Of laat je email achter voor een persoonlijk advies:
            </p>

            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <input type="hidden" name="url" value={userUrl} />
              <input type="hidden" name="analysis" value={JSON.stringify(analysis)} />

              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jouw@email.nl"
                    required
                    disabled={pending}
                    className="w-full bg-bg border border-border rounded-full px-5 py-3.5
                               text-text placeholder-text-muted text-sm
                               focus:border-primary-bright/40 focus:outline-none focus:shadow-[0_0_20px_rgba(132,99,255,0.1)]
                               transition-all duration-300
                               disabled:opacity-50 font-satoshi"
                  />
                </div>
                <button
                  type="submit"
                  disabled={pending || !email}
                  className="gradient-bg font-satoshi font-bold text-white text-sm
                             py-3.5 px-7 rounded-full
                             hover:opacity-90 transition-all duration-300
                             disabled:opacity-30 disabled:cursor-not-allowed
                             shadow-[0_2px_20px_rgba(132,99,255,0.25)]
                             whitespace-nowrap"
                >
                  {pending ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : 'Verstuur'}
                </button>
              </div>

              {state.error && (
                <p className="text-red-400 text-sm mt-4 font-satoshi animate-fade-in">
                  {state.error}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
