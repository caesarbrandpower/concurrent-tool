'use server';

import Anthropic from '@anthropic-ai/sdk';
import { AnalysisResult } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function withTimeout<T>(fn: () => Promise<T>, ms: number, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${label}: timeout na ${ms/1000}s`)), ms)
  );
  return Promise.race([fn(), timeout]);
}

async function withRetry<T>(fn: () => Promise<T>, label: string, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      const isRetryable =
        err?.status === 429 ||
        err?.status === 529 ||
        err?.status === 503 ||
        err?.status === 502 ||
        err?.message?.includes('rate_limit') ||
        err?.message?.includes('overloaded') ||
        err?.message?.includes('timeout') ||
        err?.message?.includes('ECONNRESET') ||
        err?.message?.includes('fetch failed');

      if (isRetryable && attempt < maxRetries) {
        const wait = Math.pow(2, attempt) * 5000; // 5s, 10s, 20s
        console.log(`${label}: fout (${err?.status || err?.message}), wacht ${wait/1000}s (poging ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, wait));
        continue;
      }
      throw error;
    }
  }
  throw new Error(`${label}: max retries exceeded`);
}

const ANALYSIS_PROMPT = `Je bent een eerlijke merkadviseur. Je analyseert de website van de gebruiker en drie concurrenten in dezelfde markt.

Schrijf altijd vanuit de beleving van de ondernemer. Geen vakjargon. Gewone taal. Geen gedachtestreepjes.

BELANGRIJK: Analyseer alleen concurrenten waarvoor je voldoende inhoud hebt ontvangen (minimaal een duidelijke propositie, doelgroep of dienst). Als de content van een concurrent te beperkt is om eerlijk te analyseren, sla die concurrent dan over. Neem alleen concurrenten op in je JSON die je echt kunt onderbouwen.

Genereer uitsluitend de volgende JSON structuur, geen uitleg of opmaak eromheen:

{
  "intro": "Twee zinnen die kort en direct beschrijven wat je gaat zien. Niet analyseren -- alleen kaderen.",

  "jouwSite": {
    "naam": "Naam van het bedrijf, afgeleid uit de website",
    "watGoedGaat": [
      "Eerste sterke punt -- concreet en complimenteus, één zin. Noem iets specifieks van de site.",
      "Tweede sterke punt -- ook concreet, niet generiek."
    ],
    "samenvatting": "Hoe de website overkomt op een nieuwe bezoeker. Eerlijk, twee zinnen. Geen oordeel over wat beter kan."
  },

  "concurrenten": [
    {
      "url": "URL van de concurrent",
      "naam": "Naam van het bedrijf, afgeleid uit de content",
      "omschrijving": "Hoe deze concurrent overkomt op een nieuwe bezoeker. Twee zinnen.",
      "overlap": "Waar deze concurrent hetzelfde zegt of belooft als de gebruiker. Één zin.",
      "reden": "Waarom dit een relevante concurrent is. Zelfde markt, zelfde doelgroep, zelfde dienst. Één zin."
    }
  ],

  "vergelijking": "Twee tot drie zinnen over wat alle partijen gemeen hebben. De rode draad die laat zien dat ze in een gelijkvormige markt opereren.",

  "watBeterKan": [
    "Eerste verbeterpunt -- concreet en direct gebaseerd op wat je bij de concurrenten ziet. Noem specifiek wat concurrenten wél doen of claimen dat de gebruiker mist. Geen generiek advies.",
    "Tweede verbeterpunt -- zelfde aanpak."
  ],

  "kans": "Één concrete kans die alle concurrenten laten liggen. Specifiek genoeg om te raken, prikkelend genoeg om nieuwsgierig te maken.",

  "implicatie": "Wat het de ondernemer kost als dit niet verandert. Één of twee zinnen. Direct, geen jargon."
}

Regels:
- Neem een concurrent alleen op als je zijn propositie, dienst of doelgroep kunt benoemen op basis van de ontvangen content. Bij twijfel: weglaten.
- watBeterKan moet altijd gebaseerd zijn op iets concreets dat je bij de concurrenten ziet. Nooit generiek.
- Geef uitsluitend JSON terug. Geen uitleg, geen markdown, geen code-blokken.
- Taal: Nederlands, tenzij de website volledig in het Engels is.
- Geen gedachtestreepjes in de output.`;

export async function identifyIndustry(content: string): Promise<string> {
  console.log('identifyIndustry: start, content length:', content.length);
  return withRetry(async () => {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Identificeer in max 5 woorden de branche/markt van deze website. Alleen de branche naam:\n\n${content.substring(0, 1500)}`
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return text.trim();
  }, 'identifyIndustry');
}

export async function findCompetitors(industry: string): Promise<string[]> {
  console.log('findCompetitors: industry:', industry);

  const queries = [
    `Zoek drie concurrenten in de ${industry} markt in Nederland. Geef alleen de website URLs terug, één per regel. Alleen commerciële bedrijven, geen magazines of directories.`,
    `${industry} bureaus Nederland top 3. Geef alleen website URLs, één per regel. Alleen commerciële dienstverleners.`,
    `Alternatieven voor ${industry} aanbieders Nederland. Drie website URLs, één per regel.`,
  ];

  const allUrls = new Set<string>();

  for (let attempt = 0; attempt < queries.length; attempt++) {
    // Stop als we genoeg URLs hebben
    if (allUrls.size >= 9) break;

    console.log(`findCompetitors: poging ${attempt + 1}/${queries.length}`);

    try {
      const response = await withRetry(async () => {
        return await anthropic.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 300,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
          messages: [{
            role: 'user',
            content: queries[attempt],
          }],
        });
      }, `findCompetitors poging ${attempt + 1}`);

      console.log(`findCompetitors poging ${attempt + 1}: stop_reason:`, response.stop_reason);

      const textBlocks = response.content.filter(b => b.type === 'text').map(b => b.type === 'text' ? b.text : '');
      const fullText = textBlocks.join('\n');

      const urlMatches = fullText.match(/https?:\/\/[^\s,)"\]]+/g) || [];
      const urls = urlMatches
        .map(u => u.replace(/[.,:;]+$/, ''))
        .filter(u => !u.includes('google.') && !u.includes('bing.') && !u.includes('wikipedia.'));

      urls.forEach(url => allUrls.add(url));
      console.log(`findCompetitors poging ${attempt + 1}: gevonden ${urls.length} URLs, totaal uniek: ${allUrls.size}`);

      // Stop pas na 2e query als we genoeg hebben — eerste query alleen is te weinig buffer
      if (attempt >= 1 && allUrls.size >= 7) break;
    } catch (e) {
      console.error(`findCompetitors poging ${attempt + 1} mislukt:`, e);
    }
  }

  const result = Array.from(allUrls).slice(0, 9);
  console.log('findCompetitors: final urls:', result);

  if (result.length < 2) {
    throw new Error(`Kon niet genoeg concurrenten vinden (gevonden: ${result.length}). Probeer het opnieuw.`);
  }

  return result;
}

export async function analyzeWebsites(
  userContent: string,
  competitors: { url: string; content: string }[]
): Promise<AnalysisResult> {
  const competitorTexts = competitors.map((c, i) =>
    `Concurrent ${i + 1} (${c.url}):\n${c.content.substring(0, 1500)}`
  ).join('\n\n---\n\n');

  const fullPrompt = `${ANALYSIS_PROMPT}\n\nWebsite van gebruiker:\n${userContent.substring(0, 2000)}\n\n---\n\n${competitorTexts}`;

  return withRetry(async () => {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: fullPrompt
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Claude');
    }

    return JSON.parse(jsonMatch[0]) as AnalysisResult;
  }, 'analyzeWebsites');
}
