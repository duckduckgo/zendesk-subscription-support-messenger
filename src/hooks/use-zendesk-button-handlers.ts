import { useEffect, useRef } from 'react';
import {
  getMessagingIframe,
  getMessagingIframeDocument,
} from '@/utils/zendesk-iframe';
import {
  DOM_READY_DELAY_MS,
  INITIAL_RENDER_DELAY_MS,
  MAX_RETRIES_BUTTON_HANDLERS,
} from '@/constants/zendesk-timing';
import {
  ZENDESK_BUTTON_SELECTOR,
  ZENDESK_ICON_BUTTON_DATA_ATTR,
  ZENDESK_COMPOSER_INPUT_SELECTOR,
  ZENDESK_SEND_BUTTON_SELECTOR,
} from '@/constants/zendesk-selectors';

interface UseZendeskButtonHandlersOptions {
  zendeskReady: boolean;
  onButtonClick?: (
    element: HTMLButtonElement,
    event: MouseEvent | KeyboardEvent,
  ) => void;
  onLinkClick?: (element: HTMLAnchorElement, event: MouseEvent) => void;
}

/**
 * Tracks elements that have already had click handlers attached.
 * Uses WeakSet to avoid memory leaks and allow garbage collection.
 */
const processedElements = new WeakSet<HTMLElement>();

/**
 * Tracks if textarea listener has been attached to avoid duplicates.
 */
const textareaListenerAttached = new WeakSet<HTMLTextAreaElement>();

/**
 * Options for adding click handlers (without zendeskReady)
 */
type ClickHandlerOptions = {
  onButtonClick?: (
    element: HTMLButtonElement,
    event: MouseEvent | KeyboardEvent,
  ) => void;
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
  // Find all buttons and links with data-garden-id="buttons.button" or "buttons.icon_button"
  const buttonsAndLinks = iframeDoc.querySelectorAll<HTMLElement>(
    ZENDESK_BUTTON_SELECTOR,
  );

  buttonsAndLinks.forEach((element) => {
    // Skip if already processed
    if (processedElements.has(element)) {
      return;
    }

    // Determine if it's a button or link
    const isLink = element.tagName === 'A' || element.hasAttribute('href');
    const isButton =
      element.tagName === 'BUTTON' ||
      element.getAttribute('type') === 'button' ||
      element.getAttribute('data-garden-id') === ZENDESK_ICON_BUTTON_DATA_ATTR;

    // Create click handler
    // Modern browsers automatically fire 'click' events after touch events on mobile devices
    const clickHandler = (event: MouseEvent) => {
      if (isLink && options.onLinkClick) {
        // Element is guaranteed to be an anchor when isLink is true
        options.onLinkClick(element as HTMLAnchorElement, event);
      } else if (isButton && options.onButtonClick) {
        // Element is guaranteed to be a button when isButton is true
        options.onButtonClick(element as HTMLButtonElement, event);
      }
    };

    // Add event listener - use capture phase to catch before Zendesk handlers
    element.addEventListener('click', clickHandler, { capture: true });

    // Mark as processed
    processedElements.add(element);
  });
}

/**
 * Sets up Enter key handler for textarea to trigger send button
 *
 * @function setupTextareaEnterHandler
 * @param {Document} iframeDoc - The iframe document
 * @param {ClickHandlerOptions} options - Handler callbacks
 *
 * @returns {void}
 */
function setupTextareaEnterHandler(
  iframeDoc: Document,
  options: ClickHandlerOptions,
): void {
  if (!options.onButtonClick) {
    return;
  }

  try {
    if (!iframeDoc || typeof iframeDoc.querySelector !== 'function') {
      return;
    }

    const textarea = iframeDoc.querySelector<HTMLTextAreaElement>(
      ZENDESK_COMPOSER_INPUT_SELECTOR,
    );

    if (textarea && !textareaListenerAttached.has(textarea)) {
      const textareaKeydownHandler = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.keyCode === 13) {
          // Don't prevent default - let Zendesk handle the message sending
          // Just trigger our tracking handler
          try {
            // Find the send button (icon button)
            const sendButton = iframeDoc.querySelector<HTMLButtonElement>(
              ZENDESK_SEND_BUTTON_SELECTOR,
            );

            if (sendButton && options.onButtonClick) {
              // Pass the original KeyboardEvent directly
              // The callback signature accepts MouseEvent | KeyboardEvent
              options.onButtonClick(sendButton, event);
            }
          } catch (error) {
            window.fireJse?.(
              new Error(
                `Error in textarea Enter handler: ${JSON.stringify(error)}`,
              ),
            );
          }
        }
      };

      textarea.addEventListener('keydown', textareaKeydownHandler, {
        capture: true,
      });

      textareaListenerAttached.add(textarea);
    }
  } catch (error) {
    window.fireJse?.(
      new Error(
        `Error setting up textarea Enter handler: ${JSON.stringify(error)}`,
      ),
    );
  }
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
  setupTextareaEnterHandler(iframeDoc, options);

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

    // Process buttons/links with retry logic to handle delayed rendering
    const processWithRetry = () => {
      const iframeDoc = processButtonsAndLinks(optionsRef.current);

      // If no elements found and we haven't exceeded retries, try again
      if (!iframeDoc && retryCount < MAX_RETRIES_BUTTON_HANDLERS) {
        retryCount++;

        retryTimeout = setTimeout(() => {
          processWithRetry();
        }, DOM_READY_DELAY_MS);
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
      }, INITIAL_RENDER_DELAY_MS);
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
      }, DOM_READY_DELAY_MS);
    });

    // Set up MutationObserver to watch for new buttons/links being added
    // {@link https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver}
    const setupObserver = () => {
      const iframe = getMessagingIframe(null);

      if (!iframe) {
        // Retry observer setup if iframe not ready
        setTimeout(setupObserver, DOM_READY_DELAY_MS);

        return;
      }

      const iframeDoc = getMessagingIframeDocument(iframe);

      if (!iframeDoc) {
        // Retry observer setup if iframe document not ready
        setTimeout(setupObserver, DOM_READY_DELAY_MS);

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
