/**
 * Utilities for accessing the Zendesk messaging widget iframe.
 */

/**
 * Checks if an iframe is likely the Zendesk messaging widget.
 * Uses multiple heuristics to identify the widget regardless of language.
 *
 * @param iframe - The iframe element to check
 * @returns True if this appears to be the Zendesk messaging widget
 */
function isZendeskMessagingIframe(iframe: HTMLIFrameElement): boolean {
  const src = iframe.src || '';
  const title = iframe.getAttribute('title') || '';
  const id = iframe.id || '';
  const className = iframe.className || '';

  // Check if title contains messaging-related keywords (language-agnostic)
  // Common translations: "messaging", "mensajería", "messagerie", "Nachricht", etc.
  const titleLower = title.toLowerCase();
  const hasMessagingTitle =
    titleLower.includes('messaging') ||
    titleLower.includes('mensajería') ||
    titleLower.includes('messagerie') ||
    titleLower.includes('nachricht') ||
    titleLower.includes('messaggio') ||
    titleLower.includes('mensagem') ||
    titleLower.includes('сообщение') ||
    titleLower.includes('メッセージ') ||
    titleLower.includes('消息') ||
    titleLower.includes('window') ||
    titleLower.includes('ventana') ||
    titleLower.includes('fenêtre') ||
    titleLower.includes('fenster');

  // Check for Zendesk-specific identifiers
  const hasZendeskId = id.includes('zendesk') || id.includes('zd');
  const hasZendeskClass =
    className.includes('zendesk') || className.includes('zd');

  // Check if src contains Zendesk domains (if src exists)
  const hasZendeskSrc =
    src &&
    (src.includes('zendesk.com') ||
      src.includes('zdassets.com') ||
      src.includes('zendesk') ||
      src.includes('zdassets'));

  // Return true if title matches messaging keywords (most reliable for messaging widget)
  // or if it has Zendesk identifiers
  return hasMessagingTitle || hasZendeskSrc || hasZendeskId || hasZendeskClass;
}

/**
 * Gets the Zendesk messaging widget iframe element.
 * Uses language-agnostic detection methods to find the widget regardless of locale.
 *
 * Detection strategy:
 * 1. Look for iframe nested after another iframe with data-product="web_widget"
 * 2. Check iframe title for messaging keywords (language-agnostic)
 * 3. Fallback to checking all iframes for messaging-related titles
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

  // Strategy 1: Find iframe nested after another iframe with data-product="web_widget"
  // This is the most reliable method based on the DOM structure
  const webWidgetIframe = document.querySelector(
    'iframe[data-product="web_widget"]',
  ) as HTMLIFrameElement | null;

  if (webWidgetIframe) {
    // Find the parent container
    const parent = webWidgetIframe.parentElement;
    if (parent) {
      // Look for the messaging iframe in the same parent or a sibling/descendant
      // Check siblings and descendants of the parent
      const messagingIframe = Array.from(
        parent.querySelectorAll('iframe'),
      ).find((iframe) => {
        // Skip the web_widget iframe itself
        if (iframe === webWidgetIframe) {
          return false;
        }
        return isZendeskMessagingIframe(iframe);
      }) as HTMLIFrameElement | undefined;

      if (messagingIframe) {
        return messagingIframe;
      }

      // Also check next sibling elements
      let nextSibling = parent.nextElementSibling;
      while (nextSibling) {
        const iframe = nextSibling.querySelector('iframe');
        if (iframe && isZendeskMessagingIframe(iframe)) {
          return iframe;
        }
        nextSibling = nextSibling.nextElementSibling;
      }
    }
  }

  // Strategy 2: Fallback - find iframe using language-agnostic detection
  const allIframes = Array.from(document.querySelectorAll('iframe'));
  const iframe = allIframes.find(isZendeskMessagingIframe) as
    | HTMLIFrameElement
    | undefined;

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
