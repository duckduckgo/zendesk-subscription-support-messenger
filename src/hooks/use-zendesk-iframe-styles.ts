import { useCallback, useEffect, useRef } from 'react';
import {
  getMessagingIframe,
  getMessagingIframeDocument,
} from '@/utils/zendesk-iframe';
import {
  DOM_READY_DELAY_MS,
  INITIAL_RENDER_DELAY_MS,
  OBSERVER_SETUP_DELAY_MS,
  MAX_RETRIES_STANDARD,
} from '@/constants/zendesk-timing';
import { setupZendeskObserver } from '@/utils/zendesk-observer';

interface UseZendeskIframeStylesOptions {
  zendeskReady: boolean;
  styles: string;
}

/**
 * Injects CSS styles into the Zendesk widget iframe.
 *
 * @param {UseZendeskIframeStylesOptions['zendeskReady']} options.zendeskReady
 * - Indicates widget is available
 * @param {UseZendeskIframeStylesOptions['styles']} options.styles - styles to
 * inject into iframe
 *
 * @example
 * ```ts
 * useZendeskIframeStyles({
 *   zendeskReady,
 *   styles: `
 *     .custom-class {
 *       color: red;
 *     }
 *   `,
 * });
 * ```
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
  const observerRef = useRef<MutationObserver | null>(null);
  const isMountedRef = useRef(true);

  // Injects styles into the Zendesk iframe document. Retries if iframe is not
  // available yet.
  const injectStyles = useCallback(
    (retries = MAX_RETRIES_STANDARD, delay = DOM_READY_DELAY_MS): void => {
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
        const styleElement = iframeDoc.createElement('style');

        styleElement.textContent = styles;
        styleElement.setAttribute('data-zendesk-custom-styles', 'true');

        // Inject into iframe head
        iframeDoc.head.appendChild(styleElement);

        styleElementRef.current = styleElement;
        injectedRef.current = true;
      } catch (error) {
        window.fireJse?.(error);
      }
    },
    [styles],
  );

  // Store `injectStyles` in a ref to enable recursive calls. ESLint flags
  // self-referential calls within useCallback
  useEffect(() => {
    injectStylesRef.current = injectStyles;
  }, [injectStyles]);

  useEffect(() => {
    if (!zendeskReady) {
      return;
    }

    // Mark as mounted when effect runs
    isMountedRef.current = true;

    let injectStylesTimeout: ReturnType<typeof setTimeout> | null = null;
    let observerTimeout: ReturnType<typeof setTimeout> | null = null;

    // Inject styles when widget becomes ready
    if (!injectedRef.current) {
      injectStylesTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          injectStyles();
        }
      }, INITIAL_RENDER_DELAY_MS);
    }

    // Set up MutationObserver to re-inject styles if iframe reloads
    let observerCleanup: (() => void) | null = null;

    // Set up observer after a delay to ensure iframe is ready
    observerTimeout = setTimeout(() => {
      if (!isMountedRef.current) {
        return;
      }

      observerCleanup = setupZendeskObserver({
        onMutation: (iframeDoc) => {
          // Check if style element was removed (iframe reloaded)
          if (
            styleElementRef.current &&
            !iframeDoc.contains(styleElementRef.current)
          ) {
            injectedRef.current = false;
            injectStyles();
          }
        },
        target: 'head',
        retryOnNotReady: false,
        isMountedRef,
        observerRef,
      });
    }, OBSERVER_SETUP_DELAY_MS);

    return () => {
      // Mark as unmounted to prevent any async operations from continuing
      isMountedRef.current = false;

      // Clean up timeouts
      if (injectStylesTimeout) {
        clearTimeout(injectStylesTimeout);
      }

      if (observerTimeout) {
        clearTimeout(observerTimeout);
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
  }, [zendeskReady, styles, injectStyles]);
}
