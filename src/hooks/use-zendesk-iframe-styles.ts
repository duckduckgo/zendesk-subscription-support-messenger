import { useCallback, useEffect, useRef } from 'react';
import {
  getMessagingIframe,
  getMessagingIframeDocument,
} from '@/utils/zendesk-iframe';
import {
  DOM_READY_DELAY_MS,
  INITIAL_RENDER_DELAY_MS,
  OBSERVER_SETUP_DELAY_MS,
  DEFAULT_MAX_RETRIES,
} from '@/constants/zendesk-timing';
import { setupZendeskObserver } from '@/utils/zendesk-observer';
import { ZENDESK_SEND_BUTTON_SELECTOR } from '@/constants/zendesk-selectors';
import {
  createRetryManager,
  scheduleCoordinatedRetry,
  markComponentMounted,
  markComponentUnmounted,
} from '@/utils/zendesk-retry-manager';

interface UseZendeskIframeStylesOptions {
  zendeskReady: boolean;
  styles: string;
}

/**
 * Injects CSS styles into the Zendesk widget iframe.
 *
 * @function useZendeskIframeStyles
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
  const observerRef = useRef<MutationObserver | null>(null);
  const buttonObserverRef = useRef<MutationObserver | null>(null);
  const isMountedRef = useRef(true);
  const retryManagerRef = useRef(createRetryManager());
  // Track buttons that have already had their SVG replaced to avoid duplicates
  const replacedButtonsRef = useRef<WeakSet<HTMLElement>>(
    new WeakSet<HTMLElement>(),
  );
  // Injects styles into the Zendesk iframe document. Returns true on success, false if not ready.
  const injectStyles = useCallback((): boolean => {
    // Check if component is still mounted
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

    // Check if styles are already injected and element still exists
    if (
      styleElementRef.current &&
      iframeDoc.contains(styleElementRef.current)
    ) {
      injectedRef.current = true;

      return true;
    }

    try {
      // Remove any existing style elements with our attribute to prevent duplicates
      const existingStyleElements = iframeDoc.querySelectorAll(
        'style[data-zendesk-custom-styles="true"]',
      );

      existingStyleElements.forEach((element) => {
        element.remove();
      });

      const styleElement = iframeDoc.createElement('style');

      styleElement.textContent = styles;
      styleElement.setAttribute('data-zendesk-custom-styles', 'true');

      // Inject into iframe head
      iframeDoc.head.appendChild(styleElement);

      styleElementRef.current = styleElement;
      injectedRef.current = true;

      return true;
    } catch (error) {
      window.fireJse?.(error);

      return false;
    }
  }, [styles]);

  // Replaces the SVG in the send button with a custom icon
  const replaceSendButtonSvg = useCallback((iframeDoc: Document): void => {
    try {
      // Find the send button using the proper selector
      const sendButton = iframeDoc.querySelector<HTMLElement>(
        ZENDESK_SEND_BUTTON_SELECTOR,
      );

      if (!sendButton) {
        return;
      }

      // Skip if we've already replaced this button's SVG
      if (replacedButtonsRef.current.has(sendButton)) {
        return;
      }

      const svg = sendButton.querySelector('svg');

      if (svg) {
        sendButton.dataset.customized = 'true';

        // Replace with external SVG file
        svg.outerHTML = `
          <img src="static-assets/images/Send-Plane-Solid-16.svg" 
               width="20" 
               height="20" 
               alt="Send" 
               style="display: block;" />
        `;

        // Mark this button as replaced
        replacedButtonsRef.current.add(sendButton);
      }
    } catch (error) {
      window.fireJse?.(error);
    }
  }, []);

  useEffect(() => {
    // Reset injection state when widget becomes unavailable
    // This ensures styles are re-injected when widget reloads
    if (!zendeskReady) {
      injectedRef.current = false;
      styleElementRef.current = null;
      replacedButtonsRef.current = new WeakSet<HTMLElement>();
      retryManagerRef.current.cancelRetry('style-injection');

      return;
    }

    // Capture ref value for use in cleanup
    const retryManager = retryManagerRef.current;

    // Mark as mounted when effect runs
    markComponentMounted(isMountedRef, retryManager);

    let injectStylesTimeout: ReturnType<typeof setTimeout> | null = null;
    let observerTimeout: ReturnType<typeof setTimeout> | null = null;

    // Inject styles when widget becomes ready
    // Always inject (or re-inject) when zendeskReady becomes true
    injectStylesTimeout = setTimeout(() => {
      if (!isMountedRef.current) {
        return;
      }

      const succeeded = injectStyles();

      if (!succeeded) {
        scheduleCoordinatedRetry(
          retryManager,
          'style-injection',
          injectStyles,
          isMountedRef,
          DEFAULT_MAX_RETRIES,
          DOM_READY_DELAY_MS,
        );
      }
    }, INITIAL_RENDER_DELAY_MS);

    // Set up MutationObserver to re-inject styles if iframe reloads
    let observerCleanup: (() => void) | null = null;
    let buttonObserverCleanup: (() => void) | null = null;

    // Set up observer after a delay to ensure iframe is ready
    observerTimeout = setTimeout(() => {
      if (!isMountedRef.current) {
        return;
      }

      // Observer for style injection (watches head)
      observerCleanup = setupZendeskObserver({
        onMutation: (iframeDoc) => {
          // Check if style element was removed (iframe reloaded)
          if (
            styleElementRef.current &&
            !iframeDoc.contains(styleElementRef.current)
          ) {
            injectedRef.current = false;

            const succeeded = injectStyles();

            if (!succeeded) {
              scheduleCoordinatedRetry(
                retryManager,
                'style-injection',
                injectStyles,
                isMountedRef,
                DEFAULT_MAX_RETRIES,
                DOM_READY_DELAY_MS,
              );
            }
          }
        },
        target: 'head',
        retryOnNotReady: false,
        isMountedRef,
        observerRef,
      });

      // Observer for send button SVG replacement (watches body)
      // The send button appears dynamically when user clicks in textarea
      buttonObserverCleanup = setupZendeskObserver({
        onMutation: (iframeDoc) => {
          // Try to replace SVG whenever DOM mutations occur
          replaceSendButtonSvg(iframeDoc);
        },
        onSetup: (iframeDoc) => {
          // Try immediately in case button already exists
          replaceSendButtonSvg(iframeDoc);
        },
        target: 'body',
        retryOnNotReady: false,
        isMountedRef,
        observerRef: buttonObserverRef,
      });
    }, OBSERVER_SETUP_DELAY_MS);

    return () => {
      // Mark as unmounted to prevent any async operations from continuing
      markComponentUnmounted(isMountedRef, retryManager);

      // Clean up timeouts
      if (injectStylesTimeout) {
        clearTimeout(injectStylesTimeout);
      }

      if (observerTimeout) {
        clearTimeout(observerTimeout);
      }

      // Clean up observers
      if (observerCleanup) {
        observerCleanup();
      }

      if (buttonObserverCleanup) {
        buttonObserverCleanup();
      }

      if (observerRef.current) {
        observerRef.current.disconnect();

        observerRef.current = null;
      }

      if (buttonObserverRef.current) {
        buttonObserverRef.current.disconnect();

        buttonObserverRef.current = null;
      }
    };
  }, [zendeskReady, styles, injectStyles, replaceSendButtonSvg]);
}
