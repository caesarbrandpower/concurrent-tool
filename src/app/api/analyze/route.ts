import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsite, scrapeMultipleUrls, isValidScrape } from '@/lib/scraper';
import { identifyIndustry, findCompetitors, analyzeUserSite, analyzeCompetitors, withTimeout } from '@/lib/anthropic';
import { ScrapedData } from '@/types';

export const maxDuration = 120;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, manualContent } = body;

    console.log('API key aanwezig:', !!process.env.ANTHROPIC_API_KEY);
    console.log('URL ontvangen:', url);
    console.log('Manual content aanwezig:', !!manualContent);

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    let userScraped: ScrapedData;

    // Step 1: Scrape user website or use manual content
    if (manualContent) {
      userScraped = {
        url,
        content: manualContent,
        wordCount: manualContent.split(/\s+/).filter((w: string) => w.length > 0).length,
      };
    } else {
      try {
        userScraped = await scrapeWebsite(url);

        if (!isValidScrape(userScraped)) {
          return NextResponse.json(
            { 
              error: 'Insufficient content', 
              fallback: true,
              message: 'We konden je website niet goed lezen. Beschrijf je merk kort in eigen woorden.'
            },
            { status: 422 }
          );
        }
      } catch (scrapeError) {
        return NextResponse.json(
          { 
            error: 'Scrape failed', 
            fallback: true,
            message: 'We konden je website niet goed lezen. Beschrijf je merk kort in eigen woorden.'
          },
          { status: 422 }
        );
      }
    }

    // Step 2: Identify industry + find competitors (1.5s delay tussen API calls)
    const industry = await identifyIndustry(userScraped.content);
    await delay(1500);

    const competitorUrls = await findCompetitors(industry);

    // Step 3: Scrape competitor URLs parallel (geen API calls, alleen HTTP fetches)
    console.log(`Scraping ${competitorUrls.length} competitor URLs parallel...`);
    const allScraped = await scrapeMultipleUrls(competitorUrls);
    const competitorData = allScraped.filter(s => {
      const valid = s.wordCount >= 50 && s.content.length > 0;
      console.log(`Competitor ${s.url}: ${valid ? 'OK' : 'overgeslagen'} (${s.wordCount} woorden)`);
      return valid;
    }).slice(0, 3);
    console.log(`Totaal geldige concurrenten: ${competitorData.length}`);

    if (competitorData.length === 0) {
      return NextResponse.json(
        { error: 'Could not find valid competitors' },
        { status: 500 }
      );
    }

    // Step 4: API Call 1 - Analyseer gebruiker zijn site (1.5s delay na scraping)
    await delay(1500);
    console.log('API Call 1: analyzeUserSite...');
    const call1 = await withTimeout(
      () => analyzeUserSite(userScraped.content),
      50000,
      'analyzeUserSite'
    );
    console.log(`API Call 1 klaar: merknaam=${call1.merknaam}`);

    // 3 seconden wachten tussen call 1 en call 2 (token reset)
    await delay(3000);

    // Step 5: API Call 2 - Vergelijk met concurrenten
    console.log('API Call 2: analyzeCompetitors...');
    const call2 = await withTimeout(
      () => analyzeCompetitors(
        call1.merknaam,
        userScraped.content,
        competitorData.map(c => ({ url: c.url, content: c.content }))
      ),
      50000,
      'analyzeCompetitors'
    );
    console.log('API Call 2 klaar');

    // Combineer resultaten
    const result = {
      merknaam: call1.merknaam,
      conclusie: call2.conclusie,
      concurrenten: call2.concurrenten,
      inzicht1: call1.inzicht1,
      inzicht2: call2.inzicht2,
      inzicht3: call2.inzicht3,
      actieplan: call2.actieplan,
    };

    return NextResponse.json({
      success: true,
      industry,
      competitors: competitorData.map(c => ({ url: c.url, content: c.content.substring(0, 500) })),
      result,
    });

  } catch (error) {
    console.error('Analyze error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout = message.includes('timeout');
    return NextResponse.json(
      { 
        error: isTimeout ? 'De analyse duurde te lang. Probeer het opnieuw.' : 'Analyse mislukt', 
        message 
      },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
