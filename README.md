# DuckDuckGo Automated Support Assistant (Sunset)

This service has been sunsetted. The site now serves a single page stating that DuckDuckGo Automated Support Chat is no longer available, then redirects visitors to [DuckDuckGo Subscription Support](https://duckduckgo.com/subscription-support).

## Overview

When a user visits the homepage they see the DuckDuckGo logo, background, footer, and a sunset notice. The notice:

1. Explains that the service is no longer available
2. Links to DuckDuckGo Subscription Support in case the user is not redirected
3. Counts down and redirects to Subscription Support after 20 seconds
4. Offers a "Stay on this page" button that cancels the redirect

### Accessibility

- **20 second delay** - Matches the WCAG 2.2.1 (Timing Adjustable) minimum for a warned timeout
- **Cancelable** - Users can stop the redirect with a single action
- **No meta refresh** - The redirect is scripted so it can be canceled (WCAG failure F41 covers timed meta refresh)
- **Always reachable** - The Subscription Support link works with JavaScript disabled
- **Quiet countdown** - The per-second countdown is not a live region, so screen readers are not interrupted every second. Only the cancellation is announced.

### Key Components

- **`app/page.tsx`** - Homepage that renders the sunset notice
- **`components/sunset-notice/`** - Sunset message, countdown, redirect, and cancel button
- **`components/footer/`** - Site footer with links and company information
- **`components/new-tab-label/`** - Screen reader label for links that open in new tabs
- **`components/button/`** - Reusable button component with customizable styling
- **`components/page-load-pixel/`** - Component that fires the page impression pixel on mount

### Logging

The application uses a custom `pixels.js` script (`public/scripts/pixels.js`) for anonymous logging. No PII or device fingerprinting.

- **Page impression** - `subscriptionsupport_impression` - Fired when the page loads (via the `PageLoadPixel` component)

## Getting Started

### Prerequisites

- Node.js (version specified in `.node-version`)
- npm or compatible package manager

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Building

```bash
npm run build
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run with UI mode (interactive)
npm run test:ui

# Run in headed mode (visible browser)
npm run test:headed
```

See [`src/tests/README.md`](./src/tests/README.md) for details. Tests run automatically in CI before deployment.

## Configuration

Site configuration is in `src/config/common.ts`:

- **`MAIN_SITE_URL`** - Main DuckDuckGo site URL
- **`SITE_TITLE`** - Application title
- **`SUNSET_REDIRECT_URL`** - Where users are redirected
- **`SUNSET_REDIRECT_SECONDS`** - Delay before redirecting (keep at 20 or more for accessibility)
- **`SUNSET_HEADING`** - Sunset notice heading

## Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout with header, footer, theme provider
│   └── page.tsx                # Homepage with sunset notice
├── components/                 # React components
│   ├── button/                 # Reusable button component
│   ├── footer/                 # Site footer
│   ├── new-tab-label/          # Screen reader label for new tab links
│   ├── page-load-pixel/        # Page load event dispatcher
│   └── sunset-notice/          # Sunset message and redirect
├── config/                     # Configuration constants
│   ├── common.ts               # Common site configuration
│   └── fonts.ts                # Font configuration
├── constants/                  # Application constants
│   ├── footerLinks.ts          # Footer link definitions
│   ├── test-ids.ts             # Test ID constants for Playwright tests
│   └── theme.ts                # Theme constants and types
├── contexts/                   # React contexts
│   └── theme-context.tsx       # Theme context provider (system preference)
├── icons/                      # SVG icon assets
│   └── logo-horizontal-light.svg
├── tests/                      # Test files
│   ├── integration/
│   │   └── sunset.test.ts      # Sunset notice and redirect tests
│   └── README.md               # Testing documentation
└── types/                      # TypeScript type definitions
    └── pixels.d.ts             # Window globals set by pixels.js
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
