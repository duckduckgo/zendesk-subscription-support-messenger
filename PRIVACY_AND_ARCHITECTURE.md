# Privacy & Architecture Documentation

## Privacy-Preserving Implementation

This application follows privacy-first principles, matching the static-pages repository approach.

### ✅ Privacy Features

1. **No Cookies for Locale**
   - Locale is determined from Accept-Language header only
   - No cookies set for locale persistence
   - No cross-site tracking
   - No URL-based locale routing

2. **Accept-Language Header Usage**
   - Used for locale detection on each request
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

### Server Rendering Evidence

1. **Homepage Component** (`src/app/page.tsx`)
   - ✅ No `'use client'` directive
   - ✅ Async function (server-side data fetching)
   - ✅ Translations loaded server-side
   - ✅ Server-rendered on each request

2. **Layout Component** (`src/app/layout.tsx`)
   - ✅ Server component (no `'use client'`)
   - ✅ Translations loaded server-side
   - ✅ Metadata generated server-side
   - ✅ Locale detected from Accept-Language header

3. **Benefits**
   - HTML sent directly from server
   - Translations included in initial HTML
   - Better SEO (content in HTML)
   - Faster initial page load
   - Reduced client bundle size

## Pattern Compliance with static-pages

### ✅ Matches static-pages Patterns

1. **Locale Detection**
   - ✅ Accept-Language header based detection
   - ✅ No cookies for locale
   - ✅ No URL-based locale routing

2. **Translation Loading**
   - ✅ Same JSON file structure
   - ✅ Same translation format (message/description/namespace)
   - ✅ Server-side loading
   - ✅ Same TranslationsProvider pattern

3. **Privacy**
   - ✅ No cookies for locale
   - ✅ No user tracking
   - ✅ Client-side preferences only (theme)

## Architecture Summary

### File Structure

```
src/
├── app/
│   ├── layout.tsx         # Root layout - loads translations based on Accept-Language
│   └── page.tsx           # Homepage - server component
├── components/            # Client components
├── contexts/              # React contexts (Theme)
├── providers/             # Providers (Translations)
├── utils/                 # Utilities (i18n, load-translations, detect-locale)
└── proxy.ts               # Request proxy (minimal)

src/translations/          # Translation files
├── en-US.json            # English translations
├── es-ES.json            # Spanish translations
├── pl-PL.json            # Polish translations
└── ru-RU.json            # Russian translations
```

### Data Flow

1. **Initial Request**
   - User visits any route
   - Server component reads `Accept-Language` header
   - Locale detected from header
   - No cookie set
   - No URL parsing

2. **Page Load**
   - Server component loads translations for detected locale
   - HTML sent with translations included
   - Client hydrates with React

3. **Subsequent Requests**
   - Locale always detected from Accept-Language header
   - No URL-based routing
   - Server-side locale detection on each request

### Privacy Guarantees

- ✅ No cookies for locale
- ✅ No server-side storage of user preferences
- ✅ No tracking or analytics
- ✅ Accept-Language used only for redirect (not stored)
- ✅ Theme preference: client-side only (`localStorage`)
