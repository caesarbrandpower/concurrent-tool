'use client'

import { useState } from 'react'
import { analyzeCompetitors } from './actions'
import { InputForm } from '@/components/InputForm'
import { LoadingScreen } from '@/components/LoadingScreen'
import { ResultsView } from '@/components/ResultsView'
import { AnalysisResult } from '@/types'

interface PageState {
  step: 'idle' | 'scraping' | 'searching' | 'analyzing' | 'complete' | 'error'
  progress: number
  message: string
  result?: AnalysisResult
  error?: string
}

export default function Home() {
  const [state, setState] = useState<PageState>({
    step: 'idle',
    progress: 0,
    message: '',
  })
  const [pending, setPending] = useState(false)

  async function formAction(formData: FormData) {
    setPending(true)
    setState({ step: 'scraping', progress: 0, message: '' })
    try {
      const result = await analyzeCompetitors(
        { step: 'idle', progress: 0, message: '' },
        formData
      )
      setState(result)
    } catch {
      setState({ step: 'error', progress: 0, message: '', error: 'Er ging iets mis' })
    } finally {
      setPending(false)
    }
  }

  const showLoading = pending || (state.step !== 'idle' && state.step !== 'complete' && state.step !== 'error')

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-20 md:py-32">

        {/* Header — always visible */}
        <header className="mb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface border border-border mb-8 animate-fade-in">
            <div className="w-1.5 h-1.5 rounded-full gradient-bg" />
            <span className="font-satoshi text-xs text-text-dim tracking-wide uppercase">
              Newfound Agency
            </span>
          </div>

          <h1 className="font-greed text-5xl md:text-7xl lg:text-8xl mb-6 tracking-tight leading-[0.9] animate-fade-in-up">
            <span className="gradient-text">CONCURRENT</span>
            <br />
            <span className="text-text">ANALYSE</span>
          </h1>

          <p className="font-satoshi text-lg md:text-xl text-text-dim max-w-xl mx-auto leading-relaxed animate-fade-in-up stagger-2">
            Zie hoe jij je onderscheidt van je concurrenten.
            <br className="hidden md:block" />
            Vul je website in en ontdek waar jullie hetzelfde zeggen.
          </p>
        </header>

        {/* Main content */}
        {state.step === 'idle' && !pending && (
          <div className="animate-fade-in-up stagger-3">
            <InputForm action={formAction} pending={pending} />
          </div>
        )}

        {showLoading && (
          <LoadingScreen
            step={pending ? 'scraping' : state.step}
            progress={state.progress}
          />
        )}

        {state.step === 'complete' && state.result && (
          <ResultsView
            result={state.result}
            userUrl={state.result.concurrenten[0]?.url || ''}
          />
        )}

        {state.step === 'error' && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-400 font-satoshi mb-6">{state.error}</p>
            <button
              onClick={() => window.location.reload()}
              className="font-satoshi text-sm text-primary-bright hover:text-white transition-colors underline underline-offset-4"
            >
              Probeer opnieuw
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-32 pt-8 border-t border-border text-center">
          <p className="text-text-muted text-sm font-satoshi">
            Een tool van{' '}
            <a
              href="https://newfound.agency"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-dim hover:text-primary-bright transition-colors"
            >
              Newfound Agency
            </a>
          </p>
        </footer>
      </div>
    </main>
  )
}
