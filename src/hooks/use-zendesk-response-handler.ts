import { useEffect, useRef } from 'react';
import {
  getMessagingIframe,
  getMessagingIframeDocument,
} from '@/utils/zendesk-iframe';
import { updateArticleLinks } from '@/utils/article-link-updater';
import { ZENDESK_BASE_URL, ARTICLE_LINK_MAP } from '@/config/zendesk';

interface UseZendeskResponseHandlerOptions {
  /** Whether the Zendesk widget is ready */
  zendeskReady: boolean;
}

/**
 * Processes article links in the Zendesk widget iframe.
 * Retries if iframe is not yet available.
 */
function processArticleLinks(retries = 5, delay = 500): void {
  const iframe = getMessagingIframe(null);
  if (!iframe) {
    if (retries > 0) {
      setTimeout(() => processArticleLinks(retries - 1, delay), delay);
    }
    return;
  }

  const iframeDoc = getMessagingIframeDocument(iframe);
  if (!iframeDoc) {
    if (retries > 0) {
      setTimeout(() => processArticleLinks(retries - 1, delay), delay);
    }
    return;
  }

  // Process links with article IDs
  updateArticleLinks(iframeDoc, ARTICLE_LINK_MAP, ZENDESK_BASE_URL);
}

/**
 * Hook that updates article links in Zendesk widget responses.
 * Processes links when widget is ready and when new messages arrive.
 */
export function useZendeskResponseHandler({
  zendeskReady,
}: UseZendeskResponseHandlerOptions) {
  const observerRef = useRef<MutationObserver | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (!zendeskReady) {
      return;
    }

    // Process links immediately when widget becomes ready
    // This handles embedded mode where messages are already visible
    if (!processedRef.current) {
      // Give the widget a moment to render
      setTimeout(() => {
        processArticleLinks();
        processedRef.current = true;
      }, 1000);
    }

    let timeout: ReturnType<typeof setTimeout> | null = null;

    // Listen for new messages and process links
    zE('messenger:on', 'unreadMessages', () => {
      // Clear any pending timeout
      if (timeout) {
        clearTimeout(timeout);
      }

      // Process links after a short delay to allow DOM rendering
      timeout = setTimeout(() => {
        processArticleLinks();
      }, 500);
    });

    // Set up MutationObserver to watch for new links being added to the iframe
    const setupObserver = () => {
      const iframe = getMessagingIframe(null);
      if (!iframe) {
        return;
      }

      const iframeDoc = getMessagingIframeDocument(iframe);
      if (!iframeDoc) {
        return;
      }

      // Clean up existing observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      try {
        // Create new observer to watch for DOM changes
        observerRef.current = new MutationObserver(() => {
          // Process links when DOM changes
          updateArticleLinks(iframeDoc, ARTICLE_LINK_MAP, ZENDESK_BASE_URL);
        });

        // Start observing
        observerRef.current.observe(iframeDoc.body, {
          childList: true,
          subtree: true,
        });
      } catch (error) {
        // Cross-origin restrictions might prevent observing
        console.warn(
          'Could not set up MutationObserver for Zendesk iframe:',
          error,
        );
      }
    };

    // Set up observer after a delay to ensure iframe is ready
    const observerTimeout = setTimeout(() => {
      setupObserver();
    }, 1500);

    // Also set up a periodic check as fallback (in case MutationObserver doesn't work)
    const intervalId = setInterval(() => {
      processArticleLinks(0, 0); // No retries, just process if available
    }, 2000);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      if (observerTimeout) {
        clearTimeout(observerTimeout);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [zendeskReady]);
}
