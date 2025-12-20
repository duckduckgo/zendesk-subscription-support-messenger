'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useZendeskResponseHandler } from '@/hooks/use-zendesk-response-handler';
import { Button } from './button';

/**
 * Component that loads the Zendesk Web Widget and handles article link updates.
 *
 * Features:
 * - Lazy loads Zendesk widget script on user consent
 * - Automatically updates article links in widget responses
 * - Handles dynamically added links via MutationObserver
 *
 * @param props - Component props
 * @returns Button to load widget and script tag
 */
export default function LoadScriptButton() {
  const [loadWidget, setLoadWidget] = useState(false);
  const [zendeskReady, setZendeskReady] = useState(false);

  // Set up response handler for updating article links
  useZendeskResponseHandler({
    zendeskReady,
  });

  const handleOnLoad = () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Set cookies first
      zE('messenger:set', 'cookies', 'functional');
      zE('messenger:set', 'customization', {
        common: {
          hideHeader: true,
        },
      });

      // Render the embedded messenger
      zE('messenger', 'render', {
        mode: 'embedded',
        widget: {
          targetElement: '#messaging-container',
        },
      });

      // For embedded mode, set ready after a short delay to ensure widget has rendered
      // The widget renders synchronously, so a small delay is sufficient
      setTimeout(() => {
        console.log('Zendesk messenger ready');
        setZendeskReady(true);
      }, 500);
    } catch (error) {
      console.error('Error initializing Zendesk:', error);
    }
  };

  return (
    <>
      <Button text="I Agree" onClick={() => setLoadWidget(true)} />

      {loadWidget && (
        <Script
          id="ze-snippet"
          src={process.env.NEXT_PUBLIC_ZENDESK_SCRIPT_URL}
          strategy="lazyOnload"
          onLoad={() => handleOnLoad()}
          onError={() => console.error('Failed to load Zendesk')}
        />
      )}
    </>
  );
}
