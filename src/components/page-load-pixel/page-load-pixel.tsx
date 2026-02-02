'use client';

import { useEffect, useState } from 'react';
import { SCRIPT_CHECK_INTERVAL_MS } from '@/constants/zendesk-timing';

/**
 * Portable PageLoadPixel Component
 *
 * Dispatches a custom event when a page loads.
 *
 * @param {string} eventName - Optional custom event name (defaults to
 * "pageLoaded")
 */
export default function PageLoadPixel({
  eventName = 'pageLoaded',
}: {
  eventName?: string;
}) {
  const [scriptReady, setScriptReady] = useState(false);

  // Check if script is ready
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const checkScript = () => {
      if (window?.pixelsScriptReady) {
        setScriptReady(true);
      } else {
        timeoutId = setTimeout(checkScript, SCRIPT_CHECK_INTERVAL_MS);
      }
    };

    checkScript();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Fire event when script is ready
  useEffect(() => {
    if (scriptReady) {
      const pageLoadEvent = new Event(eventName);

      document.dispatchEvent(pageLoadEvent);
    }
  }, [scriptReady, eventName]);

  return null;
}
