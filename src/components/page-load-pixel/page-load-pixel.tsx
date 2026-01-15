'use client';

import { useEffect, useState } from 'react';

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
    const checkScript = () => {
      if (window?.pixelsScriptReady) {
        setScriptReady(true);
      } else {
        setTimeout(checkScript, 50);
      }
    };
    checkScript();
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
