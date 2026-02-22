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
User clicks the consent button
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
- **`components/burn-animation/`** - Fullscreen burn animation overlay displayed when clearing conversation data
  - `burn-overlay.tsx` - Overlay wrapper that fetches and displays Lottie animation
  - `burn-animation.tsx` - Lottie animation component wrapper
- **`components/fire-button/`** - Button component for clearing conversation data (icon or button appearance)
- **`components/confirm-dialog/`** - Modal confirmation dialog for clearing conversation data with keyboard navigation and focus management
- **`components/chat-navigation/`** - Navigation links displayed below the chat widget (FAQs, Feedback)
- **`components/main-heading/`** - Main page heading component with consistent branding
- **`components/horizontal-rule/`** - Visual separator component for section divisions
- **`components/new-tab-label/`** - Screen reader label for links that open in new tabs
- **`components/button/`** - Reusable button component with customizable styling
- **`components/page-load-pixel/`** - Component that fires page impression pixel on mount

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
- **`utils/get-slug-from-url.ts`** - Extracts and sanitizes the last path segment from a URL for use in pixel event logging
- **`utils/get-storage-with-expiry.ts`** - Retrieves boolean values from localStorage with date-based expiry (YYYY-MM-DD format)
- **`utils/set-storage-with-expiry.ts`** - Stores boolean values in localStorage with date-based expiry (YYYY-MM-DD format)
- **`utils/delete-storage-keys-by-suffix.ts`** - Deletes localStorage keys matching a suffix pattern
- **`utils/is-browser.ts`** - Checks if code is running in a browser environment (SSR safety)
- **`utils/cleanup-zendesk.ts`** - Cleans up all Zendesk DOM elements, scripts, and global objects when resetting the widget

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
- **Convert to ticket** - `subscriptionsupport_link_ticket` - When the user clicks the "Support Form" link to create a ticket
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

### Testing

The project uses Playwright for testing. See [`src/tests/README.md`](./src/tests/README.md) for comprehensive testing documentation.

```bash
# Run all tests
npm test

# Run with UI mode (interactive)
npm run test:ui

# Run in headed mode (visible browser)
npm run test:headed

# Run only integration tests
npm test -- src/tests/integration/

# Run only unit tests
npm test -- src/tests/unit/
```

**Test Coverage:**

- ✅ 19 unit tests - Pure utility function tests (build-article-url, get-slug-from-url, get-storage-with-expiry)
- ✅ 9 integration tests - Complete end-to-end user flow tests with Zendesk widget mocking

Tests run automatically in CI before deployment.

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
├── app/                                    # Next.js App Router pages
│   ├── layout.tsx                          # Root layout with header, footer, theme provider
│   └── page.tsx                            # Main page with Zendesk integration
├── components/                             # React components
│   ├── burn-animation/                     # Burn animation overlay for clearing data
│   ├── button/                             # Reusable button component
│   ├── chat-navigation/                    # Navigation links below chat widget
│   ├── confirm-dialog/                     # Confirmation dialog modal
│   ├── consent-form/                       # Privacy consent form
│   ├── error-boundary/                     # Error boundary component
│   ├── fire-button/                        # Clear conversation data button
│   ├── footer/                             # Site footer
│   ├── horizontal-rule/                    # Visual separator component
│   ├── main-heading/                       # Main page heading
│   ├── new-tab-label/                      # Screen reader label for new tab links
│   └── page-load-pixel/                    # Page load event dispatcher
├── config/                                 # Configuration constants
│   ├── common.ts                           # Common site configuration
│   ├── fonts.ts                            # Font configuration
│   └── zendesk.ts                          # Zendesk widget configuration
├── constants/                              # Application constants
│   ├── breakpoints.ts                      # Responsive breakpoint constants
│   ├── footerLinks.ts                      # Footer link definitions
│   ├── test-ids.ts                         # Test ID constants for Playwright tests
│   ├── theme.ts                            # Theme constants and types
│   ├── zendesk-selectors.ts                # CSS selectors for Zendesk elements
│   ├── zendesk-styles.ts                   # Custom CSS for Zendesk iframe
│   └── zendesk-timing.ts                   # Timing constants for retries/delays
├── contexts/                               # React contexts
│   └── theme-context.tsx                   # Theme context provider (system preference)
├── hooks/                                  # React hooks
│   ├── README.md                           # Documentation for Zendesk integration hooks
│   ├── use-media-query.ts                  # Responsive design hook
│   ├── use-zendesk-click-handlers.ts       # Click event handlers
│   ├── use-zendesk-iframe-styles.ts        # Style injection
│   └── use-zendesk-swap-article-links.ts   # Article link swapping
├── reducers/                               # State reducers
│   └── widget-reducer.ts                   # Widget lifecycle state reducer (zendeskReady, loadWidget, firstMessageSent)
├── tests/                                  # Test files
│   ├── fixtures/                           # Test fixtures and mocks
│   │   └── zendesk-mock.js                 # Zendesk widget mock for testing
│   ├── integration/                        # Integration tests
│   │   └── complete-flow.test.ts           # End-to-end user flow tests (9 tests)
│   ├── unit/                               # Unit tests
│   │   ├── build-article-url.test.ts       # URL building utility tests (3 tests)
│   │   ├── get-slug-from-url.test.ts       # URL slug extraction tests (3 tests)
│   │   └── get-storage-with-expiry.test.ts # Storage expiry utility tests (13 tests)
│   └── README.md                           # Testing documentation
├── icons/                                  # SVG icon assets
│   ├── logo-horizontal-dark.svg            # DuckDuckGo logo (dark theme)
│   ├── logo-horizontal-light.svg           # DuckDuckGo logo (light theme)
│   ├── logo-stacked-dark.svg               # DuckDuckGo stacked logo (dark theme)
│   └── logo-stacked-light.svg              # DuckDuckGo stacked logo (light theme)
├── types/                                  # TypeScript type definitions
│   ├── lottie.ts                           # Lottie animation type definitions
│   └── zendesk.d.ts                        # Extended Zendesk Web Widget types
└── utils/                                  # Utility functions
    ├── build-article-url.ts                # URL building utility
    ├── delete-storage-keys-by-suffix.ts    # localStorage key deletion by suffix
    ├── get-css-variable.ts                 # CSS variable reader
    ├── get-slug-from-url.ts                # URL slug extraction and sanitization
    ├── get-storage-with-expiry.ts          # localStorage retrieval with date expiry
    ├── is-browser.ts                       # Browser environment detection (SSR safety)
    ├── set-storage-with-expiry.ts          # localStorage storage with date expiry
    ├── cleanup-zendesk.ts                  # Zendesk widget cleanup utility
    ├── update-article-links.ts             # Link updating utility
    ├── zendesk-iframe.ts                   # Iframe access utilities
    └── zendesk-observer.ts                 # MutationObserver setup utility
```

## Deployment

This application is configured to deploy to GitHub Pages via GitHub Actions.

### GitHub Environment Variables

The build process uses the `CUSTOM_DOMAIN` environment variable to determine if the app is being deployed to a custom domain. Set this variable in your GitHub repository:

1. Go to your GitHub repository
2. Click on **Settings** (top navigation)
3. In the left sidebar, expand **Secrets and variables**
4. Click on **Actions**
5. Click on the **Variables** tab (not Secrets)
6. Click **New repository variable**
7. Set:
   - **Name**: `CUSTOM_DOMAIN`
   - **Value**: `true` (if using a custom domain) or `false` (if using github.io URL)
8. Click **Add variable**

### Manual Deployment

The workflow automatically runs on pushes to the `main` branch, but you can also trigger it manually:

1. Go to your GitHub repository
2. Click on the **Actions** tab
3. In the left sidebar, click on **Deploy**
4. On the right side, click the **Run workflow** button
5. Select the branch (typically `main`)
6. Click the green **Run workflow** button

The deployment will build the application, run tests, and deploy to GitHub Pages.
