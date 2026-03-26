'use client'

import { useState } from 'react'

interface InputFormProps {
  action: (formData: FormData) => void
  pending: boolean
}

export function InputForm({ action, pending }: InputFormProps) {
  const [url, setUrl] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!url.trim()) {
      setError('Vul een website URL in')
      return
    }

    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl
    }

    try {
      new URL(normalizedUrl)
      const formData = new FormData()
      formData.append('url', normalizedUrl)
      action(formData)
    } catch {
      setError('Voer een geldige URL in (bijvoorbeeld: jouwbedrijf.nl)')
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div
          className={`
            relative flex flex-col sm:flex-row sm:items-center overflow-hidden bg-dark-light rounded-btn border transition-all duration-300
            ${isFocused
              ? 'border-white/60 shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_4px_24px_rgba(0,0,0,0.3)]'
              : 'border-white/30 shadow-[0_2px_12px_rgba(0,0,0,0.2)]'
            }
          `}
        >
          <div className="flex items-center flex-1">
            <input
              type="text"
              name="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="jouwwebsite.nl"
              disabled={pending}
              className="flex-1 py-5 px-5 text-lg bg-transparent border-none outline-none text-white placeholder:text-white/50 font-body"
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={!url.trim() || pending}
            className="w-full sm:w-auto py-3.5 px-7 bg-accent-blue text-white font-body font-medium hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 rounded-none sm:rounded-none sm:m-2.5 sm:rounded-btn"
          >
            {pending ? 'Bezig...' : 'Analyseer mijn merk'}
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-400 font-body animate-fade-in">{error}</p>
      )}

      <p className="mt-4 text-sm text-white/50 font-body" style={{ fontWeight: 300 }}>
        Gratis analyse. Geen registratie nodig.
      </p>
    </div>
  )
}
