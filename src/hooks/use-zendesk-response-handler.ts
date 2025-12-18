import { useCallback, useRef, useEffect } from 'react';
import {
  getMessagingIframe,
  getMessagingIframeDocument,
} from '@/utils/zendesk-iframe';
import {
  updateArticleLinks,
  createArticleLinkObserver,
} from '@/utils/article-link-updater';
import { ZENDESK_BASE_URL, ARTICLE_LINK_MAP } from '@/config/zendesk';

interface UseZendeskResponseHandlerOptions {
  /** Whether the Zendesk widget is ready */
  zendeskReady: boolean;
}

/**
 * Hook that sets up handlers for Zendesk widget responses.
 * Updates article links when responses are received.
 *
 * @param options - Configuration options
 */
export function useZendeskResponseHandler({
  zendeskReady,
}: UseZendeskResponseHandlerOptions) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const processedLinksRef = useRef<WeakSet<HTMLAnchorElement>>(new WeakSet());
  const observerRef = useRef<MutationObserver | null>(null);
  const isMountedRef = useRef(true);

  // Memoize article IDs for efficient lookup
  const articleIdsRef = useRef<Set<string>>(
    new Set(Object.keys(ARTICLE_LINK_MAP)),
  );

  const handleResponseComplete = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }

    // Update cached iframe reference
    const iframe = getMessagingIframe(iframeRef.current);

    if (iframe) {
      iframeRef.current = iframe;
    }

    const iframeDoc = getMessagingIframeDocument(iframeRef.current);

    if (!iframeDoc) {
      return;
    }

    // Update existing links
    updateArticleLinks(
      iframeDoc,
      ARTICLE_LINK_MAP,
      ZENDESK_BASE_URL,
      processedLinksRef.current,
      articleIdsRef.current,
    );

    // Set up observer for dynamically added links (only once)
    if (!observerRef.current && iframeDoc.body) {
      const observer = createArticleLinkObserver(
        iframeDoc,
        ARTICLE_LINK_MAP,
        ZENDESK_BASE_URL,
        processedLinksRef.current,
        articleIdsRef.current,
      );

      if (observer) {
        observerRef.current = observer;
      }
    }
  }, []);

  // Set up Zendesk event listener
  useEffect(() => {
    if (!zendeskReady) {
      return;
    }

    let responseTimeout: ReturnType<typeof setTimeout> | null = null;

    // Listen for unreadMessages changes (fires when messages are received)
    // Note: Zendesk Web Widget API only provides these documented events:
    // - 'open': When widget opens
    // - 'close': When widget closes
    // - 'unreadMessages': When unread message count changes
    //
    // There is NO documented event for when responses complete, so we use
    // unreadMessages combined with a timer as a workaround.
    zE('messenger:on', 'unreadMessages', (count: number) => {
      console.log('### use-zendesk-response-handler', {
        count,
      });

      if (!isMountedRef.current) {
        return;
      }

      // Clear any existing timeout
      if (responseTimeout) {
        clearTimeout(responseTimeout);
      }

      // Set timeout to call handler after messages are received
      // Delay allows for message rendering in DOM
      responseTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          handleResponseComplete();
        }
      }, 2000);
    });

    return () => {
      if (responseTimeout) {
        clearTimeout(responseTimeout);
      }
    };
  }, [zendeskReady, handleResponseComplete]);

  // Track mount state and cleanup observer on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (observerRef.current) {
        observerRef.current.disconnect();

        observerRef.current = null;
      }
    };
  }, []);
}
