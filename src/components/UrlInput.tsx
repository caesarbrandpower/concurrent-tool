'use client'

import { useState } from 'react'
import { Globe } from 'lucide-react'

interface UrlInputProps {
  onSubmit: (url: string, competitorUrls: string[]) => void
  isLoading: boolean
}

export default function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [competitors, setCompetitors] = useState(['', '', ''])
  const [showCompetitors, setShowCompetitors] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl
    }

    const competitorUrls = competitors
      .map(c => c.trim())
      .filter(c => c.length > 0)
      .map(c => c.startsWith('http') ? c : 'https://' + c)

    onSubmit(normalizedUrl, competitorUrls)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full" style={{ paddingLeft: '16px', paddingRight: '16px', boxSizing: 'border-box' as const }}>
      <div
        style={{
          background: 'rgb(42, 42, 42)',
          border: isFocused ? '0.9px solid rgba(255, 255, 255, 0.6)' : '0.9px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '6px',
          display: 'flex',
          flexDirection: 'row' as const,
          flexWrap: 'wrap' as const,
          alignItems: 'center',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box' as const,
          boxShadow: isFocused
            ? '0 0 0 1px rgba(255,255,255,0.2), 0 4px 24px rgba(0,0,0,0.3)'
            : '0 2px 12px rgba(0,0,0,0.2)',
          transition: 'all 0.3s',
        }}
      >
        <div style={{ paddingLeft: '16px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
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
            padding: '20px 12px',
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
          className="submit-btn-responsive"
          style={{
            background: '#0E6EFF',
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

      {/* Concurrent URL velden — verborgen, code blijft beschikbaar */}
      {showCompetitors && (
        <div style={{
          marginTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}>
          {competitors.map((comp, i) => (
            <div key={i}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.4)',
                fontFamily: 'Satoshi, sans-serif',
                fontWeight: 400,
                marginBottom: '4px',
                textAlign: 'left',
              }}>
                Concurrent {i + 1}
              </label>
              <input
                type="text"
                value={comp}
                onChange={(e) => {
                  const updated = [...competitors]
                  updated[i] = e.target.value
                  setCompetitors(updated)
                }}
                placeholder={`https://concurrent${i + 1}.nl`}
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: 'rgb(42, 42, 42)',
                  color: 'rgb(255, 255, 255)',
                  fontSize: '16px',
                  padding: '14px 18px',
                  border: '0.9px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  outline: 'none',
                  fontFamily: 'Satoshi, sans-serif',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
              />
            </div>
          ))}
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontFamily: 'Satoshi, sans-serif', fontWeight: 300, textAlign: 'left' }}>
            Niet verplicht. Laat leeg en we zoeken ze automatisch.
          </p>
        </div>
      )}
    </form>
  )
}
