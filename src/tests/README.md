# Testing Guide

## Overview

This project uses **Playwright** for all testing needs, with a focused test suite covering utility functions and comprehensive integration tests.

## Test Results

```bash
✅ 7 passing tests (15s)
  - 3 unit tests (pure utility functions)
  - 4 integration tests (complete user flows)
```

## Architecture

### Test Organization

```
src/tests/
├── unit/                           # Fast, isolated unit tests
│   └── build-article-url.test.ts   # Pure function tests
├── integration/                    # End-to-end integration tests
│   └── complete-flow.test.ts       # 🎯 COMPREHENSIVE FLOW TEST
└── fixtures/
    └── zendesk-mock.js             # Realistic Zendesk widget mock
```

## 🎯 Comprehensive Integration Test

The main integration test (`complete-flow.test.ts`) provides **high confidence** for CI deployment by testing the complete user journey.

### What It Tests

**1. ✅ Iframe Rendering**

- Clicks "Continue to Chat" button
- Verifies iframe renders inside `#messaging-container`
- Confirms both web widget and messaging iframes are attached

**2. ✅ Link Swapping with ARTICLE_LINK_MAP**

- Waits for `useZendeskSwapArticleLinks` hook to activate
- Uses same selector logic as hooks: `a[aria-label^="View article:"]` (from `ZENDESK_ARTICLE_LINK_SELECTOR`)
- Verifies article links are swapped using your configuration:
  - "Subscribing Outside the United States" (44195025991699)
    → `/privacy-pro/using-privacy-pro-outside-us`
  - "Getting Started" (44195037080467)
    → `/privacy-pro/getting-started`
  - "What is DuckDuckGo Personal Information Removal?" (44195052225555)
    → `/privacy-pro/personal-information-removal/getting-started`
- Confirms URLs changed from `duckduckgo-85720.zendesk.com` to `duckduckgo.com/duckduckgo-help-pages`

**3. ✅ Message Input & Send**

- Types message in `#composer-input` textarea
- Verifies send button appears when typing
- Clicks send button
- Confirms message was sent successfully

**4. ✅ Pixel Event Tracking**

- Intercepts network calls to `https://improving.duckduckgo.com/t/*`
- Verifies pixel events fire correctly:
  - `subscriptionsupport_consent` - when "Continue to Chat" clicked
  - `subscriptionsupport_impression` - when widget loads
  - `subscriptionsupport_message_first` - when first message sent
  - `subscriptionsupport_helplink_getting-started` - when article link clicked
  - `subscriptionsupport_link_ticket` - when Support form link clicked
  - `subscriptionsupport_helpful_yes` - when Yes button clicked

**5. ✅ Custom Styles Injection**

- Verifies `useZendeskIframeStyles` hook injects custom styles
- Confirms `<style data-zendesk-custom-styles="true">` exists in iframe

### Example Test Output

```
🎉 Complete flow test passed!
   ✅ Iframe rendered in messaging-container
   ✅ 3 article links swapped correctly
   ✅ Message entered in chatbot
   ✅ Message sent successfully
   ✅ Article link clicked
   ✅ Support form link clicked
   ✅ Yes button clicked
   ✅ 6+ pixel events fired to improving.duckduckgo.com

📊 Pixel events:
   - https://improving.duckduckgo.com/t/subscriptionsupport_consent
   - https://improving.duckduckgo.com/t/subscriptionsupport_impression
   - https://improving.duckduckgo.com/t/subscriptionsupport_message_first
   - https://improving.duckduckgo.com/t/subscriptionsupport_helplink_getting-started
   - https://improving.duckduckgo.com/t/subscriptionsupport_link_ticket
   - https://improving.duckduckgo.com/t/subscriptionsupport_helpful_yes
```

## Running Tests

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

# Run specific test file
npm test -- src/tests/integration/complete-flow.test.ts
```

## CI/CD Ready

These tests are designed for CI environments:

✅ **No external dependencies** - Zendesk is mocked
✅ **Deterministic** - Uses realistic mock with controlled timing
✅ **Fast** - Completes in ~15 seconds
✅ **Reliable** - No flaky network calls or race conditions
✅ **Comprehensive** - Tests complete user journey end-to-end

### CI Configuration

Tests work in any CI environment:

- GitHub Actions
- GitLab CI
- CircleCI
- Jenkins

The `playwright.config.ts` is already configured for CI:

- Automatic Next.js server startup
- 2 retries on failure
- Sequential execution (1 worker) for stability
- HTML reporter for test results

### Example CI Integration

```yaml
# GitHub Actions
- name: Install dependencies
  run: npm ci

- name: Run tests
  run: npm test

- name: Upload test report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Selector Strategy - Matching Hook Logic

The integration tests use the **exact same approach** as the production hooks to ensure tests accurately reflect real behavior.

### Article Link Detection

**Hook implementation** (from `src/utils/update-article-links.ts`):

```typescript
// Uses ZENDESK_ARTICLE_LINK_SELECTOR from src/constants/zendesk-selectors.ts
const anchorElements = doc.querySelectorAll<HTMLAnchorElement>(
  'a[aria-label^="View article:"]', // Selects all article links
);

// Loops through each link to find matching article IDs in href
anchorElements.forEach((anchorEl) => {
  const href = anchorEl.getAttribute('href');
  const matchedId = articleIds.find((id) => href.includes(id));
  if (matchedId && ARTICLE_LINK_MAP[matchedId]) {
    anchorEl.setAttribute('href', buildArticleUrl(ARTICLE_LINK_MAP[matchedId]));
  }
});
```

**Test implementation** (from `src/tests/integration/complete-flow.test.ts`):

```typescript
// Get all article links using the same selector as the hook
const articleLinks = await iframe
  .locator('a[aria-label^="View article:"]')
  .all();

// Iterate through links to verify they were swapped correctly
for (const link of articleLinks) {
  const href = await link.getAttribute('href');
  if (!href) continue;

  // Check if href contains the swapped path from ARTICLE_LINK_MAP
  if (href.includes('privacy-pro/using-privacy-pro-outside-us')) {
    article1Href = href;
  }
  // ... etc
}
```

**Why this matters:**

- Tests use the same selector (`a[aria-label^="View article:"]`) as the hook
- Tests iterate through all links just like the hook does
- Tests verify the outcome after the hook has swapped the URLs
- If the hook's selector changes, tests will fail, alerting you to update both
- Consistent approach makes tests maintainable and predictable

## Realistic Mocking Strategy

### Zendesk Mock (`zendesk-mock.js`)

Implements the real Zendesk Web Widget API:

```javascript
// API methods
zE('messenger', 'render', { mode: 'embedded', widget: { targetElement: '#id' } })
zE('messenger:on', 'unreadMessages', callback)
zE('messenger:set', 'cookies', 'functional')
zE('messenger:set', 'customization', { theme: {...} })
```

Creates actual iframe structure:

- Web widget iframe with `data-product="web_widget"` attribute
- Messaging iframe with ID `#zendesk-messaging-iframe`
- Realistic DOM structure matching production Zendesk widget

Includes realistic content:

- **Original article URLs** (before hook swapping) from `help.duckduckgo.com`
- Real article IDs from your `ARTICLE_LINK_MAP` configuration
- Composer textarea (`#composer-input`) and send button
- Yes/No feedback buttons for testing click handlers
- Bot messages and conversation structure

This ensures tests verify actual hook behavior, not simulations.

## Test Types Explained

### 1. Unit Tests (`src/tests/unit/`)

**Purpose:** Test pure utility functions in isolation
**Speed:** Very fast (< 100ms per test)
**Approach:** Direct imports, no browser needed

```typescript
import { buildArticleUrl } from '@/utils/build-article-url';

test('should build URL correctly', () => {
  expect(buildArticleUrl('/path')).toBe('https://...');
});
```

**Coverage:**

- `buildArticleUrl()` - URL construction with various path formats
- Edge cases: leading/trailing slashes, empty paths, multiple segments

### 2. Integration Tests (`src/tests/integration/`)

**Purpose:** Test complete user flows with realistic mocks
**Speed:** Moderate (~3-5s per test)
**Approach:** Full browser automation with mocked Zendesk widget

```typescript
test('complete flow', async ({ page }) => {
  // Mock Zendesk
  const mockScript = readFileSync(
    join(__dirname, '../fixtures/zendesk-mock.js'),
    'utf-8',
  );
  await page.route('https://static.zdassets.com/ekr/snippet.js*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: mockScript,
    });
  });

  // Test the flow
  await page.goto('/');
  await page.click('[data-testid="load-button"]');

  // Verify iframe renders
  await expect(page.locator('#messaging-container iframe')).toBeVisible();

  // Verify hooks activated
  const iframe = page.frameLocator('#zendesk-messaging-iframe');
  const link = iframe.locator('a[aria-label*="Article"]');
  await expect(link).toHaveAttribute('href', /duckduckgo\.com/);
});
```

**Coverage:**

- Complete user journey: consent → script load → iframe render → hooks → interactions
- Link swapping via `useZendeskSwapArticleLinks` hook
- Click tracking via `useZendeskClickHandlers` hook
- Style injection via `useZendeskIframeStyles` hook
- Pixel event tracking to `improving.duckduckgo.com`
- Message sending and user interactions

## Writing New Tests

### Adding a Unit Test

For pure utility functions:

```typescript
import { test, expect } from '@playwright/test';
import { myUtility } from '@/utils/my-utility';

test.describe('myUtility', () => {
  test('should handle input correctly', () => {
    expect(myUtility('input')).toBe('expected output');
  });

  test('should handle edge cases', () => {
    expect(myUtility('')).toBe('default');
    expect(myUtility(null)).toBe('fallback');
  });
});
```

### Adding an Integration Test

For testing user flows with Zendesk:

```typescript
import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

test('new user flow', async ({ page }) => {
  // Load Zendesk mock
  const mockScript = readFileSync(
    join(__dirname, '../fixtures/zendesk-mock.js'),
    'utf-8',
  );

  await page.route('https://static.zdassets.com/ekr/snippet.js*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: mockScript,
    });
  });

  // Optionally intercept pixel events
  const pixelRequests: string[] = [];
  await page.route('https://improving.duckduckgo.com/t/*', (route) => {
    pixelRequests.push(route.request().url());
    route.fulfill({ status: 200, body: '' });
  });

  // Test your flow
  await page.goto('/');

  // ... your test steps ...

  // Verify results
  expect(pixelRequests.length).toBeGreaterThan(0);
});
```

## Troubleshooting

### Tests are slow

- Check for excessive `page.waitForTimeout()` calls
- Use `waitForSelector()` or `waitFor()` instead of arbitrary timeouts
- Unit tests should be < 100ms, integration tests < 10s per test

### Iframe not accessible

- Use `page.frameLocator('#zendesk-messaging-iframe')` to access iframe content
- Ensure iframe has loaded: `await page.waitForSelector('#iframe-id')`
- Verify the Zendesk mock is creating the iframe structure correctly

### Link swapping not working in tests

- Hooks need time to activate (~1500ms total):
  - `zendeskReady` state set after 500ms (ZENDESK_READY_DELAY_MS)
  - `unreadMessages` callback fires after 200ms in mock
  - Hook processes links after both conditions met
- Check article IDs in mock match keys in `ARTICLE_LINK_MAP`
- Verify iframe document is accessible

### Pixel events not firing

- Check route pattern matches: `https://improving.duckduckgo.com/t/*`
- Verify click handlers have time to attach (~1500ms delay)
- Ensure callbacks (`onButtonClick`, `onLinkClick`) are being invoked
- Check browser console output for errors

### CI failures

- Ensure `CI` environment variable is set (enables retry logic)
- Verify Next.js server starts within 60 seconds
- Check all dependencies are installed: `npm ci`
- Review HTML report: `playwright-report/index.html`

## Best Practices

### ✅ DO:

- Test complete user flows in integration tests
- Use realistic mocks based on production behavior
- Verify actual hook effects, not simulated behavior
- Intercept and verify network requests (pixel events)
- Use the same selectors as your hooks (e.g., `ZENDESK_ARTICLE_LINK_SELECTOR`) for consistency
- Use `data-testid` attributes for stable element selection
- Wait for specific conditions with `waitForSelector()` instead of arbitrary timeouts
- Test in the real Next.js app environment

### ❌ DON'T:

- Don't recreate hook logic in tests - test the real hooks
- Don't use excessive `waitForTimeout()` - prefer event-based waiting
- Don't mock what you're testing - only mock external dependencies
- Don't test implementation details - test user-visible behavior
- Don't use brittle CSS class selectors - use semantic selectors
- Don't duplicate test setup - use shared fixtures and helpers

## Maintenance

### Adding New Article Links

When you add articles to `ARTICLE_LINK_MAP`:

1. **Update the map** in `src/config/zendesk.ts`:

   ```typescript
   export const ARTICLE_LINK_MAP: Record<string, string> = {
     '12345678901234': '/new-article-path',
     // ...
   };
   ```

2. **Add to mock** in `src/tests/fixtures/zendesk-mock.js`:

   ```javascript
   <a
     aria-label="View article: 'New Article Title'"
     href="https://help.duckduckgo.com/articles/12345678901234-new-article"
     target="_blank"
     rel="noopener noreferrer"
   >
     <span>View article</span>
   </a>
   ```

3. **Add test verification** in `src/tests/integration/complete-flow.test.ts`:

   ```typescript
   // Add to the for loop that iterates through article links
   for (const link of articleLinks) {
     const href = await link.getAttribute('href');
     if (!href) continue;

     // Check for your new article's swapped path
     if (href.includes('new-article-path')) {
       newArticleHref = href;
     }
   }

   // Then verify
   expect(newArticleHref).toBeTruthy();
   expect(newArticleHref).toContain(
     'duckduckgo.com/duckduckgo-help-pages/new-article-path',
   );
   ```

### Adding New Pixel Events

When you add pixel tracking:

1. **Add pixel call** in your component (e.g., `src/app/page.tsx`):

   ```typescript
   window.firePixelEvent?.('new_event_name');
   ```

2. **Add test verification** in `src/tests/integration/complete-flow.test.ts`:
   ```typescript
   const newEvent = pixelRequests.find((url) => url.includes('new_event_name'));
   expect(newEvent).toBeTruthy();
   expect(newEvent).toContain('https://improving.duckduckgo.com/t/');
   ```

### Testing New Hooks

When you create a new hook that modifies the widget:

1. **Create a new test** in `complete-flow.test.ts`:

   ```typescript
   test('should verify new hook behavior', async ({ page }) => {
     // Setup (mock, goto, click button)
     // Wait for hooks to activate
     await page.waitForTimeout(1500);

     // Verify hook's DOM changes
     const result = await page.evaluate(() => {
       const iframe = document.querySelector('#zendesk-messaging-iframe');
       const doc = iframe?.contentDocument;
       // Check for hook's modifications
       return doc?.querySelector('.hook-added-element') !== null;
     });

     expect(result).toBe(true);
   });
   ```

## Key Files

**Tests:**

- `src/tests/integration/complete-flow.test.ts` - Comprehensive integration tests (4 tests)
- `src/tests/unit/build-article-url.test.ts` - Unit tests for utilities (3 tests)

**Fixtures:**

- `src/tests/fixtures/zendesk-mock.js` - Realistic Zendesk Web Widget mock

**Configuration:**

- `playwright.config.ts` - Playwright test configuration
- `package.json` - Test scripts and dependencies

## Understanding the Test Flow

### How Integration Tests Work

1. **Mock Setup**

   ```typescript
   // Load the mock script
   const mockScript = readFileSync('zendesk-mock.js', 'utf-8');

   // Intercept Zendesk CDN request
   await page.route('https://static.zdassets.com/ekr/snippet.js*', (route) => {
     route.fulfill({ body: mockScript });
   });
   ```

2. **User Action**

   ```typescript
   // Navigate and click button
   await page.goto('/');
   await page.getByTestId('load-zd-button').click();
   ```

3. **Widget Renders**

   ```typescript
   // Mock creates iframes
   await page.waitForSelector('#messaging-container iframe');
   ```

4. **Hooks Activate**

   ```typescript
   // Wait for hooks (zendeskReady + callbacks)
   await page.waitForTimeout(1500);
   ```

5. **Verify Results**
   ```typescript
   // Check hook effects
   const iframe = page.frameLocator('#zendesk-messaging-iframe');
   const link = iframe.locator('a[aria-label*="Article"]');
   await expect(link).toHaveAttribute('href', /duckduckgo\.com/);
   ```

### Why 1500ms Wait?

The integration tests wait 1500ms for hooks to activate because:

- **500ms**: `zendeskReady` state set in `page.tsx` (ZENDESK_READY_DELAY_MS)
- **200ms**: Mock fires `unreadMessages` callback
- **~500ms**: Hook processes links and attaches handlers
- **+300ms**: Buffer for any timing variations

This ensures hooks have fully activated before verification.

## Questions?

For issues or questions:

1. Check this README for guidance
2. Review test examples in `src/tests/`
3. See Playwright documentation: https://playwright.dev
4. Check test output and HTML reports

---

**Summary:** A focused test suite providing high confidence for CI deployment. Tests the complete user journey with realistic mocks, verifying iframe rendering, link swapping, message sending, and pixel tracking.
