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
    // Normalize URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`

    // Step 1: Scrape user website
    const userContent = await scrapeWebsite(normalizedUrl)

    // Step 2: Find competitors using Claude with web search
    const competitorUrls = await findCompetitorsWithClaude(userContent, normalizedUrl)

    // Step 3: Scrape competitors
    const competitors = await Promise.all(
      competitorUrls.slice(0, 3).map(async (compUrl) => {
        try {
          const content = await scrapeWebsite(compUrl)
          return { url: compUrl, content }
        } catch {
          return null
        }
      })
    )

    const validCompetitors = competitors.filter((c): c is { url: string; content: string } => c !== null)

    if (validCompetitors.length < 3) {
      // Fallback: use Jina search
      const searchResults = await searchCompetitors(`${userContent.substring(0, 200)} concurrent`, 3 - validCompetitors.length)
      for (const searchUrl of searchResults) {
        if (validCompetitors.length >= 3) break
        try {
          const content = await scrapeWebsite(searchUrl)
          validCompetitors.push({ url: searchUrl, content })
        } catch {
          // Skip failed scrapes
        }
      }
    }

    // Step 4: Analyze all websites
    const result = await analyzeWebsites(normalizedUrl, userContent, validCompetitors.slice(0, 3))

    return {
      step: 'complete',
      progress: 100,
      message: 'Analyse voltooid',
      result,
    }
  } catch (error) {
    console.error('Analysis error:', error)
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