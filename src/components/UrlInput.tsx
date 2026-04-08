'use client'

import { useState } from 'react'
import { Globe } from 'lucide-react'

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
        style={{
          background: 'rgb(42, 42, 42)',
          border: isFocused ? '0.9px solid rgba(255, 255, 255, 0.6)' : '0.9px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '6px',
          display: 'flex',
          flexDirection: 'row' as const,
          alignItems: 'center',
          overflow: 'hidden',
          boxShadow: isFocused
            ? '0 0 0 1px rgba(255,255,255,0.2), 0 4px 24px rgba(0,0,0,0.3)'
            : '0 2px 12px rgba(0,0,0,0.2)',
          transition: 'all 0.3s',
        }}
      >
        <div style={{ paddingLeft: '20px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <Globe
            style={{
              width: '20px',
              height: '20px',
              color: isFocused ? '#DDB3FF' : 'rgba(255, 255, 255, 0.4)',
              transition: 'color 0.3s',
            }}
          />
        </div>

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="jouwwebsite.nl"
          disabled={isLoading}
          style={{
            background: 'transparent',
            color: 'rgb(255, 255, 255)',
            fontSize: '18px',
            padding: '20px 16px',
            border: 'none',
            outline: 'none',
            flex: 1,
            minWidth: 0,
            fontFamily: 'Satoshi, sans-serif',
          }}
        />

        <button
          type="submit"
          disabled={!url.trim() || isLoading}
          style={{
            background: 'rgb(14, 110, 255)',
            color: 'rgb(255, 255, 255)',
            fontSize: '16px',
            padding: '14px 28px',
            borderRadius: '0px',
            border: 'none',
            whiteSpace: 'nowrap' as const,
            cursor: (!url.trim() || isLoading) ? 'not-allowed' : 'pointer',
            opacity: (!url.trim() || isLoading) ? 0.4 : 1,
            fontFamily: 'Satoshi, sans-serif',
            fontWeight: 500,
            transition: 'filter 0.2s, opacity 0.2s',
            alignSelf: 'stretch',
          }}
          onMouseEnter={(e) => { if (url.trim() && !isLoading) (e.currentTarget).style.filter = 'brightness(1.1)' }}
          onMouseLeave={(e) => { (e.currentTarget).style.filter = 'none' }}
        >
          {isLoading ? 'Bezig...' : 'Scan mijn markt \u2192'}
        </button>
      </div>

      <p style={{ marginTop: '16px', fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontFamily: 'Satoshi, sans-serif', fontWeight: 300 }}>
        Bijvoorbeeld: newfound.agency of www.jouwsite.nl
      </p>
    </form>
  )
}
