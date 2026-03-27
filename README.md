# Concurrentie-analyse Tool

Een Next.js 14 applicatie voor Newfound Agency waarmee ondernemers hun website kunnen vergelijken met drie automatisch gevonden concurrenten.

## Features

- **URL Analyse**: Vul je website-URL in en krijg binnen 90 seconden een analyse
- **Automatische Concurrent Detectie**: Vindt 3 relevante concurrenten in jouw branche
- **Vergelijkende Analyse**: Zie waar je hetzelfde zegt als je concurrenten én waar je je onderscheidt
- **Email Gate**: Ontvang de volledige analyse (onderscheidingspunten + implicatie) na het invullen van je emailadres
- **Lead Opslag**: Emailadressen worden opgeslagen in Airtable
- **Email Notificatie**: Automatische email met de analyse via Mijndomein SMTP

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animaties**: Framer Motion
- **AI**: Claude API (claude-sonnet-4-20250514) + Web Search Tool
- **Scraper**: Jina AI (https://r.jina.ai/)
- **Database**: Airtable
- **Email**: Nodemailer (Mijndomein SMTP)

## Installatie

1. Clone de repository:
```bash
git clone https://github.com/caesarbrandpower/concurrent-tool.git
cd concurrent-tool
```

2. Installeer dependencies:
```bash
npm install
```

3. Kopieer `.env.example` naar `.env.local` en vul je API keys in:
```bash
cp .env.example .env.local
```

4. Start de development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

## Environment Variables

| Variable | Beschrijving | Vereist |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Claude API key voor analyse | Ja |
| `JINA_API_KEY` | Jina AI API key (optioneel, maar aanbevolen) | Nee |
| `AIRTABLE_API_KEY` | Airtable API key voor lead opslag | Ja |
| `AIRTABLE_BASE_ID` | Airtable base ID (default: appQ8PADMp8Sc7mXT) | Ja |
| `SMTP_USER` | SMTP gebruiker (default: hello@newfound.agency) | Ja |
| `SMTP_PASS` | SMTP wachtwoord | Ja |
| `SMTP_HOST` | SMTP host (default: mail.mijndomein.nl) | Ja |
| `SMTP_PORT` | SMTP poort (default: 465) | Ja |

## API Routes

### POST /api/analyze

Multi-step API voor de analyse flow:

1. **Step: `scrape`** - Scrape de gebruikerswebsite met Jina AI
2. **Step: `identify-industry`** - Identificeer de branche met Claude
3. **Step: `find-competitors`** - Zoek 3 concurrenten met Claude Web Search
4. **Step: `scrape-competitors`** - Scrape de concurrenten websites
5. **Step: `analyze`** - Analyseer alle content en genereer JSON output
6. **Step: `save-lead`** - Sla lead op in Airtable en stuur email

## Design Specificaties

### Kleurenpalet
```css
--bg: #0f0f10;
--surface: #15181f;
--surface-2: #1a1f29;
--text: #e5e7eb;
--text-muted: rgba(229, 231, 235, 0.7);
--border: rgba(255, 255, 255, 0.10);
--grad-a: #2e7cf6;
--grad-b: #8463ff;
--cta: #23c26b;
```

### Typografie
- **Headers**: Greed Condensed Bold (CAPS, letter-spacing: 0.6px)
- **Body**: Satoshi (Regular + Medium)

### Componenten
- **Input + Button**: Aaneengesloten element met afgeronde hoeken (12px)
- **Concurrentiekaartjes**: Donkere achtergrond (#1a1f29), border 1px, border-radius 10px
- **Implicatieblokje**: Border-left 2px, padding-left 16px, italic

## Wat nog ontbreekt / TODO

1. **Error Handling**: Uitgebreidere error handling voor edge cases
2. **Rate Limiting**: Implementatie van rate limiting voor de API
3. **Analytics**: Toevoegen van analytics voor gebruiksstatistieken
4. **Testing**: Unit tests en integration tests toevoegen
5. **SEO**: Meta tags en Open Graph tags optimaliseren
6. **Accessibility**: A11y audit en verbeteringen
7. **Performance**: Image optimization en code splitting

## Deployment

Deze tool is gebouwd voor deployment op Vercel. Caesar voert de deployment uit via Claude Code na review.

```bash
# Build voor productie
npm run build

# Start productie server
npm start
```

## Licentie

Interne tool voor Newfound Agency.
