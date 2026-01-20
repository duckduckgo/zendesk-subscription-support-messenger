import { useEffect, useRef, type RefObject } from 'react';
import {
  getMessagingIframe,
  getMessagingIframeDocument,
} from '@/utils/zendesk-iframe';
import { updateArticleLinks } from '@/utils/update-article-links';
import {
  DOM_READY_DELAY_MS,
  INITIAL_RENDER_DELAY_MS,
  OBSERVER_SETUP_DELAY_MS,
  FALLBACK_INTERVAL_MS,
  MAX_RETRIES_STANDARD,
} from '@/constants/zendesk-timing';
import { setupZendeskObserver } from '@/utils/zendesk-observer';

interface UseZendeskArticleLinkHandlerOptions {
  zendeskReady: boolean;
}

/**
 * Processes article links in the Zendesk widget iframe.
 *
 * @function processArticleLinks
 * @param {RefObject<boolean>} isMountedRef - Ref to track if component is
 * mounted
 * @param {number} retries - Maximum number of retry attempts (defaults to
 * MAX_RETRIES_STANDARD)
 * @param {number} delay - Delay between retries in milliseconds (defaults to
 * DOM_READY_DELAY_MS)
 *
 * @returns The iframe document if successful, or void if iframe/document not
 * found
 */
function processArticleLinks(
  isMountedRef: RefObject<boolean>,
  retries: number = MAX_RETRIES_STANDARD,
  delay: number = DOM_READY_DELAY_MS,
): Document | void {
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
  updateArticleLinks(iframeDoc);

  return iframeDoc;
}

/**
 * Updates article links in the Zendesk widget iframe.
 *
 * @function useZendeskArticleLinkHandler
 * @param {UseZendeskArticleLinkHandlerOptions['zendeskReady']}
 * options.zendeskReady - Whether the Zendesk widget is ready
 *
 * @example
 * ```ts
 * useZendeskArticleLinkHandler({
 *   zendeskReady,
 * });
 * ```
 */
export function useZendeskArticleLinkHandler({
  zendeskReady,
}: UseZendeskArticleLinkHandlerOptions) {
  const observerRef = useRef<MutationObserver | null>(null);
  const processedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (!zendeskReady) {
      return;
    }

    // Mark as mounted when effect runs
    isMountedRef.current = true;

    let processArticleLinksTimeout: ReturnType<typeof setTimeout> | null = null;
    let observerTimeout: ReturnType<typeof setTimeout> | null = null;
    let observerCleanup: (() => void) | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    // Process article links immediately when widget becomes ready to catch
    // previously rendered chat elements
    if (!processedRef.current) {
      // Give the widget a moment to render
      processArticleLinksTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          processArticleLinks(isMountedRef);

          processedRef.current = true;
        }
      }, INITIAL_RENDER_DELAY_MS);
    }

    let timeout: ReturnType<typeof setTimeout> | null = null;

    // Listen for new messages and process article links
    zE('messenger:on', 'unreadMessages', () => {
      // Clear any pending timeout
      if (timeout) {
        clearTimeout(timeout);
      }

      // Process article links after a short delay to allow DOM rendering
      timeout = setTimeout(() => {
        if (isMountedRef.current) {
          processArticleLinks(isMountedRef);
        }
      }, DOM_READY_DELAY_MS);
    });

    // Set up MutationObserver to watch for new article links being added to the iframe
    observerTimeout = setTimeout(() => {
      if (!isMountedRef.current) {
        return;
      }

      observerCleanup = setupZendeskObserver({
        onMutation: (iframeDoc) => {
          updateArticleLinks(iframeDoc);
        },
        target: 'body',
        retryOnNotReady: false,
        isMountedRef,
        observerRef,
      });
    }, OBSERVER_SETUP_DELAY_MS);

    // Also set up a periodic check as fallback (in case MutationObserver doesn't work)
    intervalId = setInterval(() => {
      if (isMountedRef.current) {
        // No retries, just process if available
        processArticleLinks(isMountedRef, 0, 0);
      }
    }, FALLBACK_INTERVAL_MS);

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

      if (observerTimeout) {
        clearTimeout(observerTimeout);
      }

      if (intervalId) {
        clearInterval(intervalId);
      }

      // Clean up observer
      if (observerCleanup) {
        observerCleanup();
      }

      if (observerRef.current) {
        observerRef.current.disconnect();

        observerRef.current = null;
      }
    };
  }, [zendeskReady]);
}
