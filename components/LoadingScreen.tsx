'use client'

import { useState, useEffect } from 'react'

interface LoadingScreenProps {
  step: 'idle' | 'scraping' | 'searching' | 'analyzing' | 'complete' | 'error'
  progress: number
}

const steps = [
  { id: 'scraping', label: 'We lezen jouw website...' },
  { id: 'searching', label: 'We zoeken drie concurrenten in jouw markt...' },
  { id: 'analyzing', label: 'We vergelijken hoe jullie overkomen...' },
]

export function LoadingScreen({ step }: LoadingScreenProps) {
  const [showAlmostDone, setShowAlmostDone] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (elapsedTime >= 8 && step === 'analyzing') {
      setShowAlmostDone(true)
    }
  }, [elapsedTime, step])

  const currentStepIndex = steps.findIndex((s) => s.id === step)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  return (
    <div className="w-full max-w-2xl mx-auto py-16">
      <div className="space-y-8">
        {/* Progress bar */}
        <div className="relative h-1 bg-dark-600 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-accent transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((s, index) => {
            const isActive = index === currentStepIndex
            const isCompleted = index < currentStepIndex

            return (
              <div 
                key={s.id}
                className={`flex items-center gap-4 transition-all duration-500 ${
                  isActive ? 'opacity-100' : isCompleted ? 'opacity-50' : 'opacity-30'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isActive 
                    ? 'border-accent bg-accent/10 animate-pulse-slow' 
                    : isCompleted 
                      ? 'border-accent bg-accent' 
                      : 'border-dark-600'
                }`}>
                  {isCompleted ? (
                    <svg className="w-4 h-4 text-dark-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className={`text-sm font-satoshi font-bold ${isActive ? 'text-accent' : 'text-accent-dim'}`}>
                      {index + 1}
                    </span>
                  )}
                </div>
                <span className={`font-satoshi text-lg ${isActive ? 'text-accent' : 'text-accent-dim'}`}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Almost done message */}
        {showAlmostDone && (
          <p className="text-center text-accent-dim font-satoshi italic animate-fade-in">
            Nog even, bijna klaar...
          </p>
        )}
      </div>
    </div>
  )
}