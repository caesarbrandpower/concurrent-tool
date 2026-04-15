'use client'

import { useState, useRef, useEffect } from 'react'
import UrlInput from '@/components/UrlInput'
import LoadingState from '@/components/LoadingState'
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
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([])
  const [slowServer, setSlowServer] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  const loadingSteps = [
    'We lezen jouw website...',
    competitorUrls.length > 0 ? 'We lezen je concurrenten...' : 'We zoeken drie concurrenten in jouw markt...',
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

  useEffect(() => {
    if (isLoading) {
      setSlowServer(false)
      const timer = setTimeout(() => setSlowServer(true), 15000)
      return () => clearTimeout(timer)
    } else {
      setSlowServer(false)
    }
  }, [isLoading])

  const handleUrlSubmit = async (submittedUrl: string, competitorUrls: string[] = []) => {
    setUrl(submittedUrl)
    setCompetitorUrls(competitorUrls)
    setIsLoading(true)
    setLoadingStep(0)
    setError(null)
    setResult(null)
    setShowManualInput(false)
    setSlowServer(false)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: submittedUrl, competitorUrls: competitorUrls.length > 0 ? competitorUrls : undefined }),
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
        const errData = await response.json().catch(() => null)
        throw new Error(errData?.message || errData?.error || 'Analyse mislukt')
      }

      const data = await response.json()
      setResult(data.result)

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      console.error('Analyse error:', err)
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
          url: url,
          manualContent: manualInput,
          competitorUrls: competitorUrls.length > 0 ? competitorUrls : undefined,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => null)
        throw new Error(errData?.message || errData?.error || 'Analyse mislukt')
      }

      const data = await response.json()
      setResult(data.result)
      setShowManualInput(false)

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      console.error('Analyse error:', err)
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
          <img src="https://newfound.agency/wp-content/uploads/2025/06/Logo_newfound.svg" alt="Newfound" style={{ height: '18px' }} />
        </a>
      </nav>

      {/* Hero sectie */}
      {!result && !isLoading && (!error || showManualInput) && (
        <div className="flex flex-col items-center min-h-[calc(100vh-72px)]">
          <div className="flex-1 flex flex-col justify-center w-full mx-auto text-center px-4" style={{ maxWidth: '680px' }}>
            <p className="label-style text-accent mb-6 animate-hero-title">Marktscan</p>

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
              <UrlInput onSubmit={handleUrlSubmit} isLoading={isLoading} />
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
          <div className="text-center">
            <LoadingState steps={loadingSteps} currentStep={loadingStep} />
            {slowServer && (
              <p className="mt-6 text-white/50 font-body animate-fade-in" style={{ fontSize: '14px', fontWeight: 300 }}>
                Even geduld, drukke server. We proberen het opnieuw.
              </p>
            )}
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
