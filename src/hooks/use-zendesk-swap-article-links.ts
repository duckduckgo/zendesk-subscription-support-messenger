import { useEffect, useRef, type RefObject } from 'react';
import {
  getMessagingIframe,
  getMessagingIframeDocument,
} from '@/utils/zendesk-iframe';
import { updateArticleLinks } from '@/utils/update-article-links';
import {
  DOM_READY_DELAY_MS,
  INITIAL_RENDER_DELAY_MS,
  DEFAULT_MAX_RETRIES,
} from '@/constants/zendesk-timing';
import {
  createRetryManager,
  scheduleCoordinatedRetry,
  markComponentMounted,
  markComponentUnmounted,
} from '@/utils/zendesk-retry-manager';

interface UseZendeskSwapArticleLinksOptions {
  zendeskReady: boolean;
}

/**
 * Creates a retry callback for link swapping operations.
 *
 * @function createLinkSwapRetryCallback
 * @param isMountedRef - Ref to track if component is mounted
 * @param retryManager - Shared retry manager instance
 * @param retries - Number of retries remaining
 * @param delay - Delay between retries
 * @returns Retry callback function
 */
function createLinkSwapRetryCallback(
  isMountedRef: RefObject<boolean>,
  retryManager: ReturnType<typeof createRetryManager>,
  retries: number,
  delay: number,
): () => boolean {
  return () => {
    if (!isMountedRef.current) {
      return false;
    }
    const result = processArticleLinks(
      isMountedRef,
      retryManager,
      retries - 1,
      delay,
    );
    return !!result?.linksFound;
  };
}

/**
 * Processes article links in the Zendesk widget iframe using coordinated retry logic.
 *
 * @function processArticleLinks
 * @param {RefObject<boolean>} isMountedRef - Ref to track if component is
 * mounted
 * @param retryManager - Shared retry manager instance for coordination
 * @param {number} retries - Maximum number of retry attempts (defaults to
 * DEFAULT_MAX_RETRIES)
 * @param {number} delay - Delay between retries in milliseconds (defaults to
 * DOM_READY_DELAY_MS)
 *
 * @returns {Object | void} Object with iframe document and whether links were
 * found, or void if iframe/document not found
 */
function processArticleLinks(
  isMountedRef: RefObject<boolean>,
  retryManager: ReturnType<typeof createRetryManager>,
  retries: number = DEFAULT_MAX_RETRIES,
  delay: number = DOM_READY_DELAY_MS,
): { doc: Document; linksFound: boolean } | void {
  // Check mounted state before proceeding
  if (!isMountedRef.current) {
    return;
  }

  const iframe = getMessagingIframe(null);

  if (!iframe) {
    // Schedule coordinated retry if retries remaining
    scheduleCoordinatedRetry(
      retryManager,
      'link-swapping',
      createLinkSwapRetryCallback(isMountedRef, retryManager, retries, delay),
      isMountedRef,
      retries,
      delay,
    );

    return;
  }

  const iframeDoc = getMessagingIframeDocument(iframe);

  if (!iframeDoc) {
    // Schedule coordinated retry if retries remaining
    scheduleCoordinatedRetry(
      retryManager,
      'link-swapping',
      createLinkSwapRetryCallback(isMountedRef, retryManager, retries, delay),
      isMountedRef,
      retries,
      delay,
    );

    return;
  }

  // Update article links in the iframe document
  const linksUpdated = updateArticleLinks(iframeDoc);
  const linksFound = linksUpdated > 0;

  // If no links were found and we have retries left, retry (links may not be
  // ready yet)
  if (!linksFound) {
    // Schedule coordinated retry
    scheduleCoordinatedRetry(
      retryManager,
      'link-swapping',
      createLinkSwapRetryCallback(isMountedRef, retryManager, retries, delay),
      isMountedRef,
      retries,
      delay,
    );
  }

  // Return the document and whether links were found
  // iframeDoc is guaranteed to be non-null here since we checked above
  return { doc: iframeDoc as Document, linksFound };
}

/**
 * Swaps article links in the Zendesk widget iframe with custom URLs.
 *
 * @function useZendeskSwapArticleLinks
 * @param {UseZendeskSwapArticleLinksOptions['zendeskReady']}
 * options.zendeskReady - Whether the Zendesk widget is ready
 *
 * @example
 * ```ts
 * useZendeskSwapArticleLinks({
 *   zendeskReady,
 * });
 * ```
 */
export function useZendeskSwapArticleLinks({
  zendeskReady,
}: UseZendeskSwapArticleLinksOptions) {
  const processedRef = useRef(false);
  const isMountedRef = useRef(true);
  const retryManagerRef = useRef(createRetryManager());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!zendeskReady) {
      return;
    }

    // Capture ref value for use in cleanup
    const retryManager = retryManagerRef.current;

    // Mark as mounted when effect runs
    markComponentMounted(isMountedRef, retryManager);

    let processArticleLinksTimeout: ReturnType<typeof setTimeout> | null = null;

    // Process article links immediately when widget becomes ready to catch
    // previously rendered chat elements. Use retry logic to handle timing
    // issues where links may not be ready yet.
    if (!processedRef.current) {
      // Give the widget a moment to render, then process with retries
      processArticleLinksTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          const result = processArticleLinks(isMountedRef, retryManager);

          // Only mark as processed if links were actually found, or if
          // retries are exhausted (to prevent infinite retries)
          if (result?.linksFound) {
            processedRef.current = true;
          }
        }
      }, INITIAL_RENDER_DELAY_MS);
    }

    // Listen for new messages and swap article links. Only process when `count
    // === 0` (indicating response content has been added to the DOM). The
    // callback may fire multiple times per response, so we debounce with
    // a timeout.
    zE('messenger:on', 'unreadMessages', (count) => {
      if (count !== 0) {
        return;
      }

      // Clear any pending timeout to debounce multiple calls
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Cancel any active retry for link-swapping to prevent conflicts
      retryManager.cancelRetry('link-swapping');

      // Swap article links after a short delay to ensure DOM is fully rendered
      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          processArticleLinks(isMountedRef, retryManager);
        }
        timeoutRef.current = null;
      }, DOM_READY_DELAY_MS);
    });

    return () => {
      // Mark as unmounted
      markComponentUnmounted(isMountedRef, retryManager);

      // Clean up timeouts
      if (processArticleLinksTimeout) {
        clearTimeout(processArticleLinksTimeout);
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [zendeskReady]);
}
