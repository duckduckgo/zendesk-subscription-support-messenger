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

interface UseZendeskSwapArticleLinksOptions {
  zendeskReady: boolean;
}

/**
 * Processes article links in the Zendesk widget iframe.
 *
 * @function processArticleLinks
 * @param {RefObject<boolean>} isMountedRef - Ref to track if component is
 * mounted
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
  retries: number = DEFAULT_MAX_RETRIES,
  delay: number = DOM_READY_DELAY_MS,
): { doc: Document; linksFound: boolean } | void {
  // Schedules a retry if attempts remain and component is mounted
  const scheduleRetry = (): void => {
    if (retries > 0) {
      setTimeout(() => {
        // Check mounted state before recursive call
        if (isMountedRef.current) {
          processArticleLinks(isMountedRef, retries - 1, delay);
        }
      }, delay);
    }
  };

  // Check mounted state before proceeding
  if (!isMountedRef.current) {
    return;
  }

  const iframe = getMessagingIframe(null);

  if (!iframe) {
    scheduleRetry();

    return;
  }

  const iframeDoc = getMessagingIframeDocument(iframe);

  if (!iframeDoc) {
    scheduleRetry();

    return;
  }

  // Update article links in the iframe document
  const linksUpdated = updateArticleLinks(iframeDoc);
  const linksFound = linksUpdated > 0;

  // If no links were found and we have retries left, retry (links may not be
  // ready yet)
  if (!linksFound && retries > 0) {
    scheduleRetry();

    return;
  }

  // Return the document and whether links were found
  return { doc: iframeDoc, linksFound };
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

  useEffect(() => {
    if (!zendeskReady) {
      return;
    }

    // Mark as mounted when effect runs
    isMountedRef.current = true;

    let processArticleLinksTimeout: ReturnType<typeof setTimeout> | null = null;

    // Process article links immediately when widget becomes ready to catch
    // previously rendered chat elements. Use retry logic to handle timing
    // issues where links may not be ready yet.
    if (!processedRef.current) {
      // Give the widget a moment to render, then process with retries
      processArticleLinksTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          const result = processArticleLinks(isMountedRef);

          // Only mark as processed if links were actually found, or if
          // retries are exhausted (to prevent infinite retries)
          if (result?.linksFound) {
            processedRef.current = true;
          }
        }
      }, INITIAL_RENDER_DELAY_MS);
    }

    let timeout: ReturnType<typeof setTimeout> | null = null;

    // Listen for new messages and swap article links. Only process when `count
    // === 0` (indicating response content has been added to the DOM). The
    // callback may fire multiple times per response, so we debounce with
    // a timeout.
    zE('messenger:on', 'unreadMessages', (count) => {
      if (count !== 0) {
        return;
      }

      // Clear any pending timeout to debounce multiple calls
      if (timeout) {
        clearTimeout(timeout);
      }

      // Swap article links after a short delay to ensure DOM is fully rendered
      timeout = setTimeout(() => {
        if (isMountedRef.current) {
          processArticleLinks(isMountedRef);
        }
      }, DOM_READY_DELAY_MS);
    });

    return () => {
      // Mark as unmounted
      isMountedRef.current = false;

      // Clean up timeouts
      if (processArticleLinksTimeout) {
        clearTimeout(processArticleLinksTimeout);
      }

      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [zendeskReady]);
}
