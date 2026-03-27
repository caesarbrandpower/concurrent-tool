import * as cheerio from 'cheerio';
import { ScrapedData } from '@/types';

const MIN_WORDS = 200;

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Connection': 'keep-alive',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

// --- Layer 1: Jina AI (8s per URL) ---
async function fetchViaJina(pageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(`https://r.jina.ai/${encodeURIComponent(pageUrl)}`, {
      headers: { 'Accept': 'text/plain' },
      signal: AbortSignal.timeout(8000),
    });

    if (response.ok) {
      const text = await response.text();
      if (text && text.length > 200) return text;
    }
  } catch (error) {
    console.error('Jina failed for', pageUrl, error);
  }
  return null;
}

// --- Layer 2: Direct HTML + Cheerio (12s) ---
function parseHtml(html: string, pageUrl: string): string | null {
  if (html.length < 500) return null;

  const $ = cheerio.load(html);
  $('script, style, nav, footer, header, aside, .cookie-banner, .popup, .modal, .advertisement, .ads, iframe, noscript').remove();

  let content = '';
  const mainSelectors = [
    'main', 'article', '[role="main"]', '.content', '#content',
    '.main-content', '#main-content', 'section', '.container', 'body',
  ];

  for (const selector of mainSelectors) {
    const element = $(selector).first();
    if (element.length && element.text().trim().length > 200) {
      const textElements = element.find('p, h1, h2, h3, h4, h5, h6, li');
      if (textElements.length > 0) {
        content = textElements.map((_, el) => $(el).text().trim()).get().join('\n\n');
      } else {
        content = element.text().trim();
      }
      break;
    }
  }

  if (!content || content.length < 200) {
    content = $('p, h1, h2, h3, h4, h5, h6, li').map((_, el) => $(el).text().trim()).get().join('\n\n');
  }

  content = content.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
  if (content.length < 100) return null;
  return content;
}

async function fetchDirectHtml(pageUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(pageUrl, {
      headers: BROWSER_HEADERS,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok || response.status >= 400) return null;

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return null;

    const html = await response.text();
    return parseHtml(html, pageUrl);
  } catch {
    return null;
  }
}

// --- Layer 3: Googlebot plain text (15s) ---
async function fetchDirectPlain(pageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000);

    if (text.split(/\s+/).length < MIN_WORDS) return null;
    return text;
  } catch {
    return null;
  }
}

// --- Main scraper: Jina → Cheerio → Googlebot ---
export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  console.log(`scrapeWebsite: ${url}`);

  // Layer 1: Jina (8s per URL, 15s hard limit on phase)
  let content: string | null = null;
  try {
    content = await Promise.race([
      fetchViaJina(url),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 15000)),
    ]);
  } catch {
    console.log(`Jina phase failed for ${url}`);
  }

  if (content) {
    console.log(`scrapeWebsite OK via Jina: ${url}`);
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    return { url, content: content.trim(), wordCount };
  }

  // Layer 2: Direct HTML + Cheerio
  console.log(`Jina failed, trying Cheerio for: ${url}`);
  content = await fetchDirectHtml(url);

  if (content) {
    console.log(`scrapeWebsite OK via Cheerio: ${url}`);
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    return { url, content: content.trim(), wordCount };
  }

  // Layer 3: Googlebot
  console.log(`Cheerio failed, trying Googlebot for: ${url}`);
  content = await fetchDirectPlain(url);

  if (content) {
    console.log(`scrapeWebsite OK via Googlebot: ${url}`);
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    return { url, content: content.trim(), wordCount };
  }

  // All layers failed
  console.log(`scrapeWebsite: all layers failed for ${url}`);
  return { url, content: '', wordCount: 0 };
}

export function isValidScrape(data: ScrapedData): boolean {
  return data.wordCount >= MIN_WORDS && data.content.length > 0;
}

// --- Parallel scraper for multiple URLs ---
export async function scrapeMultipleUrls(urls: string[]): Promise<ScrapedData[]> {
  const results = await Promise.all(urls.map(url => scrapeWebsite(url)));
  return results;
}
