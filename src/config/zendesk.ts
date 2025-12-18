export const ZENDESK_BASE_URL = 'https://duckduckgo.com/duckduckgo-help-pages/';

/**
 * Map of Zendesk article IDs to their corresponding paths.
 * Keys should match article IDs found in Zendesk widget hrefs.
 * Values are the paths to prepend with baseUrl without the leading slash.
 */
export const ARTICLE_LINK_MAP: Record<string, string> = {
  '44195025991699': 'privacy-pro/using-privacy-pro-outside-us',
  '44195071393683': 'privacy-pro/vpn/servers',
} as const;
