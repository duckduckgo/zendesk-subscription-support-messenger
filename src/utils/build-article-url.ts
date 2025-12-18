/**
 * Builds a complete article URL from a base URL and path.
 *
 * Handles URL normalization including:
 * - Ensuring base URL has trailing slash
 * - Removing leading slash from path
 * - Proper URL construction using URL constructor with fallback
 *
 * @param baseUrl - The base URL for articles
 * @param path - The article path (relative to baseUrl)
 * @returns Complete article URL
 *
 * @example
 * ```ts
 * buildArticleUrl('https://example.com/', '/article/path')
 * // Returns: 'https://example.com/article/path'
 * ```
 */
export function buildArticleUrl(baseUrl: string, path: string): string {
  try {
    // Use URL constructor for proper URL handling and validation
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return new URL(normalizedPath, normalizedBase).href;
  } catch {
    // Fallback to string concatenation if URL constructor fails
    // (e.g., invalid base URL format)
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return `${normalizedBase}${normalizedPath}`;
  }
}
