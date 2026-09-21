# Zema

Live Ethiopian and Eritrean radio, plus a four-lane news desk with an AI-written brief.
Next.js 14 (App Router) on Vercel, Supabase for accounts.

## What's in it

- **Radio** (`/radio`, `/radio/<station>`): six Zeno.fm streams, a player that keeps
  playing while you browse, live "now playing" titles, auto-reconnect, sleep timer,
  lock-screen controls. `/api/radio/health` checks which stations are actually on air.
- **News** (`/world-news`): Top, Ethiopia, East Africa and Diaspora lanes from free RSS
  feeds, plus "The Brief", written by whichever AI provider is configured.
- **Accounts**: Supabase Auth (email + password).
- **Analytics**: PostHog, optional.

## Run it locally

Needs Node 20 or 22.

```bash
npm install
cp .env.example .env.local   # fill in the values you have
npm run dev
```

Everything is optional except the two Supabase values. Without them, sign-in is off
but radio and news still work. `.env.example` explains each variable.

## Deploy

Push to a branch → Vercel preview. Push to `main` → production (habeshagram.today).
Environment variables live in the Vercel dashboard, not in the repo.

## Database

Schema and Row Level Security policies are in `supabase/migrations/`, applied in order.
