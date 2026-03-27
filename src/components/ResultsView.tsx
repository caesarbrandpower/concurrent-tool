'use client';

import { useState } from 'react';
import { AnalysisResult } from '@/types';
import { saveLead } from '@/lib/airtable';
import { sendAnalysisEmail } from '@/lib/email';

interface ResultsViewProps {
  url: string;
  result: AnalysisResult;
}

export default function ResultsView({ url, result }: ResultsViewProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLayer2, setShowLayer2] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      await saveLead(email, url);
      await sendAnalysisEmail(email, url, result);
      setShowLayer2(true);
      setEmailSent(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Er ging iets mis. Probeer het later opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: '6rem' }}>
      <div className="content-wrapper">
        {/* Layer 1: Free visible content */}
        <div>
          <p className="section-title">WAT WE ZAGEN</p>

          <div className="summary-box">
            <p className="body-text">{result.samenvatting}</p>
          </div>

          <div className="card-grid">
            {result.concurrenten.map((competitor, index) => (
              <div key={index} className="competitor-card">
                <p className="competitor-url">{competitor.url}</p>
                <p className="competitor-description">{competitor.omschrijving}</p>
                <p className="competitor-overlap">{competitor.overlap}</p>
                {competitor.reden && (
                  <p style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Waarom deze concurrent? {competitor.reden}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Layer 2: Email gate */}
        {!showLayer2 ? (
          <div className="email-gate">
            <p className="section-title" style={{ marginTop: 0 }}>
              WAT JOU ÉCHT ANDERS MAAKT
            </p>
            <p className="sub-heading" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              Ontvang jouw volledige analyse
            </p>

            <ul className="benefits-list">
              <li>Waar jij écht verschilt</li>
              <li>Concrete aanbevelingen</li>
              <li>Gratis, direct in je inbox</li>
            </ul>

            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                className="input-field"
                placeholder="jouw@email.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={isSubmitting || !email.trim()}
              >
                {isSubmitting ? 'Bezig...' : 'Stuur me de analyse'}
              </button>
            </form>
          </div>
        ) : (
          <div className="email-gate">
            <p className="section-title" style={{ marginTop: 0 }}>
              WAT JOU ÉCHT ANDERS MAAKT
            </p>

            {emailSent && (
              <p style={{ color: 'var(--success)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                ✓ Analyse verstuurd naar {email}
              </p>
            )}

            <ul className="distinction-list">
              {result.onderscheid.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <div className="implication-box">
              <p className="body-text">{result.implicatie}</p>
            </div>

            <p className="body-text" style={{ marginTop: '1.5rem' }}>
              Samen scherper naar je merk kijken? We helpen je graag.{" "}
              <a href="mailto:hello@newfound.agency" className="cta-link">
                Mail ons
              </a>
            </p>
          </div>
        )}
      </div>

      <p className="footer-text">
        Een tool van{" "}
        <a href="https://newfound.agency" target="_blank" rel="noopener noreferrer">
          Newfound Agency
        </a>
      </p>
    </div>
  );
}
