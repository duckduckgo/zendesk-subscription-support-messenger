'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import styles from './page.module.css';
import PageLoadPixel from '@/components/page-load-pixel/page-load-pixel';
import ConsentForm from '@/components/consent-form/consent-form';
import MainHeading from '@/components/main-heading/main-heading';
import FireButton from '@/components/fire-button/fire-button';
import BurnOverlay from '@/components/burn-animation/burn-overlay';
import HorizontalRule from '@/components/horizontal-rule/horizontal-rule';
import ChatNavigation from '@/components/chat-navigation/chat-navigation';
import ConfirmDialog from '@/components/confirm-dialog/confirm-dialog';
import { useZendeskSwapArticleLinks } from '@/hooks/use-zendesk-swap-article-links';
import { useZendeskIframeStyles } from '@/hooks/use-zendesk-iframe-styles';
import { useZendeskClickHandlers } from '@/hooks/use-zendesk-click-handlers';
import {
  CONSENT_STORAGE_KEY,
  CONSENT_STORAGE_TTL,
  EMBEDDED_TARGET_ELEMENT,
} from '@/config/common';
import { ZENDESK_SCRIPT_URL } from '@/config/zendesk';
import {
  ZENDESK_READY_DELAY_MS,
  ZENDESK_RESET_DELAY_MS,
  SCRIPT_CHECK_INTERVAL_MS,
} from '@/constants/zendesk-timing';
import {
  ZENDESK_SEND_BUTTON_IDENTIFIER,
  ZENDESK_YES_BUTTON_IDENTIFIER,
  ZENDESK_NO_BUTTON_IDENTIFIER,
  ZENDESK_SCRIPT_TAG_ID,
} from '@/constants/zendesk-selectors';
import { ZENDESK_IFRAME_STYLES } from '@/constants/zendesk-styles';
import { getCSSVariable } from '@/utils/get-css-variable';
import { getSlugFromUrl } from '@/utils/get-slug-from-url';
import { widgetReducer, initialWidgetState } from '@/reducers/widget-reducer';
import { setStorageWithExpiry } from '@/utils/set-storage-with-expiry';
import { deleteStorageKeysBySuffix } from '@/utils/delete-storage-keys-by-suffix';
import { cleanupZendesk } from '@/utils/cleanup-zendesk';

export default function Home() {
  const [widgetState, dispatch] = useReducer(widgetReducer, initialWidgetState);
  const { zendeskReady, loadWidget, firstMessageSent } = widgetState;
  const [isBurning, setIsBurning] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const scriptLoadedRef = useRef(false);
  const initializeZendeskRef = useRef<((retries?: number) => void) | null>(
    null,
  );
  const isMountedRef = useRef(true);
  const initializeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const readyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onContinue = useCallback(() => {
    window.firePixelEvent?.('consent');

    setStorageWithExpiry(CONSENT_STORAGE_KEY, true, CONSENT_STORAGE_TTL);

    dispatch({ type: 'SET_LOAD_WIDGET' });
  }, [dispatch]);

  // Swap ZD article link URLs for help page URLs
  useZendeskSwapArticleLinks({
    zendeskReady,
  });

  // Add click handlers to Zendesk buttons and links to facilitate sending
  // pixels. For more information about the pixels we're sending see {@link
  // https://app.asana.com/1/137249556945/project/1211050482669423/task/1212831137706946?focus=true}
  useZendeskClickHandlers({
    zendeskReady,
    onButtonClick: (el) => {
      const { innerText, title } = el;

      // Check for first time `send` button clicks
      if (title === ZENDESK_SEND_BUTTON_IDENTIFIER && !firstMessageSent) {
        window.firePixelEvent?.('message_first');

        dispatch({ type: 'SET_FIRST_MESSAGE_SENT' });
      }

      // Check for `Yes` or `No` clicks when asked 'Was this helpful?'
      if (
        innerText === ZENDESK_YES_BUTTON_IDENTIFIER ||
        innerText === ZENDESK_NO_BUTTON_IDENTIFIER
      ) {
        window.firePixelEvent?.(`helpful_${innerText.toLowerCase()}`);
      }
    },
    // Handle KB link and 'Support Form' clicks
    onLinkClick: (el) => {
      // @note: using `includes()` to handle hidden character after "Form" on
      // the Zendesk button along with `toLowerCase()` to handle case variations
      if (el.innerText.toLowerCase().includes('support form')) {
        window.firePixelEvent?.('link_ticket');
      } else {
        try {
          window.firePixelEvent?.(`helplink_${getSlugFromUrl(el.href)}`);
        } catch (error) {
          window.fireJse?.(error);
        }
      }
    },
  });

  // Inject custom styles into Zendesk iframe
  useZendeskIframeStyles({
    zendeskReady,
    styles: ZENDESK_IFRAME_STYLES,
  });

  const handleFireButtonClick = useCallback(() => {
    setShowConfirmDialog(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    // Close dialog
    setShowConfirmDialog(false);

    // Start the burn animation
    setIsBurning(true);

    setTimeout(() => {
      // Reset Zendesk widget
      zE('messenger', 'resetWidget', function () {
        // `resetWidget` clears all but the clientId
        deleteStorageKeysBySuffix('.clientId');
        // clear `ZD-widgetOpen`
        sessionStorage.clear();

        // Clean up all Zendesk DOM elements, scripts, and globals
        cleanupZendesk();

        // Reset state to clear UI elements
        dispatch({ type: 'RESET_STATE' });

        // Reset script loaded flag so script will reload on next mount
        scriptLoadedRef.current = false;
      });
    }, ZENDESK_RESET_DELAY_MS);
  }, [dispatch]);

  const handleCancelDelete = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  const handleBurnComplete = useCallback(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });

    // Stop burn animation
    setIsBurning(false);
  }, []);

  const initializeZendesk = useCallback(
    (retries = 5) => {
      // Clear any existing timeout to prevent duplicates
      if (initializeTimeoutRef.current) {
        clearTimeout(initializeTimeoutRef.current);

        initializeTimeoutRef.current = null;
      }

      // Wait a bit to ensure zE is available and messaging-container exists
      initializeTimeoutRef.current = setTimeout(() => {
        // Check if component is still mounted before proceeding
        if (!isMountedRef.current) {
          return;
        }

        try {
          // Check if messaging-container exists
          const messagingContainer = document.getElementById(
            EMBEDDED_TARGET_ELEMENT,
          );

          if (!messagingContainer) {
            if (retries > 0) {
              initializeZendeskRef.current?.(retries - 1);
            }

            return;
          }

          // Check if zE exists (script might not have initialized yet)
          if (typeof zE === 'undefined') {
            if (retries > 0) {
              initializeZendeskRef.current?.(retries - 1);
            }

            return;
          }

          // Set cookies and theme customization first
          zE('messenger:set', 'cookies', 'functional');
          zE('messenger:set', 'customization', {
            common: {
              hideHeader: true,
            },
            theme: {
              message: getCSSVariable('--sds-color-palette-blue-60'),
              action: getCSSVariable('--sds-color-palette-blue-60'),
              onAction: '#FAFAFA',
              businessMessage: '#F2F2F2', // Chat response background
              onBusinessMessage: getCSSVariable('--sds-color-text-01'),
              background: 'transparent', // Chat window background
              onBackground: '#666666',
              error: '#FF1744',
              onError: '#FFFFFF',
              notify: '#FF007F',
              onNotify: '#FFFFFF',
            },
          });

          // Render the embedded messenger
          zE('messenger', 'render', {
            mode: 'embedded',
            widget: {
              targetElement: `#${EMBEDDED_TARGET_ELEMENT}`,
            },
          });

          // Clear any existing ready timeout
          if (readyTimeoutRef.current) {
            clearTimeout(readyTimeoutRef.current);

            readyTimeoutRef.current = null;
          }

          // Set ready after a delay to allow widget to render
          readyTimeoutRef.current = setTimeout(() => {
            // Check if component is still mounted before dispatching
            if (isMountedRef.current) {
              dispatch({ type: 'SET_ZENDESK_READY' });
            }

            readyTimeoutRef.current = null;
          }, ZENDESK_READY_DELAY_MS);
        } catch (error) {
          window.fireJse?.(error);
        }

        initializeTimeoutRef.current = null;
      }, SCRIPT_CHECK_INTERVAL_MS);
    },
    [dispatch],
  );

  // Store initializeZendesk in a ref to enable recursive calls
  useEffect(() => {
    initializeZendeskRef.current = initializeZendesk;
  }, [initializeZendesk]);

  // Cleanup timeouts and mark as unmounted when component unmounts
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      // Mark as unmounted to prevent any async operations from continuing
      isMountedRef.current = false;

      // Clean up timeouts
      if (initializeTimeoutRef.current) {
        clearTimeout(initializeTimeoutRef.current);
        initializeTimeoutRef.current = null;
      }

      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
        readyTimeoutRef.current = null;
      }
    };
  }, []);

  // Manually load Zendesk script when loadWidget becomes true
  useEffect(() => {
    if (!loadWidget || scriptLoadedRef.current) {
      return;
    }

    // Check if script already exists
    const existingScript = document.getElementById(ZENDESK_SCRIPT_TAG_ID);
    if (existingScript) {
      // Script already exists, just initialize
      initializeZendesk();
      scriptLoadedRef.current = true;
      return;
    }

    // Create and inject script tag manually
    const script = document.createElement('script');
    script.id = ZENDESK_SCRIPT_TAG_ID;
    script.src = ZENDESK_SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      scriptLoadedRef.current = true;
      initializeZendesk();
    };

    script.onerror = () => {
      window.fireJse?.(new Error('Failed to load Zendesk script'));
    };

    document.head.appendChild(script);
  }, [loadWidget, initializeZendesk]);

  return (
    <>
      {isBurning && <BurnOverlay onComplete={handleBurnComplete} />}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      <main id="main-content" className={styles.main}>
        <MainHeading />
        {loadWidget && (
          <div className={`${styles.card} ${styles.target}`}>
            {!zendeskReady && (
              <div
                className={styles.spinnerContainer}
                role="status"
                aria-live="polite"
                aria-label="Loading chat widget"
              >
                <div className={styles.spinner} aria-hidden="true"></div>
              </div>
            )}
            <div
              className={styles.chatContent}
              id={EMBEDDED_TARGET_ELEMENT}
              role="region"
              aria-label="Support Chat"
              aria-live="polite"
              style={{ display: zendeskReady ? 'block' : 'none' }}
            ></div>
            {zendeskReady && (
              <>
                <HorizontalRule />
                <div className={styles.chatFooter}>
                  <ChatNavigation />
                  <FireButton
                    appearance="button"
                    onClick={handleFireButtonClick}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {!loadWidget && <ConsentForm onContinue={onContinue} />}
      </main>
      <PageLoadPixel />
    </>
  );
}
