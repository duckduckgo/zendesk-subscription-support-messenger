export const MAIN_SITE_URL = 'https://duckduckgo.com';
export const SITE_TITLE = 'DuckDuckGo Automated Support Chat';
export const MAIN_HEADING = 'DuckDuckGo Automated Support Chat';
export const HELP_PAGES_BASE_URL = `${MAIN_SITE_URL}/duckduckgo-help-pages`;
export const EMBEDDED_TARGET_ELEMENT = 'messaging-container';
export const DECLINE_BUTTON_TEXT = 'Cancel';
export const CONSENT_BUTTON_TEXT = 'Continue to Chat';
export const CONSENT_STORAGE_KEY = 'ddg_consent';

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

export const DAY_MILLISECONDS = 864e5;
