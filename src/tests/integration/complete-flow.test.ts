import { test, expect } from '@playwright/test';
import { LOAD_ZD_BUTTON_TEST_ID } from '@/constants/test-ids';
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

test.describe('Complete Zendesk Widget Flow', () => {
  test('should render iframe, swap links, send message, and fire pixel events', async ({
    page,
  }) => {
    // ==========================================
    // SETUP: Mock Zendesk script and intercept pixel requests
    // ==========================================

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

    // Intercept pixel network calls
    const pixelRequests: string[] = [];

    await page.route('https://improving.duckduckgo.com/t/*', (route) => {
      const url = route.request().url();
      pixelRequests.push(url);
      console.log('📊 Pixel event:', url);
      route.fulfill({ status: 200, body: '' });
    });

    // ==========================================
    // STEP 1: Navigate and click the consent button
    // ==========================================

    await page.goto('/');

    // Verify consent form is visible
    await expect(
      page.locator('h1:has-text("DuckDuckGo Automated Support Assistant")'),
    ).toBeVisible();

    const continueButton = page.getByTestId(LOAD_ZD_BUTTON_TEST_ID);
    await expect(continueButton).toBeVisible();

    // Click the button
    await continueButton.click();

    // Verify consent pixel event fired
    await page.waitForTimeout(500);
    expect(pixelRequests.some((url) => url.includes('consent'))).toBe(true);
    console.log('✅ Consent pixel fired');

    // ==========================================
    // STEP 2: Verify iframe renders in messaging-container
    // ==========================================

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

    // ==========================================
    // STEP 3: Wait for hooks to activate and verify link swapping
    // ==========================================

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

    // ==========================================
    // STEP 4: Enter message in chatbot input
    // ==========================================

    const textarea = iframe.locator('#composer-input');
    await expect(textarea).toBeVisible();

    const testMessage = 'I need help with my VPN subscription';
    await textarea.fill(testMessage);

    // Verify message was entered
    const textareaValue = await textarea.inputValue();
    expect(textareaValue).toBe(testMessage);
    console.log('✅ Message entered in chatbot input:', testMessage);

    // ==========================================
    // STEP 5: Send the message
    // ==========================================

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

    // ==========================================
    // STEP 6: Click an article link and verify pixel
    // ==========================================

    // Find the "Personal Information Removal" article link
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

    // ==========================================
    // STEP 7: Click Support Form link and verify pixel
    // ==========================================

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

    // ==========================================
    // STEP 8: Click Yes button and verify pixel
    // ==========================================

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

    // ==========================================
    // STEP 9: Verify all pixel network calls
    // ==========================================

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

    // ==========================================
    // SUMMARY
    // ==========================================

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

    await page.goto('/');
    await page.getByTestId(LOAD_ZD_BUTTON_TEST_ID).click();

    // Wait for iframe
    await page.waitForSelector(
      '#messaging-container iframe#zendesk-messaging-iframe',
      { timeout: 5000 },
    );

    // Wait for hooks to activate
    await page.waitForTimeout(1500);

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

    // Intercept pixel requests
    const pixelRequests: string[] = [];
    await page.route('https://improving.duckduckgo.com/t/*', (route) => {
      pixelRequests.push(route.request().url());
      route.fulfill({ status: 200, body: '' });
    });

    await page.goto('/');
    await page.getByTestId(LOAD_ZD_BUTTON_TEST_ID).click();

    // Wait for iframe and hooks
    await page.waitForSelector(
      '#messaging-container iframe#zendesk-messaging-iframe',
      { timeout: 5000 },
    );
    await page.waitForTimeout(1500);

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

    // Intercept pixel requests
    const pixelRequests: string[] = [];
    await page.route('https://improving.duckduckgo.com/t/*', (route) => {
      pixelRequests.push(route.request().url());
      route.fulfill({ status: 200, body: '' });
    });

    await page.goto('/');
    await page.getByTestId(LOAD_ZD_BUTTON_TEST_ID).click();

    // Wait for iframe and hooks
    await page.waitForSelector(
      '#messaging-container iframe#zendesk-messaging-iframe',
      { timeout: 5000 },
    );
    await page.waitForTimeout(1500);

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
});
