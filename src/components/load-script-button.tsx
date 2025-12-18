'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useZendeskResponseHandler } from '@/hooks/use-zendesk-response-handler';
import { Button } from './button';

export interface LoadScriptButtonProps {
  /** JWT token for Zendesk authentication */
  token: string | null;
}

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
export default function LoadScriptButton({ token }: LoadScriptButtonProps) {
  const [loadWidget, setLoadWidget] = useState(false);
  const [zendeskReady, setZendeskReady] = useState(false);

  console.log('### load-script-button.tsx', {
    token,
  });

  // Set up response handler for updating article links
  useZendeskResponseHandler({
    zendeskReady,
  });

  const handleOnLoad = () => {
    return zE('messenger:on', 'open', () => setZendeskReady(true));
  };

  return (
    <>
      <Button text="I agree" onClick={() => setLoadWidget(true)} />

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
