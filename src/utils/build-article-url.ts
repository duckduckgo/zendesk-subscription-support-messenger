import { ZENDESK_BASE_URL } from '@/config/zendesk';

/**
 * Builds a complete article URL from the provided path using the URL constructor.
 *
 * The URL constructor handles path normalization automatically, including:
 * - Trailing slashes in the base URL
 * - Leading slashes in the path
 *
 * @param {string} path - The article path (relative to baseUrl, with or without
 * a leading slash)
 * @returns {string} Complete article URL
 *
 * @example
 * ```ts
 * buildArticleUrl('/privacy-pro/i-lost-my-device')
 * // Returns: 'https://duckduckgo.com/duckduckgo-help-pages/privacy-pro/i-lost-my-device'
 * ```
 */
export function buildArticleUrl(path: string): string {
  return new URL(path, ZENDESK_BASE_URL).href;
}
