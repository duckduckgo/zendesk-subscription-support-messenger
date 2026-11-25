export const MAIN_SITE_URL = 'https://duckduckgo.com';
export const SITE_TITLE = 'DuckDuckGo Automated Support Chat';

/**
 * Determine if using custom domain (e.g., subscription-support.duckduckgo.com)
 * Custom domains don't need basePath, GitHub Pages default URLs do
 */
export const useCustomDomain = process.env.CUSTOM_DOMAIN === 'true';

/**
 * Base path for GitHub Pages (repository subdirectory)
 * Only used for GitHub Pages default URL (username.github.io/repo-name)
 * Custom domains are served at root and don't need a basePath
 */
export const basePath =
  process.env.NODE_ENV === 'production' && !useCustomDomain
    ? '/zendesk-subscription-support-messenger'
    : '';

/**
 * Service sunset. The homepage shows a notice and then redirects here.
 * 20 seconds matches the WCAG 2.2.1 (Timing Adjustable) minimum for a warned
 * timeout, and users can cancel the redirect.
 */
export const SUNSET_REDIRECT_URL = `${MAIN_SITE_URL}/subscription-support`;
export const SUNSET_REDIRECT_SECONDS = 20;
export const SUNSET_HEADING =
  'DuckDuckGo Automated Support Chat is no longer available';
