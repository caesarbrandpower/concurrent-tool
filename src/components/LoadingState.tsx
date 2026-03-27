'use client'

import { useState, useEffect } from 'react'

interface LoadingStateProps {
  steps: string[]
  currentStep: number
}

export default function LoadingState({ steps, currentStep }: LoadingStateProps) {
  const [showReassurance, setShowReassurance] = useState(false)
  const isLastStep = currentStep === steps.length - 1

  useEffect(() => {
    if (!isLastStep) {
      setShowReassurance(false)
      return
    }

    const timer = setTimeout(() => setShowReassurance(true), 8000)
    return () => clearTimeout(timer)
  }, [isLastStep])

  const activeText = isLastStep && showReassurance
    ? 'Nog heel even, bijna klaar\u2026'
    : steps[currentStep]

  return (
    <div className="text-center max-w-sm">
      {/* Progress dots: ● — ● — ● */}
      <div className="flex items-center justify-center gap-0 mb-12" style={{ fontSize: '14px' }}>
        {steps.map((_, index) => (
          <span key={index} className="flex items-center">
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: index <= currentStep ? '#0E6EFF' : 'rgba(255,255,255,0.2)',
                transition: 'background 0.5s',
              }}
              className={index === currentStep ? 'progress-dot' : ''}
            />
            {index < steps.length - 1 && (
              <span
                style={{
                  display: 'inline-block',
                  width: '32px',
                  height: '2px',
                  margin: '0 8px',
                  background: index < currentStep ? '#0E6EFF' : 'rgba(255,255,255,0.2)',
                  transition: 'background 0.5s',
                }}
              />
            )}
          </span>
        ))}
      </div>

      {/* Only the active step text */}
      <p className="text-xl font-body text-white animate-fade-in" style={{ fontWeight: 400 }} key={currentStep}>
        {activeText}
      </p>

      {/* Step counter */}
      <p className="mt-10 text-sm text-white/50 font-body" style={{ fontWeight: 300 }}>
        Stap {currentStep + 1} van {steps.length}
      </p>
    </div>
  )
}
