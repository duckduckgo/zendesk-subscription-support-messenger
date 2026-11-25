import { test, expect } from '@playwright/test';
import {
  SUNSET_REDIRECT_LINK_TEST_ID,
  SUNSET_STAY_BUTTON_TEST_ID,
} from '@/constants/test-ids';
import {
  SUNSET_HEADING,
  SUNSET_REDIRECT_SECONDS,
  SUNSET_REDIRECT_URL,
} from '@/config/common';

test.describe('Sunset notice', () => {
  test.beforeEach(async ({ page }) => {
    // Never actually leave the site during tests
    await page.route(`${SUNSET_REDIRECT_URL}*`, (route) =>
      route.fulfill({ status: 200, body: 'redirected' }),
    );

    await page.clock.install();
  });

  test('shows the notice and link without a chat window', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { level: 1, name: SUNSET_HEADING }),
    ).toBeVisible();

    await expect(
      page.getByTestId(SUNSET_REDIRECT_LINK_TEST_ID),
    ).toHaveAttribute('href', SUNSET_REDIRECT_URL);

    await expect(page.locator('iframe')).toHaveCount(0);
  });

  test('redirects after the countdown', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId(SUNSET_STAY_BUTTON_TEST_ID)).toBeVisible();

    await page.clock.runFor((SUNSET_REDIRECT_SECONDS - 1) * 1000);
    expect(page.url()).not.toContain(SUNSET_REDIRECT_URL);

    await page.clock.runFor(2000);
    await page.waitForURL(SUNSET_REDIRECT_URL);
  });

  test('"Stay on this page" cancels the redirect', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(SUNSET_STAY_BUTTON_TEST_ID).click();

    await expect(page.getByRole('status')).toContainText('redirect canceled');

    await page.clock.runFor((SUNSET_REDIRECT_SECONDS + 5) * 1000);
    expect(page.url()).not.toContain(SUNSET_REDIRECT_URL);
  });
});

test.describe('Legacy chat storage cleanup', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${SUNSET_REDIRECT_URL}*`, (route) =>
      route.fulfill({ status: 200, body: 'redirected' }),
    );

    await page.clock.install();
  });

  test('removes chat keys and keeps unrelated keys', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => {
      localStorage.setItem('ddg_consent', '{"value":true}');
      localStorage.setItem('ZD-abc123.clientId', 'client');
      localStorage.setItem('ZD-abc123.appUserId', 'user');
      localStorage.setItem('ZD-abc123.sessionToken', 'token');
      localStorage.setItem('ZD-abc123.conversationStartedAt', '123');
      localStorage.setItem('unrelated', 'keep me');
    });

    await page.reload();

    // The button is server rendered, so wait for the cleanup to run after
    // hydration instead of checking right away
    await expect
      .poll(() => page.evaluate(() => Object.keys(localStorage)))
      .toEqual(['unrelated']);
  });

  test('loads without errors when no chat keys exist', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');

    // A ticking countdown proves the page hydrated and the cleanup ran
    await page.clock.runFor(1000);
    await expect(page.getByText('19 seconds')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('still shows the notice when storage is blocked', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('Access denied', 'SecurityError');
        },
      });
    });

    await page.goto('/');
    await expect(
      page.getByRole('heading', { level: 1, name: SUNSET_HEADING }),
    ).toBeVisible();

    // A ticking countdown proves the page hydrated and the cleanup ran
    await page.clock.runFor(1000);
    await expect(page.getByText('19 seconds')).toBeVisible();

    expect(errors).toEqual([]);
  });
});
