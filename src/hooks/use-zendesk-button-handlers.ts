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
  ZENDESK_INPUT_SELECTOR,
  ZENDESK_SEND_BUTTON_SELECTOR,
} from '@/constants/zendesk-selectors';
import { setupZendeskObserver } from '@/utils/zendesk-observer';

interface UseZendeskButtonHandlersOptions {
  zendeskReady: boolean;
  onButtonClick?: (
    element: HTMLButtonElement,
    event: MouseEvent | KeyboardEvent,
  ) => void;
  onLinkClick?: (element: HTMLAnchorElement, event: MouseEvent) => void;
}

// Tracks elements that have already had click handlers attached
const processedElements = new WeakSet<HTMLElement>();

// Tracks if textarea listener has been attached to avoid duplicates
const textareaListenerAttached = new WeakSet<HTMLTextAreaElement>();

type ClickHandlerOptions = {
  onButtonClick?: (
    element: HTMLButtonElement,
    /** KeyboardEvent needed for capturing return key for sending messages */
    event: MouseEvent | KeyboardEvent,
  ) => void;
  onLinkClick?: (element: HTMLAnchorElement, event: MouseEvent) => void;
};

/**
 * Adds click handlers to buttons and links within the Zendesk iframe
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

    const clickHandler = (event: MouseEvent) => {
      if (isLink && options.onLinkClick) {
        options.onLinkClick(element as HTMLAnchorElement, event);
      } else if (isButton && options.onButtonClick) {
        options.onButtonClick(element as HTMLButtonElement, event);
      }
    };

    // Add event listener in capture phase to intercept clicks before Zendesk's
    // handlers. Using capture to ensure handler runs before Zendesk's handlers
    element.addEventListener('click', clickHandler, { capture: true });

    // Mark as processed
    processedElements.add(element);
  });
}

/**
 * Sets up Enter key handler for textarea (sending messages)
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
      ZENDESK_INPUT_SELECTOR,
    );

    if (textarea && !textareaListenerAttached.has(textarea)) {
      const textareaKeydownHandler = (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
          try {
            const sendButton = iframeDoc.querySelector<HTMLButtonElement>(
              ZENDESK_SEND_BUTTON_SELECTOR,
            );

            if (sendButton && options.onButtonClick) {
              options.onButtonClick(sendButton, event);
            }
          } catch (error) {
            window.fireJse?.(
              new Error(
                `Error setting textarea keydown handler: ${JSON.stringify(error)}`,
              ),
            );
          }
        }
      };

      // Add event listener in capture phase to intercept clicks before
      // Zendesk's handlers
      textarea.addEventListener('keydown', textareaKeydownHandler, {
        capture: true,
      });

      // Mark as processed
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
 * Processes buttons and links in the Zendesk widget iframe. Only processes
 * elements that haven't been processed yet.
 *
 * @function processButtonsAndLinks
 * @param {ClickHandlerOptions} options - Handler callbacks
 * @param {Document} [iframeDoc] - Optional iframe document to use (avoids redundant lookup)
 *
 * @returns {Document | void}
 */
function processButtonsAndLinks(
  options: ClickHandlerOptions,
  iframeDoc?: Document,
): Document | void {
  // Use provided iframeDoc if available, otherwise fetch it
  const doc =
    iframeDoc ||
    (() => {
      const iframe = getMessagingIframe(null);

      if (!iframe) {
        return null;
      }

      return getMessagingIframeDocument(iframe);
    })();

  if (!doc) {
    return;
  }

  addClickHandlers(doc, options);
  setupTextareaEnterHandler(doc, options);

  return doc;
}

/**
 * Adds click handlers to Zendesk widget buttons and links.
 *
 * @param {UseZendeskButtonHandlersOptions['zendeskReady']} options.zendeskReady
 * - Whether the Zendesk widget is ready
 * @param {UseZendeskButtonHandlersOptions['onButtonClick']}
 * options.onButtonClick - Optional callback for button clicks (including Enter
 * key)
 * @param {UseZendeskButtonHandlersOptions['onLinkClick']} options.onLinkClick
 * - Optional callback for link clicks
 *
 * @example
 * ```ts
 * useZendeskButtonHandlers({
 *   zendeskReady,
 *   onButtonClick: (element, event) => {
 *     console.log('Button clicked:', element.innerText);
 *   },
 *   onLinkClick: (element, event) => {
 *     console.log('Link clicked:', element.href);
 *   },
 * });
 * ```
 */
export function useZendeskButtonHandlers({
  zendeskReady,
  onButtonClick,
  onLinkClick,
}: UseZendeskButtonHandlersOptions) {
  const observerRef = useRef<MutationObserver | null>(null);
  const processedRef = useRef(false);
  const isMountedRef = useRef(true);
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

    // Mark as mounted when effect runs
    isMountedRef.current = true;

    let timeout: ReturnType<typeof setTimeout> | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    let observerCleanup: (() => void) | null = null;

    // Process buttons/links with retry logic to handle delayed rendering
    const processWithRetry = () => {
      if (!isMountedRef.current) {
        return;
      }

      const iframeDoc = processButtonsAndLinks(optionsRef.current, undefined);

      // If no elements found and we haven't exceeded retries, try again
      if (!iframeDoc && retryCount < MAX_RETRIES_BUTTON_HANDLERS) {
        retryCount++;

        retryTimeout = setTimeout(() => {
          if (isMountedRef.current) {
            processWithRetry();
          }
        }, DOM_READY_DELAY_MS);
      } else {
        retryCount = 0;
      }
    };

    // Process buttons/links immediately when widget becomes ready to catch
    // previously rendered chat elements
    let initialProcessTimeout: ReturnType<typeof setTimeout> | null = null;

    if (!processedRef.current) {
      // Give the widget a moment to render, then start retry logic
      initialProcessTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          processWithRetry();

          processedRef.current = true;
        }
      }, INITIAL_RENDER_DELAY_MS);
    } else {
      // If already processed, still try once more in case new elements appeared
      if (isMountedRef.current) {
        processButtonsAndLinks(optionsRef.current);
      }
    }

    // Listen for new messages and process new buttons/links
    zE('messenger:on', 'unreadMessages', () => {
      // Clear any pending timeout
      if (timeout) {
        clearTimeout(timeout);
      }

      // Process new buttons/links after a short delay to allow DOM rendering
      timeout = setTimeout(() => {
        if (isMountedRef.current) {
          processButtonsAndLinks(optionsRef.current);
        }
      }, DOM_READY_DELAY_MS);
    });

    // Set up MutationObserver to watch for new buttons/links being added
    observerCleanup = setupZendeskObserver({
      onMutation: (iframeDoc) => {
        // Process new buttons/links when DOM changes Only new elements will be
        // processed (tracked via WeakSet)
        processButtonsAndLinks(optionsRef.current, iframeDoc);
      },
      onSetup: (iframeDoc) => {
        // Process existing elements immediately when observer is set up
        processButtonsAndLinks(optionsRef.current, iframeDoc);
      },
      target: 'body',
      retryOnNotReady: true,
      isMountedRef,
      observerRef,
    });

    return () => {
      // Mark as unmounted to prevent any async operations from continuing
      isMountedRef.current = false;

      // Clean up all timeouts
      if (initialProcessTimeout) {
        clearTimeout(initialProcessTimeout);
      }
      if (timeout) {
        clearTimeout(timeout);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
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
