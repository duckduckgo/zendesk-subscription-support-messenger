import { test, expect } from '@playwright/test';
import { buildArticleUrl } from '@/utils/build-article-url';

/**
 * Unit tests for buildArticleUrl utility
 * Pure function - tests run in Node context (no browser needed)
 */
test.describe('buildArticleUrl', () => {
  test('should build URL with leading slash in path', () => {
    const result = buildArticleUrl('/privacy-pro/i-lost-my-device');

    expect(result).toBe(
      'https://duckduckgo.com/duckduckgo-help-pages/privacy-pro/i-lost-my-device',
    );
  });

  test('should build URL without leading slash in path', () => {
    const result = buildArticleUrl('privacy-pro/i-lost-my-device');

    expect(result).toBe(
      'https://duckduckgo.com/duckduckgo-help-pages/privacy-pro/i-lost-my-device',
    );
  });

  test('should handle path with multiple segments', () => {
    const result = buildArticleUrl('/privacy-pro/subscriptions/billing');

    expect(result).toBe(
      'https://duckduckgo.com/duckduckgo-help-pages/privacy-pro/subscriptions/billing',
    );
  });
});
