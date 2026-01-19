/**
 * Timing constants for Zendesk widget integration.
 * Centralized values for delays, timeouts, and retry logic.
 */

/**
 * Standard delay for DOM operations (e.g., allowing elements to render)
 * Used for: unreadMessages callback delays, retry delays, observer setup retries
 */
export const DOM_READY_DELAY_MS = 500;

/**
 * Initial delay after widget render to allow full initialization
 * Used for: initial processing of buttons/links/styles after widget becomes ready
 */
export const INITIAL_RENDER_DELAY_MS = 1000;

/**
 * Delay before setting up MutationObserver to ensure iframe is fully ready
 * Used for: observer setup in response handler and iframe styles hook
 */
export const OBSERVER_SETUP_DELAY_MS = 1500;

/**
 * Interval for fallback polling mechanism
 * Used for: periodic check fallback if MutationObserver doesn't work
 */
export const FALLBACK_INTERVAL_MS = 2000;

/**
 * Standard maximum retry attempts for iframe/document access
 * Used for: processArticleLinks, injectStyles
 */
export const MAX_RETRIES_STANDARD = 5;

/**
 * Maximum retry attempts for button/link handler setup
 * Used for: processWithRetry in button handlers hook
 */
export const MAX_RETRIES_BUTTON_HANDLERS = 10;

/**
 * Delay for redirect after pixel fire
 * Used for: cancel button redirect delay
 */
export const REDIRECT_DELAY_MS = 500;

/**
 * Delay after Zendesk render before marking as ready
 * Used for: setZendeskReady timeout in handleOnLoad
 */
export const ZENDESK_READY_DELAY_MS = 500;
