import { useEffect, useRef } from 'react';
import { DOM_READY_DELAY_MS } from '@/constants/zendesk-timing';
import {
  ZENDESK_ICON_BUTTON_DATA_ATTR,
  ZENDESK_INPUT_SELECTOR,
  ZENDESK_SEND_BUTTON_SELECTOR,
} from '@/constants/zendesk-selectors';
import { setupZendeskObserver } from '@/utils/zendesk-observer';

interface UseZendeskClickHandlersOptions {
  zendeskReady: boolean;
  onButtonClick?: (
    element: HTMLButtonElement,
    event: MouseEvent | KeyboardEvent,
  ) => void;
  onLinkClick?: (element: HTMLAnchorElement, event: MouseEvent) => void;
}

/**
 * Adds click handlers to Zendesk widget buttons and links.
 *
 * @function useZendeskClickHandlers
 * @param {UseZendeskClickHandlersOptions['zendeskReady']} options.zendeskReady
 * - Whether the Zendesk widget is ready
 * @param {UseZendeskClickHandlersOptions['onButtonClick']}
 * options.onButtonClick - Optional callback for button clicks (including Enter
 * key)
 * @param {UseZendeskClickHandlersOptions['onLinkClick']} options.onLinkClick
 * - Optional callback for link clicks
 *
 * @example
 * ```ts
 * useZendeskClickHandlers({
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
export function useZendeskClickHandlers({
  zendeskReady,
  onButtonClick,
  onLinkClick,
}: UseZendeskClickHandlersOptions) {
  const observerRef = useRef<MutationObserver | null>(null);
  const isMountedRef = useRef(true);
  const optionsRef = useRef<UseZendeskClickHandlersOptions>({
    zendeskReady,
    onButtonClick,
    onLinkClick,
  });
  // Track which documents we've attached handlers to (using WeakSet to avoid memory leaks)
  // Initialize WeakSets once per component instance - useRef only calls the initializer once
  const documentsWithClickHandler = useRef<WeakSet<Document>>(
    new WeakSet<Document>(),
  );

  const textareasWithHandler = useRef<WeakSet<HTMLTextAreaElement>>(
    new WeakSet<HTMLTextAreaElement>(),
  );

  // Keep options ref up to date
  useEffect(() => {
    optionsRef.current = { zendeskReady, onButtonClick, onLinkClick };
  }, [zendeskReady, onButtonClick, onLinkClick]);

  useEffect(() => {
    if (!zendeskReady) {
      return;
    }

    // Mark as mounted when effect runs
    isMountedRef.current = true;

    let observerCleanup: (() => void) | null = null;

    // Attach click handler
    const attachClickHandler = (iframeDoc: Document) => {
      // Skip if we've already attached to this document
      if (documentsWithClickHandler.current.has(iframeDoc)) {
        return;
      }

      iframeDoc.addEventListener(
        'click',
        (event) => {
          if (!isMountedRef.current) {
            return;
          }

          const target = event.target as HTMLElement | null;

          if (!target) {
            return;
          }

          // If click was on a link
          const anchor = target.closest('a');

          if (anchor && optionsRef.current.onLinkClick) {
            optionsRef.current.onLinkClick(
              anchor as HTMLAnchorElement,
              event as MouseEvent,
            );

            return;
          }

          // If click was on a button
          const button =
            target.closest('button') ||
            (target.getAttribute('data-garden-id') ===
            ZENDESK_ICON_BUTTON_DATA_ATTR
              ? target
              : null);

          if (button && optionsRef.current.onButtonClick) {
            optionsRef.current.onButtonClick(
              button as HTMLButtonElement,
              event as MouseEvent,
            );
          }
        },
        true, // Use capture
      );

      // Mark this document as having the handler attached
      documentsWithClickHandler.current.add(iframeDoc);
    };

    // Attach textarea Enter key handler
    const attachTextareaHandler = (iframeDoc: Document) => {
      if (!optionsRef.current.onButtonClick) {
        return;
      }

      try {
        const textarea = iframeDoc.querySelector<HTMLTextAreaElement>(
          ZENDESK_INPUT_SELECTOR,
        );

        // Skip if we've already attached to this textarea
        if (textarea && !textareasWithHandler.current.has(textarea)) {
          const textareaKeydownHandler = (event: KeyboardEvent) => {
            if (!isMountedRef.current) {
              return;
            }

            if (event.key === 'Enter') {
              try {
                const sendButton = iframeDoc.querySelector<HTMLButtonElement>(
                  ZENDESK_SEND_BUTTON_SELECTOR,
                );

                if (sendButton && optionsRef.current.onButtonClick) {
                  // Pass the KeyboardEvent to onButtonClick
                  optionsRef.current.onButtonClick(sendButton, event);
                }
              } catch (error) {
                window.fireJse?.(error);
              }
            }
          };

          textarea.addEventListener('keydown', textareaKeydownHandler, {
            capture: true,
          });

          // Mark this textarea as having the handler attached
          textareasWithHandler.current.add(textarea);
        }
      } catch (error) {
        window.fireJse?.(error);
      }
    };

    // Set up MutationObserver to attach generic click handlers
    observerCleanup = setupZendeskObserver({
      onMutation: (iframeDoc) => {
        // Re-attach handlers on DOM mutations in case iframe was reloaded
        // This ensures handlers persist even if Zendesk reloads the widget
        if (isMountedRef.current) {
          attachClickHandler(iframeDoc);
          attachTextareaHandler(iframeDoc);
        }
      },
      onSetup: (iframeDoc) => {
        // Attach handlers when observer is first set up
        attachClickHandler(iframeDoc);
        attachTextareaHandler(iframeDoc);

        // Retry textarea handler setup after a delay in case it's not ready yet
        setTimeout(() => {
          if (isMountedRef.current) {
            attachTextareaHandler(iframeDoc);
          }
        }, DOM_READY_DELAY_MS);
      },
      target: 'body',
      retryOnNotReady: true,
      isMountedRef,
      observerRef,
    });

    return () => {
      // Mark as unmounted to prevent any async operations from continuing
      isMountedRef.current = false;

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
