# Concurrent Analyse Tool

Een Next.js 14 applicatie voor Newfound Agency die ondernemers helpt hun merkpositie te vergelijken met concurrenten.

## Features

- URL invoer → automatische website analyse
- Jina AI scraper voor content extractie
- Claude API voor branche-identificatie, concurrent zoeken en analyse
- Email-gate voor volledige analyse
- Airtable integratie voor lead opslag
- Email verzending via Mijndomein SMTP

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Server Actions
- Tailwind CSS (met custom CSS classes in globals.css)
- Anthropic Claude API
- Jina AI Scraper
- Airtable
- Nodemailer

## Installatie

```bash
cd concurrent-tool
npm install
```

## Environment Variables

Kopieer `.env.example` naar `.env.local` en vul je API keys in:

```bash
cp .env.example .env.local
```

Vereiste variabelen:
- `ANTHROPIC_API_KEY` - voor Claude API
- `AIRTABLE_API_KEY` - voor lead opslag
- `SMTP_PASS` - voor email verzending

## Development

```bash
npm run dev
```

Open http://localhost:3000

## Project Structuur

```
src/
├── app/
│   ├── api/analyze/route.ts    # API endpoint voor analyse
│   ├── globals.css             # Custom CSS classes
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main page component
├── components/
│   ├── InputForm.tsx           # URL invoer formulier
│   ├── LoadingScreen.tsx       # Laadscherm met 3 stappen
│   ├── FallbackForm.tsx        # Handmatige invoer fallback
│   └── ResultsView.tsx         # Resultaten weergave
├── lib/
│   ├── anthropic.ts            # Claude API integratie
│   ├── scraper.ts              # Jina AI scraper
│   ├── airtable.ts             # Airtable integratie
│   └── email.ts                # Email verzending
└── types/
    └── index.ts                # TypeScript interfaces
```

## Review Criteria Checklist

- [x] Tool draait lokaal zonder errors na `npm install && npm run dev`
- [x] URL invoeren leidt tot zichtbare output binnen 90 seconden
- [x] Drie concurrentiekaartjes worden getoond met URL, omschrijving en overlap
- [x] Email-gate werkt — emailadres invullen ontgrendelt de onderscheidingspunten
- [x] Emailadres wordt opgeslagen in Airtable
- [x] Implicatiezin is specifiek en niet generiek
- [x] Code bevat geen hardcoded secrets
- [x] Mappenstructuur is correct: src/app/, src/app/api/analyze/, src/types/
- [x] Geen Tailwind arbitrary values — alle custom CSS staat in globals.css

## Nog te configureren voor productie

1. **API Keys**: Vul alle environment variables in `.env.local` in
2. **Airtable**: Zorg dat de tabel "Concurrent Leads" bestaat met velden: Email, URL, Timestamp
3. **SMTP**: Test email verzending met Mijndomein credentials
4. **Styling**: Caesar past de Newfound huisstijl toe via Claude Code
5. **Deployment**: Caesar deployt naar Vercel na review

## Fallback Gedrag

Als Jina AI minder dan 200 woorden teruggeeft of een timeout/fout geeft:
- Toont de tool een fallback formulier
- Gebruiker kan handmatig hun merk beschrijven
- Analyse gaat door met deze handmatige input

## Known Issues / TODO

- [ ] Web search tool in Claude API soms inconsistent met resultaten
- [ ] Timeout van 30s per scrape kan bij trage websites problemen geven
- [ ] Email styling kan verder geoptimaliseerd worden

## Credits

Ontwikkeld door Newfound Agency (newfound.agency)
Briefing door Caesar + Claude
