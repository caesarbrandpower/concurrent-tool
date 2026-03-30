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
      // Nooit retrien als het een withTimeout hard limit is
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
        const wait = isTokenLimit ? 10000 : Math.pow(2, attempt) * 3000; // 3s, 6s
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
  "intro": "Drie tot vier zinnen die kort en direct beschrijven wat de gebruiker gaat zien. Stel de toon in: eerlijk, zonder oordeel, nieuwsgierig makend. Benoem kort wat je hebt onderzocht en wat de rode draad is die je alvast ziet.",

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

  "scoreboard": {
    "jij": {
      "kernbelofte": "Wat jij claimt in max 6 woorden",
      "aanbod": "Wat je concreet verkoopt, max 6 woorden",
      "toon": "Één woord dat je toon typeert",
      "onderscheid": "Wat jij doet dat anderen niet claimen. Één zin."
    },
    "concurrenten": [
      {
        "naam": "Naam concurrent",
        "kernbelofte": "Wat zij claimen in max 6 woorden",
        "kernbelofteOverlap": true,
        "aanbod": "Wat zij concreet verkopen, max 6 woorden",
        "aanbodOverlap": false,
        "toon": "Één woord dat hun toon typeert",
        "onderscheid": "Wat zij doen dat anderen niet claimen. Één zin."
      }
    ]
  },

  "vergelijkingTitel": "Een pakkende subtitel van 3-6 woorden die de kern samenvat. Concreet en scherp. Bijv: 'Iedereen belooft hetzelfde' of 'De markt klinkt als één stem'.",

  "vergelijking": "Twee tot drie zinnen over wat alle partijen gemeen hebben. De rode draad die laat zien dat ze in een gelijkvormige markt opereren.",

  "watBeterKan": [
    "Eerste verbeterpunt: begin altijd met wat er op de eigen site van de gebruiker ontbreekt of onduidelijk is. Concreet, gebaseerd op wat je op die site ziet. Één zin.",
    "Tweede verbeterpunt: gebaseerd op wat een of meerdere concurrenten wél doen of claimen dat de gebruiker mist. Noem de concurrent bij naam. Één zin."
  ],

  "kans": "Één concrete kans die alle concurrenten laten liggen. Specifiek genoeg om te raken, prikkelend genoeg om nieuwsgierig te maken.",

  "implicatie": "Wat het de ondernemer kost als dit niet verandert. Één of twee zinnen. Direct, geen jargon."
}

Regels:
- Neem een concurrent alleen op als je zijn propositie, dienst of doelgroep kunt benoemen op basis van de ontvangen content. Bij twijfel: weglaten.
- kernbelofteOverlap: true als de kernbelofte van de concurrent inhoudelijk overlapt met die van de gebruiker. Anders false.
- aanbodOverlap: true als het aanbod van de concurrent inhoudelijk overlapt met dat van de gebruiker. Anders false.
- watBeterKan: eerste punt altijd over de eigen site, tweede punt altijd met naam van concurrent. Nooit generiek.
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

  // Eén brede query i.p.v. drie — bespaart API calls en voorkomt rate limits
  const query = `Zoek vijf concurrenten in de ${industry} markt in Nederland. Geef alleen de website URLs terug, één per regel. Alleen commerciële bedrijven met een toegankelijke website (geen cookiewalls, geen login-vereiste). Geen magazines, directories of nieuwssites.`;

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
      max_tokens: 3000,
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
