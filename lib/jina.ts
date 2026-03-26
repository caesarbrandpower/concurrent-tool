export async function scrapeWebsite(url: string): Promise<string> {
  // Use r.jina.ai with the full URL (preserving original protocol)
  const cleanUrl = url.replace(/^https?:\/\//, '')
  const jinaUrl = `https://r.jina.ai/https://${cleanUrl}`

  console.log(`[JINA] Scraping: ${jinaUrl}`)

  const response = await fetch(jinaUrl, {
    headers: {
      'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[JINA] Scrape failed for ${url}: ${response.status} ${response.statusText}`, errorText)
    throw new Error(`Failed to scrape ${url}: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.data?.content || data.content || ''

  console.log(`[JINA] Scraped ${url}: ${content.length} chars`)

  if (!content || content.length < 50) {
    throw new Error(`No meaningful content found on ${url}`)
  }

  return content
}

export async function searchCompetitors(query: string, maxResults: number = 3): Promise<string[]> {
  const searchUrl = `https://s.jina.ai/${encodeURIComponent(query)}`

  console.log(`[JINA] Searching: ${query}`)

  const response = await fetch(searchUrl, {
    headers: {
      'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[JINA] Search failed: ${response.status} ${response.statusText}`, errorText)
    throw new Error(`Search failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const results = data.data || []

  console.log(`[JINA] Search returned ${results.length} results`)

  return results
    .slice(0, maxResults + 2)
    .map((r: any) => r.url)
    .filter((url: string) => url && !url.includes(query.split(' ')[0]))
    .slice(0, maxResults)
}
