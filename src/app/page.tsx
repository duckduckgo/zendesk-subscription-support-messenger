'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import styles from './page.module.css';
import PageLoadPixel from '@/components/page-load-pixel/page-load-pixel';
import { Button } from '@/components/button/button';
import { useZendeskResponseHandler } from '@/hooks/use-zendesk-response-handler';
import { useZendeskIframeStyles } from '@/hooks/use-zendesk-iframe-styles';
import { useZendeskButtonHandlers } from '@/hooks/use-zendesk-button-handlers';
import { EMBEDDED_TARGET_ELEMENT, ZENDESK_SCRIPT_URL } from '@/config/zendesk';
import { MAIN_SITE_URL, SITE_TITLE } from '@/config/common';
import { useIsTablet, useIsMobile } from '@/hooks/use-media-query';
import {
  REDIRECT_DELAY_MS,
  ZENDESK_READY_DELAY_MS,
} from '@/constants/zendesk-timing';
import {
  ZENDESK_SEND_BUTTON_IDENTIFIER,
  ZENDESK_BUTTON_DATA_ATTR,
  ZENDESK_COMPOSER_INPUT_SELECTOR,
  ZENDESK_YES_BUTTON_IDENTIFIER,
  ZENDESK_NO_BUTTON_IDENTIFIER,
  ZENDESK_TALKTOAHUMAN_BUTTON_IDENTIFIER,
} from '@/constants/zendesk-selectors';

export default function Home() {
  const [zendeskReady, setZendeskReady] = useState(false);
  const [loadWidget, setLoadWidget] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [firstMessageSent, setFirstMessageSent] = useState(false);
  const isTablet = useIsTablet();
  const isMobile = useIsMobile();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Set up response handler for updating article links
  useZendeskResponseHandler({
    zendeskReady,
  });

  // Add click handlers to Zendesk buttons and links
  useZendeskButtonHandlers({
    zendeskReady,
    onButtonClick: (el) => {
      const { innerText, title } = el;

      // Check for first time `send` button clicks
      if (title === ZENDESK_SEND_BUTTON_IDENTIFIER && !firstMessageSent) {
        console.log('### onButtonClick.send', {
          innerText,
          title,
        });

        setFirstMessageSent(true);
      }

      // Check for `Yes` or `No` clicks when asked 'Was this helpful?'
      if (
        innerText === ZENDESK_YES_BUTTON_IDENTIFIER ||
        innerText === ZENDESK_NO_BUTTON_IDENTIFIER
      ) {
        console.log('### onButtonClick.yes/no', {
          innerText,
          title,
        });
      }

      // Check for `Talk to a human` button clicks
      if (innerText === ZENDESK_TALKTOAHUMAN_BUTTON_IDENTIFIER) {
        console.log('### onButtonClick.talk', {
          innerText,
          title,
        });
      }
    },
    // Handle KB link and 'Support Form' clicks
    onLinkClick: (el) => {
      const { innerText, href } = el;

      // @note: if targeting the support form link, use `innerText.includes()`.
      // ZD has a carriage return after the text
      console.log('### onLinkClick', {
        href,
        innerText,
      });
    },
  });

  // Inject custom styles into Zendesk iframe
  useZendeskIframeStyles({
    zendeskReady,
    styles: `
      div[role="status"] + div {
        padding: 10px 1px;
        width: 95%;
        margin: 0 auto;
      }

      ${ZENDESK_COMPOSER_INPUT_SELECTOR} {
        border-radius: 8px;
        background-color: #FFFFFF;
      }

      ${ZENDESK_COMPOSER_INPUT_SELECTOR} textarea,
      ${ZENDESK_COMPOSER_INPUT_SELECTOR} textarea:active,
      ${ZENDESK_COMPOSER_INPUT_SELECTOR} textarea:focus,
      ${ZENDESK_COMPOSER_INPUT_SELECTOR} textarea:focus-visible,
      ${ZENDESK_COMPOSER_INPUT_SELECTOR} textarea:focus-within {
        border: 1px solid rgb(102, 102, 102) !important;
        border-color: rgb(102, 102, 102) !important;
        outline: none !important;
        box-shadow: none !important;
      }

      ${ZENDESK_COMPOSER_INPUT_SELECTOR}:focus-within,
      ${ZENDESK_COMPOSER_INPUT_SELECTOR}:has(textarea:focus),
      ${ZENDESK_COMPOSER_INPUT_SELECTOR}:has(textarea:active) {
        border: 1px solid rgb(102, 102, 102) !important;
        border-color: rgb(102, 102, 102) !important;
        box-shadow: none !important;
      }

      div[role="dialog"][aria-label="Messaging window"] {
        border: none;
        border-radius: 8px;
      }

      ul:has(button[data-garden-id="${ZENDESK_BUTTON_DATA_ATTR}"]) {
        max-width: unset;
        justify-content: center;
      }
    `,
  });

  const handleOnError = (error: Error) => {
    window.fireJse?.(
      new Error(`Failed to load Zendesk: ${JSON.stringify(error)}`),
    );
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
      window.fireJse?.(
        new Error(
          `Error initializing messenger settings: ${JSON.stringify(error)}`,
        ),
      );
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

        {!loadWidget && (
          <>
            <h1
              className={`${styles.mainHeading} ${
                mounted && isMobile ? styles.mainHeadingMobile : ''
              }`}
            >
              Before You Continue
            </h1>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <p>By continuing, you agree to the following:</p>
              </div>

              <div className={styles.content}>
                <div className={styles.section}>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Maecenas sed augue dictum, placerat arcu nec, rutrum eros.
                    Etiam fringilla malesuada dui eget viverra. Donec porta quam
                    sed lacus pulvinar, et consectetur enim venenatis.
                    Pellentesque non orci dictum, ultricies metus ac, blandit
                    est. Duis fermentum felis orci, at hendrerit tellus
                    efficitur viverra. Integer suscipit condimentum nunc, nec
                    vehicula nibh accumsan sit amet. Sed dolor elit, placerat
                    nec neque eget, cursus ullamcorper justo. Nunc facilisis
                    urna et lacus feugiat pretium. Etiam elementum nunc vel
                    lacinia dapibus. Donec non luctus lacus. Aliquam et eleifend
                    felis. Phasellus in odio tortor. Morbi sed diam vitae libero
                    condimentum maximus vitae vitae nulla. Sed risus velit,
                    eleifend vitae ligula suscipit, sollicitudin posuere mauris.
                    Donec ut lobortis augue. Donec et nisl malesuada nibh
                    iaculis imperdiet. Aliquam justo tortor, porttitor eu lacus
                    quis, mattis interdum est. Etiam eleifend nisl vel porttitor
                    scelerisque. Cras a sapien faucibus, euismod arcu at,
                    scelerisque elit. Sed at nulla nulla. Sed vitae tellus
                    euismod, sollicitudin odio eu, interdum lorem. Donec
                    dignissim molestie imperdiet. Maecenas eu arcu in mi
                    dignissim ornare. Pellentesque in ante eleifend, maximus
                    odio augue elit congue nisl, quis porta neque nunc non elit.
                  </p>
                  <p>
                    Pellentesque posuere tellus ut aliquam pulvinar. Aliquam
                    erat volutpat. Aliquam ac libero cursus, ultricies sem id,
                    dapibus libero. Vestibulum ac ex et sapien bibendum
                    bibendum. Nulla eleifend mauris nulla, non mattis ipsum
                    pellentesque in. Integer lobortis mattis turpis, non
                    dignissim justo efficitur eu. Ut et pretium libero.
                    Curabitur bibendum blandit vehicula. Curabitur interdum sem
                    id suscipit tincidunt. Integer non velit arcu. Nullam
                    lacinia vehicula felis eu vulputate. Vivamus rhoncus tempor
                    orci. Etiam mi lorem, tempor a nulla sollicitudin, dictum
                    aliquet turpis. Pellentesque sit amet est massa. Nullam
                    elementum porttitor nisl, vitae iaculis eros maximus ac.
                    Donec sapien libero, gravida sit amet risus id, vulputate
                    gravida dui. Lorem ipsum dolor sit amet, consectetur
                    adipiscing elit.
                  </p>
                </div>
              </div>

              <div
                className={`${styles.buttonGroup} ${
                  mounted && isTablet ? styles.buttonGroupMobile : ''
                }`}
              >
                <Button
                  text="Cancel"
                  skipBaseStyles
                  className={`${styles.button} ${styles.cancelButton}`}
                  onClick={() => {
                    // allow time for a pixel to fire before redirecting
                    setTimeout(() => {
                      window.location.href = `${MAIN_SITE_URL}/subscription-support`;
                    }, REDIRECT_DELAY_MS);
                  }}
                />
                <Button
                  text="Continue to Chat"
                  skipBaseStyles
                  className={`${styles.button} ${styles.continueButton}`}
                  onClick={() => setLoadWidget(true)}
                />
              </div>
            </div>
          </>
        )}
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
