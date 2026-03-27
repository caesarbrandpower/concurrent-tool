'use client'

import { useState, useRef, useEffect } from 'react'
import ResultsView from '@/components/ResultsView'
import { AnalysisResult } from '@/types'

export default function Home() {
  const [url, setUrl] = useState('')
  const [manualInput, setManualInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  const loadingSteps = [
    'We lezen jouw website...',
    'We zoeken vijf concurrenten in jouw markt...',
    'We vergelijken hoe jullie overkomen...',
  ]

  useEffect(() => {
    if (isLoading && loadingStep < loadingSteps.length - 1) {
      const timer = setTimeout(() => {
        setLoadingStep((prev) => prev + 1)
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [isLoading, loadingStep])

  const [showReassurance, setShowReassurance] = useState(false)
  const isLastStep = loadingStep === loadingSteps.length - 1

  useEffect(() => {
    if (!isLoading || !isLastStep) {
      setShowReassurance(false)
      return
    }
    const timer = setTimeout(() => setShowReassurance(true), 8000)
    return () => clearTimeout(timer)
  }, [isLoading, isLastStep])

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    let submittedUrl = url.trim()
    if (!submittedUrl.startsWith('http')) {
      submittedUrl = 'https://' + submittedUrl
    }

    setIsLoading(true)
    setLoadingStep(0)
    setError(null)
    setResult(null)
    setShowManualInput(false)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: submittedUrl }),
      })

      if (response.status === 422) {
        const data = await response.json()
        if (data.fallback) {
          setIsLoading(false)
          setShowManualInput(true)
          setError(data.message || 'We konden je website niet goed lezen. Beschrijf je merk kort in eigen woorden.')
          return
        }
      }

      if (!response.ok) {
        throw new Error('Analyse mislukt')
      }

      const data = await response.json()
      setResult(data.result)

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) return

    setIsLoading(true)
    setLoadingStep(1)
    setError(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          manualContent: manualInput,
        }),
      })

      if (!response.ok) {
        throw new Error('Analyse mislukt')
      }

      const data = await response.json()
      setResult(data.result)
      setShowManualInput(false)

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-dark">
      {/* Navbar with gradient background — full bleed */}
      <nav className="gradient-navbar" style={{ height: '72px', paddingLeft: '24px', paddingRight: '24px' }}>
        <a href="https://newfound.agency" target="_blank">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://newfound.agency/wp-content/uploads/2025/06/Logo_newfound.svg" height={18} alt="Newfound" style={{ height: '18px' }} />
        </a>
      </nav>

      {/* Hero sectie */}
      {!result && !isLoading && (!error || showManualInput) && (
        <div className="flex flex-col items-center min-h-[calc(100vh-72px)]">
          <div className="flex-1 flex flex-col justify-center w-full mx-auto text-center px-4" style={{ maxWidth: '680px' }}>
            <h1 className="font-heading text-white mb-5 animate-hero-title">
              Zie hoe jij je<br />verhoudt.
            </h1>

            <h2 className="text-white mb-3 animate-hero-subtitle">
              Ontdek waar jij en je concurrenten hetzelfde zeggen.
            </h2>

            <p className="text-white/60 mb-16 font-body animate-hero-body" style={{ fontWeight: 300 }}>
              Vul je website in en krijg een analyse in 60 seconden.
            </p>

            <div className="animate-hero-cta">
              <form onSubmit={handleUrlSubmit} className="w-full">
                <div
                  className={`
                    relative flex flex-col sm:flex-row sm:items-center overflow-hidden bg-dark-light rounded-btn border transition-all duration-300
                    ${isFocused
                      ? 'border-white/60 shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_4px_24px_rgba(0,0,0,0.3)]'
                      : 'border-white/30 shadow-[0_2px_12px_rgba(0,0,0,0.2)]'
                    }
                  `}
                >
                  <div className="flex items-center flex-1">
                    <div className="pl-5">
                      <svg className={`w-5 h-5 transition-colors duration-300 ${isFocused ? 'text-accent' : 'text-white/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </div>

                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="Voer je website-URL in"
                      className="flex-1 py-5 px-4 text-lg bg-transparent border-none outline-none text-white placeholder:text-white/50 font-body"
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!url.trim() || isLoading}
                    className="w-full sm:w-auto py-3.5 px-7 bg-accent-blue text-white font-body font-medium hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 rounded-none sm:rounded-none sm:m-2.5 sm:rounded-btn"
                  >
                    {isLoading ? 'Bezig...' : 'Analyseer mijn merk'}
                    {!isLoading && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    )}
                  </button>
                </div>

                <p className="mt-4 text-sm text-white/50 font-body" style={{ fontWeight: 300 }}>
                  Bijvoorbeeld: newfound.agency of www.jouwsite.nl
                </p>
              </form>
            </div>

            {showManualInput && (
              <div className="mt-10 p-6 bg-dark-light border border-white/10 rounded-btn animate-fade-in text-left">
                <p className="text-white mb-4">{error}</p>
                <textarea
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Beschrijf je bedrijf: wat doe je, voor wie, en wat maakt jullie uniek?"
                  className="w-full p-4 bg-dark border border-white/20 rounded-btn resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all font-body text-white placeholder:text-white/50"
                  rows={5}
                />
                <button
                  onClick={handleManualSubmit}
                  disabled={!manualInput.trim() || isLoading}
                  className="mt-4 w-full py-3 px-6 bg-accent-blue text-white rounded-btn font-body font-medium hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Analyseer mijn merk
                </button>
              </div>
            )}
          </div>

          <div className="pb-8 text-sm text-white/50 animate-hero-footer">
            Een product van <a href="https://newfound.agency" target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-accent transition-colors">Newfound</a>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !result && (
        <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-3 mb-12">
              {loadingSteps.map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className={`
                      w-2.5 h-2.5 rounded-full transition-all duration-700
                      ${index < loadingStep ? 'bg-accent scale-100' : ''}
                      ${index === loadingStep ? 'bg-accent-blue scale-125 progress-dot' : ''}
                      ${index > loadingStep ? 'bg-white/20 scale-100' : ''}
                    `}
                  />
                  {index < loadingSteps.length - 1 && (
                    <div
                      className={`
                        w-12 h-px transition-all duration-700
                        ${index < loadingStep ? 'bg-accent' : 'bg-white/20'}
                      `}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Current step text */}
            <div className="relative h-16">
              {loadingSteps.map((step, index) => (
                <div
                  key={index}
                  className={`
                    absolute inset-0 flex items-center justify-center
                    transition-all duration-500
                    ${index === loadingStep ? 'opacity-100 transform translate-y-0' : ''}
                    ${index < loadingStep ? 'opacity-0 transform -translate-y-4' : ''}
                    ${index > loadingStep ? 'opacity-0 transform translate-y-4' : ''}
                  `}
                >
                  <p className="text-xl font-body text-white" style={{ fontWeight: 400 }}>
                    {index === loadingSteps.length - 1 && showReassurance ? 'Nog heel even, bijna klaar\u2026' : step}
                  </p>
                </div>
              ))}
            </div>

            {/* Step counter */}
            <p className="mt-10 text-sm text-white/50 font-body" style={{ fontWeight: 300 }}>
              Stap {loadingStep + 1} van {loadingSteps.length}
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && !result && !showManualInput && (
        <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4">
          <div className="text-center max-w-md animate-fade-in">
            <div className="w-16 h-16 border-2 border-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl text-accent">!</span>
            </div>
            <h3 className="font-body text-xl font-normal text-white mb-3">{error}</h3>
            <button
              onClick={() => {
                setError(null)
                setUrl('')
                setShowManualInput(false)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent-blue text-white rounded-btn font-body font-medium hover:brightness-110 transition-all"
            >
              Probeer opnieuw
            </button>
          </div>
        </div>
      )}

      {/* Resultaat */}
      {result && (
        <div ref={resultRef}>
          <ResultsView
            url={url}
            result={result}
          />
        </div>
      )}
    </main>
  )
}
