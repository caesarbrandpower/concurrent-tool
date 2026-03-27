'use client';

import { useState } from 'react';

interface FallbackFormProps {
  onSubmit: (content: string) => void;
}

export default function FallbackForm({ onSubmit }: FallbackFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim());
    }
  };

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="fallback-box">
          <p className="fallback-title">
            We konden je website niet goed lezen.
          </p>
          <p className="body-text">
            Beschrijf je merk kort in eigen woorden.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
          <textarea
            className="input-field"
            style={{ minHeight: '150px', resize: 'vertical' }}
            placeholder="Bijvoorbeeld: Wij zijn een marketingbureau in Amsterdam dat zich specialiseert in..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={!content.trim()}
          >
            Ga verder met analyse
          </button>
        </form>
      </div>
    </div>
  );
}
