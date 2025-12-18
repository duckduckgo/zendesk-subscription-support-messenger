import { useEffect } from 'react';
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
 * Hook that updates article links in Zendesk widget responses.
 * Processes links when new messages arrive.
 */
export function useZendeskResponseHandler({
  zendeskReady,
}: UseZendeskResponseHandlerOptions) {
  useEffect(() => {
    if (!zendeskReady) {
      return;
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
        const iframe = getMessagingIframe(null);
        if (!iframe) {
          return;
        }

        const iframeDoc = getMessagingIframeDocument(iframe);
        if (!iframeDoc) {
          return;
        }

        // Process links with article IDs
        updateArticleLinks(iframeDoc, ARTICLE_LINK_MAP, ZENDESK_BASE_URL);
      }, 500);
    });

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [zendeskReady]);
}
