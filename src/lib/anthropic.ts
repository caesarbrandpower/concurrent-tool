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
      const is429 = err?.status === 429 || isTokenLimit;

      if ((isRetryable || isTokenLimit) && attempt < maxRetries) {
        // 429: wacht 10s, dan 20s
        const wait = is429 ? 10000 * Math.pow(2, attempt) : Math.pow(2, attempt) * 3000;
        console.log(`${label}: fout (${err?.status || err?.message}), wacht ${wait/1000}s (poging ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, wait));
        continue;
      }
      throw error;
    }
  }
  throw new Error(`${label}: max retries exceeded`);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const BASE_RULES = `BELANGRIJK:
- Gebruik alleen informatie uit de gescrapete content. Verzin niets.
- Verwijs nooit naar website-elementen (video's, pagina's, tools) die je niet letterlijk hebt gelezen.
- Als je iets niet kunt bevestigen: laat het weg.

Je bent een eerlijke bedrijfsadviseur. Gewone taal. Geen vakjargon. Geen gedachtestreepjes. Geen algemene observaties. Alles wat je schrijft moet alleen voor dit bedrijf kunnen gelden.

Toonzetting: eerlijk en direct, maar nooit bot. De ondernemer moet knikken, niet schrikken.

SCHRIJFREGELS:
- Schrijf altijd in korte, directe zinnen. Maximaal één punt per zin. Geen lange bijzinnen.
- De lezer moet elke zin in één keer snappen.
- Schrijf inzichten altijd vanuit de vergelijking met de concurrenten. Niet "jij zegt X" maar "jij zegt X, net als concurrent Y en Z."
- Noem jargon zoals '360 graden', 'full-service' of andere holle beloftes altijd met naam, en benoem direct wat er ontbreekt.
- Generieke observaties zijn verboden. Elk punt moet alleen voor déze ondernemer in déze markt kunnen gelden.
- Controleer je output altijd op taalfouten, spelfouten en grammaticafouten voordat je de JSON teruggeeft. De output moet foutloos Nederlands zijn.`;

const CALL1_PROMPT = `${BASE_RULES}

Analyseer deze website als iemand die het bedrijf voor het eerst ziet. Kijk naar: aanbod, tone of voice, wat ze beloven, wie ze aanspreken. Kijk wat de site claimt maar niet bewijst.

Geef terug:
1. MERKNAAM: De naam van het bedrijf, afgeleid uit de website.
2. INZICHT 1 - ZO STA JIJ ERVOOR: Wat ziet een klant als hij op deze website landt? Twee zinnen. Begin eerlijk maar niet hard.
3. ACTIE: Een concrete actie. Een zin. Specifiek voor dit bedrijf.

Regels:
- Geen gedachtestreepjes.
- Uitsluitend JSON terug. Geen uitleg, geen markdown.
- Taal: Nederlands, tenzij de website volledig in het Engels is.

{
  "merknaam": "Naam",
  "inzicht1": { "titel": "Zo sta jij ervoor", "tekst": "...", "actie": "..." }
}`;

const CALL2_PROMPT = `${BASE_RULES}

Je vergelijkt een bedrijf met drie concurrenten. Analyseer alleen op basis van de aangeleverde content.

CONCLUSIE: Een zin van maximaal 12 woorden die direct de kern raakt.

CONCURRENTEN: Per concurrent: naam, URL, omschrijving (een zin), reden waarom gekozen (max 12 woorden).
Voorbeelden reden: "Gekozen omdat ze dezelfde groeigerichte MKB-klanten aanspreken." / "Gekozen omdat ze vergelijkbare merkstrategie-diensten aanbieden."

INZICHT 2 - HIER VAL JE NIET OP: Waar zegt dit bedrijf hetzelfde als concurrenten? Twee zinnen. Concreet.
Actie: Een concrete actie om zich te onderscheiden.

INZICHT 3 - JOUW KANS IN DE MARKT: Wat zegt niemand maar willen klanten wel horen? Twee zinnen. Specifiek.
Actie: Een concrete actie om deze kans te pakken.

ACTIEPLAN: Drie stappen, geprioriteerd. Concreet en specifiek.

Regels:
- Geen gedachtestreepjes, geen vakjargon, geen algemene observaties.
- Conclusie maximaal 12 woorden.
- Uitsluitend JSON terug.
- Taal: Nederlands, tenzij de website volledig in het Engels is.

{
  "conclusie": "Max 12 woorden.",
  "concurrenten": [
    { "naam": "...", "url": "...", "omschrijving": "...", "reden": "..." }
  ],
  "inzicht2": { "titel": "Hier val je niet op", "tekst": "...", "actie": "..." },
  "inzicht3": { "titel": "Jouw kans in de markt", "tekst": "...", "actie": "..." },
  "actieplan": ["Stap 1", "Stap 2", "Stap 3"]
}`;

export async function identifyIndustry(content: string): Promise<string> {
  console.log('identifyIndustry: start, content length:', content.length);
  return withRetry(async () => {
    const messages = [{ role: 'user', content: `Identificeer in max 5 woorden de branche/markt van deze website. Alleen de branche naam:\n\n${content.substring(0, 1000)}` }];
    console.log('[DEBUG] identifyIndustry input:', JSON.stringify(messages).length, 'chars');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 100,
      messages: messages as { role: 'user'; content: string }[],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return text.trim();
  }, 'identifyIndustry');
}

export async function findCompetitors(industry: string): Promise<string[]> {
  console.log('findCompetitors: industry:', industry);

  const query = `Je bent een marktkenner. Zoek drie directe concurrenten voor dit bedrijf in de ${industry} markt.

Regels:
- Kies alleen bedrijven die écht in dezelfde markt zitten. Niet groter, niet kleiner, maar gelijkwaardig of net iets groter — zodat de vergelijking relevant voelt.
- Kies bedrijven die de gebruiker kent of zou moeten kennen. Geen obscure of kleine spelers.
- Kies bedrijven die actief zijn in hetzelfde land of dezelfde regio als het ingevoerde bedrijf.
- Als je twijfelt tussen een bekende en een onbekende speler, kies altijd de bekende.
- Geef alleen bedrijven terug waarvan je zeker weet dat ze bestaan en actief zijn.
- Geen taalfouten in namen of URLs.

Geef alleen de website URLs terug, een per regel. Alleen commerciele bedrijven met een toegankelijke website. Geen magazines, directories of nieuwssites.`;

  const allUrls = new Set<string>();

  try {
    const fcMessages = [{ role: 'user', content: query }];
    console.log('[DEBUG] findCompetitors input:', JSON.stringify(fcMessages).length, 'chars');
    const response = await withRetry(async () => {
      return await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
        messages: fcMessages as { role: 'user'; content: string }[],
      });
    }, 'findCompetitors');
    console.log('[DEBUG] findCompetitors response stop_reason:', response.stop_reason, 'content blocks:', response.content.length, 'types:', response.content.map(b => b.type));

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

// --- Call 1: Analyseer alleen de gebruiker zijn site ---
export async function analyzeUserSite(
  userContent: string
): Promise<{ merknaam: string; inzicht1: { titel: string; tekst: string; actie: string } }> {
  console.log('analyzeUserSite: start');

  return withRetry(async () => {
    const messages = [{ role: 'user', content: `${CALL1_PROMPT}\n\nWebsite content:\n${userContent}` }];
    console.log('[DEBUG] analyzeUserSite input:', JSON.stringify(messages).length, 'chars');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: messages as { role: 'user'; content: string }[],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON response from Claude (call 1)');
    return JSON.parse(jsonMatch[0]);
  }, 'analyzeUserSite');
}

// --- Call 2: Vergelijk met concurrenten ---
export async function analyzeCompetitors(
  merknaam: string,
  userContent: string,
  competitors: { url: string; content: string }[]
): Promise<{
  conclusie: string;
  concurrenten: { naam: string; url: string; omschrijving: string; reden: string }[];
  inzicht2: { titel: string; tekst: string; actie: string };
  inzicht3: { titel: string; tekst: string; actie: string };
  actieplan: string[];
}> {
  console.log('analyzeCompetitors: start');

  const competitorTexts = competitors.map((c, i) =>
    `Concurrent ${i + 1} (${c.url}):\n${c.content}`
  ).join('\n\n---\n\n');

  return withRetry(async () => {
    const messages = [{ role: 'user', content: `${CALL2_PROMPT}\n\nBedrijf: ${merknaam}\nWebsite samenvatting:\n${userContent}\n\n---\n\n${competitorTexts}` }];
    console.log('[DEBUG] analyzeCompetitors input:', JSON.stringify(messages).length, 'chars');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: messages as { role: 'user'; content: string }[],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON response from Claude (call 2)');
    return JSON.parse(jsonMatch[0]);
  }, 'analyzeCompetitors');
}
