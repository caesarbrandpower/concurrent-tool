# Concurrent Analyse Tool

Een Next.js 14 applicatie die automatisch concurrenten analyseert op basis van een website URL.

## Wat de tool doet

1. Gebruiker vult een website URL in
2. Tool scraped de website met Jina AI
3. Claude API identificeert de branche en zoekt 3 concurrenten
4. Alle 4 websites worden geanalyseerd
5. Resultaat toont waar ze allemaal hetzelfde zeggen (de pijn)
6. Email-gate toont onderscheidende punten en implicatie

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Scraping**: Jina AI Reader API
- **AI Analyse**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Database**: Airtable
- **Email**: Nodemailer met Mijndomein SMTP

## Installatie

```bash
# Clone de repo
git clone https://github.com/caesarbrandpower/concurrent-tool.git
cd concurrent-tool

# Installeer dependencies
npm install

# Kopieer environment variables
cp .env.example .env.local

# Vul je API keys in .env.local
```

## Environment Variables

```env
ANTHROPIC_API_KEY=your_claude_api_key
JINA_API_KEY=your_jina_api_key
AIRTABLE_API_KEY=your_airtable_key
AIRTABLE_BASE_ID=appQ8PADMp8Sc7mXT
SMTP_HOST=mail.mijndomein.nl
SMTP_PORT=465
SMTP_USER=hello@newfound.agency
SMTP_PASS=your_smtp_password
SMTP_FROM=hello@newfound.agency
SMTP_BCC=caesar@newfound.agency
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

Deze tool is gebouwd voor deployment op Vercel:

```bash
npm run build
```

## Belangrijke features

- **Donker thema**: Consistent met Brandprompt ecosysteem
- **Typografie**: Greed Condensed (headers) + Satoshi (UI)
- **Geen liggend streepje**: In alle copy
- **Progressive enhancement**: Werkt zonder JavaScript
- **Server Actions**: Alle API calls via Next.js Server Actions
- **Email gate**: Leads worden opgeslagen in Airtable

## Airtable Structuur

Base: `appQ8PADMp8Sc7mXT` (zelfde als Brandprompt)
Tabel: `Concurrent Leads`
Velden:
- Email (Email)
- URL (URL)
- Timestamp (Date)
- Analysis (Long text, JSON)

## API Flow

1. `scrapeWebsite()` - Jina AI scraped de ingevoerde URL
2. `findCompetitorsWithClaude()` - Claude identificeert branche en concurrenten
3. `scrapeWebsite()` x3 - Jina scraped de 3 concurrenten
4. `analyzeWebsites()` - Claude analyseert alle 4 en genereert JSON
5. `saveLead()` - Email + analyse opgeslagen in Airtable
6. `sendConfirmationEmail()` - Bevestiging via SMTP

## Licentie

Intern gebruik voor Newfound Agency / Allegretto
