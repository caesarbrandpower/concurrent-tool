import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsite, isValidScrape } from '@/lib/scraper';
import { identifyIndustry, findCompetitors, analyzeWebsites } from '@/lib/anthropic';
import { ScrapedData, AnalysisResult } from '@/types';

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

    // Step 3: Find competitors
    const competitorUrls = await findCompetitors(industry);

    // Step 4: Scrape competitors
    const competitorData: ScrapedData[] = [];
    for (const compUrl of competitorUrls) {
      try {
        const scraped = await scrapeWebsite(compUrl);
        if (isValidScrape(scraped)) {
          competitorData.push(scraped);
        }
      } catch (e) {
        console.error(`Failed to scrape competitor: ${compUrl}`, e);
      }
    }

    if (competitorData.length === 0) {
      return NextResponse.json(
        { error: 'Could not find valid competitors' },
        { status: 500 }
      );
    }

    // Step 5: Analyze all websites
    const analysis = await analyzeWebsites(
      userScraped.content,
      competitorData.map(c => ({ url: c.url, content: c.content }))
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
