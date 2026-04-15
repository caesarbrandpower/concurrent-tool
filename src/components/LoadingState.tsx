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
    ? 'Nog even geduld, bijna klaar...'
    : steps[currentStep]

  return (
    <div className="text-center max-w-sm">
      {/* Progress dots: ● — ● — ● */}
      <div className="flex items-center justify-center gap-0" style={{ fontSize: '14px', marginBottom: '32px' }}>
        {steps.map((_, index) => {
          const isActive = index === currentStep
          const isCompleted = index < currentStep
          const dotColor = isActive
            ? '#DDB3FF'
            : isCompleted
            ? 'rgba(255, 255, 255, 0.35)'
            : 'rgba(255, 255, 255, 0.2)'
          const lineColor = isCompleted
            ? 'rgba(255, 255, 255, 0.25)'
            : 'rgba(255, 255, 255, 0.1)'
          return (
          <span key={index} className="flex items-center">
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: dotColor,
                transition: 'background 0.5s',
              }}
              className={isActive ? 'progress-dot' : ''}
            />
            {index < steps.length - 1 && (
              <span
                style={{
                  display: 'inline-block',
                  width: '32px',
                  height: '2px',
                  margin: '0 8px',
                  background: lineColor,
                  transition: 'background 0.5s',
                }}
              />
            )}
          </span>
          )
        })}
      </div>

      {/* Only the active step text */}
      <p className="font-body text-white animate-fade-in" style={{ fontWeight: 400, fontSize: '24px' }} key={currentStep}>
        {activeText}
      </p>

      {/* Step counter */}
      <p className="text-sm text-white/50 font-body" style={{ fontWeight: 300, marginTop: '16px' }}>
        Stap {currentStep + 1} van {steps.length}
      </p>
    </div>
  )
}
