/**
 * Utilities for accessing the Zendesk messaging widget iframe.
 */

const MESSAGING_WIDGET_TITLE = 'Messaging window' as const;

/**
 * Gets the Zendesk messaging widget iframe element.
 * Caches the result for performance.
 *
 * @param cachedIframe - Previously cached iframe reference (optional)
 * @returns The messaging widget iframe or null if not found
 */
export function getMessagingIframe(
  cachedIframe: HTMLIFrameElement | null,
): HTMLIFrameElement | null {
  // Use cached iframe if available and still in DOM
  if (cachedIframe && document.contains(cachedIframe)) {
    return cachedIframe;
  }

  // Find iframe by title attribute
  const iframe = Array.from(document.querySelectorAll('iframe')).find(
    (el) => el.getAttribute('title') === MESSAGING_WIDGET_TITLE,
  ) as HTMLIFrameElement | undefined;

  return iframe || null;
}

/**
 * Gets the content document of the Zendesk messaging widget iframe.
 * Returns null if iframe is not found or if cross-origin restrictions apply.
 *
 * @param cachedIframe - Previously cached iframe reference (optional)
 * @returns The iframe's content document or null
 */
export function getMessagingIframeDocument(
  cachedIframe: HTMLIFrameElement | null,
): Document | null {
  const iframe = getMessagingIframe(cachedIframe);

  if (!iframe) {
    return null;
  }

  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    return doc || null;
  } catch {
    // Cross-origin restriction - cannot access iframe document
    return null;
  }
}
