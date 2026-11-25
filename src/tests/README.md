# Testing Guide

This project uses **Playwright** for testing.

## Test Organization

```
src/tests/
└── integration/
    └── sunset.test.ts    # Sunset notice and redirect
```

## What the Sunset Tests Cover

- The notice heading and Subscription Support link render, and no chat window is present
- The page redirects to Subscription Support after `SUNSET_REDIRECT_SECONDS`, and not before
- "Stay on this page" cancels the redirect and announces the cancellation
- Leftover chat keys are deleted from localStorage while unrelated keys stay
- The page loads cleanly when no chat keys exist and when the browser blocks storage

The tests use Playwright's clock API (`page.clock`) to fast-forward the countdown, and intercept the redirect URL so tests never leave the local site.

## Running Tests

```bash
# Run all tests
npm test

# Run with UI mode (interactive)
npm run test:ui

# Run in headed mode (visible browser)
npm run test:headed
```

Playwright starts the Next.js dev server automatically (see `playwright.config.ts`).
