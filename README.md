# DuckDuckGo Automated Support Assistant

A Next.js application that integrates the Zendesk Web Widget messaging interface for automated customer support. The application provides a consent form, embeds the Zendesk widget, and logs user interactions via anonymous pixels.

## Overview

This application serves as a support ticket deflection tool that:

1. **Displays a consent form** before loading the Zendesk script and widget
2. **Renders the Zendesk messaging widget** in embedded mode
3. **Customizes the widget** with DuckDuckGo branding and theme colors
4. **Logs interactions** via anonymous pixel events (clicks, messages, link navigation)
5. **Swaps article links** to point to DuckDuckGo help pages instead of Zendesk articles

## Architecture

### Application Flow

```
User visits page
  ↓
Consent form displayed
  ↓
User clicks "Continue to Chat"
  ↓
Zendesk script loads
  ↓
Widget renders in embedded mode
  ↓
Hooks initialize (link swapping, click handlers, styles)
  ↓
User interacts with widget
  ↓
Events anonymously logged via pixels.js
```

### Key Components

- **`app/page.tsx`** - Main page component managing widget lifecycle and event handlers
- **`components/consent-form/`** - Privacy consent form shown before widget loads
- **`components/footer/`** - Site footer with links and company information

### Zendesk Integration

The application uses three main hooks for Zendesk integration (see [`src/hooks/README.md`](./src/hooks/README.md) for details):

- **`useZendeskSwapArticleLinks`** - Replaces Zendesk article URLs with DuckDuckGo help page URLs
- **`useZendeskClickHandlers`** - Attaches click handlers to buttons and links for anonymous event logging
- **`useZendeskIframeStyles`** - Injects custom CSS styles into the widget iframe

### Utilities

- **`utils/zendesk-iframe.ts`** - Functions to access the Zendesk messaging widget iframe and its document
- **`utils/zendesk-observer.ts`** - Sets up MutationObserver on the Zendesk iframe for DOM change detection
- **`utils/build-article-url.ts`** - Builds complete article URLs using the URL constructor
- **`utils/update-article-links.ts`** - Updates article links in a document based on article ID mapping
- **`utils/get-css-variable.ts`** - Reads CSS variable values from the document root

### Logging

The application uses a custom `pixels.js` script (`public/scripts/pixels.js`) for anonymous logging of events. No PII or device fingerprinting.

- **Page impression** - Fired when page loads (via `PageLoadPixel` component)
- **Button clicks** - logs button interactions (send button, Yes/No buttons)
- **Link clicks** - Logs knowledge base article link clicks

Pixel configuration can be set via `window.PIXEL_CONFIG` before the script loads:

```javascript
window.PIXEL_CONFIG = {
  baseUrl: 'https://improving.duckduckgo.com/t/',
  eventPrefix: 'subscriptionsupport_',
  disableDeduplication: false, // Set to true to allow duplicate pixels
  ...
};
```

#### Pixel schema

- **Page impression** - `subscriptionsupport_impression` - The first time user lands on the page
- **User consent** - `subscriptionsupport_consent` - User provides consent to privacy policy / TOU
- **First message** - `subscriptionsupport_message_first` - The first question / message per session that the user submits
- **Convert to ticket** - `subscriptionsupport_link_ticket` - When the user clicks the "Support form" link to create a ticket
- **Error** - `subscriptionsupport_jsexception` - JavaScript Error object
- **Yes / No clicks**: `subscriptionsupport_helpful_yes` or `subscriptionsupport_helpful_no` - User clicked either "Yes" or "No" button when asked "Was this helpful?"
- **Article link clicks with slug** - `subscriptionsupport_helplink_$slug` - User clicked a help page link (provided by the chat bot). Example: `subscriptionsupport_helplink_getting-started` (The DDG help page slug)

## Getting Started

### Prerequisites

- Node.js (version specified in `.nvmrc`)
- npm or compatible package manager

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

For HTTPS development (useful for testing Zendesk widget):

```bash
npm run dev:tls
```

Open [http://localhost:3000](http://localhost:3000) (or https://localhost:3000 for TLS) to view the application.

### Building

```bash
npm run build
npm start
```

## Configuration

### Common Configuration

Common site configuration is in `src/config/common.ts`:

- **`MAIN_SITE_URL`** - Main DuckDuckGo site URL
- **`SITE_TITLE`** - Application title
- **`HELP_PAGES_BASE_URL`** - Base URL for help pages

### Zendesk Widget

Zendesk configuration is in `src/config/zendesk.ts`:

- **`WEB_WIDGET_KEY`** - Zendesk Web Widget key
- **`ZENDESK_SCRIPT_URL`** - Zendesk script URL
- **`ARTICLE_LINK_MAP`** - Mapping of Zendesk article IDs to help page paths

## Project Structure

```
src/
├── app/                                  # Next.js App Router pages
│   ├── layout.tsx                        # Root layout with header, footer, theme provider
│   └── page.tsx                          # Main page with Zendesk integration
├── components/                           # React components
│   ├── button/                           # Reusable button component
│   ├── consent-form/                     # Privacy consent form
│   ├── footer/                           # Site footer
│   └── page-load-pixel/                  # Page load event dispatcher
├── config/                               # Configuration constants
│   ├── common.ts                         # Common site configuration
│   ├── fonts.ts                          # Font configuration
│   └── zendesk.ts                        # Zendesk widget configuration
├── constants/                            # Application constants
│   ├── breakpoints.ts                    # Responsive breakpoint constants
│   ├── footerLinks.ts                    # Footer link definitions
│   ├── zendesk-selectors.ts              # CSS selectors for Zendesk elements
│   ├── zendesk-styles.ts                 # Custom CSS for Zendesk iframe
│   └── zendesk-timing.ts                 # Timing constants for retries/delays
├── hooks/                                # React hooks
│   ├── README.md                         # Documentation for Zendesk integration hooks
│   ├── use-media-query.ts                # Responsive design hook
│   ├── use-zendesk-click-handlers.ts     # Click event handlers
│   ├── use-zendesk-iframe-styles.ts      # Style injection
│   └── use-zendesk-swap-article-links.ts # Article link swapping
├── types/                                # TypeScript type definitions
│   └── zendesk.d.ts                      # Extended Zendesk Web Widget types
└── utils/                                # Utility functions
    ├── build-article-url.ts              # URL building utility
    ├── get-css-variable.ts               # CSS variable reader
    ├── update-article-links.ts           # Link updating utility
    ├── zendesk-iframe.ts                 # Iframe access utilities
    └── zendesk-observer.ts               # MutationObserver setup utility
```

## Deployment

@todo - jingram
