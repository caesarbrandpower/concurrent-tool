'use client';

import { useState } from 'react';
import InputForm from '@/components/InputForm';
import LoadingScreen from '@/components/LoadingScreen';
import FallbackForm from '@/components/FallbackForm';
import ResultsView from '@/components/ResultsView';
import { AnalysisResult } from '@/types';

type Step = 'input' | 'loading' | 'fallback' | 'results';

export default function Home() {
  const [step, setStep] = useState<Step>('input');
  const [loadingStep, setLoadingStep] = useState(0);
  const [userUrl, setUserUrl] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startAnalysis = async (url: string, manualDesc?: string) => {
    setIsLoading(true);
    setUserUrl(url);

    if (manualDesc) {
      setManualContent(manualDesc);
    }

    setStep('loading');
    setLoadingStep(0);

    // Simulate loading steps
    const stepTimers = [
      setTimeout(() => setLoadingStep(1), 2000),
      setTimeout(() => setLoadingStep(2), 5000),
    ];

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url, 
          manualContent: manualDesc 
        }),
      });

      // Clear timers
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
      // Show fallback on error
      setStep('fallback');
    } finally {
      setIsLoading(false);
      stepTimers.forEach(clearTimeout);
    }
  };

  const handleUrlSubmit = (url: string) => {
    startAnalysis(url);
  };

  const handleFallbackSubmit = (content: string) => {
    startAnalysis(userUrl, content);
  };

  return (
    <main className="page-container">
      {step === 'input' && (
        <InputForm onSubmit={handleUrlSubmit} isLoading={isLoading} />
      )}

      {step === 'loading' && (
        <LoadingScreen step={loadingStep} />
      )}

      {step === 'fallback' && (
        <FallbackForm onSubmit={handleFallbackSubmit} />
      )}

      {step === 'results' && result && (
        <ResultsView url={userUrl} result={result} />
      )}
    </main>
  );
}
