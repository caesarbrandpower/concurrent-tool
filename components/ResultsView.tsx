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
    <div className="space-y-12 animate-fade-in">
      {/* Layer 1: Free visible content */}
      <section>
        <h2 className="font-greed text-3xl md:text-4xl mb-6 text-accent">
          WAT WE ZAGEN
        </h2>
        <div className="bg-dark-800 rounded-xl p-6 md:p-8 border border-dark-600">
          <p className="font-satoshi text-lg leading-relaxed text-accent">
            {result.samenvatting}
          </p>
        </div>
      </section>

      {/* Competitor cards */}
      <section>
        <h3 className="font-greed text-xl mb-6 text-accent-dim">
          DRIE CONCURRENTEN
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {result.concurrenten.map((comp, index) => (
            <div 
              key={index}
              className="bg-dark-800 rounded-xl p-6 border border-dark-600 hover:border-accent/30 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-dark-700 rounded-full text-xs font-satoshi text-accent-dim mb-3">
                  Concurrent {index + 1}
                </span>
                <h4 className="font-satoshi font-bold text-accent truncate">
                  {comp.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </h4>
              </div>
              <p className="font-satoshi text-sm text-accent/80 leading-relaxed mb-4">
                {comp.omschrijving}
              </p>
              <div className="pt-4 border-t border-dark-600">
                <p className="font-satoshi text-sm text-accent-dim italic">
                  {comp.overlap}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA to unlock layer 2 */}
      <section className="text-center py-8">
        <div className="bg-gradient-to-b from-dark-800 to-dark-900 rounded-2xl p-8 md:p-12 border border-dark-600">
          <h3 className="font-greed text-2xl md:text-3xl mb-4 text-accent">
            WAT JOU ÉCHT ANDERS MAAKT
          </h3>
          <p className="font-satoshi text-accent-dim mb-8 max-w-lg mx-auto">
            Ontdek je onderscheidende punten en wat het je kost als je niet verandert.
          </p>
          <button
            onClick={() => setShowEmailGate(true)}
            className="bg-accent text-dark-900 font-satoshi font-bold text-lg 
                       py-4 px-10 rounded-lg hover:bg-white transition-all duration-300
                       transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Toon mijn analyse
          </button>
          <p className="font-satoshi text-sm text-accent-dim mt-4">
            We sturen je een bevestiging per email. Geen spam, beloofd.
          </p>
        </div>
      </section>
    </div>
  )
}