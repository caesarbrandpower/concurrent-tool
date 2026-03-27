'use server';

import Anthropic from '@anthropic-ai/sdk';
import { AnalysisResult } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const ANALYSIS_PROMPT = `Je bent een eerlijke merkadviseur. Je analyseert vier websites: één van de gebruiker en drie concurrenten in dezelfde markt.

Schrijf altijd vanuit de beleving van de ondernemer. Geen vakjargon. Gewone taal.

Genereer uitsluitend de volgende JSON structuur, geen uitleg of opmaak eromheen:

{
  "samenvatting": "2-3 zinnen die eerlijk benoemen wat opvalt als je alle vier websites naast elkaar legt. Kern: waar zeggen ze hetzelfde?",
  "concurrenten": [
    {
      "url": "URL van de concurrent",
      "omschrijving": "Twee zinnen over hoe deze concurrent overkomt op een nieuwe bezoeker",
      "overlap": "Één zin over waar deze concurrent hetzelfde zegt als de gebruiker"
    }
  ],
  "onderscheid": [
    "Eerste punt waar de gebruiker écht anders is — concreet, één zin",
    "Tweede punt",
    "Derde punt"
  ],
  "implicatie": "Één of twee zinnen die benoemen wat het de ondernemer kost als dit niet verandert. Direct, geen jargon, geen liggend streepje."
}

Regels:
- Als er onvoldoende informatie is schrijf je: 'Onvoldoende informatie gevonden — dit verdient aandacht.'
- Wees specifiek. Niet: 'je positionering kan sterker.' Wel een concreet voorbeeld.
- Geef uitsluitend JSON terug. Geen uitleg, geen markdown, geen code-blokken.
- Taal: Nederlands, tenzij de website volledig in het Engels is.`;

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
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 500,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
    messages: [{
      role: 'user',
      content: `Zoek 3 concrete concurrenten in de ${industry} markt in Nederland. Geef alleen de website URLs terug, één per regel, geen uitleg. Focus op directe concurrenten die vergelijkbare diensten/producten aanbieden.`
    }],
  });

  console.log('findCompetitors: response stop_reason:', response.stop_reason);
  console.log('findCompetitors: content blocks:', JSON.stringify(response.content.map(b => b.type)));
  const text = response.content.find(b => b.type === 'text')?.text ?? '';
  console.log('findCompetitors: raw text:', text);
  const urls = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.includes('.'))
    .map(line => {
      const match = line.match(/https?:\/\/[^\s]+/);
      return match ? match[0] : line;
    })
    .slice(0, 3);

  return urls;
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
