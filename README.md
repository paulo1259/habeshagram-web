# HabeshaGram Web MVP

HabeshaGram is a mobile-first social web app for the Ethiopian and Eritrean Habesha community.

This project is designed to run locally today at zero cost:

- It uses real Firebase Authentication when configured
- It keeps local mock content for posts, comments, likes, and discovery sections
- It stays runnable even if Firebase is not configured, but auth-protected actions will be unavailable until you add `.env.local`

## Run In VS Code On Windows

1. Open the `habeshagram-web` folder in VS Code
2. Open the terminal in that folder
3. Run:

```bash
npm install
npm run dev
```

4. Visit `http://localhost:3000`

## Stable Local Dev

HabeshaGram is most stable on Node 20 or Node 22. This project currently uses Next.js 14, and newer major Node versions can cause flaky dev-server cache or chunk issues.

Recommended:

- Node 20 LTS or Node 22 LTS
- Avoid Node 25 for daily local development on this project

If Next starts throwing chunk or vendor errors such as:

- `Cannot find module './161.js'`
- `Can't resolve './vendor-chunks/clsx'`
- `404 /_next/static/chunks/app/loading.js`

that usually means the local build cache is stale or partially corrupted, not that your app code is fundamentally broken.

Use this recovery flow from the project root:

```bash
npm run clean
npm run dev
```

`npm run dev` and `npm run build` already start from a clean Next cache now, so in normal day-to-day use you should not need to delete `.next` manually very often.

If that is still not enough, do a full reinstall:

```bash
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npm run dev
```

When to delete `.next`:

- after branch switches
- after dependency changes
- after changing Next.js, Tailwind, or TypeScript config
- when you see missing chunk or vendor module errors
- when the UI suddenly looks stale compared to the source code

## Authentication

- HabeshaGram uses Firebase Authentication with email/password.
- On signup, it creates a matching Firestore document at `users/{uid}`.
- If Firebase env vars are missing, the app still renders, but login/signup and protected routes will tell you Firebase setup is required.

## Environment Variables

Copy `.env.example` to `.env.local` when you are ready for Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_KEY=
FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_HOST=free-api-live-football-data.p.rapidapi.com
FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_BASE_URL=https://free-api-live-football-data.p.rapidapi.com
SPORTAPI_RAPIDAPI_KEY=
SPORTAPI_RAPIDAPI_HOST=sportapi7.p.rapidapi.com
SPORTAPI_RAPIDAPI_BASE_URL=https://sportapi7.p.rapidapi.com
BREAKING_NEWS_RSS_URL=
```

If these are blank, the app still starts, but authentication remains unavailable until you add real values and restart the dev server.

`FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_KEY` is server-only for the live match center. Keep it in `.env.local` and in Vercel project environment variables, but do not prefix it with `NEXT_PUBLIC_`.
`FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_HOST` is server-only and can usually stay at `free-api-live-football-data.p.rapidapi.com`.
`FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_BASE_URL` is server-only and defaults to `https://free-api-live-football-data.p.rapidapi.com`.
`SPORTAPI_RAPIDAPI_KEY` is server-only too. Keep it in `.env.local` and in Vercel project environment variables, but do not prefix it with `NEXT_PUBLIC_`.
`SPORTAPI_RAPIDAPI_HOST` is server-only and can usually stay at `sportapi7.p.rapidapi.com`.
`SPORTAPI_RAPIDAPI_BASE_URL` is server-only and defaults to `https://sportapi7.p.rapidapi.com`.
`BREAKING_NEWS_RSS_URL` is also server-only and optional. If you leave it blank, HabeshaGram defaults to the BBC Sport football RSS feed.

### football API setup

For local development, add this exact line to `.env.local`:

```env
FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_KEY=YOUR_RAPIDAPI_KEY
FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_HOST=free-api-live-football-data.p.rapidapi.com
FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_BASE_URL=https://free-api-live-football-data.p.rapidapi.com
SPORTAPI_RAPIDAPI_KEY=YOUR_RAPIDAPI_KEY
SPORTAPI_RAPIDAPI_HOST=sportapi7.p.rapidapi.com
SPORTAPI_RAPIDAPI_BASE_URL=https://sportapi7.p.rapidapi.com
```

For Vercel:

1. Open your project in Vercel
2. Go to `Project Settings > Environment Variables`
3. Add `FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_KEY`
4. Paste your RapidAPI key as the value
5. Add `FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_HOST`
6. Set it to `free-api-live-football-data.p.rapidapi.com`
7. Add `FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_BASE_URL`
8. Set it to `https://free-api-live-football-data.p.rapidapi.com`
9. Add the SportAPI vars too if you want the standings widget to keep using that provider
10. Save them for the environments you want, usually:
   - `Production`
   - `Preview`
   - `Development`
11. Redeploy after saving the variables so the server route can read the new token

Important:

- do not rename it to `NEXT_PUBLIC_FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_KEY`
- do not place the token in client components
- the browser should only call `/api/football/live` and `/api/football/standings`, never the RapidAPI providers directly

## Firebase Setup

In Firebase Console:

1. Create a project
2. Add a Web app
3. Copy the app config into `.env.local`
4. In `Authentication`, enable `Email/Password`
5. In `Firestore Database`, create a database in production or test mode
6. Create a `users` collection
7. Add Firestore rules that allow authenticated reads/writes for your app as needed

HabeshaGram creates user documents in:

- `users/{uid}`

Each user document stores:

- `id`
- `username`
- `email`
- `profileImageURL`
- `bio`
- `createdAt`

## Production Readiness

HabeshaGram is ready for a public MVP, but you should tighten Firebase Console before launch.

### Firestore Rules

This repo now includes a safer MVP rules file:

- [firestore.rules](/C:/Users/Mesfi/Downloads/ios/habeshagram-web/firestore.rules)

It keeps the current app working while narrowing the riskiest client writes:

- public reads for public profiles and posts
- self-only writes for saved posts
- self-only notification read-state updates
- authenticated comment creation
- authenticated post creation
- limited post updates for likes and comment counters only
- a locked-down `reports` collection that clients can create into but not read back from

Important tradeoff:

- follower/following counters are still updated client-side, so the included rules allow counter-only user document updates
- this is safer than fully open user updates, but the best long-term production path is moving counter updates and notifications to Cloud Functions or another trusted backend

### Firestore Indexes You Will Likely Need

Because HabeshaGram now uses multiple compound queries, Firestore may ask you to create indexes. The most likely ones are:

- `posts` on `userId + createdAt`
- `posts` on `hashtags + createdAt`
- `posts` on `userId(in) + createdAt`

When Firestore throws an index error, it usually gives you a direct Console link to create the exact index.

### Auth Authorized Domains

Before launch, make sure Firebase Authentication includes:

- `localhost`
- your Vercel preview domain if you test sign-in there
- your final production domain
- your default `*.vercel.app` domain if you plan to use it

### Storage Path Assumptions

The app uploads files to:

- post images: `posts/{userId}/{postId}-{timestamp}.{ext}`
- profile image: `users/{userId}/profile.jpg`

Your Storage rules should allow authenticated users to write only inside their own uid path and allow public reads for rendered media.

### Live Football Data

HabeshaGram's Live Match Center now reads real match data from Free API Live Football Data through RapidAPI using an internal Next.js route handler.

- server route: `app/api/football/live/route.ts`
- live provider env vars:
  - `FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_KEY`
  - `FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_HOST`
  - `FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_BASE_URL`
- live coverage endpoints:
  - `/football-current-live`
  - `/football-scheduled-events`
  - `/football-matches`
- current provider focus: Premier League fixtures involving Manchester United, Arsenal, Chelsea, and Manchester City

The app keeps the provider key on the server, polls the local route from the browser every 15 seconds on the live page, and falls back to the last successful response or the built-in seeded slate if the provider is unavailable.

If `FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_KEY` is missing or blank, `app/api/football/live/route.ts` returns a friendly fallback payload instead of crashing the live page.

### Breaking Football News

HabeshaGram's Breaking Now section can read live football stories through an internal Next.js route:

- server route: `app/api/news/breaking/route.ts`
- default provider: BBC Sport football RSS
- optional override env var: `BREAKING_NEWS_RSS_URL`

The route ingests RSS on the server, filters for Manchester United, Arsenal, Chelsea, and Manchester City relevance, caches the last successful payload in memory, and falls back to the seeded editorial cards if the provider becomes unavailable.

### Reporting / Moderation MVP

Post reports are stored in:

- `reports/{reportId}`

Each report includes:

- `postId`
- `reportedUserId`
- `reporterUserId`
- `reporterUsername`
- `reason`
- `details`
- `status`
- `postTextPreview`
- `postImageURL`
- `createdAt`

Clients can submit reports, but should not be able to read the reports collection back from the public app. Review reports in Firebase Console or later through an admin-only dashboard.

## Soft Launch Checklist

Before inviting real users, run through this short checklist:

### Firebase setup

- Publish the Firestore rules from [firestore.rules](/C:/Users/Mesfi/Downloads/ios/habeshagram-web/firestore.rules)
- Publish Storage rules for:
  - `posts/{userId}/...`
  - `users/{userId}/profile.jpg`
- Enable Firebase Authentication with Email/Password
- Add Authorized domains for:
  - `localhost`
  - your `vercel.app` preview domain
  - your production domain

### Likely Firestore indexes

- `posts` with `userId` + `createdAt`
- `posts` with `hashtags` + `createdAt`
- `posts` with `userId (in)` + `createdAt`
- any index Firestore prompts for when testing topic pages, following feed, or comments

### Soft launch test flow

1. Sign up a brand-new account
2. Log out and log back in
3. Edit profile and upload a profile image
4. Create a text-only post
5. Create a post with an image
6. Create a team-tagged football post
7. Create a hashtagged post like `#Habesha` or `#GGMU`
8. Like, comment, save, and report a post from another account
9. Follow another user and confirm counts update
10. Open notifications and confirm unread count clears
11. Open:
    - `/saved`
    - `/search`
    - `/topic/habesha`
    - one football hub page
12. Verify mobile layout on a narrow screen before launch

### Deployment sanity check

- Add the same Firebase env vars to Vercel
- Verify the deployed domain is added in Firebase Auth Authorized domains
- Test one full login/post/image-upload flow on the deployed site before sharing it widely

## Firebase Content Later

Authentication is already wired. When you want to connect the rest of the real backend, update:

- `services/post-service.ts`
- `services/comment-service.ts`

The remaining content services still use mock/local data for the MVP:

- Firestore for users, posts, comments, likes
- Firebase Storage for image uploads

## Local Discovery Content

The homepage includes discovery sections so HabeshaGram feels complete even when no live external sources are connected:

- `services/discovery-data.ts`
  - `radioStations`: curated Addis Ababa / Ethiopia station cards
  - `localNewsItems`: editorial-style Addis entertainment and culture stories
- `services/news-service.ts`
  - clean fallback data layer for local entertainment and culture content

### Radio Data Shape

Each radio station includes:

- `id`
- `name`
- `frequency`
- `city`
- `description`
- `provider`
- `playbackMode`
- `embedUrl`
- `streamUrl`
- `tags`

Use these fields in `services/discovery-data.ts`:

- `embedUrl`: iframe player URL when a provider supports embeddable playback
- `streamUrl`: paste a direct audio stream URL here
- `playbackMode`: use `"widget"`, `"stream"`, or `"external"`

If `embedUrl` is present, HabeshaGram renders an in-page iframe player. If `embedUrl` is missing but `streamUrl` exists, it falls back to the browser audio player. If both are blank, the radio panel shows a graceful placeholder inside the site.

### Local News Data Shape

Each news item includes:

- `id`
- `headline`
- `source`
- `summary`
- `category`
- `imageURL`
- `link`

If `link` is blank, the UI still renders a complete editorial card and shows a placeholder action. Later, replace `services/news-service.ts` with live fetch logic from your preferred editorial source or internal API route.

## New UI Components

The discovery sections use reusable components:

- `components/discovery/radio-station-card.tsx`
- `components/discovery/radio-carousel.tsx`
- `components/discovery/news-card.tsx`
- `components/discovery/local-news-section.tsx`
- `components/discovery/community-highlights.tsx`
- `components/ui/section-header.tsx`

This keeps the homepage easier to expand later without rewriting the social feed.
