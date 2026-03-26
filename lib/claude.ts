import { AnalysisResult } from '@/types';

const SYSTEM_PROMPT = `Je analyseert vier websites: één van de gebruiker en drie van concurrenten in dezelfde markt. Schrijf vanuit de beleving van de ondernemer, niet als merkstrateeg. Gebruik geen vakjargon. Stel vast waar alle vier hetzelfde zeggen — dat is de kern. Benoem daarna concreet wat de gebruiker anders doet of kan doen. De implicatiezin benoemt wat het de ondernemer kost als dit niet verandert. Geen liggend streepje. Toon: direct, menselijk, geen mooipraterij. Geef uitsluitend JSON terug, geen uitleg of opmaak.

Het JSON formaat moet zijn:
{
  "samenvatting": "Twee of drie zinnen in gewone taal over wat je zag...",
  "concurrenten": [
    { "url": "...", "omschrijving": "Twee zinnen over hoe ze overkomen...", "overlap": "Één zin over de overlap..." }
  ],
  "onderscheid": ["Punt 1...", "Punt 2...", "Punt 3..."],
  "implicatie": "Max twee zinnen over wat het kost als dit niet verandert..."
}`;

export async function analyzeWebsites(
  userUrl: string,
  userContent: string,
  competitors: Array<{ url: string; content: string }>
): Promise<AnalysisResult> {
  const websites = [
    { url: userUrl, content: userContent, isUser: true },
    ...competitors.map(c => ({ ...c, isUser: false }))
  ];

  const prompt = `Analyseer deze vier websites in dezelfde branche:

${websites.map((w, i) => `
${i === 0 ? 'WEBSITE GEBRUIKER' : `CONCURRENT ${i}`}: ${w.url}
${w.content.substring(0, 8000)}
`).join('\n---\n')}

Geef je analyse in het vereiste JSON formaat. Gebruik alleen gewone taal, geen vakjargon. Focus op: waar zeggen ze allemaal hetzelfde? Wat maakt de gebruiker anders? Wat kost het als dit niet verandert?`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  const content = data.content[0].text;

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid response format from Claude');
  }

  return JSON.parse(jsonMatch[0]) as AnalysisResult;
}

export async function findCompetitorsWithClaude(
  userContent: string,
  userUrl: string
): Promise<string[]> {
  const prompt = `Op basis van deze website-content, identificeer de branche en geef me 3 typische concurrenten die je zou verwachten in deze markt. Geef alleen de domeinnamen terug, geen uitleg.

Website: ${userUrl}
Content: ${userContent.substring(0, 4000)}

Format: domein1.nl, domein2.nl, domein3.nl`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to find competitors');
  }

  const data = await response.json();
  const content = data.content[0].text;

  // Parse comma-separated domains
  return content
    .split(/[,\n]/)
    .map((s: string) => s.trim())
    .filter((s: string) => s.includes('.') && !s.includes(' '));
}