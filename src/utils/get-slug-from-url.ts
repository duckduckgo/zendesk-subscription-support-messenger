/**
 * Extracts and sanitizes the last segment from a URL's pathname.
 *
 * @function getSlugFromUrl
 * @param {string} url - The URL to extract the slug from (must be a valid
 * absolute URL)
 *
 * @returns {string} The sanitized slug (alphanumeric, hyphens, underscores
 * only), or empty string if URL is invalid
 *
 * @example
 * ```ts
 * getSlugFromUrl('https://example.com/path/to/article-slug')
 * // Returns: 'article-slug'
 * ```
 */
export function getSlugFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const slug = urlObj.pathname.split('/').at(-1) || '';

    // Sanitize: only allow alphanumeric, hyphens, underscores
    return slug.replace(/[^a-zA-Z0-9_-]/g, '');
  } catch {
    return '';
  }
}
