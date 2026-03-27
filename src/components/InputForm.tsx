'use client';

import { useState } from 'react';

interface InputFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export default function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <div className="content-wrapper">
      <h1 className="main-heading">Hoe verhoudt jouw merk zich?</h1>
      <p className="sub-heading">
        Ontdek waar je écht verschilt van concurrenten — in gewone taal.
      </p>

      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <input
          type="text"
          className="input-field"
          placeholder="jouwwebsite.nl"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
        />

        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', marginTop: '1rem' }}
          disabled={isLoading || !url.trim()}
        >
          {isLoading ? 'Bezig...' : 'Analyseer mijn merk'}
        </button>
      </form>

      <p className="muted-text" style={{ textAlign: 'center', marginTop: '0.75rem' }}>
        Gratis analyse. Geen registratie nodig.
      </p>

      <p className="footer-text">
        Een tool van{' '}
        <a href="https://newfound.agency" target="_blank" rel="noopener noreferrer">
          Newfound Agency
        </a>
      </p>
    </div>
  );
}
