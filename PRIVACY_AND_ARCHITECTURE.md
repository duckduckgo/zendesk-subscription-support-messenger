# Privacy & Architecture Documentation

## Privacy-Preserving Implementation

This application follows privacy-first principles, matching the static-pages repository approach.

### ✅ Privacy Features

1. **No Cookies for Locale**
   - Locale is determined from URL path only (`/[locale]/...`)
   - No cookies set for locale persistence
   - No cross-site tracking
   - Matches static-pages pattern exactly

2. **Accept-Language Header Usage**
   - Used only for initial redirect (first visit to `/`)
   - Not stored, logged, or tracked
   - Standard HTTP header (RFC 7231)
   - Privacy-preserving: header is ephemeral and not persisted

3. **Theme Storage**
   - Stored in `localStorage` (client-side only)
   - Never sent to server
   - No tracking or analytics
   - User's preference stays on their device

4. **No User Tracking**
   - No analytics
   - No data collection
   - No server-side logging of user preferences
   - No cross-site tracking mechanisms

## Server Rendering Verification

### Build Output Confirmation

```
Route (app)
┌ ○ /
├ ○ /_not-found
└ ƒ /[locale]

ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

### Server Rendering Evidence

1. **Homepage Component** (`src/app/[locale]/page.tsx`)
   - ✅ No `'use client'` directive
   - ✅ Async function (server-side data fetching)
   - ✅ Translations loaded server-side
   - ✅ Build shows: `ƒ /[locale]` (function route = server-rendered)

2. **Layout Component** (`src/app/[locale]/layout.tsx`)
   - ✅ Server component (no `'use client'`)
   - ✅ Translations loaded server-side
   - ✅ Metadata generated server-side

3. **Benefits**
   - HTML sent directly from server
   - Translations included in initial HTML
   - Better SEO (content in HTML)
   - Faster initial page load
   - Reduced client bundle size

## Pattern Compliance with static-pages

### ✅ Matches static-pages Patterns

1. **Locale Routing**
   - ✅ URL-based locale (`/[locale]/...`)
   - ✅ No cookies for locale
   - ✅ Locale from route parameters

2. **Translation Loading**
   - ✅ Same JSON file structure
   - ✅ Same translation format (message/description/namespace)
   - ✅ Server-side loading
   - ✅ Same TranslationsProvider pattern

3. **Privacy**
   - ✅ No cookies for locale
   - ✅ No user tracking
   - ✅ Client-side preferences only (theme)

### Differences (App Router vs Pages Router)

1. **Routing**
   - App Router: `[locale]` folder structure
   - Pages Router: `pages/[locale]/...` structure
   - Both: Locale from URL path

2. **Data Loading**
   - App Router: Server components with async/await
   - Pages Router: `getStaticProps` / `getServerSideProps`
   - Both: Server-side translation loading

3. **Middleware**
   - App Router: `middleware.ts` file
   - Pages Router: No middleware (handled in `getStaticPaths`)
   - Both: Locale detection from URL

## Architecture Summary

### File Structure

```
src/
├── app/
│   ├── [locale]/          # Locale-specific routes
│   │   ├── layout.tsx     # Server component - loads translations
│   │   └── page.tsx       # Server component - homepage
│   ├── layout.tsx         # Root layout (minimal)
│   └── page.tsx            # Root redirect
├── components/            # Client components
├── contexts/              # React contexts (Theme)
├── providers/             # Providers (Translations)
├── utils/                 # Utilities (i18n, load-translations)
└── middleware.ts          # Locale detection & routing

text/                      # Translation files
└── en-US.json            # English translations
```

### Data Flow

1. **Initial Request**
   - User visits `/`
   - Middleware reads `Accept-Language` header
   - Redirects to `/en-US` (or detected locale)
   - No cookie set

2. **Page Load**
   - Server component loads translations
   - HTML sent with translations included
   - Client hydrates with React

3. **Navigation**
   - Locale always from URL path
   - No server round-trip for locale detection
   - Fast client-side navigation

### Privacy Guarantees

- ✅ No cookies for locale
- ✅ No server-side storage of user preferences
- ✅ No tracking or analytics
- ✅ Accept-Language used only for redirect (not stored)
- ✅ Theme preference: client-side only (`localStorage`)
