import { test, expect } from '@playwright/test';
import { getSlugFromUrl } from '@/utils/get-slug-from-url';

test.describe('getSlugFromUrl', () => {
  test('should extract slug from URL with single path segment', () => {
    const result = getSlugFromUrl('https://example.com/article-slug');

    expect(result).toBe('article-slug');
  });

  test('should extract slug from URL with multiple path segments', () => {
    const result = getSlugFromUrl('https://example.com/path/to/article-slug');

    expect(result).toBe('article-slug');
  });

  test('should sanitize slug by removing invalid characters', () => {
    const result = getSlugFromUrl(
      'https://example.com/path/to/article-slug!@#$%^&*()',
    );

    expect(result).toBe('article-slug');
  });
});
