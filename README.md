# Match Archive

A FIFA World Cup archive and companion. Browse every match from 1986 to 2022, follow the 2026 tournament with live scores, a knockout bracket and a calendar, and see AI-assisted match predictions.

## Features

- **Archive**: match pages for the 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018 and 2022 World Cups, with scorecards and search
- **2026 tournament**: groups, fixtures, calendar and knockout bracket
- **Live scores** and standings from API-Football
- **Predictions**: a statistical baseline blended with web-search context and Gemini, stored in Supabase
- **Live TV and watch party** pages with an HLS video player
- A scheduled job (`/api/cron`) refreshes data on Vercel

## Tech stack

Next.js (App Router), React, Supabase, GSAP, hls.js, react-markdown, Gemini, Vercel

## Getting started

```bash
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
API_FOOTBALL_KEY=
GEMINI_API_KEY=            # or GEMINI_API_KEYS=key1,key2
SERPER_API_KEY=            # web search for predictions
TAVILY_API_KEY=            # alternative web search
VERCEL_CRON_SECRET=
NEXT_PUBLIC_HLS_PROXY=
```

```bash
npm run dev       # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | Lint with ESLint |