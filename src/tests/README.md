# Testing Guide

## Overview

This project uses **Playwright** for all testing needs, with a focused test suite covering utility functions and comprehensive integration tests.

## Test Results

```bash
✅ All tests passing
  - Unit tests
    - build-article-url.test.ts
    - get-slug-from-url.test.ts
    - get-storage-with-expiry.test.ts
    - parse-legal-notice.test.ts
  - Integration tests (complete user flows)
    - complete-flow.test.ts
```

## Architecture

### Test Organization

```
src/tests/
├── unit/                               # Fast, isolated unit tests
│   ├── build-article-url.test.ts       # URL building utility tests
│   ├── get-slug-from-url.test.ts       # URL slug extraction tests
│   ├── get-storage-with-expiry.test.ts # Storage expiry utility tests
│   └── parse-legal-notice.test.ts      # Legal notice parsing tests
├── integration/                        # End-to-end integration tests
│   └── complete-flow.test.ts           # COMPREHENSIVE FLOW TEST
└── fixtures/
    ├── zendesk-mock.js                 # Realistic Zendesk widget mock
    ├── mock-document-html.ts           # Static HTML mock from Word document
    └── mock-legal-notice-content.ts    # Static mock of parsed legal notice content
```

## 🎯 Comprehensive Integration Test

The main integration test (`complete-flow.test.ts`) provides **high confidence** for CI deployment by testing the complete user journey.

### What It Tests

**1. ✅ Iframe Rendering**

- Clicks the consent button
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

**4. ✅ Pixel Event Logging**

- Intercepts network calls to `https://improving.duckduckgo.com/t/*`
- Verifies pixel events fire correctly:
  - `subscriptionsupport_consent` - when the consent button is clicked
  - `subscriptionsupport_impression` - when widget loads
  - `subscriptionsupport_message_first` - when first message sent
  - `subscriptionsupport_helplink_getting-started` - when article link clicked
  - `subscriptionsupport_link_ticket` - when Support Form link clicked
  - `subscriptionsupport_helpful_yes` - when Yes button clicked

**5. ✅ Custom Styles Injection**

- Verifies `useZendeskIframeStyles` hook injects custom styles
- Confirms `<style data-zendesk-custom-styles="true">` exists in iframe

**6. ✅ Clear Conversation Data Flow**

- Tests the "Clear Conversation Data" button functionality
- Verifies confirmation dialog appears with proper content
- Tests dialog cancellation (storage preserved, dialog closes)
- Confirms storage (localStorage/sessionStorage) is cleared on confirmation
- Verifies user returns to consent screen after clearing
- Tests dialog keyboard interactions (Escape key, Tab navigation, focus management)
- Tests overlay click to close dialog
- Verifies widget is not rendered after state reset
- Verifies button visibility based on widget state

### Example Test Output

```
🎉 Complete flow test passed!
   ✅ Iframe rendered in messaging-container
   ✅ 3 article links swapped correctly
   ✅ Message entered in chatbot
   ✅ Message sent successfully
   ✅ Article link clicked
   ✅ Support Form link clicked
   ✅ Yes button clicked
   ✅ 6+ pixel events fired to improving.duckduckgo.com

📊 Pixel events:
   - https://improving.duckduckgo.com/t/subscriptionsupport_consent
   - https://improving.duckduckgo.com/t/subscriptionsupport_impression
   - https://improving.duckduckgo.com/t/subscriptionsupport_message_first
   - https://improving.duckduckgo.com/t/subscriptionsupport_helplink_getting-started
   - https://improving.duckduckgo.com/t/subscriptionsupport_link_ticket
   - https://improving.duckduckgo.com/t/subscriptionsupport_helpful_yes

✅ Storage cleared and widget not rendered
✅ Dialog cancelled and storage preserved
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
zE('messenger', 'resetWidget', callback) // Resets widget and calls callback
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

**Mock Features:**

- `resetWidget` support - Resets widget state, removes iframes, and calls callback
- Proper iframe structure matching production Zendesk widget
- Realistic timing for callbacks and rendering

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
- `getSlugFromUrl()` - URL slug extraction and sanitization
  - Edge cases: invalid URLs, special characters, empty paths
- `getStorageWithExpiry()` - localStorage retrieval with date-based expiry
  - Valid/invalid storage items, expired items, server-side handling
  - Date string format validation (YYYY-MM-DD)
  - Edge cases: missing keys, invalid JSON, type mismatches
- `parseHtmlToLegalNotice()` - Legal notice HTML parsing (from Word documents)
  - Full document parsing with sections, headings, paragraphs, links, bold, and italic text
  - Button text pattern filtering (e.g., `[Continue to Chat] [Cancel]`)
  - "Last updated" line filtering (automatically sets date)
  - Validates parsed output matches expected structure

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
- Click logging via `useZendeskClickHandlers` hook
- Style injection via `useZendeskIframeStyles` hook
- Pixel event logging to `improving.duckduckgo.com`
- Message sending and user interactions
- Clear conversation data flow with dialog confirmation
- Storage clearing (localStorage/sessionStorage)
- State reset and return to consent screen

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

For testing user flows with Zendesk, use the helper functions defined in `complete-flow.test.ts` for cleaner, more maintainable tests:

```typescript
import { test, expect } from '@playwright/test';
// Helper functions are defined at the top of complete-flow.test.ts
// They can be reused within that file or copied to new test files

test('new user flow', async ({ page }) => {
  // Set up Zendesk mock (helper function)
  await setupZendeskMock(page);

  // Optionally intercept pixel events (helper function)
  const pixelRequests = await setupPixelInterception(page);

  // Load widget and wait for it to be ready (helper function)
  await loadWidget(page);

  // ... your test steps ...

  // Verify results
  expect(pixelRequests.length).toBeGreaterThan(0);
});
```

**Helper Functions Available in `complete-flow.test.ts`:**

- `setupZendeskMock(page)` - Sets up the Zendesk script mock route (mock script loaded once at module level)
- `loadWidget(page)` - Navigates to page, clicks consent button, waits for widget ready (~1500ms)
- `setupPixelInterception(page)` - Sets up pixel request interception, returns requests array

These helpers eliminate code duplication and ensure consistent test setup. The mock script is loaded once at module level for better performance.

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
- Test IDs available: `LOAD_ZD_BUTTON_TEST_ID`, `DELETE_DATA_BUTTON_TEST_ID`, `CONFIRM_DELETE_DATA_BUTTON_TEST_ID`, `CANCEL_DELETE_DATA_BUTTON_TEST_ID`
- Wait for specific conditions with `waitForSelector()` instead of arbitrary timeouts
- Test in the real Next.js app environment

### ❌ DON'T:

- Don't recreate hook logic in tests - test the real hooks
- Don't use excessive `waitForTimeout()` - prefer event-based waiting
- Don't mock what you're testing - only mock external dependencies
- Don't test implementation details - test user-visible behavior
- Don't use brittle CSS class selectors - use semantic selectors
- Don't duplicate test setup - use shared fixtures and helper functions (`setupZendeskMock`, `loadWidget`, `setupPixelInterception`)

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

When you add pixel logging:

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
     // Use helper functions for setup
     await setupZendeskMock(page);
     await loadWidget(page);

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

### Testing Clear Conversation Data Flow

When testing the clear conversation data functionality:

```typescript
test('should clear conversation data', async ({ page }) => {
  await setupZendeskMock(page);
  await loadWidget(page);

  // Pre-populate storage
  await page.evaluate(() => {
    localStorage.setItem('test-key', 'test-value');
    sessionStorage.setItem('test-session-key', 'test-session-value');
  });

  // Click clear button
  const clearButton = page.getByTestId(DELETE_DATA_BUTTON_TEST_ID);
  await clearButton.click();

  // Verify dialog appears
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Confirm deletion
  const confirmButton = page.getByTestId(CONFIRM_DELETE_DATA_BUTTON_TEST_ID);
  await confirmButton.click();

  // Wait for reload
  await page.waitForLoadState('networkidle');

  // Verify storage is cleared
  const storageState = await page.evaluate(() => ({
    localStorage: Object.keys(localStorage).length,
    sessionStorage: Object.keys(sessionStorage).length,
  }));
  expect(storageState.sessionStorage).toBe(0);
});
```

## Key Files

**Tests:**

- `src/tests/integration/complete-flow.test.ts` - Comprehensive integration tests
  - Complete widget flow with pixel logging
  - Custom styles injection verification
  - Article link click logging
  - Yes/No button click logging
  - Clear conversation data flow
  - Dialog cancellation flow
- `src/tests/unit/build-article-url.test.ts` - Unit tests for URL building utility
- `src/tests/unit/get-slug-from-url.test.ts` - Unit tests for URL slug extraction
- `src/tests/unit/get-storage-with-expiry.test.ts` - Unit tests for storage expiry utility
  - Valid/invalid storage items
  - Expired items handling
  - Server-side environment handling
  - Date string format validation
- `src/tests/unit/parse-legal-notice.test.ts` - Unit tests for legal notice parsing
  - Full document parsing validation against static mock fixtures
  - Button text pattern filtering
  - "Last updated" line filtering

**Fixtures:**

- `src/tests/fixtures/zendesk-mock.js` - Realistic Zendesk Web Widget mock
- `src/tests/fixtures/mock-document-html.ts` - Static HTML mock from Word document conversion
- `src/tests/fixtures/mock-legal-notice-content.ts` - Static mock of expected parsed legal notice content

**Configuration:**

- `playwright.config.ts` - Playwright test configuration
- `package.json` - Test scripts and dependencies

## Understanding the Test Flow

### How Integration Tests Work

1. **Mock Setup** (using helper functions)

   ```typescript
   // Set up Zendesk mock (helper function handles script loading)
   await setupZendeskMock(page);

   // Optionally set up pixel interception
   const pixelRequests = await setupPixelInterception(page);
   ```

2. **User Action** (using helper functions)

   ```typescript
   // Load widget (helper function handles navigation, consent click, and waiting)
   await loadWidget(page);
   ```

3. **Widget Renders**

   ```typescript
   // Widget is ready after loadWidget() completes
   // Mock creates iframes automatically
   ```

4. **Hooks Activate**

   ```typescript
   // Hooks activate automatically (loadWidget waits for them)
   // Additional waits may be needed for specific hook effects
   await page.waitForTimeout(1500);
   ```

5. **Verify Results**
   ```typescript
   // Check hook effects
   const iframe = page.frameLocator('#zendesk-messaging-iframe');
   const link = iframe.locator('a[aria-label*="Article"]');
   await expect(link).toHaveAttribute('href', /duckduckgo\.com/);
   ```

**Helper Functions:**

The test suite includes optimized helper functions to reduce code duplication:

- `setupZendeskMock(page)` - Loads and routes the Zendesk mock script (loaded once at module level)
- `loadWidget(page)` - Navigates to page, clicks consent, waits for widget ready (~1500ms)
- `setupPixelInterception(page)` - Sets up pixel request interception, returns requests array

These helpers make tests more maintainable and consistent.

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

**Summary:** A focused test suite providing high confidence for CI deployment. Tests the complete user journey with realistic mocks, verifying iframe rendering, link swapping, message sending, pixel logging, and the clear conversation data flow. Uses optimized helper functions to reduce duplication and improve maintainability.
