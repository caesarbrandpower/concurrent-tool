'use client';

import { useState } from 'react';
import LoadingScreen from '@/components/LoadingScreen';
import FallbackForm from '@/components/FallbackForm';
import ResultsView from '@/components/ResultsView';
import { AnalysisResult } from '@/types';

type Step = 'input' | 'loading' | 'fallback' | 'results';

export default function Home() {
  const [step, setStep] = useState<Step>('input');
  const [loadingStep, setLoadingStep] = useState(0);
  const [userUrl, setUserUrl] = useState('');
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startAnalysis = async (inputUrl: string, manualDesc?: string) => {
    setIsLoading(true);
    setUserUrl(inputUrl);

    setStep('loading');
    setLoadingStep(0);

    const stepTimers = [
      setTimeout(() => setLoadingStep(1), 2000),
      setTimeout(() => setLoadingStep(2), 5000),
    ];

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: inputUrl,
          manualContent: manualDesc,
        }),
      });

      stepTimers.forEach(clearTimeout);

      if (response.status === 422) {
        const data = await response.json();
        if (data.fallback) {
          setStep('fallback');
          setIsLoading(false);
          return;
        }
      }

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setResult(data.result);
      setStep('results');
    } catch (error) {
      console.error('Analysis error:', error);
      setStep('fallback');
    } finally {
      setIsLoading(false);
      stepTimers.forEach(clearTimeout);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      startAnalysis(url.trim());
    }
  };

  const handleFallbackSubmit = (content: string) => {
    startAnalysis(userUrl, content);
  };

  if (step === 'loading') {
    return <LoadingScreen step={loadingStep} />;
  }

  if (step === 'fallback') {
    return <FallbackForm onSubmit={handleFallbackSubmit} />;
  }

  if (step === 'results' && result) {
    return <ResultsView url={userUrl} result={result} />;
  }

  // Input step
  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* Gradient navbar */}
      <div className="gradient-navbar" style={{ height: '4px' }} />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 4px)',
        padding: '2rem',
      }}>
        <div className="content-wrapper" style={{ textAlign: 'center' }}>
          {/* Logo */}
          <p className="animate-hero-footer" style={{
            fontFamily: 'KansasNew, sans-serif',
            fontSize: '0.875rem',
            color: 'var(--muted)',
            marginBottom: '3rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Newfound
          </p>

          <h1 className="main-heading animate-hero-title">
            ZIE HOE JIJ JE VERHOUDT.
          </h1>

          <p className="sub-heading animate-hero-subtitle">
            Ontdek waar jij en je concurrenten hetzelfde zeggen.
          </p>

          <p className="muted-text animate-hero-body" style={{ marginBottom: '2rem' }}>
            Vul je website in en krijg een analyse in 60 seconden.
          </p>

          <form onSubmit={handleUrlSubmit} className="animate-hero-cta" style={{
            display: 'flex',
            gap: '0',
            width: '100%',
            maxWidth: '520px',
            margin: '0 auto',
          }}>
            <input
              type="text"
              className="input-field"
              style={{
                borderRadius: '0.5rem 0 0 0.5rem',
                borderRight: 'none',
                flex: 1,
              }}
              placeholder="jouwwebsite.nl"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{
                borderRadius: '0 0.5rem 0.5rem 0',
                whiteSpace: 'nowrap',
              }}
              disabled={isLoading || !url.trim()}
            >
              {isLoading ? 'Bezig...' : 'Analyseer mijn merk'}
            </button>
          </form>

          <p className="footer-text animate-hero-footer">
            Een tool van{' '}
            <a href="https://newfound.agency" target="_blank" rel="noopener noreferrer">
              Newfound Agency
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
