'use client'

import { useState } from 'react'

interface InputFormProps {
  action: (formData: FormData) => void
  pending: boolean
}

export function InputForm({ action, pending }: InputFormProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!url.trim()) {
      setError('Vul een website URL in')
      return
    }

    // Basic URL validation
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <input
            type="text"
            name="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="jouwwebsite.nl"
            disabled={pending}
            className="w-full bg-dark-800 border-2 border-dark-600 rounded-lg px-6 py-5 text-lg 
                       text-accent placeholder-accent-dim/50 
                       focus:border-accent focus:outline-none transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed
                       font-satoshi"
            autoComplete="off"
          />
          {url && (
            <button
              type="button"
              onClick={() => setUrl('')}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-accent-dim hover:text-accent transition-colors"
              aria-label="Wis invoer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        {error && (
          <p className="text-red-400 text-sm font-satoshi animate-fade-in">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !url.trim()}
          className="w-full bg-accent text-dark-900 font-satoshi font-bold text-lg 
                     py-5 px-8 rounded-lg hover:bg-white transition-all duration-300
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent
                     transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {pending ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Bezig...
            </span>
          ) : (
            'Analyseer mijn merk'
          )}
        </button>
      </form>

      <p className="text-center text-accent-dim text-sm mt-6 font-satoshi">
        Gratis analyse. Geen registratie nodig.
      </p>
    </div>
  )
}