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
```

If these are blank, the app still starts, but authentication remains unavailable until you add real values and restart the dev server.

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
