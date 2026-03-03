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
 * Processes article links in the Zendesk widget iframe.
 *
 * @function processArticleLinks
 * @param {RefObject<boolean>} isMountedRef - Ref to track if component is mounted
 * @returns {boolean} True if links were found and updated, false if not ready or no links found
 */
function processArticleLinks(isMountedRef: RefObject<boolean>): boolean {
  if (!isMountedRef.current) {
    return false;
  }

  const iframe = getMessagingIframe(null);

  if (!iframe) {
    return false;
  }

  const iframeDoc = getMessagingIframeDocument(iframe);

  if (!iframeDoc) {
    return false;
  }

  return updateArticleLinks(iframeDoc) > 0;
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
      processedRef.current = false;

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
        if (!isMountedRef.current) {
          return;
        }

        const linksFound = processArticleLinks(isMountedRef);

        if (linksFound) {
          processedRef.current = true;
        } else {
          scheduleCoordinatedRetry(
            retryManager,
            'link-swapping',
            () => {
              const found = processArticleLinks(isMountedRef);

              if (found) {
                processedRef.current = true;
              }

              return found;
            },
            isMountedRef,
            DEFAULT_MAX_RETRIES,
            DOM_READY_DELAY_MS,
          );
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
        if (!isMountedRef.current) {
          return;
        }

        const found = processArticleLinks(isMountedRef);

        if (!found) {
          scheduleCoordinatedRetry(
            retryManager,
            'link-swapping',
            () => processArticleLinks(isMountedRef),
            isMountedRef,
            DEFAULT_MAX_RETRIES,
            DOM_READY_DELAY_MS,
          );
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
