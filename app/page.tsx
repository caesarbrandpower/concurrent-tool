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

  const isLoading = pending || (state.step !== 'idle' && state.step !== 'complete' && state.step !== 'error')

  return (
    <main className="min-h-screen bg-dark">
      {/* Gradient navbar — identical to Brandprompt */}
      <nav className="gradient-navbar" style={{ height: '72px', paddingLeft: '24px', paddingRight: '24px' }}>
        <a href="https://newfound.agency" target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://newfound.agency/wp-content/uploads/2025/06/Logo_newfound.svg" height={18} alt="Newfound" style={{ height: '18px' }} />
        </a>
      </nav>

      {/* Hero — idle state */}
      {state.step === 'idle' && !pending && (
        <div className="flex flex-col items-center min-h-[calc(100vh-72px)]">
          <div className="flex-1 flex flex-col justify-center w-full mx-auto text-center px-4" style={{ maxWidth: '680px' }}>
            <p className="font-body text-accent mb-6 animate-hero-title" style={{ fontSize: '15px', fontWeight: 400 }}>
              Concurrent Analyse
            </p>

            <h1 className="font-heading text-white mb-5 animate-hero-title">
              Zie hoe jij je<br />onderscheidt.
            </h1>

            <h2 className="text-white mb-3 animate-hero-subtitle">
              Ontdek waar jij en je concurrenten hetzelfde zeggen.
            </h2>

            <p className="text-white/60 mb-16 font-body animate-hero-body" style={{ fontWeight: 300 }}>
              Vul je website in en krijg een analyse in 60 seconden.
            </p>

            <div className="animate-hero-cta">
              <InputForm action={formAction} pending={pending} />
            </div>
          </div>

          <div className="pb-8 text-sm text-white/50 animate-hero-footer font-body" style={{ fontWeight: 300 }}>
            Een tool van{' '}
            <a href="https://newfound.agency" target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-accent transition-colors">
              Newfound Agency
            </a>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4">
          <LoadingScreen
            step={pending ? 'scraping' : state.step}
            progress={state.progress}
          />
        </div>
      )}

      {/* Results */}
      {state.step === 'complete' && state.result && (
        <ResultsView
          result={state.result}
          userUrl={state.result.concurrenten[0]?.url || ''}
        />
      )}

      {/* Error */}
      {state.step === 'error' && (
        <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4">
          <div className="text-center max-w-md animate-fade-in">
            <div className="w-16 h-16 border-2 border-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl text-accent">!</span>
            </div>
            <h3 className="font-body text-xl text-white mb-3" style={{ fontWeight: 400 }}>
              {state.error}
            </h3>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent-blue text-white rounded-btn font-body font-medium hover:brightness-110 transition-all"
            >
              Probeer opnieuw
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
