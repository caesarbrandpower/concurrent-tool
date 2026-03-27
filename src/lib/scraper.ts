import { ScrapedData } from '@/types';

const MIN_WORDS = 200;
const TIMEOUT_MS = 30000;

export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;

    const response = await fetch(jinaUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Scraper error: ${response.status}`);
    }

    const content = await response.text();
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

    return {
      url,
      content: content.trim(),
      wordCount,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Scrape timeout exceeded');
      }
      throw error;
    }
    throw new Error('Unknown scraping error');
  }
}

export function isValidScrape(data: ScrapedData): boolean {
  return data.wordCount >= MIN_WORDS && data.content.length > 0;
}
