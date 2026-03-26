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

  return (
    <main className="min-h-screen bg-dark-900 text-accent">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <header className="mb-16 text-center">
          <h1 className="font-greed text-4xl md:text-6xl lg:text-7xl mb-6 tracking-tight">
            CONCURRENT ANALYSE
          </h1>
          <p className="font-satoshi text-lg md:text-xl text-accent-dim max-w-2xl mx-auto leading-relaxed">
            Zie hoe jij je onderscheidt van je concurrenten. 
            Vul je website in en ontdek waar jullie allemaal hetzelfde zeggen.
          </p>
        </header>

        {/* Main content */}
        {state.step === 'idle' && (
          <InputForm action={formAction} pending={pending} />
        )}

        {(pending || (state.step !== 'idle' && state.step !== 'complete' && state.step !== 'error')) && (
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
          <div className="text-center py-16">
            <p className="text-red-400 mb-4">{state.error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-accent underline hover:text-white transition-colors"
            >
              Probeer opnieuw
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-dark-600 text-center">
          <p className="text-accent-dim text-sm font-satoshi">
            Een tool van{' '}
            <a 
              href="https://newfound.agency" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Newfound Agency
            </a>
          </p>
        </footer>
      </div>
    </main>
  )
}