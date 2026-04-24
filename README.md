# HabeshaGram Web MVP

HabeshaGram is a mobile-first social web app for the Ethiopian and Eritrean Habesha community.

This project is designed to run locally today at zero cost:

- It uses real Firebase Authentication when configured
- It uses real live/admin-managed discovery content where configured
- It falls back to clean empty states or cached real server responses instead of fake discovery cards
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
SPORTMONKS_API_TOKEN=
SPORTMONKS_BASE_URL=https://api.sportmonks.com/v3/football
SPORTMONKS_PREMIER_LEAGUE_ID=8
BREAKING_NEWS_RSS_URL=
FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=
ADMIN_EMAIL_ALLOWLIST=
ADMIN_UID_ALLOWLIST=
```

If these are blank, the app still starts, but authentication remains unavailable until you add real values and restart the dev server.

`SPORTMONKS_API_TOKEN` is server-only for live scores, fixtures, standings, and match events. Keep it in `.env.local` and in Vercel project environment variables, but do not prefix it with `NEXT_PUBLIC_`.
`SPORTMONKS_BASE_URL` is server-only and usually stays at `https://api.sportmonks.com/v3/football`.
`SPORTMONKS_PREMIER_LEAGUE_ID` is server-only and defaults to `8` for the Premier League.
`BREAKING_NEWS_RSS_URL` is also server-only and optional. If you leave it blank, HabeshaGram defaults to the BBC Sport football RSS feed.
`FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` is admin-only for one-time content seeding. It should never be exposed to the browser or added to Vercel public env vars.
`ADMIN_EMAIL_ALLOWLIST` and `ADMIN_UID_ALLOWLIST` are server-only allowlists for the internal admin workspace.

### football API setup

For local development, add this exact line to `.env.local`:

```env
SPORTMONKS_API_TOKEN=YOUR_SPORTMONKS_TOKEN
SPORTMONKS_BASE_URL=https://api.sportmonks.com/v3/football
SPORTMONKS_PREMIER_LEAGUE_ID=8
```

### One-time Firestore content seed

HabeshaGram includes a one-time admin seed script for Firestore-managed discovery content:

```bash
npm run seed:content
```

What it creates:

- `dailyDebates/{debateId}`
- `curatedVideos/{videoId}`

What it does:

- inserts starter admin-managed debate documents
- inserts starter curated video documents
- uses stable readable document ids
- skips existing docs instead of overwriting them
- logs each `create` or `skip` result clearly

How to set it up locally:

1. Keep your normal Firebase web config in `.env.local`
2. Add the admin credential the script requires
3. Run `npm install` if `firebase-admin` is not installed yet
4. Run `npm run seed:content`

Required admin credential for this script:

1. Create a Firebase service account key JSON in Firebase Console
2. Base64-encode the JSON
3. Add this to `.env.local`:

```env
FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=PASTE_BASE64_SERVICE_ACCOUNT_JSON
ADMIN_EMAIL_ALLOWLIST=you@example.com
ADMIN_UID_ALLOWLIST=
```

The script reads `.env.local` automatically through:

```bash
node --env-file=.env.local scripts/seed-content.mjs
```

Important:

- this is an admin-only local script
- it does not run in the client
- it does not affect the deployed runtime app
- do not expose the service account key in client-side env vars
- do not prefix it with `NEXT_PUBLIC_`
- it does not use Google default credentials or `gcloud auth application-default login`

### Internal admin workspace

HabeshaGram also includes a lightweight internal content workspace:

- `/admin`
- `/admin/videos`
- `/admin/debates`
- `/admin/editorial`
- `/admin/reports`

It manages these live Firestore collections:

- `curatedVideos/{videoId}`
- `dailyDebates/{debateId}`
- `editorialHighlights/{itemId}`

To enable the admin routes locally, add these server-only values to `.env.local`:

```env
FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=PASTE_BASE64_SERVICE_ACCOUNT_JSON
ADMIN_EMAIL_ALLOWLIST=you@example.com,second-admin@example.com
ADMIN_UID_ALLOWLIST=
```

How it works:

- the public app still reads curated content directly from Firestore
- public client writes stay blocked in `firestore.rules`
- admin create/edit/delete actions go through protected Next.js routes under `/api/admin/*`
- those routes verify the signed-in Firebase user with the Admin SDK
- only emails or UIDs in the server allowlist can manage curated content

For Vercel:

1. Open your project in Vercel
2. Go to `Project Settings > Environment Variables`
3. Add `SPORTMONKS_API_TOKEN`
4. Paste your Sportmonks API token as the value
5. Add `SPORTMONKS_BASE_URL`
6. Set it to `https://api.sportmonks.com/v3/football`
7. Add `SPORTMONKS_PREMIER_LEAGUE_ID`
8. Set it to `8` unless you intentionally want a different league
9. Add `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` if you want the internal admin workspace to function on Vercel
10. Add `ADMIN_EMAIL_ALLOWLIST` and/or `ADMIN_UID_ALLOWLIST` for your approved admins
11. Save them for the environments you want, usually:
   - `Production`
   - `Preview`
   - `Development`
12. Redeploy after saving the variables so the server routes can read the new tokens

Important:

- do not rename it to `NEXT_PUBLIC_SPORTMONKS_API_TOKEN`
- do not place the token in client components
- the browser should only call `/api/football/live` and `/api/football/standings`, never the upstream providers directly

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

HabeshaGram's football stack now uses Sportmonks 3.0 behind internal Next.js route handlers:

- live route: `app/api/football/live/route.ts`
- standings route: `app/api/football/standings/route.ts`
- server-only env vars:
  - `SPORTMONKS_API_TOKEN`
  - `SPORTMONKS_BASE_URL`
  - `SPORTMONKS_PREMIER_LEAGUE_ID`
- live coverage endpoints:
  - `GET /livescores/latest`
  - `GET /fixtures/between/{from}/{to}`
- standings endpoints:
  - `GET /standings/live/leagues/{leagueId}`
  - fallback `GET /leagues/{leagueId}?include=currentSeason`
  - fallback `GET /standings/seasons/{seasonId}`
- current provider focus: Premier League fixtures and tracked-club table coverage involving Manchester United, Arsenal, Chelsea, and Manchester City

The browser still polls only the local `/api/football/live` route every 15 seconds on the live page and reads `/api/football/standings` for the table. Sportmonks stays server-side only, and the app falls back to the last successful real payload or a clean empty response if the provider is unavailable.

If `SPORTMONKS_API_TOKEN` is missing or blank, both football routes return friendly empty responses instead of crashing the live page or rendering fake table data.

### Breaking Football News

HabeshaGram's Breaking Now section can read live football stories through an internal Next.js route:

- server route: `app/api/news/breaking/route.ts`
- default provider: BBC Sport football RSS
- optional override env var: `BREAKING_NEWS_RSS_URL`

The route ingests RSS on the server, filters for Manchester United, Arsenal, Chelsea, and Manchester City relevance, caches the last successful payload in memory, and otherwise returns a clear empty/unavailable state instead of fake stories.

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

Clients can submit reports, but should not be able to read the reports collection back from the public app. Approved admins can review and update report status through `/admin/reports`.

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

## Firebase Content Notes

Authentication is already wired. Core social data uses Firebase when configured:

- Firestore for users, posts, comments, likes, saves, notifications, curated content, and reports
- Firebase Storage for image uploads

If Firebase is unconfigured locally, auth-protected actions stay unavailable and the app shows setup messaging instead of pretending the backend is live.

## Local Discovery Content

The homepage still includes a few lightweight curated/configured discovery surfaces:

- `services/discovery-data.ts`
  - `radioStations`: curated Addis Ababa / Ethiopia station cards
- Firestore-managed editorial content:
  - `editorialHighlights`
  - `dailyDebates`
  - `curatedVideos`

That means radio is still a simple curated config layer, while editorial highlights, debates, and videos are now admin-managed live content.

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

### Editorial Highlight Data Shape

Each editorial highlight includes:

- `id`
- `headline`
- `source`
- `summary`
- `category`
- `imageURL`
- `link`
- `featured`
- `publishLabel`
- `teamTag`
- `hashtags`

These are now best managed through `/admin/editorial` instead of editing Firestore documents manually.

## New UI Components

The discovery sections use reusable components:

- `components/discovery/radio-station-card.tsx`
- `components/discovery/radio-carousel.tsx`
- `components/discovery/news-card.tsx`
- `components/discovery/local-news-section.tsx`
- `components/discovery/community-highlights.tsx`
- `components/ui/section-header.tsx`

This keeps the homepage easier to expand later without rewriting the social feed.
