'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/button/button';
import {
  MAIN_SITE_URL,
  DECLINE_BUTTON_TEXT,
  CONSENT_BUTTON_TEXT,
  START_CHAT_BUTTON_TEXT,
  CONSENT_STORAGE_KEY,
} from '@/config/common';
import { legalNoticeContent } from '@/config/legal-notice-content';
import { renderLegalNoticeContent } from '@/utils/render-legal-notice-content';
import NewTabLabel from '@/components/new-tab-label/new-tab-label';
import { LOAD_ZD_BUTTON_TEST_ID } from '@/constants/test-ids';
import { REDIRECT_DELAY_MS } from '@/constants/zendesk-timing';
import { getStorageWithExpiry } from '@/utils/get-storage-with-expiry';
import styles from './consent-form.module.css';

interface ConsentFormProps {
  onContinue: () => void;
}

export default function ConsentForm({ onContinue }: ConsentFormProps) {
  // Initialize with undefined to ensure SSR and client hydration match. This
  // prevents hydration errors since both server and client start with undefined
  const [hasConsent, setHasConsent] = useState<boolean | null | undefined>(
    undefined,
  );

  // Check localStorage after mount to avoid hydration mismatch. This is
  // a legitimate use case where we need to read from localStorage after
  // component mounts, so we disable the ESLint rule for this line
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasConsent(getStorageWithExpiry(CONSENT_STORAGE_KEY));
  }, []);

  // Render structured legal notice content
  const renderedContent = renderLegalNoticeContent(legalNoticeContent);

  const renderContinueButton = (text: string, className?: string) => (
    <Button
      text={text}
      skipBaseStyles
      className={[styles.button, styles.continueButton, className]
        .filter(Boolean)
        .join(' ')}
      onClick={onContinue}
      data-testid={LOAD_ZD_BUTTON_TEST_ID}
    />
  );

  return (
    <div className={styles.card}>
      {hasConsent === undefined ? null : hasConsent ? (
        renderContinueButton(START_CHAT_BUTTON_TEXT, styles.startNewChatButton)
      ) : (
        <>
          <div className={styles.cardHeader}>
            <p>
              Subscriber support chat is available 24/7 and can answer many
              common questions immediately. However, if you&apos;d prefer to
              speak with our human support team via email instead, you can use
              the subscriber support form to{' '}
              <a
                href={`${MAIN_SITE_URL}/subscription-support`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                contact us
                <NewTabLabel />
              </a>
              . We try to answer questions within 2 business days.
              <span>
                {' '}
                By clicking &quot;{CONSENT_BUTTON_TEXT}&quot;, you agree to the
                following:
              </span>
            </p>
          </div>

          <div className={styles.content}>
            <div className={styles.section}>
              {renderedContent.sections.map((section, index) => (
                <React.Fragment key={`section-${index}`}>
                  {section.heading && <p>{section.heading}</p>}
                  {section.paragraphs}
                </React.Fragment>
              ))}
              {renderedContent.lastUpdated}
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <Button
              text={DECLINE_BUTTON_TEXT}
              skipBaseStyles
              className={`${styles.button} ${styles.cancelButton}`}
              onClick={() => {
                // allow time for a pixel to fire before redirecting
                setTimeout(() => {
                  window.location.href = new URL(
                    '/subscription-support',
                    MAIN_SITE_URL,
                  ).href;
                }, REDIRECT_DELAY_MS);
              }}
            />
            {renderContinueButton(CONSENT_BUTTON_TEXT)}
          </div>
        </>
      )}
    </div>
  );
}
