export async function scrapeWebsite(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;

  const response = await fetch(jinaUrl, {
    headers: {
      'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to scrape ${url}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data?.content || data.content || '';
}

export async function searchCompetitors(query: string, maxResults: number = 3): Promise<string[]> {
  const searchUrl = `https://s.jina.ai/${encodeURIComponent(query)}`;

  const response = await fetch(searchUrl, {
    headers: {
      'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  const data = await response.json();
  const results = data.data || [];

  // Extract URLs from search results, filter out the original site
  return results
    .slice(0, maxResults + 2)
    .map((r: any) => r.url)
    .filter((url: string) => url && !url.includes(query.split(' ')[0]))
    .slice(0, maxResults);
}