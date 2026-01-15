import { ZENDESK_BASE_URL } from '@/config/zendesk';

/**
 * Builds a complete article URL from the provided path.
 *
 * Handles URL normalization including:
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
 * buildArticleUrl('/article/path')
 * // Returns: 'https://duckduckgo.com/duckduckgo-help-pages/article/path'
 * ```
 */
export function buildArticleUrl(path: string): string {
  // Remove leading slash if present (URL constructor will add it properly)
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  return new URL(normalizedPath, ZENDESK_BASE_URL).href;
}
