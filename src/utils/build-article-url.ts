import { ZENDESK_BASE_URL } from '@/config/zendesk';

/**
 * Builds a complete article URL from the provided path.
 *
 * Handles URL normalization including:
 * - Ensuring base URL has trailing slash
 * - Removing leading slash from path (URL constructor handles this properly)
 * - Proper URL construction using URL constructor
 *
 * @function buildArticleUrl
 * @param {string} path - The article path (relative to baseUrl, with a leading slash)
 *
 * @returns {string} Complete article URL
 *
 * @example
 * ```ts
 * buildArticleUrl('/privacy-pro/i-lost-my-device')
 * // Returns: 'https://duckduckgo.com/duckduckgo-help-pages/privacy-pro/i-lost-my-device'
 * ```
 */
export function buildArticleUrl(path: string): string {
  // Ensure base URL has trailing slash for proper URL construction
  const baseUrl = ZENDESK_BASE_URL.endsWith('/')
    ? ZENDESK_BASE_URL
    : `${ZENDESK_BASE_URL}/`;

  // Remove leading slash from path (URL constructor will add it properly)
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  return new URL(normalizedPath, baseUrl).href;
}
