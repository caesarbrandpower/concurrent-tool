import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import Airtable from 'airtable';
import nodemailer from 'nodemailer';
import { AnalysisResult, ScrapedData } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Configure Airtable (lazy init to avoid build-time errors)
function getAirtable() {
  return new Airtable({
    apiKey: process.env.AIRTABLE_API_KEY || '',
  });
}

// Configure SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.mijndomein.nl',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

// Jina AI scraper
async function scrapeWithJina(url: string): Promise<ScrapedData> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'application/json',
        ...(process.env.JINA_API_KEY && { 'Authorization': `Bearer ${process.env.JINA_API_KEY}` }),
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Jina AI returned ${response.status}`);
    }

    const data = await response.text();

    // Check if we got meaningful content (at least 200 words)
    const wordCount = data.split(/\s+/).length;

    if (wordCount < 200) {
      return {
        url,
        content: '',
        success: false,
        error: 'INSUFFICIENT_CONTENT',
      };
    }

    return {
      url,
      content: data,
      success: true,
    };
  } catch (error) {
    return {
      url,
      content: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Identify industry using Claude
async function identifyIndustry(content: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20241022',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: `Based on this website content, identify the industry/sector in 2-3 words. Be specific but concise.\n\nContent: ${content.substring(0, 2000)}`,
      },
    ],
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
  return text.trim();
}

// Find competitors using Claude with web search
async function findCompetitors(industry: string, userUrl: string): Promise<string[]> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20241022',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `Find 3 real, existing competitor websites in the ${industry} sector. Exclude ${userUrl}. Return only the full URLs (https://...) as a JSON array.`,
      },
    ],
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 3,
      },
    ],
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';

  // Try to extract URLs from the response
  const urlRegex = /https?:\/\/[^\s\"\'<>\]]+/g;
  const urls = text.match(urlRegex) || [];

  // Filter and clean URLs
  const cleanUrls = urls
    .map(url => url.replace(/[.,;]$/, ''))
    .filter((url, index, self) => self.indexOf(url) === index)
    .slice(0, 3);

  return cleanUrls;
}

// Analyze all websites and generate output
async function analyzeWebsites(
  userContent: string,
  competitorContents: ScrapedData[]
): Promise<AnalysisResult> {
  const validCompetitors = competitorContents.filter(c => c.success);

  const prompt = `Je bent een eerlijke merkadviseur. Je analyseert vier websites: één van de gebruiker en drie concurrenten die je hebt gevonden in dezelfde markt.

Schrijf altijd vanuit de beleving van de ondernemer. Geen vakjargon. Geen merktheorie. Gewone taal die elke ondernemer begrijpt.

Gebruikerswebsite content:
${userContent.substring(0, 3000)}

Concurrent 1 (${validCompetitors[0]?.url || 'niet gevonden'}):
${validCompetitors[0]?.content?.substring(0, 2000) || 'Geen content'}

Concurrent 2 (${validCompetitors[1]?.url || 'niet gevonden'}):
${validCompetitors[1]?.content?.substring(0, 2000) || 'Geen content'}

Concurrent 3 (${validCompetitors[2]?.url || 'niet gevonden'}):
${validCompetitors[2]?.content?.substring(0, 2000) || 'Geen content'}

Genereer de volgende JSON structuur:

{
  "samenvatting": "2-3 zinnen die eerlijk benoemen wat opvalt als je alle vier websites naast elkaar legt. Kern: waar zeggen ze hetzelfde? Toon: eerlijke adviseur, niet een algoritme.",
  "concurrenten": [
    {
      "url": "de URL van de concurrent",
      "omschrijving": "twee zinnen over hoe deze concurrent overkomt op een nieuwe bezoeker",
      "overlap": "één zin over waar deze concurrent hetzelfde zegt als de gebruiker"
    }
  ],
  "onderscheid": [
    "Eerste punt waar de gebruiker écht anders is — concreet, geen jargon, één zin",
    "Tweede punt waar de gebruiker écht anders is",
    "Derde punt waar de gebruiker écht anders is"
  ],
  "implicatie": "Één of twee zinnen die benoemen wat het de ondernemer kost als dit niet verandert. Vanuit het perspectief van de ondernemer zelf. Direct, geen jargon, geen liggend streepje."
}

Belangrijke regels:
- Als er onvoldoende informatie is om een onderscheidingspunt te benoemen, schrijf dan letterlijk: 'Onvoldoende informatie gevonden — dit verdient aandacht.' Vul nooit iets in dat je niet kunt onderbouwen.
- Wees specifiek. Niet: 'je positionering kan sterker.' Wel: 'Je website noemt nergens voor welk type bedrijf je het meest geschikt bent — daardoor trekt je aanvraagformulier de verkeerde leads.'
- De implicatiezin benoemt het verlies voor de ondernemer, niet wat er mis is.
- Geef uitsluitend JSON terug. Geen uitleg, geen opmaak, geen code-blokken.
- Taal: Nederlands, tenzij de website volledig in het Engels is.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20241022',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';

  // Extract JSON from response
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch (error) {
    // Return fallback structure
    return {
      samenvatting: 'We konden de analyse niet volledig afronden. Probeer het later opnieuw.',
      concurrenten: validCompetitors.map(c => ({
        url: c.url,
        omschrijving: 'We konden deze website analyseren.',
        overlap: 'Onvoldoende informatie gevonden.',
      })),
      onderscheid: [
        'Onvoldoende informatie gevonden — dit verdient aandacht.',
        'Onvoldoende informatie gevonden — dit verdient aandacht.',
        'Onvoldoende informatie gevonden — dit verdient aandacht.',
      ],
      implicatie: 'Zonder duidelijk onderscheid blijf je concurreren op prijs alleen.',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, email, manualContent, step } = body;

    // Step 1: Scrape user website
    if (step === 'scrape') {
      const scraped = await scrapeWithJina(url);

      if (!scraped.success) {
        return NextResponse.json({
          success: false,
          needsManualInput: true,
          error: scraped.error,
        });
      }

      return NextResponse.json({
        success: true,
        content: scraped.content,
      });
    }

    // Step 2: Identify industry
    if (step === 'identify-industry') {
      const { content } = body;
      const industry = await identifyIndustry(content);
      return NextResponse.json({ success: true, industry });
    }

    // Step 3: Find competitors
    if (step === 'find-competitors') {
      const { content, industry } = body;
      const competitors = await findCompetitors(industry, url);
      return NextResponse.json({ success: true, competitors });
    }

    // Step 4: Scrape competitors
    if (step === 'scrape-competitors') {
      const { competitorUrls } = body;
      const competitorContents = await Promise.all(
        competitorUrls.map((u: string) => scrapeWithJina(u))
      );
      return NextResponse.json({ success: true, competitorContents });
    }

    // Step 5: Analyze
    if (step === 'analyze') {
      const { userContent, competitorContents } = body;
      const analysis = await analyzeWebsites(userContent, competitorContents);
      return NextResponse.json({ success: true, analysis });
    }

    // Step 6: Save lead and send email
    if (step === 'save-lead') {
      const { email: leadEmail, url: leadUrl, analysis } = body;

      // Save to Airtable
      try {
        const base = getAirtable().base(process.env.AIRTABLE_BASE_ID || 'appQ8PADMp8Sc7mXT');
        await base('Concurrent Leads').create([
          {
            fields: {
              Email: leadEmail,
              URL: leadUrl,
              Timestamp: new Date().toISOString(),
            },
          },
        ]);
      } catch (airtableError) {
        console.error('Airtable error:', airtableError);
        // Continue even if Airtable fails
      }

      // Send email
      try {
        const onderscheidHtml = analysis.onderscheid
          .map((point: string) => `<p>• ${point}</p>`)
          .join('');

        await transporter.sendMail({
          from: process.env.SMTP_USER || 'hello@newfound.agency',
          to: leadEmail,
          bcc: 'caesar@newfound.agency',
          subject: 'Jouw concurrentie-analyse van Newfound',
          html: `
            <div style="font-family: Satoshi, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #0f0f10;">Jouw concurrentie-analyse</h1>
              <p>Bedankt voor het gebruiken van onze concurrentie-analyse tool.</p>

              <h2 style="color: #2e7cf6; margin-top: 30px;">Wat we zagen</h2>
              <p>${analysis.samenvatting}</p>

              <h2 style="color: #8463ff; margin-top: 30px;">Wat jou écht anders maakt</h2>
              ${onderscheidHtml}

              <div style="border-left: 2px solid #ccc; padding-left: 16px; margin: 30px 0; font-style: italic;">
                ${analysis.implicatie}
              </div>

              <p style="margin-top: 40px;">
                <a href="mailto:hello@newfound.agency" style="background: linear-gradient(90deg, #2e7cf6, #8463ff); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Samen scherper naar je merk kijken?
                </a>
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Email error:', emailError);
        // Continue even if email fails
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
