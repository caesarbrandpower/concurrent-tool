'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnalysisResult, AnalysisStep } from '@/types';

const steps: AnalysisStep[] = [
  { id: 1, text: 'We lezen jouw website...', status: 'pending' },
  { id: 2, text: 'We zoeken drie concurrenten in jouw markt...', status: 'pending' },
  { id: 3, text: 'We vergelijken hoe jullie overkomen...', status: 'pending' },
];

export default function Home() {
  const [url, setUrl] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepTexts, setStepTexts] = useState(steps.map(s => s.text));
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [email, setEmail] = useState('');
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentStep === 3) {
      const timer = setTimeout(() => {
        setStepTexts(prev => {
          const newTexts = [...prev];
          newTexts[2] = 'Nog even, bijna klaar…';
          return newTexts;
        });
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setCurrentStep(0);
    setAnalysis(null);
    setShowEmailGate(false);
    setEmailSubmitted(false);

    try {
      // Step 1: Scrape user website
      setCurrentStep(1);
      const scrapeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'scrape', url }),
      });

      const scrapeData = await scrapeResponse.json();

      if (!scrapeData.success) {
        setShowManualInput(true);
        setIsLoading(false);
        return;
      }

      const userContent = scrapeData.content;

      // Step 2: Identify industry
      setCurrentStep(2);
      const industryResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'identify-industry', content: userContent }),
      });

      const industryData = await industryResponse.json();
      const industry = industryData.industry;

      // Step 3: Find competitors
      const competitorsResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'find-competitors', url, industry }),
      });

      const competitorsData = await competitorsResponse.json();
      const competitorUrls = competitorsData.competitors;

      // Step 4: Scrape competitors
      const scrapeCompetitorsResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'scrape-competitors', competitorUrls }),
      });

      const competitorsContentData = await scrapeCompetitorsResponse.json();
      const competitorContents = competitorsContentData.competitorContents;

      // Step 5: Analyze
      setCurrentStep(3);
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'analyze', userContent, competitorContents }),
      });

      const analyzeData = await analyzeResponse.json();

      if (analyzeData.success) {
        setAnalysis(analyzeData.analysis);
        setShowEmailGate(true);
      } else {
        setError('Er ging iets mis bij de analyse. Probeer het later opnieuw.');
      }
    } catch (err) {
      setError('Er ging iets mis. Probeer het later opnieuw.');
    } finally {
      setIsLoading(false);
      setCurrentStep(0);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualContent.trim()) return;

    setShowManualInput(false);
    setIsLoading(true);
    setCurrentStep(2);

    try {
      const userContent = manualContent;

      // Identify industry from manual content
      const industryResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'identify-industry', content: userContent }),
      });

      const industryData = await industryResponse.json();
      const industry = industryData.industry;

      // Find competitors
      const competitorsResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'find-competitors', url, industry }),
      });

      const competitorsData = await competitorsResponse.json();
      const competitorUrls = competitorsData.competitors;

      // Scrape competitors
      const scrapeCompetitorsResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'scrape-competitors', competitorUrls }),
      });

      const competitorsContentData = await scrapeCompetitorsResponse.json();
      const competitorContents = competitorsContentData.competitorContents;

      // Analyze
      setCurrentStep(3);
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'analyze', userContent, competitorContents }),
      });

      const analyzeData = await analyzeResponse.json();

      if (analyzeData.success) {
        setAnalysis(analyzeData.analysis);
        setShowEmailGate(true);
      }
    } catch (err) {
      setError('Er ging iets mis. Probeer het later opnieuw.');
    } finally {
      setIsLoading(false);
      setCurrentStep(0);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !analysis) return;

    try {
      await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'save-lead',
          email,
          url,
          analysis,
        }),
      });

      setEmailSubmitted(true);
    } catch (err) {
      console.error('Error saving lead:', err);
    }
  };

  return (
    <main className="min-h-screen bg-[#0f0f10] text-[#e5e7eb]">
      {/* Header */}
      <header className="w-full py-4 px-6" style={{
        background: 'linear-gradient(90deg, #2e7cf6, #8463ff)'
      }}>
        <div className="max-w-6xl mx-auto">
          <span className="text-white font-medium text-sm tracking-wide" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            ✦ NEWFOUND
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-20">
        <AnimatePresence mode="wait">
          {!isLoading && !analysis && !showManualInput && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-12 tracking-wide" style={{ fontFamily: 'Greed, Oswald, sans-serif' }}>
                CONCURRENTIE-ANALYSE
              </h1>

              <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                <div className="flex">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="jouwwebsite.nl"
                    className="flex-1 bg-[#15181f] border border-[rgba(255,255,255,0.10)] text-[#e5e7eb] px-6 py-4 text-lg outline-none transition-all"
                    style={{ 
                      borderRadius: '12px 0 0 12px',
                      fontFamily: 'Satoshi, sans-serif'
                    }}
                    required
                  />
                  <button
                    type="submit"
                    className="px-8 py-4 font-medium text-white transition-all hover:opacity-90"
                    style={{
                      background: 'linear-gradient(90deg, #2e7cf6, #8463ff)',
                      borderRadius: '0 12px 12px 0',
                      fontFamily: 'Satoshi, sans-serif'
                    }}
                  >
                    Analyseer mijn merk
                  </button>
                </div>

                <p className="mt-4 text-[rgba(229,231,235,0.7)] text-sm" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  Gratis analyse. Geen registratie nodig.
                </p>
              </form>

              {error && (
                <p className="mt-6 text-red-400 text-sm">{error}</p>
              )}

              <div className="mt-20">
                <a 
                  href="https://newfound.agency" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[rgba(229,231,235,0.7)] text-sm hover:text-[#e5e7eb] transition-colors"
                  style={{ fontFamily: 'Satoshi, sans-serif' }}
                >
                  Een tool van Newfound Agency
                </a>
              </div>
            </motion.div>
          )}

          {showManualInput && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <h2 className="text-2xl font-bold mb-6 text-center" style={{ fontFamily: 'Greed, Oswald, sans-serif' }}>
                WE KONDEN JE WEBSITE NIET GOED LEZEN
              </h2>
              <p className="text-[rgba(229,231,235,0.7)] mb-6 text-center" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                Beschrijf je merk kort in eigen woorden.
              </p>
              <textarea
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                placeholder="Wat doe je? Voor wie? Waarom doe je het?"
                className="w-full h-40 bg-[#15181f] border border-[rgba(255,255,255,0.10)] text-[#e5e7eb] p-4 rounded-lg outline-none resize-none mb-4"
                style={{ fontFamily: 'Satoshi, sans-serif' }}
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setShowManualInput(false)}
                  className="flex-1 py-3 border border-[rgba(255,255,255,0.10)] rounded-lg hover:bg-[#1a1f29] transition-colors"
                  style={{ fontFamily: 'Satoshi, sans-serif' }}
                >
                  Terug
                </button>
                <button
                  onClick={handleManualSubmit}
                  disabled={!manualContent.trim()}
                  className="flex-1 py-3 font-medium text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(90deg, #2e7cf6, #8463ff)',
                    fontFamily: 'Satoshi, sans-serif'
                  }}
                >
                  Doorgaan
                </button>
              </div>
            </motion.div>
          )}

          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <div className="space-y-8">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: currentStep >= index + 1 ? 1 : 0.3,
                      x: 0
                    }}
                    className="flex items-center justify-center gap-4"
                  >
                    <span 
                      className={`text-lg ${currentStep === index + 1 ? 'text-[#e5e7eb]' : 'text-[rgba(229,231,235,0.5)]'}`}
                      style={{ fontFamily: 'Satoshi, sans-serif' }}
                    >
                      {stepTexts[index]}
                    </span>
                    {currentStep === index + 1 && (
                      <div className="flex gap-1">
                        {[0, 1, 2].map((dot) => (
                          <motion.div
                            key={dot}
                            className="w-2 h-2 rounded-full bg-[#2e7cf6]"
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: dot * 0.2,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {analysis && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {/* Layer 1: Free content */}
              <section>
                <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Greed, Oswald, sans-serif' }}>
                  WAT WE ZAGEN
                </h2>
                <p className="text-lg leading-relaxed mb-10" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                  {analysis.samenvatting}
                </p>

                <div className="grid md:grid-cols-3 gap-6">
                  {analysis.concurrenten.map((concurrent, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-[#1a1f29] border border-[rgba(255,255,255,0.10)] rounded-[10px] p-5"
                    >
                      <h3 className="text-[#2e7cf6] font-medium mb-3 truncate" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                        {concurrent.url}
                      </h3>
                      <p className="text-[rgba(229,231,235,0.9)] text-sm mb-3" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                        {concurrent.omschrijving}
                      </p>
                      <p className="text-[rgba(229,231,235,0.7)] text-sm italic" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                        {concurrent.overlap}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Layer 2: Email gate */}
              {showEmailGate && !emailSubmitted && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-t border-[rgba(255,255,255,0.10)] pt-12"
                >
                  <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Greed, Oswald, sans-serif' }}>
                    WAT JOU ÉCHT ANDERS MAAKT
                  </h2>
                  <p className="text-[rgba(229,231,235,0.7)] mb-6" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                    Ontvang jouw volledige analyse
                  </p>

                  <div className="flex flex-wrap gap-3 mb-8">
                    {['✓ Waar jij écht verschilt', '✓ Concrete aanbevelingen', '✓ Gratis, direct in je inbox'].map((pill, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-[#15181f] border border-[rgba(255,255,255,0.10)] rounded-full text-sm"
                        style={{ fontFamily: 'Satoshi, sans-serif' }}
                      >
                        {pill}
                      </span>
                    ))}
                  </div>

                  <form onSubmit={handleEmailSubmit} className="flex max-w-md">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jouw@email.nl"
                      className="flex-1 bg-[#15181f] border border-[rgba(255,255,255,0.10)] text-[#e5e7eb] px-4 py-3 outline-none"
                      style={{ 
                        borderRadius: '12px 0 0 12px',
                        fontFamily: 'Satoshi, sans-serif'
                      }}
                      required
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 font-medium text-white transition-all hover:opacity-90"
                      style={{
                        background: 'linear-gradient(90deg, #2e7cf6, #8463ff)',
                        borderRadius: '0 12px 12px 0',
                        fontFamily: 'Satoshi, sans-serif'
                      }}
                    >
                      Stuur me de analyse
                    </button>
                  </form>
                </motion.section>
              )}

              {/* Layer 2: Unlocked content */}
              {emailSubmitted && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-t border-[rgba(255,255,255,0.10)] pt-12"
                >
                  <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Greed, Oswald, sans-serif' }}>
                    WAT JOU ÉCHT ANDERS MAAKT
                  </h2>

                  <div className="space-y-4 mb-8">
                    {analysis.onderscheid.map((point, index) => (
                      <p 
                        key={index} 
                        className="text-lg leading-relaxed"
                        style={{ fontFamily: 'Satoshi, sans-serif' }}
                      >
                        {point}
                      </p>
                    ))}
                  </div>

                  <div 
                    className="border-l-2 border-[rgba(255,255,255,0.2)] pl-4 py-2 mb-10"
                  >
                    <p 
                      className="text-[15px] italic text-[#e5e7eb]"
                      style={{ fontFamily: 'Satoshi, sans-serif' }}
                    >
                      {analysis.implicatie}
                    </p>
                  </div>

                  <p className="text-[rgba(229,231,235,0.9)]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
                    Samen scherper naar je merk kijken?{' '}
                    <a 
                      href="mailto:hello@newfound.agency" 
                      className="text-[#2e7cf6] hover:underline"
                    >
                      Mail ons →
                    </a>
                  </p>
                </motion.section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
