'use client'

import { useState } from 'react'
import { ArrowRight, Globe } from 'lucide-react'

interface UrlInputProps {
  onSubmit: (url: string) => void
  isLoading: boolean
}

export default function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl
    }

    onSubmit(normalizedUrl)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`
          relative flex items-center overflow-hidden bg-dark-light rounded-btn border transition-all duration-300
          ${isFocused
            ? 'border-white/60 shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_4px_24px_rgba(0,0,0,0.3)]'
            : 'border-white/30 shadow-[0_2px_12px_rgba(0,0,0,0.2)]'
          }
        `}
      >
        <div className="flex items-center flex-1 min-w-0">
          <div className="pl-5 flex-shrink-0">
            <Globe className={`w-5 h-5 transition-colors duration-300 ${isFocused ? 'text-accent' : 'text-white/50'}`} />
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="jouwwebsite.nl"
            className="flex-1 min-w-0 py-5 px-4 text-lg bg-transparent border-none outline-none text-white placeholder:text-white/50 font-body"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={!url.trim() || isLoading}
          className="flex-shrink-0 py-3.5 px-7 bg-accent-blue text-white font-body font-medium hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 m-2.5 rounded-btn whitespace-nowrap"
        >
          {isLoading ? 'Bezig...' : 'Scan mijn markt'}
          {!isLoading && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>

      <p className="mt-4 text-sm text-white/50 font-body" style={{ fontWeight: 300 }}>
        Bijvoorbeeld: newfound.agency of www.jouwsite.nl
      </p>
    </form>
  )
}
