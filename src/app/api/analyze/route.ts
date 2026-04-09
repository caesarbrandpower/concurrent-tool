import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsite, scrapeMultipleUrls, isValidScrape } from '@/lib/scraper';
import { identifyIndustry, findCompetitors, analyzeWebsites, withTimeout } from '@/lib/anthropic';
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

    // Step 2: Identify industry
    const industry = await identifyIndustry(userScraped.content);

    // 2s delay tussen API calls om rate limits te voorkomen
    await delay(2000);

    // Step 3: Find competitors
    const competitorUrls = await findCompetitors(industry);

    // 2s delay voor volgende fase
    await delay(2000);

    // Step 4: Scrape all competitor URLs in parallel, take first 3 valid
    console.log(`Scraping ${competitorUrls.length} competitor URLs in parallel...`);
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

    // 2s delay voor de analyse call
    await delay(2000);

    // Step 5: Analyze all websites
    const analysis = await withTimeout(
      () => analyzeWebsites(userScraped.content, competitorData.map(c => ({ url: c.url, content: c.content }))),
      90000,
      'analyzeWebsites'
    );

    return NextResponse.json({
      success: true,
      industry,
      competitors: competitorData.map(c => ({ url: c.url, content: c.content.substring(0, 500) })),
      result: analysis,
    });

  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
