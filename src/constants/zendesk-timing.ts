/**
 * Default delay for DOM operations (e.g., allowing elements to render)
 */
export const DOM_READY_DELAY_MS = 500;

/**
 * Initial delay after widget render to allow full initialization
 */
export const INITIAL_RENDER_DELAY_MS = 1000;

/**
 * Delay before setting up MutationObserver to ensure iframe is fully ready
 */
export const OBSERVER_SETUP_DELAY_MS = 1500;

/**
 * Default maximum retry attempts for iframe/document access
 */
export const DEFAULT_MAX_RETRIES = 5;

/**
 * Delay for redirect after pixel fire
 */
export const REDIRECT_DELAY_MS = 500;

/**
 * Delay after Zendesk render before marking as ready
 */
export const ZENDESK_READY_DELAY_MS = 500;
