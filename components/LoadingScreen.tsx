'use client'

import { useState, useEffect } from 'react'

interface LoadingScreenProps {
  step: 'idle' | 'scraping' | 'searching' | 'analyzing' | 'complete' | 'error'
  progress: number
}

const steps = [
  {
    id: 'scraping',
    label: 'We lezen jouw website',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  },
  {
    id: 'searching',
    label: 'We zoeken concurrenten in jouw markt',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: 'analyzing',
    label: 'We vergelijken hoe jullie overkomen',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
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
  const progress = Math.max(((currentStepIndex + 1) / steps.length) * 100, 10)

  return (
    <div className="w-full max-w-lg mx-auto py-16 animate-fade-in">
      {/* Animated gradient orb */}
      <div className="flex justify-center mb-12">
        <div className="relative">
          <div className="w-20 h-20 rounded-full gradient-bg opacity-20 animate-pulse-glow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full gradient-bg animate-spin-slow opacity-60"
              style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)' }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-primary-bright" />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-[2px] bg-surface-raised rounded-full overflow-hidden mb-10">
        <div
          className="absolute top-0 left-0 h-full gradient-bg transition-all duration-1000 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
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
              className={`
                flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-500
                ${isActive
                  ? 'bg-surface border border-primary-bright/20'
                  : isCompleted
                    ? 'bg-transparent opacity-50'
                    : 'bg-transparent opacity-20'
                }
              `}
            >
              {/* Step indicator */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                transition-all duration-500
                ${isActive
                  ? 'gradient-bg shadow-[0_0_16px_rgba(132,99,255,0.3)]'
                  : isCompleted
                    ? 'bg-primary-bright/20'
                    : 'bg-surface-raised'
                }
              `}>
                {isCompleted ? (
                  <svg className="w-4 h-4 text-primary-bright" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className={isActive ? 'text-white' : 'text-text-muted'}>
                    {s.icon}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`
                font-satoshi text-[15px]
                ${isActive ? 'text-text' : isCompleted ? 'text-text-dim' : 'text-text-muted'}
              `}>
                {s.label}
                {isActive && (
                  <span className="inline-flex ml-1">
                    <span className="animate-pulse">.</span>
                    <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
                    <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
                  </span>
                )}
              </span>
            </div>
          )
        })}
      </div>

      {/* Almost done */}
      {showAlmostDone && (
        <p className="text-center text-text-dim font-satoshi text-sm mt-8 italic animate-fade-in">
          Nog even, bijna klaar...
        </p>
      )}
    </div>
  )
}
