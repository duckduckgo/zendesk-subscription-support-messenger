'use client';

import { useState } from 'react';
import Script from 'next/script';
import styles from './page.module.css';
import PageLoadPixel from '@/components/page-load-pixel/page-load-pixel';
import ConsentForm from '@/components/consent-form/consent-form';
import { useZendeskSwapArticleLinks } from '@/hooks/use-zendesk-swap-article-links';
import { useZendeskIframeStyles } from '@/hooks/use-zendesk-iframe-styles';
import { useZendeskClickHandlers } from '@/hooks/use-zendesk-click-handlers';
import { EMBEDDED_TARGET_ELEMENT, ZENDESK_SCRIPT_URL } from '@/config/zendesk';
import { SITE_TITLE } from '@/config/common';
import { ZENDESK_READY_DELAY_MS } from '@/constants/zendesk-timing';
import {
  ZENDESK_SEND_BUTTON_IDENTIFIER,
  ZENDESK_YES_BUTTON_IDENTIFIER,
  ZENDESK_NO_BUTTON_IDENTIFIER,
  ZENDESK_TALKTOAHUMAN_BUTTON_IDENTIFIER,
} from '@/constants/zendesk-selectors';
import { ZENDESK_IFRAME_STYLES } from '@/constants/zendesk-styles';

export default function Home() {
  const [zendeskReady, setZendeskReady] = useState(false);
  const [loadWidget, setLoadWidget] = useState(false);
  const [firstMessageSent, setFirstMessageSent] = useState(false);

  // Swap article links with custom URLs
  useZendeskSwapArticleLinks({
    zendeskReady,
  });

  // Add click handlers to Zendesk buttons and links
  useZendeskClickHandlers({
    zendeskReady,
    onButtonClick: (el) => {
      const { innerText, title } = el;

      // Check for first time `send` button clicks
      if (title === ZENDESK_SEND_BUTTON_IDENTIFIER && !firstMessageSent) {
        window.firePixelEvent?.('first-message');

        setFirstMessageSent(true);
      }

      // Check for `Yes` or `No` clicks when asked 'Was this helpful?'
      if (
        innerText === ZENDESK_YES_BUTTON_IDENTIFIER ||
        innerText === ZENDESK_NO_BUTTON_IDENTIFIER
      ) {
        window.firePixelEvent?.('button-click', {
          'button-query': 'Was-this-helpful',
          'button-text': innerText,
        });
      }

      // Check for `Talk to a human` button clicks
      if (innerText === ZENDESK_TALKTOAHUMAN_BUTTON_IDENTIFIER) {
        /* noop */
      }
    },
    // Handle KB link and 'Support Form' clicks
    onLinkClick: (el) => {
      // @note: if specifically targeting the support form link, use
      // `innerText.includes('Support form')`. ZD has a carriage return after
      // the text

      try {
        window.firePixelEvent?.('link-click', {
          slug: new URL(el.href).pathname,
        });
      } catch (error) {
        window.fireJse?.(error);
      }
    },
  });

  // Inject custom styles into Zendesk iframe
  useZendeskIframeStyles({
    zendeskReady,
    styles: ZENDESK_IFRAME_STYLES,
  });

  const handleOnError = (error: Error) => {
    window.fireJse?.(error);
  };

  const handleOnLoad = () => {
    try {
      // Set cookies and theme customization first
      zE('messenger:set', 'cookies', 'functional');
      zE('messenger:set', 'customization', {
        common: {
          hideHeader: true,
        },
        theme: {
          message: '#2B55CA',
          action: '#2B55CA',
          onAction: '#FAFAFA',
          businessMessage: '#FFFFFF',
          onBusinessMessage: '#222222',
          background: '#F2F2F2',
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
        setZendeskReady(true);
      }, ZENDESK_READY_DELAY_MS);
    } catch (error) {
      window.fireJse?.(error);
    }
  };

  return (
    <>
      <main className={styles.main}>
        {loadWidget && (
          <div className={`${styles.card} ${styles.target}`}>
            {!zendeskReady && (
              <div className={styles.spinnerContainer}>
                <div className={styles.spinner}></div>
              </div>
            )}
            {zendeskReady && (
              <div className={styles.chatCardHeader}>
                <p>{SITE_TITLE}</p>
              </div>
            )}
            <div
              className={styles.chatContent}
              id={EMBEDDED_TARGET_ELEMENT}
              style={{ display: zendeskReady ? 'block' : 'none' }}
            ></div>
          </div>
        )}

        {!loadWidget && <ConsentForm onContinue={() => setLoadWidget(true)} />}
      </main>
      {loadWidget && (
        <Script
          id="ze-snippet"
          src={ZENDESK_SCRIPT_URL}
          onLoad={() => handleOnLoad()}
          onError={(e) => handleOnError(e)}
        />
      )}
      <PageLoadPixel />
    </>
  );
}
