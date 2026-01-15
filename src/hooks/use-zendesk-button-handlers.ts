import { useEffect, useRef } from 'react';
import {
  getMessagingIframe,
  getMessagingIframeDocument,
} from '@/utils/zendesk-iframe';

interface UseZendeskButtonHandlersOptions {
  zendeskReady: boolean;
  onButtonClick?: (element: HTMLButtonElement, event: MouseEvent) => void;
  onLinkClick?: (element: HTMLAnchorElement, event: MouseEvent) => void;
}

/**
 * Tracks elements that have already had click handlers attached.
 * Uses WeakSet to avoid memory leaks and allow garbage collection.
 */
const processedElements = new WeakSet<HTMLElement>();

/**
 * Options for adding click handlers (without zendeskReady)
 */
type ClickHandlerOptions = {
  onButtonClick?: (element: HTMLButtonElement, event: MouseEvent) => void;
  onLinkClick?: (element: HTMLAnchorElement, event: MouseEvent) => void;
};

/**
 * Adds click handlers to buttons and links with data-garden-id="buttons.button"
 * that haven't been processed yet.
 *
 * @function addClickHandlers
 * @param {Document} iframeDoc - The iframe document
 * @param {ClickHandlerOptions} options - Handler callbacks
 *
 * @returns {void}
 */
function addClickHandlers(
  iframeDoc: Document,
  options: ClickHandlerOptions,
): void {
  // Find all buttons and links with data-garden-id="buttons.button"
  const buttonsAndLinks = iframeDoc.querySelectorAll<HTMLElement>(
    '[data-garden-id="buttons.button"]',
  );

  buttonsAndLinks.forEach((element) => {
    // Skip if already processed
    if (processedElements.has(element)) {
      return;
    }

    // Determine if it's a button or link
    const isLink = element.tagName === 'A' || element.hasAttribute('href');
    const isButton =
      element.tagName === 'BUTTON' || element.getAttribute('type') === 'button';

    // Create click handler for mouse events
    const clickHandler = (event: MouseEvent) => {
      if (isLink && options.onLinkClick) {
        // Element is guaranteed to be an anchor when isLink is true
        options.onLinkClick(element as HTMLAnchorElement, event);
      } else if (isButton && options.onButtonClick) {
        // Element is guaranteed to be a button when isButton is true
        options.onButtonClick(element as HTMLButtonElement, event);
      }
    };

    // Create touch handler for mobile devices
    // Note: Modern mobile browsers fire 'click' events after touch events,
    // but we add touchstart as a fallback for better mobile support
    const touchHandler = (event: TouchEvent) => {
      // Only handle if it's the initial touch (not a move or multi-touch)
      if (event.touches.length === 1) {
        if (isLink && options.onLinkClick) {
          // Create a synthetic MouseEvent for consistency with click handler signature
          const syntheticEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: event.view,
            detail: 1,
          });
          // Element is guaranteed to be an anchor when isLink is true
          options.onLinkClick(element as HTMLAnchorElement, syntheticEvent);
        } else if (isButton && options.onButtonClick) {
          const syntheticEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: event.view,
            detail: 1,
          });
          // Element is guaranteed to be a button when isButton is true
          options.onButtonClick(element as HTMLButtonElement, syntheticEvent);
        }
      }
    };

    // Add event listeners - use capture phase to catch before Zendesk handlers
    element.addEventListener('click', clickHandler, { capture: true });

    // Also listen to touchstart for mobile devices (without preventDefault to preserve native behavior)
    // Modern browsers will fire both touchstart and click, but this ensures we catch touch events
    element.addEventListener('touchstart', touchHandler, { capture: true });

    // Mark as processed
    processedElements.add(element);
  });
}

/**
 * Processes buttons and links in the Zendesk widget iframe.
 * Only processes elements that haven't been processed yet.
 *
 * @function processButtonsAndLinks
 * @param {ClickHandlerOptions} options - Handler callbacks
 *
 * @returns {Document | void}
 */
function processButtonsAndLinks(options: ClickHandlerOptions): Document | void {
  const iframe = getMessagingIframe(null);

  if (!iframe) {
    return;
  }

  const iframeDoc = getMessagingIframeDocument(iframe);

  if (!iframeDoc) {
    return;
  }

  addClickHandlers(iframeDoc, options);

  return iframeDoc;
}

/**
 * Hook that adds click handlers to Zendesk widget buttons and links.
 * Processes elements when widget is ready and when new messages arrive.
 * Avoids adding duplicate handlers by tracking processed elements.
 */
export function useZendeskButtonHandlers({
  zendeskReady,
  onButtonClick,
  onLinkClick,
}: UseZendeskButtonHandlersOptions) {
  const observerRef = useRef<MutationObserver | null>(null);
  const processedRef = useRef(false);
  const optionsRef = useRef<ClickHandlerOptions>({
    onButtonClick,
    onLinkClick,
  });

  // Keep options ref up to date
  useEffect(() => {
    optionsRef.current = { onButtonClick, onLinkClick };
  }, [onButtonClick, onLinkClick]);

  useEffect(() => {
    if (!zendeskReady) {
      return;
    }

    let timeout: ReturnType<typeof setTimeout> | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    const maxRetries = 10;
    const retryDelay = 500;

    // Process buttons/links with retry logic to handle delayed rendering
    const processWithRetry = () => {
      const iframeDoc = processButtonsAndLinks(optionsRef.current);

      // If no elements found and we haven't exceeded retries, try again
      if (!iframeDoc && retryCount < maxRetries) {
        retryCount++;
        retryTimeout = setTimeout(() => {
          processWithRetry();
        }, retryDelay);
      } else {
        retryCount = 0;
      }
    };

    // Process buttons/links immediately when widget becomes ready
    // This handles embedded mode where messages are already visible
    if (!processedRef.current) {
      // Give the widget a moment to render, then start retry logic
      setTimeout(() => {
        processWithRetry();
        processedRef.current = true;
      }, 1000);
    } else {
      // If already processed, still try once more in case new elements appeared
      processButtonsAndLinks(optionsRef.current);
    }

    // Listen for new messages and process new buttons/links
    zE('messenger:on', 'unreadMessages', () => {
      // Clear any pending timeout
      if (timeout) {
        clearTimeout(timeout);
      }

      // Process new buttons/links after a short delay to allow DOM rendering
      timeout = setTimeout(() => {
        processButtonsAndLinks(optionsRef.current);
      }, 500);
    });

    // Set up MutationObserver to watch for new buttons/links being added
    // {@link https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver}
    const setupObserver = () => {
      const iframe = getMessagingIframe(null);

      if (!iframe) {
        // Retry observer setup if iframe not ready
        setTimeout(setupObserver, 500);
        return;
      }

      const iframeDoc = getMessagingIframeDocument(iframe);

      if (!iframeDoc) {
        // Retry observer setup if iframe document not ready
        setTimeout(setupObserver, 500);
        return;
      }

      // Clean up existing observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      try {
        // Process existing elements immediately when observer is set up
        processButtonsAndLinks(optionsRef.current);

        // Create new observer to watch for DOM changes
        observerRef.current = new MutationObserver(() => {
          // Process new buttons/links when DOM changes
          // Only new elements will be processed (tracked via WeakSet)
          processButtonsAndLinks(optionsRef.current);
        });

        // Start observing
        // {@link https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/observe}
        observerRef.current.observe(iframeDoc.body, {
          childList: true,
          subtree: true,
        });
      } catch (error) {
        // Cross-origin restrictions might prevent observing
        window.fireJse?.(
          new Error(
            `Could not set up MutationObserver for Zendesk iframe: ${JSON.stringify(error)}`,
          ),
        );
      }
    };

    // Set up observer immediately, with retry logic built in
    setupObserver();

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [zendeskReady]);
}
