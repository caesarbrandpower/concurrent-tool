'use client'

import { useState } from 'react'
import { AnalysisResult } from '@/types'
import { EmailGate } from './EmailGate'

interface ResultsViewProps {
  result: AnalysisResult
  userUrl: string
}

export function ResultsView({ result, userUrl }: ResultsViewProps) {
  const [showEmailGate, setShowEmailGate] = useState(false)

  if (showEmailGate) {
    return (
      <EmailGate
        userUrl={userUrl}
        analysis={result}
        onBack={() => setShowEmailGate(false)}
      />
    )
  }

  return (
    <div className="w-full mx-auto px-4 py-16" style={{ maxWidth: '780px' }}>
      {/* Summary */}
      <section className="mb-14 animate-slide-up">
        <h1 className="font-heading text-white mb-6" style={{ fontSize: 'clamp(24px, 3.5vw, 40px)' }}>
          WAT WE ZAGEN
        </h1>
        <div className="bg-dark-light border border-white/10 rounded-btn p-6 md:p-8">
          <p className="font-body text-white/80 text-lg leading-relaxed" style={{ fontWeight: 300 }}>
            {result.samenvatting}
          </p>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="gradient-line mb-14" />

      {/* Competitor cards */}
      <section className="mb-14">
        <h1 className="font-heading text-white mb-6" style={{ fontSize: 'clamp(20px, 3vw, 32px)' }}>
          DRIE CONCURRENTEN
        </h1>
        <div className="grid gap-4 md:grid-cols-3">
          {result.concurrenten.map((comp, index) => (
            <div
              key={index}
              className="bg-dark-light border border-white/10 rounded-btn p-5 hover:border-white/20 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <p className="font-body text-white/40 text-xs uppercase tracking-wider mb-2" style={{ fontWeight: 400 }}>
                Concurrent {index + 1}
              </p>
              <h4 className="font-body text-white mb-3 truncate" style={{ fontWeight: 400 }}>
                {comp.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </h4>
              <p className="font-body text-white/60 text-sm leading-relaxed mb-4" style={{ fontWeight: 300 }}>
                {comp.omschrijving}
              </p>
              <div className="pt-3 border-t border-white/10">
                <p className="font-body text-white/40 text-xs uppercase tracking-wider mb-1" style={{ fontWeight: 400 }}>
                  Overlap
                </p>
                <p className="font-body text-white/50 text-sm italic leading-relaxed" style={{ fontWeight: 300 }}>
                  {comp.overlap}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gradient divider */}
      <div className="gradient-line mb-14" />

      {/* CTA to unlock deeper insights */}
      <section className="text-center animate-slide-up">
        <div className="bg-dark-light border border-white/10 rounded-btn p-8 md:p-12">
          <h1 className="font-heading text-white mb-4" style={{ fontSize: 'clamp(22px, 3vw, 36px)' }}>
            WAT JOU ÉCHT ANDERS MAAKT
          </h1>
          <p className="font-body text-white/60 mb-8 max-w-md mx-auto" style={{ fontWeight: 300 }}>
            Ontdek je onderscheidende punten en wat het je kost als je niet verandert.
          </p>
          <button
            onClick={() => setShowEmailGate(true)}
            className="py-3.5 px-8 bg-accent-blue text-white font-body font-medium rounded-btn hover:brightness-110 transition-all duration-200"
          >
            Toon mijn analyse
          </button>
          <p className="font-body text-white/40 text-sm mt-4" style={{ fontWeight: 300 }}>
            We sturen je een bevestiging per email. Geen spam, beloofd.
          </p>
        </div>
      </section>
    </div>
  )
}
