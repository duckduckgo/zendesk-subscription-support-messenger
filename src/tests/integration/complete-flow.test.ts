import { test, expect, type Page } from '@playwright/test';
import {
  CANCEL_DELETE_DATA_BUTTON_TEST_ID,
  CONFIRM_DELETE_DATA_BUTTON_TEST_ID,
  DELETE_DATA_BUTTON_TEST_ID,
  LOAD_ZD_BUTTON_TEST_ID,
} from '@/constants/test-ids';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Comprehensive Integration Test for Zendesk Widget
 *
 * Tests the complete user flow with high confidence:
 * 1. ✅ Click the consent button → iframe renders
 * 2. ✅ Link hrefs are swapped using ARTICLE_LINK_MAP
 * 3. ✅ Enter message in chatbot input
 * 4. ✅ Send the message
 * 5. ✅ Verify pixel network calls
 *
 * This test can run in CI with mocked Zendesk script.
 */

// Load mock script once at module level
const mockScript = readFileSync(
  join(__dirname, '../fixtures/zendesk-mock.js'),
  'utf-8',
);

// Helper function to set up Zendesk mock
async function setupZendeskMock(page: Page) {
  await page.route('https://static.zdassets.com/ekr/snippet.js*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: mockScript,
    });
  });
}

// Helper function to load the widget and wait for it to be ready
async function loadWidget(page: Page) {
  await page.goto('/');
  await page.getByTestId(LOAD_ZD_BUTTON_TEST_ID).click();

  // Wait for widget to be ready
  await page.waitForSelector(
    '#messaging-container iframe#zendesk-messaging-iframe',
    { timeout: 5000 },
  );

  await page.waitForTimeout(1500);
}

// Helper function to set up pixel interception
async function setupPixelInterception(page: Page): Promise<string[]> {
  const pixelRequests: string[] = [];

  await page.route('https://improving.duckduckgo.com/t/*', (route) => {
    const url = route.request().url();
    pixelRequests.push(url);
    console.log('📊 Pixel event:', url);
    route.fulfill({ status: 200, body: '' });
  });

  return pixelRequests;
}

test.describe('Complete Zendesk Widget Flow', () => {
  test('should render iframe, swap links, send message, and fire pixel events', async ({
    page,
  }) => {
    await setupZendeskMock(page);

    // Intercept pixel network calls
    const pixelRequests = await setupPixelInterception(page);

    await page.goto('/');

    // Verify consent form is visible
    await expect(
      page.locator('h1:has-text("DuckDuckGo Automated Support Chat")'),
    ).toBeVisible();

    const continueButton = page.getByTestId(LOAD_ZD_BUTTON_TEST_ID);

    await expect(continueButton).toBeVisible();

    // Click the button
    await continueButton.click();

    // Verify consent pixel event fired
    await page.waitForTimeout(500);
    expect(pixelRequests.some((url) => url.includes('consent'))).toBe(true);
    console.log('✅ Consent pixel fired');

    // Wait for web widget iframe
    await page.waitForSelector(
      '#messaging-container iframe[data-product="web_widget"]',
      {
        state: 'attached',
        timeout: 5000,
      },
    );

    // Verify both iframes exist
    const webWidgetIframe = page.locator(
      '#messaging-container iframe[data-product="web_widget"]',
    );

    await expect(webWidgetIframe).toBeAttached();

    const messagingIframe = page.locator(
      '#messaging-container iframe#zendesk-messaging-iframe',
    );

    await expect(messagingIframe).toBeAttached();

    console.log('✅ Iframe rendered in messaging-container');

    // Access iframe content
    const iframe = page.frameLocator('#zendesk-messaging-iframe');

    // Wait for article links to be present
    await iframe.locator('a[aria-label^="View article:"]').first().waitFor({
      timeout: 5000,
    });

    // Wait for hooks to activate
    await page.waitForTimeout(1500);

    // Get all article links
    const articleLinks = await iframe
      .locator('a[aria-label^="View article:"]')
      .all();

    // The hook has already swapped the URLs from Zendesk to DDG help pages.
    // Iterate through links to find each article
    let article1Href: string | null = null;
    let article2Href: string | null = null;
    let article3Href: string | null = null;

    for (const link of articleLinks) {
      const href = await link.getAttribute('href');

      if (!href) continue;

      // Article 1: ARTICLE_LINK_MAP['44195025991699']
      if (href.includes('privacy-pro/using-privacy-pro-outside-us')) {
        article1Href = href;
      }
      // Article 2: ARTICLE_LINK_MAP['44195037080467']
      else if (href.includes('privacy-pro/getting-started')) {
        article2Href = href;
      }
      // Article 3: ARTICLE_LINK_MAP['44195052225555']
      else if (
        href.includes(
          'privacy-pro/personal-information-removal/getting-started',
        )
      ) {
        article3Href = href;
      }
    }

    expect(article1Href).toBeTruthy();
    expect(article1Href).toContain('duckduckgo.com/duckduckgo-help-pages');
    expect(article1Href).toContain('privacy-pro/using-privacy-pro-outside-us');
    console.log('✅ Article 1 link swapped:', article1Href);

    expect(article2Href).toBeTruthy();
    expect(article2Href).toContain('duckduckgo.com/duckduckgo-help-pages');
    expect(article2Href).toContain('privacy-pro/getting-started');
    console.log('✅ Article 2 link swapped:', article2Href);

    expect(article3Href).toBeTruthy();
    expect(article3Href).toContain('duckduckgo.com/duckduckgo-help-pages');
    expect(article3Href).toContain(
      'privacy-pro/personal-information-removal/getting-started',
    );
    console.log('✅ Article 3 link swapped:', article3Href);

    console.log(
      '✅ All article links swapped correctly using ARTICLE_LINK_MAP',
    );

    // Enter message in chatbot input
    const textarea = iframe.locator('#composer-input');
    await expect(textarea).toBeVisible();

    const testMessage = 'I need help with my VPN subscription';
    await textarea.fill(testMessage);

    // Verify message was entered
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe(testMessage);
    console.log('✅ Message entered in chatbot input:', testMessage);

    // Wait for send button to appear (mock shows it when user types)
    await page.waitForTimeout(300);

    const sendButton = iframe.locator('button[title="Send message"]');
    await expect(sendButton).toBeVisible();

    // Click send button
    await sendButton.click();

    // Wait for pixel event to fire
    await page.waitForTimeout(500);

    // Verify message_first pixel event fired
    const messageFirstEvent = pixelRequests.find((url) =>
      url.includes('message_first'),
    );
    expect(messageFirstEvent).toBeTruthy();
    console.log('✅ First message pixel fired:', messageFirstEvent);

    console.log('✅ Message sent successfully');

    // Click an article link and verify pixel. Find the "PIR" article link
    let article3Link = null;

    for (const link of articleLinks) {
      const href = await link.getAttribute('href');
      if (
        href?.includes(
          'privacy-pro/personal-information-removal/getting-started',
        )
      ) {
        article3Link = link;
        break;
      }
    }

    expect(article3Link).toBeTruthy();
    await article3Link!.click();

    // Wait for pixel event to fire
    await page.waitForTimeout(500);

    // Verify helplink pixel event fired with the slug
    const helplinkEvent = pixelRequests.find((url) =>
      url.includes('helplink_getting-started'),
    );
    expect(helplinkEvent).toBeTruthy();
    console.log('✅ Article link click pixel fired:', helplinkEvent);

    // Click Support Form link and verify pixel
    const supportFormLink = iframe.locator('a:has-text("Support Form")');

    await expect(supportFormLink).toBeVisible();
    await supportFormLink.click();

    // Wait for pixel event to fire
    await page.waitForTimeout(500);

    // Verify link_ticket pixel event fired
    const linkTicketEvent = pixelRequests.find((url) =>
      url.includes('link_ticket'),
    );

    expect(linkTicketEvent).toBeTruthy();
    console.log('✅ Support Form link click pixel fired:', linkTicketEvent);

    // Click Yes button and verify pixel
    const yesButton = iframe.locator(
      'button[data-garden-id="buttons.button"]:has-text("Yes")',
    );

    await expect(yesButton).toBeVisible();
    await yesButton.click();

    // Wait for pixel event to fire
    await page.waitForTimeout(500);

    // Verify helpful_yes pixel event fired
    const helpfulYesEvent = pixelRequests.find((url) =>
      url.includes('helpful_yes'),
    );

    expect(helpfulYesEvent).toBeTruthy();
    console.log('✅ Yes button click pixel fired:', helpfulYesEvent);

    // Verify all pixel network calls

    // Expected pixel events:
    // 1. consent - when the consent button is clicked
    // 2. impression - page load
    // 3. message_first - when first message sent
    // 4. helplink_getting-started - when article link clicked
    // 5. link_ticket - when Support Form link clicked
    // 6. helpful_yes - when Yes button clicked

    expect(pixelRequests.length).toBeGreaterThanOrEqual(6);

    // Verify consent event
    const consentEvent = pixelRequests.find((url) => url.includes('consent'));

    expect(consentEvent).toBeTruthy();
    expect(consentEvent).toContain('https://improving.duckduckgo.com/t/');

    // Verify impression event
    const impressionEvent = pixelRequests.find((url) =>
      url.includes('impression'),
    );
    expect(impressionEvent).toBeTruthy();

    // Verify message_first event
    expect(messageFirstEvent).toContain('https://improving.duckduckgo.com/t/');

    // Verify helplink event
    expect(helplinkEvent).toContain('https://improving.duckduckgo.com/t/');

    // Verify link_ticket event
    expect(linkTicketEvent).toContain('https://improving.duckduckgo.com/t/');

    // Verify helpful_yes event
    expect(helpfulYesEvent).toContain('https://improving.duckduckgo.com/t/');

    console.log('✅ All pixel events verified');
    console.log('📊 Total pixel events fired:', pixelRequests.length);
    console.log('📊 Pixel events:', pixelRequests);

    // SUMMARY
    console.log('\n🎉 Complete flow test passed!');
    console.log('   ✅ Iframe rendered in messaging-container');
    console.log('   ✅ 3 article links swapped correctly');
    console.log('   ✅ Message entered in chatbot');
    console.log('   ✅ Message sent successfully');
    console.log('   ✅ Article link clicked');
    console.log('   ✅ Support Form link clicked');
    console.log('   ✅ Yes button clicked');
    console.log('   ✅ 6+ pixel events fired to improving.duckduckgo.com');
  });

  test('should verify custom styles are injected into iframe', async ({
    page,
  }) => {
    await setupZendeskMock(page);
    await loadWidget(page);

    // Check if custom styles were injected by useZendeskIframeStyles hook
    const stylesInjected = await page.evaluate(() => {
      const messagingIframe = document.querySelector(
        '#zendesk-messaging-iframe',
      ) as HTMLIFrameElement;

      if (!messagingIframe) return false;

      const iframeDoc = messagingIframe.contentDocument;

      if (!iframeDoc) return false;

      // Look for custom style element injected by hook
      const customStyles = iframeDoc.querySelector(
        'style[data-zendesk-custom-styles="true"]',
      );

      return customStyles !== null;
    });

    expect(stylesInjected).toBe(true);
    console.log('✅ Custom styles injected into iframe by hook');
  });

  test('should track article link clicks with pixel events', async ({
    page,
  }) => {
    await setupZendeskMock(page);

    // Intercept pixel requests
    const pixelRequests = await setupPixelInterception(page);

    await loadWidget(page);

    const iframe = page.frameLocator('#zendesk-messaging-iframe');

    // Click an article link
    const articleLink = iframe
      .locator(
        'a[aria-label*="What is DuckDuckGo Personal Information Removal"]',
      )
      .first();
    await articleLink.click();

    // Wait for click handler to fire pixel event
    await page.waitForTimeout(500);

    // Verify helplink pixel event fired (should contain the article slug)
    const helpLinkEvent = pixelRequests.find((url) =>
      url.includes('helplink_getting-started'),
    );

    expect(helpLinkEvent).toBeTruthy();
    console.log('✅ Article link click tracked:', helpLinkEvent);
  });

  test('should track Yes/No button clicks with pixel events', async ({
    page,
  }) => {
    await setupZendeskMock(page);

    // Intercept pixel requests
    const pixelRequests = await setupPixelInterception(page);

    await loadWidget(page);

    const iframe = page.frameLocator('#zendesk-messaging-iframe');

    // Click "Yes" button
    const yesButton = iframe.locator('button:has-text("Yes")').first();
    await yesButton.click();

    await page.waitForTimeout(500);

    // Verify helpful_yes pixel event fired
    const yesEvent = pixelRequests.find((url) => url.includes('helpful_yes'));
    expect(yesEvent).toBeTruthy();
    console.log('✅ Yes button click tracked:', yesEvent);
  });

  test('should clear conversation data and show new chat button', async ({
    page,
  }) => {
    await setupZendeskMock(page);
    await loadWidget(page);

    // Pre-populate storage to verify it gets cleared. Use a key ending with
    // .clientId to test the deleteStorageKeysBySuffix function
    await page.evaluate(() => {
      localStorage.setItem('test-key.clientId', 'test-value');
      sessionStorage.setItem('test-session-key', 'test-session-value');
    });

    // Verify storage was set
    const storageBefore = await page.evaluate(() => ({
      localStorage: localStorage.getItem('test-key.clientId'),
      sessionStorage: sessionStorage.getItem('test-session-key'),
    }));

    expect(storageBefore.localStorage).toBe('test-value');
    expect(storageBefore.sessionStorage).toBe('test-session-value');

    // Click "Clear Conversation Data" button
    const clearButton = page.getByTestId(DELETE_DATA_BUTTON_TEST_ID);

    await expect(clearButton).toBeVisible();
    await clearButton.click();

    // Verify dialog appears
    const dialog = page.getByRole('dialog');

    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Clear Conversation Data?')).toBeVisible();
    await expect(
      dialog.getByText(/are you sure you want to clear/i),
    ).toBeVisible();

    // Click "Clear Data" to confirm
    const confirmButton = page.getByTestId(CONFIRM_DELETE_DATA_BUTTON_TEST_ID);

    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Wait for page reload (burn animation completes)
    // The reload happens after ZENDESK_RESET_DELAY_MS (1000ms) + burn animation
    await page.waitForLoadState('networkidle');

    // Verify we're back at the chat screen (consent is persisted, so "New Chat"
    // button shows)
    await expect(
      page.locator('h1:has-text("DuckDuckGo Automated Support Chat")'),
    ).toBeVisible();
    await expect(page.getByTestId(LOAD_ZD_BUTTON_TEST_ID)).toBeVisible();

    // Verify storage is cleared (except consent which persists)
    // @note: Storage clearing happens in resetWidget callback before reload.
    // After reload, localStorage should only contain ddg_consent. All other
    // keys should be removed. We verify that our test keys are gone and only
    // consent remains, which confirms the clear() was called.
    const storageState = await page.evaluate(() => {
      const allLocalStorageKeys = Object.keys(localStorage);
      const allSessionStorageKeys = Object.keys(sessionStorage);

      return {
        localStorage: {
          count: allLocalStorageKeys.length,
          hasTestKey: allLocalStorageKeys.includes('test-key.clientId'),
          hasConsent: allLocalStorageKeys.includes('ddg_consent'),
          hasClientId: allLocalStorageKeys.some((key) =>
            key.endsWith('.clientId'),
          ),
          keys: allLocalStorageKeys,
        },
        sessionStorage: {
          count: allSessionStorageKeys.length,
          hasTestKey: allSessionStorageKeys.includes('test-session-key'),
          keys: allSessionStorageKeys,
        },
      };
    });

    if (storageState.localStorage.hasTestKey) {
      await page.waitForTimeout(1000);

      const storageStateRetry = await page.evaluate(() => {
        const allLocalStorageKeys = Object.keys(localStorage);
        const allSessionStorageKeys = Object.keys(sessionStorage);

        return {
          localStorage: {
            hasTestKey: allLocalStorageKeys.includes('test-key.clientId'),
            hasConsent: allLocalStorageKeys.includes('ddg_consent'),
            hasClientId: allLocalStorageKeys.some((key) =>
              key.endsWith('.clientId'),
            ),
            count: allLocalStorageKeys.length,
          },
          sessionStorage: {
            hasTestKey: allSessionStorageKeys.includes('test-session-key'),
            count: allSessionStorageKeys.length,
          },
        };
      });

      expect(storageStateRetry.localStorage.hasTestKey).toBe(false);
      expect(storageStateRetry.sessionStorage.hasTestKey).toBe(false);
      expect(storageStateRetry.sessionStorage.count).toBe(0);
      // Verify consent persists after clearing conversation data
      expect(storageStateRetry.localStorage.hasConsent).toBe(true);
      // Verify all .clientId keys are removed
      expect(storageStateRetry.localStorage.hasClientId).toBe(false);
      // Verify only ddg_consent remains
      expect(storageStateRetry.localStorage.count).toBe(1);
    } else {
      // Storage was cleared before reload - verify it's still cleared
      expect(storageState.localStorage.hasTestKey).toBe(false);
      expect(storageState.sessionStorage.hasTestKey).toBe(false);
      // SessionStorage should be completely empty
      expect(storageState.sessionStorage.count).toBe(0);
      // Consent should persist after clearing conversation data
      expect(storageState.localStorage.hasConsent).toBe(true);
      // Verify all .clientId keys are removed
      expect(storageState.localStorage.hasClientId).toBe(false);
      // Verify only ddg_consent remains
      expect(storageState.localStorage.count).toBe(1);
    }

    // After reload and state reset, loadWidget should be false, so no widget
    // should render
    const widgetRendered = await page.evaluate(() => {
      const container = document.querySelector('#messaging-container');

      if (!container) return false;

      const iframes = container.querySelectorAll('iframe');

      return iframes.length > 0;
    });

    expect(widgetRendered).toBe(false);
    console.log('✅ Storage cleared and widget not rendered');
  });

  test('should cancel clear conversation dialog without clearing data', async ({
    page,
  }) => {
    await setupZendeskMock(page);
    await loadWidget(page);

    // Pre-populate storage
    await page.evaluate(() => {
      localStorage.setItem('preserve-key', 'preserve-value');
      sessionStorage.setItem('preserve-session', 'preserve-session-value');
    });

    // Click clear button
    const clearButton = page.getByTestId(DELETE_DATA_BUTTON_TEST_ID);

    await clearButton.click();

    // Verify dialog appears
    const dialog = page.getByRole('dialog');

    await expect(dialog).toBeVisible();

    // Click Cancel
    const cancelButton = page.getByTestId(CANCEL_DELETE_DATA_BUTTON_TEST_ID);
    await cancelButton.click();

    // Verify dialog closes
    await expect(dialog).not.toBeVisible();

    // Verify still on chat screen (widget still visible)
    await expect(
      page.locator('#messaging-container iframe#zendesk-messaging-iframe'),
    ).toBeAttached();

    // Verify storage is NOT cleared
    const storageState = await page.evaluate(() => ({
      localStorage: localStorage.getItem('preserve-key'),
      sessionStorage: sessionStorage.getItem('preserve-session'),
    }));

    expect(storageState.localStorage).toBe('preserve-value');
    expect(storageState.sessionStorage).toBe('preserve-session-value');
    console.log('✅ Dialog cancelled and storage preserved');
  });
});
