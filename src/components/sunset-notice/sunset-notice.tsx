'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/button/button';
import {
  SUNSET_HEADING,
  SUNSET_REDIRECT_SECONDS,
  SUNSET_REDIRECT_URL,
} from '@/config/common';
import {
  SUNSET_REDIRECT_LINK_TEST_ID,
  SUNSET_STAY_BUTTON_TEST_ID,
} from '@/constants/test-ids';
import styles from './sunset-notice.module.css';

/**
 * Notice shown while the service is being sunsetted. Counts down and then
 * redirects to the subscription support page.
 *
 * Accessibility notes (WCAG 2.2.1 Timing Adjustable, 3.2.5 Change on Request):
 * - The redirect waits 20 seconds, the minimum WCAG uses for a warned timeout
 * - Users can stop the redirect with a single action ("Stay on this page")
 * - A plain link to the destination is always available, including without JS
 * - The per-second countdown is not a live region, so screen readers are not
 *   interrupted every second. Only state changes are announced.
 */
export default function SunsetNotice() {
  const [secondsLeft, setSecondsLeft] = useState(SUNSET_REDIRECT_SECONDS);
  const [isCanceled, setIsCanceled] = useState(false);

  useEffect(() => {
    if (isCanceled) {
      return;
    }

    if (secondsLeft <= 0) {
      window.location.assign(SUNSET_REDIRECT_URL);

      return;
    }

    const timeoutId = setTimeout(() => {
      setSecondsLeft((seconds) => seconds - 1);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [secondsLeft, isCanceled]);

  const secondsLabel = secondsLeft === 1 ? 'second' : 'seconds';

  return (
    <div className={styles.card}>
      <h1 className={styles.heading}>{SUNSET_HEADING}</h1>
      <p className={styles.text}>
        For help with your DuckDuckGo subscription, please visit{' '}
        <a
          href={SUNSET_REDIRECT_URL}
          className={styles.link}
          data-testid={SUNSET_REDIRECT_LINK_TEST_ID}
        >
          DuckDuckGo Subscription Support
        </a>
        .
      </p>

      {isCanceled ? (
        <p className={styles.text} role="status">
          Automatic redirect canceled. Use the link above whenever you&apos;re
          ready.
        </p>
      ) : (
        <>
          <p className={styles.text}>
            You will be redirected automatically in{' '}
            <span aria-hidden="true">
              {secondsLeft} {secondsLabel}
            </span>
            <span className="sr-only">{SUNSET_REDIRECT_SECONDS} seconds</span>.
          </p>
          <Button
            text="Stay on this page"
            skipBaseStyles
            className={styles.button}
            onClick={() => setIsCanceled(true)}
            data-testid={SUNSET_STAY_BUTTON_TEST_ID}
          />
        </>
      )}
    </div>
  );
}
