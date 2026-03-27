'use client';

import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  step: number;
}

const steps = [
  'We lezen jouw website...',
  'We zoeken drie concurrenten in jouw markt...',
  'We vergelijken hoe jullie overkomen...',
];

export default function LoadingScreen({ step }: LoadingScreenProps) {
  const [displayText, setDisplayText] = useState(steps[0]);

  useEffect(() => {
    if (step >= 3) {
      const timer = setTimeout(() => {
        setDisplayText('Nog even, bijna klaar…');
      }, 8000);
      return () => clearTimeout(timer);
    } else {
      setDisplayText(steps[step] || steps[0]);
    }
  }, [step]);

  return (
    <div className="page-container">
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
                {index < step ? '✓' : index === step ? '○' : '○'}
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

        {step >= 3 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
            {displayText}
          </p>
        )}
      </div>
    </div>
  );
}
