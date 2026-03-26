'use server'

import { scrapeWebsite, searchCompetitors } from '@/lib/jina'
import { analyzeWebsites, findCompetitorsWithClaude } from '@/lib/claude'
import { saveLead } from '@/lib/airtable'
import { sendConfirmationEmail } from '@/lib/email'
import { AnalysisResult, LeadData } from '@/types'

interface AnalyzeState {
  step: 'idle' | 'scraping' | 'searching' | 'analyzing' | 'complete' | 'error'
  progress: number
  message: string
  result?: AnalysisResult
  error?: string
}

export async function analyzeCompetitors(
  prevState: AnalyzeState,
  formData: FormData
): Promise<AnalyzeState> {
  const url = formData.get('url') as string

  if (!url) {
    return { step: 'error', progress: 0, message: '', error: 'Geen URL opgegeven' }
  }

  try {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
    console.log(`[ACTION] Starting analysis for: ${normalizedUrl}`)

    // Step 1: Scrape user website
    console.log(`[ACTION] Step 1: Scraping user website`)
    const userContent = await scrapeWebsite(normalizedUrl)
    console.log(`[ACTION] Step 1 complete: ${userContent.length} chars scraped`)

    // Step 2: Find competitors using Claude
    console.log(`[ACTION] Step 2: Finding competitors`)
    const competitorUrls = await findCompetitorsWithClaude(userContent, normalizedUrl)
    console.log(`[ACTION] Step 2 complete: ${competitorUrls.length} competitors found:`, competitorUrls)

    // Step 3: Scrape competitors
    console.log(`[ACTION] Step 3: Scraping competitors`)
    const competitors = await Promise.all(
      competitorUrls.slice(0, 3).map(async (compUrl) => {
        try {
          const content = await scrapeWebsite(compUrl)
          return { url: compUrl, content }
        } catch (err) {
          console.error(`[ACTION] Failed to scrape competitor ${compUrl}:`, err instanceof Error ? err.message : err)
          return null
        }
      })
    )

    const validCompetitors = competitors.filter((c): c is { url: string; content: string } => c !== null)
    console.log(`[ACTION] Step 3 complete: ${validCompetitors.length}/${competitorUrls.length} competitors scraped`)

    if (validCompetitors.length < 3) {
      console.log(`[ACTION] Step 3b: Using Jina search fallback for ${3 - validCompetitors.length} more competitors`)
      try {
        const searchResults = await searchCompetitors(`${userContent.substring(0, 200)} concurrent`, 3 - validCompetitors.length)
        for (const searchUrl of searchResults) {
          if (validCompetitors.length >= 3) break
          try {
            const content = await scrapeWebsite(searchUrl)
            validCompetitors.push({ url: searchUrl, content })
          } catch (err) {
            console.error(`[ACTION] Failed to scrape fallback ${searchUrl}:`, err instanceof Error ? err.message : err)
          }
        }
      } catch (err) {
        console.error(`[ACTION] Jina search fallback failed:`, err instanceof Error ? err.message : err)
      }
    }

    if (validCompetitors.length === 0) {
      return { step: 'error', progress: 0, message: '', error: 'Geen concurrenten gevonden. Probeer een andere URL.' }
    }

    // Step 4: Analyze all websites
    console.log(`[ACTION] Step 4: Analyzing ${validCompetitors.length} competitors`)
    const result = await analyzeWebsites(normalizedUrl, userContent, validCompetitors.slice(0, 3))
    console.log(`[ACTION] Step 4 complete: Analysis done`)

    return {
      step: 'complete',
      progress: 100,
      message: 'Analyse voltooid',
      result,
    }
  } catch (error) {
    console.error('[ACTION] Analysis error:', error)
    return {
      step: 'error',
      progress: 0,
      message: '',
      error: error instanceof Error ? error.message : 'Er ging iets mis bij de analyse',
    }
  }
}

export async function submitEmail(
  prevState: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const email = formData.get('email') as string
  const url = formData.get('url') as string
  const analysisJson = formData.get('analysis') as string

  if (!email || !url) {
    return { success: false, error: 'Email en URL zijn verplicht' }
  }

  try {
    const analysis: AnalysisResult | undefined = analysisJson ? JSON.parse(analysisJson) : undefined

    const leadData: LeadData = {
      email,
      url,
      timestamp: new Date().toISOString(),
      analysis,
    }

    // Save to Airtable
    await saveLead(leadData)

    // Send confirmation email
    await sendConfirmationEmail(email, url)

    return { success: true }
  } catch (error) {
    console.error('Email submission error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Er ging iets mis bij het opslaan'
    }
  }
}
