/**
 * Utilities for accessing the Zendesk messaging widget iframe.
 */

/**
 * Gets the Zendesk messaging widget iframe element.
 * Finds the iframe nested after the web_widget iframe based on DOM structure.
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

  // Find iframe nested after another iframe with data-product="web_widget"
  const webWidgetIframe = document.querySelector(
    'iframe[data-product="web_widget"]',
  ) as HTMLIFrameElement | null;

  if (webWidgetIframe) {
    const parent = webWidgetIframe.parentElement;

    if (parent) {
      try {
        // Find the messaging iframe in the same parent (skip web_widget iframe)
        const messagingIframe = Array.from(
          parent.querySelectorAll('iframe'),
        ).find((iframe) => iframe !== webWidgetIframe) as
          | HTMLIFrameElement
          | undefined;

        if (messagingIframe) {
          return messagingIframe;
        }

        // Check next sibling elements
        let nextSibling = parent.nextElementSibling;

        while (nextSibling) {
          if (nextSibling && typeof nextSibling.querySelector === 'function') {
            const iframe = nextSibling.querySelector('iframe');

            if (iframe) {
              return iframe;
            }
          }

          nextSibling = nextSibling.nextElementSibling;
        }
      } catch (error) {
        window.fireJse?.(
          new Error(`Error finding messaging iframe: ${JSON.stringify(error)}`),
        );
      }
    }
  }

  return null;
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
  } catch (error) {
    window.fireJse?.(
      `Cross-origin restriction - cannot access iframe document: ${JSON.stringify(error)}`,
    );

    return null;
  }
}
