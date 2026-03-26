'use client'

import { useState } from 'react'

interface InputFormProps {
  action: (formData: FormData) => void
  pending: boolean
}

export function InputForm({ action, pending }: InputFormProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)

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
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        {/* Pill-shaped input container */}
        <div className={`
          relative rounded-full overflow-hidden transition-all duration-500
          ${focused ? 'shadow-[0_0_0_1px_rgba(132,99,255,0.3),0_0_30px_rgba(132,99,255,0.1)]' : 'shadow-[0_0_0_1px_rgba(255,255,255,0.06)]'}
        `}>
          {/* Background */}
          <div className="absolute inset-0 bg-surface" />

          <div className="relative flex items-center">
            {/* Search icon */}
            <div className="pl-6 pr-2">
              <svg
                className={`w-5 h-5 transition-colors duration-300 ${focused ? 'text-primary-bright' : 'text-text-muted'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Input */}
            <input
              type="text"
              name="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="jouwwebsite.nl"
              disabled={pending}
              className="flex-1 bg-transparent py-5 px-2 text-lg text-text
                         placeholder-text-muted
                         focus:outline-none disabled:opacity-50
                         font-satoshi"
              autoComplete="off"
            />

            {/* Clear button */}
            {url && (
              <button
                type="button"
                onClick={() => setUrl('')}
                className="p-2 mr-1 text-text-muted hover:text-text transition-colors rounded-full hover:bg-surface-raised"
                aria-label="Wis invoer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Submit button — gradient pill */}
            <div className="pr-2">
              <button
                type="submit"
                disabled={pending || !url.trim()}
                className="gradient-bg font-satoshi font-bold text-white
                           py-3 px-7 rounded-full text-sm
                           hover:opacity-90 transition-all duration-300
                           disabled:opacity-30 disabled:cursor-not-allowed
                           transform hover:scale-[1.02] active:scale-[0.98]
                           shadow-[0_2px_20px_rgba(132,99,255,0.25)]
                           hover:shadow-[0_4px_30px_rgba(132,99,255,0.35)]"
              >
                {pending ? (
                  <svg className="w-5 h-5 animate-spin-slow" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  'Analyseer'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {error && (
        <p className="text-red-400 text-sm font-satoshi mt-4 text-center animate-fade-in">
          {error}
        </p>
      )}

      <p className="text-center text-text-muted text-sm mt-6 font-satoshi">
        Gratis analyse &middot; Geen registratie nodig
      </p>
    </div>
  )
}
