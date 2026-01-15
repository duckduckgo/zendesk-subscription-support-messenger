import { useCallback, useEffect, useRef } from 'react';
import {
  getMessagingIframe,
  getMessagingIframeDocument,
} from '@/utils/zendesk-iframe';

interface UseZendeskIframeStylesOptions {
  /** Whether the Zendesk widget is ready */
  zendeskReady: boolean;
  /** CSS styles to inject into the iframe */
  styles: string;
}

/**
 * Hook that injects CSS styles into the Zendesk widget iframe.
 * Handles style injection when widget is ready and re-injects if iframe reloads.
 *
 * @param options - Configuration options
 * @param options.zendeskReady - Whether the Zendesk widget is ready
 * @param options.styles - CSS string to inject into the iframe
 */
export function useZendeskIframeStyles({
  zendeskReady,
  styles,
}: UseZendeskIframeStylesOptions) {
  const injectedRef = useRef(false);
  const styleElementRef = useRef<HTMLStyleElement | null>(null);
  const injectStylesRef = useRef<
    ((retries?: number, delay?: number) => void) | null
  >(null);

  /**
   * Injects styles into the Zendesk iframe document.
   * Retries if iframe is not yet available.
   */
  const injectStyles = useCallback(
    (retries = 5, delay = 500): void => {
      const iframe = getMessagingIframe(null);
      if (!iframe) {
        if (retries > 0) {
          setTimeout(
            () => injectStylesRef.current?.(retries - 1, delay),
            delay,
          );
        }
        return;
      }

      const iframeDoc = getMessagingIframeDocument(iframe);
      if (!iframeDoc) {
        if (retries > 0) {
          setTimeout(
            () => injectStylesRef.current?.(retries - 1, delay),
            delay,
          );
        }
        return;
      }

      // Check if styles are already injected
      if (
        styleElementRef.current &&
        iframeDoc.contains(styleElementRef.current)
      ) {
        return;
      }

      try {
        // Create style element
        const styleElement = iframeDoc.createElement('style');
        styleElement.textContent = styles;
        styleElement.setAttribute('data-zendesk-custom-styles', 'true');

        // Inject into iframe head
        iframeDoc.head.appendChild(styleElement);
        styleElementRef.current = styleElement;
        injectedRef.current = true;
      } catch (error) {
        window.fireJse?.(
          `Failed to inject styles into Zendesk iframe: ${JSON.stringify(error)}`,
        );
      }
    },
    [styles],
  );

  // Store the function reference in a ref so it can be called recursively
  // Must be done in an effect to avoid accessing refs during render
  useEffect(() => {
    injectStylesRef.current = injectStyles;
  }, [injectStyles]);

  useEffect(() => {
    if (!zendeskReady) {
      return;
    }

    // Inject styles when widget becomes ready
    if (!injectedRef.current) {
      setTimeout(() => {
        injectStyles();
      }, 1000);
    }

    // Set up MutationObserver to re-inject styles if iframe reloads
    const setupObserver = () => {
      const iframe = getMessagingIframe(null);
      if (!iframe) {
        return;
      }

      const iframeDoc = getMessagingIframeDocument(iframe);
      if (!iframeDoc) {
        return;
      }

      try {
        const observer = new MutationObserver(() => {
          // Check if style element was removed (iframe reloaded)
          if (
            styleElementRef.current &&
            !iframeDoc.contains(styleElementRef.current)
          ) {
            injectedRef.current = false;
            injectStyles();
          }
        });

        observer.observe(iframeDoc.head, {
          childList: true,
          subtree: true,
        });

        return () => {
          observer.disconnect();
        };
      } catch (error) {
        window.fireJse?.(
          `Could not set up MutationObserver for Zendesk iframe styles: ${JSON.stringify(error)}`,
        );
      }
    };

    // Set up observer after a delay to ensure iframe is ready
    const observerTimeout = setTimeout(() => {
      setupObserver();
    }, 1500);

    return () => {
      if (observerTimeout) {
        clearTimeout(observerTimeout);
      }
    };
  }, [zendeskReady, styles, injectStyles]);
}
