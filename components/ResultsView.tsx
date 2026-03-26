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
    <div className="space-y-14 animate-fade-in">
      {/* Summary section */}
      <section className="animate-fade-in-up">
        <h2 className="font-greed text-3xl md:text-4xl mb-6 gradient-text">
          WAT WE ZAGEN
        </h2>
        <div className="bg-surface rounded-2xl p-7 md:p-9 border border-border">
          <p className="font-satoshi text-lg leading-relaxed text-text/90">
            {result.samenvatting}
          </p>
        </div>
      </section>

      {/* Competitor cards */}
      <section>
        <h3 className="font-greed text-xl mb-6 text-text-dim">
          DRIE CONCURRENTEN
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {result.concurrenten.map((comp, index) => (
            <div
              key={index}
              className={`
                group gradient-border bg-surface rounded-2xl p-6
                hover:bg-surface-raised transition-all duration-300
                animate-fade-in-up stagger-${index + 1}
              `}
            >
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full gradient-bg-subtle flex items-center justify-center">
                    <span className="font-satoshi font-bold text-[10px] text-primary-bright">
                      {index + 1}
                    </span>
                  </div>
                  <span className="font-satoshi text-[11px] uppercase tracking-wider text-text-muted">
                    Concurrent
                  </span>
                </div>
                <h4 className="font-satoshi font-bold text-text truncate group-hover:text-primary-bright transition-colors">
                  {comp.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </h4>
              </div>

              {/* Description */}
              <p className="font-satoshi text-sm text-text-dim leading-relaxed mb-5">
                {comp.omschrijving}
              </p>

              {/* Overlap */}
              <div className="pt-4 border-t border-border">
                <p className="font-satoshi text-xs text-text-muted uppercase tracking-wider mb-1.5">Overlap</p>
                <p className="font-satoshi text-sm text-text-dim italic leading-relaxed">
                  {comp.overlap}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA to unlock */}
      <section className="text-center py-4">
        <div className="relative bg-surface rounded-2xl p-10 md:p-14 border border-border overflow-hidden animate-scale-in">
          {/* Ambient gradient in background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-blue/5 via-transparent to-primary-bright/5 pointer-events-none" />

          <div className="relative">
            <h3 className="font-greed text-3xl md:text-4xl mb-4 gradient-text">
              WAT JOU ÉCHT ANDERS MAAKT
            </h3>
            <p className="font-satoshi text-text-dim mb-10 max-w-md mx-auto leading-relaxed">
              Ontdek je onderscheidende punten en wat het je kost als je niet verandert.
            </p>
            <button
              onClick={() => setShowEmailGate(true)}
              className="gradient-bg font-satoshi font-bold text-white text-base
                         py-4 px-10 rounded-full
                         hover:opacity-90 transition-all duration-300
                         transform hover:scale-[1.02] active:scale-[0.98]
                         shadow-[0_4px_30px_rgba(132,99,255,0.3)]
                         hover:shadow-[0_6px_40px_rgba(132,99,255,0.4)]"
            >
              Toon mijn analyse
            </button>
            <p className="font-satoshi text-xs text-text-muted mt-5">
              Ontvang je volledige rapport per email
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
