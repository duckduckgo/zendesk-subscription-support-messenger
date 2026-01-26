import { HELP_PAGES_BASE_URL } from '@/config/common';

/**
 * Builds a complete article URL from the provided path using the URL constructor.
 *
 * The URL constructor treats paths starting with '/' as absolute, which would replace
 * the base URL's pathname. To preserve the base pathname, we ensure the base URL
 * has a trailing slash and remove the leading slash from the path to make it relative.
 *
 * @function buildArticleUrl
 * @param {string} path - The article path (relative to baseUrl, with or without
 * a leading slash)
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
  // Ensure base URL has trailing slash to preserve pathname
  const baseUrl = HELP_PAGES_BASE_URL.endsWith('/')
    ? HELP_PAGES_BASE_URL
    : `${HELP_PAGES_BASE_URL}/`;

  // Remove leading slash from path to make it relative to base URL pathname
  // This prevents the URL constructor from treating it as an absolute path
  const relativePath = path.startsWith('/') ? path.slice(1) : path;

  return new URL(relativePath, baseUrl).href;
}
