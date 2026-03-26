'use client'

import { useState, useEffect } from 'react'

interface LoadingScreenProps {
  step: 'idle' | 'scraping' | 'searching' | 'analyzing' | 'complete' | 'error'
  progress: number
}

const steps = [
  'Je website wordt gelezen...',
  'We zoeken concurrenten in jouw markt...',
  'We vergelijken hoe jullie overkomen...',
]

export function LoadingScreen({ step }: LoadingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const stepMap: Record<string, number> = {
    scraping: 0,
    searching: 1,
    analyzing: 2,
  }

  useEffect(() => {
    const mapped = stepMap[step]
    if (mapped !== undefined) {
      setCurrentStep(mapped)
    }
  }, [step])

  return (
    <div className="text-center max-w-md animate-fade-in">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-3 mb-8">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`
              w-2.5 h-2.5 rounded-full transition-all duration-500
              ${index === currentStep
                ? 'bg-accent-blue progress-dot scale-125'
                : index < currentStep
                  ? 'bg-accent-blue/60'
                  : 'bg-white/20'
              }
            `}
          />
        ))}
      </div>

      {/* Current step text */}
      <p className="font-body text-white text-lg mb-2" style={{ fontWeight: 400 }}>
        {steps[currentStep]}
      </p>

      <p className="font-body text-white/40 text-sm" style={{ fontWeight: 300 }}>
        Dit duurt meestal minder dan een minuut
      </p>
    </div>
  )
}
