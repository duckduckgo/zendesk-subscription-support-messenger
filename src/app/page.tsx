'use client';

import { useCallback, useReducer, useState } from 'react';
import Script from 'next/script';
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
import { EMBEDDED_TARGET_ELEMENT } from '@/config/common';
import { ZENDESK_SCRIPT_URL } from '@/config/zendesk';
import {
  ZENDESK_READY_DELAY_MS,
  ZENDESK_RESET_DELAY_MS,
} from '@/constants/zendesk-timing';
import {
  ZENDESK_SEND_BUTTON_IDENTIFIER,
  ZENDESK_YES_BUTTON_IDENTIFIER,
  ZENDESK_NO_BUTTON_IDENTIFIER,
} from '@/constants/zendesk-selectors';
import { ZENDESK_IFRAME_STYLES } from '@/constants/zendesk-styles';
import { getCSSVariable } from '@/utils/get-css-variable';
import { getSlugFromUrl } from '@/utils/get-slug-from-url';
import { widgetReducer, initialWidgetState } from '@/reducers/widget-reducer';

export default function Home() {
  const [widgetState, dispatch] = useReducer(widgetReducer, initialWidgetState);
  const { zendeskReady, loadWidget, firstMessageSent } = widgetState;
  const [isBurning, setIsBurning] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const onContinue = useCallback(() => {
    window.firePixelEvent?.('consent');

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
        localStorage.clear();
        // clear `ZD-widgetOpen`
        sessionStorage.clear();

        // Reset state to clear UI elements
        dispatch({ type: 'RESET_STATE' });
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

    window.location.reload();
  }, []);

  const handleOnError = useCallback((e: Error) => {
    window.fireJse?.(e);
  }, []);

  const handleOnLoad = useCallback(() => {
    try {
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

      // Set ready after a delay to allow widget to render
      setTimeout(() => {
        dispatch({ type: 'SET_ZENDESK_READY' });
      }, ZENDESK_READY_DELAY_MS);
    } catch (error) {
      window.fireJse?.(error);
    }
  }, [dispatch]);

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
      {loadWidget && (
        <Script
          id="ze-snippet"
          src={ZENDESK_SCRIPT_URL}
          onLoad={handleOnLoad}
          onError={handleOnError}
        />
      )}
      <PageLoadPixel />
    </>
  );
}
