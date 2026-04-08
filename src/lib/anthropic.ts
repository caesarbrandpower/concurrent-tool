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

async function withRetry<T>(fn: () => Promise<T>, label: string, maxRetries = 2): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      const isHardTimeout = err?.message?.includes('timeout na');
      if (isHardTimeout) throw error;

      const isRetryable =
        err?.status === 429 ||
        err?.status === 529 ||
        err?.status === 503 ||
        err?.status === 502 ||
        err?.message?.includes('rate_limit') ||
        err?.message?.includes('overloaded') ||
        err?.message?.includes('ETIMEDOUT') ||
        err?.message?.includes('ECONNRESET') ||
        err?.message?.includes('fetch failed');

      const isTokenLimit = err?.message?.includes('input tokens per minute');
      if ((isRetryable || isTokenLimit) && attempt < maxRetries) {
        const wait = isTokenLimit ? 10000 : Math.pow(2, attempt) * 3000;
        console.log(`${label}: fout (${err?.status || err?.message}), wacht ${wait/1000}s (poging ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, wait));
        continue;
      }
      throw error;
    }
  }
  throw new Error(`${label}: max retries exceeded`);
}

const ANALYSIS_PROMPT = `Je bent een eerlijke bedrijfsadviseur. Je analyseert hoe een bedrijf overkomt op zijn website en vergelijkt dat met hoe zijn concurrenten overkomen.

Je schrijft altijd vanuit de beleving van de ondernemer. Gewone taal. Geen vakjargon. Geen gedachtestreepjes. Geen algemene observaties. Alles wat je schrijft moet alleen voor dit bedrijf kunnen gelden.

ANALYSEER ALTIJD ALS VOLGT:
- Lees de site als iemand die het bedrijf voor het eerst ziet.
- Kijk naar: aanbod, tone of voice, wat ze beloven, wie ze aanspreken.
- Kijk wat de site claimt maar niet bewijst.
- Generieke observaties zijn verboden. Elk punt moet alleen voor deze ondernemer kunnen gelden.

Je geeft eerst een conclusie, dan de concurrenten, dan drie inzichten. Bij elk inzicht een concrete actie.

CONCLUSIE
Een zin van maximaal 12 woorden die direct de kern raakt. Prikkelend genoeg om verder te lezen.

CONCURRENTEN
Geef per concurrent de naam, URL en een omschrijving van een zin over hoe zij overkomen op een nieuwe bezoeker.

INZICHT 1: ZO STA JIJ ERVOOR
Wat ziet een klant als hij op deze website landt? Twee zinnen. Begin eerlijk maar niet hard. Dit is de spiegel.
Actie: Een concrete actie. Een zin. Specifiek voor dit bedrijf.

INZICHT 2: HIER VAL JE NIET OP
Waar zegt dit bedrijf hetzelfde als zijn concurrenten? Wees direct. Twee zinnen. Concreet.
Actie: Een concrete actie om zich te onderscheiden. Een zin. Specifiek voor dit bedrijf.

INZICHT 3: JOUW KANS IN DE MARKT
Wat zegt niemand in deze markt maar wat klanten wel willen horen? Twee zinnen. Specifiek genoeg om te raken.
Actie: Een concrete actie om deze kans te pakken. Een zin. Specifiek voor dit bedrijf.

Regels:
- Geen gedachtestreepjes.
- Geen vakjargon.
- Geen algemene observaties.
- Conclusie maximaal 12 woorden.
- Uitsluitend JSON terug. Geen uitleg, geen markdown, geen code-blokken.
- Taal: Nederlands, tenzij de website volledig in het Engels is.

{
  "conclusie": "Maximaal 12 woorden die direct de kern raken.",
  "concurrenten": [
    {
      "naam": "Naam van het bedrijf",
      "url": "URL van de concurrent",
      "omschrijving": "Een zin hoe zij overkomen op een nieuwe bezoeker."
    }
  ],
  "inzicht1": { "titel": "Zo sta jij ervoor", "tekst": "...", "actie": "..." },
  "inzicht2": { "titel": "Hier val je niet op", "tekst": "...", "actie": "..." },
  "inzicht3": { "titel": "Jouw kans in de markt", "tekst": "...", "actie": "..." }
}`;

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

  const query = `Zoek vijf concurrenten in de ${industry} markt in Nederland. Geef alleen de website URLs terug, een per regel. Alleen commerciele bedrijven met een toegankelijke website (geen cookiewalls, geen login-vereiste). Geen magazines, directories of nieuwssites.`;

  const allUrls = new Set<string>();

  console.log('findCompetitors: start, query:', query.substring(0, 80));

  try {
    const response = await withRetry(async () => {
      return await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 300,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
        messages: [{
          role: 'user',
          content: query,
        }],
      });
    }, 'findCompetitors');

    console.log('findCompetitors: stop_reason:', response.stop_reason);

    const textBlocks = response.content.filter(b => b.type === 'text').map(b => b.type === 'text' ? b.text : '');
    const fullText = textBlocks.join('\n');

    const urlMatches = fullText.match(/https?:\/\/[^\s,)"\]]+/g) || [];
    const urls = urlMatches
      .map(u => u.replace(/[.,:;]+$/, ''))
      .filter(u => !u.includes('google.') && !u.includes('bing.') && !u.includes('wikipedia.'));

    urls.forEach(url => allUrls.add(url));
    console.log(`findCompetitors: gevonden ${urls.length} URLs, uniek: ${allUrls.size}`);
  } catch (e) {
    console.error('findCompetitors mislukt:', e);
  }

  const result = Array.from(allUrls).slice(0, 6);
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
      max_tokens: 2500,
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
