'use client';

import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  step: number;
}

const steps = [
  'We lezen jouw website...',
  'We zoeken vijf concurrenten in jouw markt...',
  'We vergelijken hoe jullie overkomen...',
];

export default function LoadingScreen({ step }: LoadingScreenProps) {
  const [showExtra, setShowExtra] = useState(false);

  useEffect(() => {
    if (step >= 2) {
      const timer = setTimeout(() => {
        setShowExtra(true);
      }, 8000);
      return () => clearTimeout(timer);
    } else {
      setShowExtra(false);
    }
  }, [step]);

  return (
    <div className="page-container" style={{ background: 'var(--background)' }}>
      <div className="loading-container">
        <div className="loading-steps">
          {steps.map((text, index) => (
            <div
              key={index}
              className={`loading-step ${
                index === step ? 'active' : index < step ? 'completed' : ''
              }`}
            >
              <span>
                {index < step ? '\u2713' : '\u25CB'}
              </span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {step === 2 && (
          <div className="pulse-dots">
            <span className="pulse-dot"></span>
            <span className="pulse-dot"></span>
            <span className="pulse-dot"></span>
          </div>
        )}

        {showExtra && step >= 2 && (
          <p className="animate-fade-in" style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
            Nog even, bijna klaar...
          </p>
        )}
      </div>
    </div>
  );
}
