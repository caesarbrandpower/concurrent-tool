import * as cheerio from 'cheerio';
import FirecrawlApp from '@mendable/firecrawl-js';
import { ScrapedData } from '@/types';

const MIN_WORDS = 100;

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

const GATE_PATTERNS = [
  'ben je 18',
  '18 jaar',
  '18+',
  'ouder dan 18',
  'leeftijdsverificatie',
  'leeftijdscontrole',
  'geboortejaar',
  'geboortedatum',
  'age verification',
  'age gate',
  'verify your age',
  'are you 18',
  'are you of legal',
  'you must be',
  'over 18',
  'legal age',
  'date of birth',
  'year of birth',
  'enter your birth',
  'verantwoord drinken',
  'drink responsibly',
  'cookie-wall',
  'cookiewall',
  'accepteer cookies',
  'accept cookies',
];

function isGateContent(text: string): boolean {
  const lower = text.toLowerCase();
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount > 500) return false;
  return GATE_PATTERNS.some(pattern => lower.includes(pattern));
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function isSubstantialContent(text: string): boolean {
  const blocks = text.split(/\n\s*\n|\.\s+/);
  let substantialBlocks = 0;
  for (const block of blocks) {
    const words = block.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (words >= 20) substantialBlocks++;
    if (substantialBlocks >= 1) return true;
  }
  return false;
}

function isErrorPage(text: string): boolean {
  const words = countWords(text);
  if (words > 50) return false;
  const lower = text.toLowerCase();
  return lower.includes('404') || lower.includes('not found') || lower.includes('page not found') ||
    lower.includes('redirect') || lower.includes('moved permanently');
}

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
  if (html.length > 250000) {
    console.log(`[Scraper] HTML te groot (${Math.round(html.length / 1024)}KB), skip Cheerio voor: ${pageUrl}`);
    return null;
  }

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

    return text;
  } catch {
    return null;
  }
}

// --- Layer 4: Firecrawl (voor beveiligde sites) ---
async function fetchViaFirecrawl(pageUrl: string): Promise<string | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.log('[Scraper] Firecrawl: geen FIRECRAWL_API_KEY in environment');
    return null;
  }
  try {
    const app = new FirecrawlApp({ apiKey });
    const result = await app.scrapeUrl(pageUrl, { formats: ['markdown'] });
    if (!result.success) {
      console.log(`[Scraper] Firecrawl mislukt: ${JSON.stringify(result).substring(0, 300)}`);
      return null;
    }
    const text = result.markdown || '';
    const words = countWords(text);
    if (words < 10) return null;
    return text;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Scraper] Firecrawl error: ${msg}`);
    return null;
  }
}

function validateContent(text: string, layer: string, url: string): boolean {
  const words = countWords(text);
  const gate = isGateContent(text);
  const error = isErrorPage(text);

  if (gate) {
    console.log(`[${layer}] gate content voor ${url} (${words} woorden), skip`);
    return false;
  }
  if (error) {
    console.log(`[${layer}] error page voor ${url}, skip`);
    return false;
  }
  if (words < MIN_WORDS) {
    console.log(`[${layer}] te weinig content voor ${url} (${words} woorden)`);
    return false;
  }
  if (!isSubstantialContent(text)) {
    console.log(`[${layer}] geen substantiele content voor ${url} (${words} woorden)`);
    return false;
  }

  console.log(`[${layer}] OK voor ${url} (${words} woorden)`);
  return true;
}

// --- Main scraper: Jina -> Cheerio -> Googlebot -> Firecrawl ---
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
    console.log(`[1/4] Jina phase failed for ${url}`);
  }

  if (content && validateContent(content, '1/4 Jina', url)) {
    const wordCount = countWords(content);
    return { url, content: content.trim(), wordCount };
  }

  // Layer 2: Direct HTML + Cheerio
  console.log(`[2/4] Cheerio: start voor ${url}`);
  content = await fetchDirectHtml(url);

  if (content && validateContent(content, '2/4 Cheerio', url)) {
    const wordCount = countWords(content);
    return { url, content: content.trim(), wordCount };
  }

  // Layer 3: Googlebot
  console.log(`[3/4] Googlebot: start voor ${url}`);
  content = await fetchDirectPlain(url);

  if (content && validateContent(content, '3/4 Googlebot', url)) {
    const wordCount = countWords(content);
    return { url, content: content.trim(), wordCount };
  }

  // Layer 4: Firecrawl (voor beveiligde sites met age gates, cookiewalls)
  console.log(`[4/4] Firecrawl: start voor ${url}`);
  content = await fetchViaFirecrawl(url);

  if (content && validateContent(content, '4/4 Firecrawl', url)) {
    const wordCount = countWords(content);
    return { url, content: content.trim(), wordCount };
  }

  // All layers failed
  console.log(`[Scraper] Alle 4 lagen gefaald voor ${url}`);
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
