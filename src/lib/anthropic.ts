'use server';

import Anthropic from '@anthropic-ai/sdk';
import { AnalysisResult } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const ANALYSIS_PROMPT = `Je bent een eerlijke merkadviseur. Je analyseert zes websites: één van de gebruiker en vijf concurrenten in dezelfde markt.

Analyseer de zes websites objectief. Trek geen vooraf bepaalde conclusies.
Als concurrenten wél iets onderscheidends doen, benoem dat eerlijk.
Als de gebruiker zich juist goed onderscheidt, zeg dat dan ook.
Een eerlijk oordeel is waardevoller dan een voorspelbaar oordeel.

Schrijf altijd vanuit de beleving van de ondernemer. Geen vakjargon. Gewone taal.

Genereer uitsluitend de volgende JSON structuur, geen uitleg of opmaak eromheen:

{
  "samenvatting": "2-3 zinnen die eerlijk benoemen wat opvalt als je alle zes websites naast elkaar legt.",
  "concurrenten": [
    {
      "url": "URL van de concurrent",
      "omschrijving": "Twee zinnen over hoe deze concurrent overkomt op een nieuwe bezoeker",
      "overlap": "Één zin over waar deze concurrent hetzelfde zegt als de gebruiker",
      "reden": "Één zin die uitlegt waarom dit een relevante concurrent is — zelfde doelgroep, zelfde markt, zelfde dienst."
    }
  ],
  "onderscheid": [
    "Eerste punt waar de gebruiker écht anders is — concreet, één zin",
    "Tweede punt",
    "Derde punt"
  ],
  "diagnose": "Is dit primair een aanbod-probleem (wat je doet) of een merk-probleem (hoe je het vertelt)? Één heldere conclusie in twee zinnen. Eerlijk en specifiek.",
  "kans": "Één concrete kans die alle concurrenten laten liggen — specifiek genoeg om te raken, vaag genoeg om nieuwsgierig te maken.",
  "implicatie": "Één of twee zinnen die benoemen wat het de ondernemer kost als dit niet verandert. Direct, geen jargon, geen liggend streepje."
}

Regels:
- Als er onvoldoende informatie is schrijf je: 'Onvoldoende informatie gevonden — dit verdient aandacht.'
- Wees specifiek. Niet: 'je positionering kan sterker.' Wel een concreet voorbeeld.
- Geef uitsluitend JSON terug. Geen uitleg, geen markdown, geen code-blokken.
- Taal: Nederlands, tenzij de website volledig in het Engels is.
- Kies alleen bedrijven die actief commerciële diensten aanbieden in dezelfde branche. Geen magazines, geen directories, geen nieuwssites, geen community-platforms.`;

export async function identifyIndustry(content: string): Promise<string> {
  console.log('identifyIndustry: start, content length:', content.length);
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `Identificeer in één korte zin (max 5 woorden) de branche/markt van deze website. Geen uitleg, alleen de branche naam:\n\n${content.substring(0, 3000)}`
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return text.trim();
}

export async function findCompetitors(industry: string): Promise<string[]> {
  console.log('findCompetitors: industry:', industry);

  const queries = [
    `Zoek exact vijf concurrenten in de ${industry} markt in Nederland. Geef alleen de vijf website URLs terug, één per regel, geen uitleg, geen nummering. Focus op directe concurrenten die vergelijkbare diensten/producten aanbieden. Geen magazines, directories, nieuwssites of community-platforms — alleen bedrijven die actief commerciële diensten aanbieden.`,
    `Zoek vijf ${industry} bureaus en vergelijkbare bureaus in Nederland. Geef alleen website URLs terug, één per regel, geen uitleg. Alternatieven voor bestaande ${industry} aanbieders. Alleen commerciële bedrijven, geen media of directories.`,
    `${industry} bureau Nederland top 5. Geef alleen de website URLs, één per regel, geen uitleg. Alleen commerciële dienstverleners.`,
  ];

  const allUrls = new Set<string>();

  for (let attempt = 0; attempt < queries.length; attempt++) {
    if (allUrls.size >= 5) break;

    console.log(`findCompetitors: poging ${attempt + 1}/${queries.length}, query:`, queries[attempt]);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 500,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
      messages: [{
        role: 'user',
        content: queries[attempt],
      }],
    });

    console.log(`findCompetitors poging ${attempt + 1}: raw response:`, JSON.stringify(response.content, null, 2));
    console.log(`findCompetitors poging ${attempt + 1}: stop_reason:`, response.stop_reason);

    const text = response.content.find(b => b.type === 'text')?.text ?? '';
    console.log(`findCompetitors poging ${attempt + 1}: raw text:`, text);

    const urls = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.includes('.'))
      .map(line => {
        const match = line.match(/https?:\/\/[^\s]+/);
        return match ? match[0] : line;
      })
      .filter(url => url.startsWith('http') || url.includes('.'));

    urls.forEach(url => allUrls.add(url));
    console.log(`findCompetitors poging ${attempt + 1}: gevonden ${urls.length} URLs, totaal uniek: ${allUrls.size}`);
  }

  const result = Array.from(allUrls).slice(0, 5);
  console.log('findCompetitors: final urls:', result);

  if (result.length < 5) {
    throw new Error(`Kon geen vijf concurrenten vinden na ${queries.length} pogingen (gevonden: ${result.length}). Probeer het opnieuw.`);
  }

  return result;
}

export async function analyzeWebsites(
  userContent: string,
  competitors: { url: string; content: string }[]
): Promise<AnalysisResult> {
  const competitorTexts = competitors.map((c, i) => 
    `Concurrent ${i + 1} (${c.url}):\n${c.content.substring(0, 2000)}`
  ).join('\n\n---\n\n');

  const fullPrompt = `${ANALYSIS_PROMPT}\n\nWebsite van gebruiker:\n${userContent.substring(0, 3000)}\n\n---\n\n${competitorTexts}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: fullPrompt
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid JSON response from Claude');
  }

  try {
    const result = JSON.parse(jsonMatch[0]) as AnalysisResult;
    return result;
  } catch (e) {
    throw new Error('Failed to parse analysis result');
  }
}
