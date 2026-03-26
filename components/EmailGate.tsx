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
        <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-dark-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-greed text-2xl mb-4 text-accent">
          ANALYSE VERSTUURD
        </h3>
        <p className="font-satoshi text-accent-dim mb-8 max-w-md mx-auto">
          Je ontvangt binnen enkele minuten een email met je volledige analyse. 
          We nemen binnen 24 uur contact met je op.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-accent underline hover:text-white transition-colors font-satoshi"
        >
          Start een nieuwe analyse
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-accent-dim hover:text-accent transition-colors mb-8 font-satoshi"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Terug naar resultaten
      </button>

      <div className="bg-dark-800 rounded-2xl p-8 md:p-12 border border-dark-600">
        <h2 className="font-greed text-3xl md:text-4xl mb-6 text-accent">
          WAT JOU ÉCHT ANDERS MAAKT
        </h2>

        {/* Show the differentiators */}
        <div className="space-y-6 mb-10">
          {analysis.onderscheid.map((point, index) => (
            <div key={index} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="font-satoshi font-bold text-accent text-sm">{index + 1}</span>
              </div>
              <p className="font-satoshi text-lg text-accent leading-relaxed">
                {point}
              </p>
            </div>
          ))}
        </div>

        {/* Implication */}
        <div className="mb-10">
          <p className="font-satoshi text-lg text-accent italic">
            {analysis.implicatie}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-dark-600 my-10"></div>

        {/* Email form */}
        <div className="text-center">
          <p className="font-satoshi text-accent mb-6">
            Samen scherper naar je merk kijken? We helpen je graag.{' '}
            <a 
              href="mailto:hello@newfound.agency"
              className="text-accent underline hover:text-white transition-colors"
            >
              Mail ons
            </a>
          </p>

          <p className="font-satoshi text-accent-dim text-sm mb-6">
            Of laat je email achter voor een persoonlijk advies:
          </p>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <input type="hidden" name="url" value={userUrl} />
            <input type="hidden" name="analysis" value={JSON.stringify(analysis)} />

            <div className="flex gap-3">
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jouw@email.nl"
                required
                disabled={pending}
                className="flex-1 bg-dark-900 border-2 border-dark-600 rounded-lg px-4 py-3 
                           text-accent placeholder-accent-dim/50 
                           focus:border-accent focus:outline-none transition-all duration-300
                           disabled:opacity-50 font-satoshi"
              />
              <button
                type="submit"
                disabled={pending || !email}
                className="bg-accent text-dark-900 font-satoshi font-bold 
                           py-3 px-6 rounded-lg hover:bg-white transition-all duration-300
                           disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {pending ? '...' : 'Verstuur'}
              </button>
            </div>

            {state.error && (
              <p className="text-red-400 text-sm mt-3 font-satoshi">
                {state.error}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}