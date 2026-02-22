import { EMBEDDED_TARGET_ELEMENT } from '@/config/common';
import { ZENDESK_SCRIPT_TAG_ID } from '@/constants/zendesk-selectors';

/**
 * Zendesk global objects that need to be cleaned up.
 */
const ZENDESK_GLOBALS = [
  'zE',
  'zEMessenger',
  'zEmbed',
  'zEACLoaded',
  'zEWebpackACJsonp',
] as const;

/**
 * Cleans up all Zendesk DOM elements, scripts, and global objects.
 *
 * This function removes:
 * - All Zendesk iframes (messaging iframe, hidden iframe, etc.)
 * - All Zendesk script tags
 * - All Zendesk global objects (zE, zEMessenger, zEmbed, etc.)
 * - Contents of the messaging-container div
 *
 * After cleanup, recreates zEMessenger with fresh config to ensure clean state
 * for potential reload.
 *
 * @function cleanupZendesk
 *
 * @returns {void}
 */
export function cleanupZendesk(): void {
  // Clear contents of messaging-container div (Zendesk iframe, etc.)
  const messagingContainer = document.getElementById(EMBEDDED_TARGET_ELEMENT);
  if (messagingContainer) {
    messagingContainer.innerHTML = '';
  }

  // Remove ALL Zendesk iframes (not just the hidden one)
  const allZendeskIframes = document.querySelectorAll(
    'iframe[id*="zendesk"], iframe[data-product="web_widget"]',
  );
  allZendeskIframes.forEach((iframe) => iframe.remove());

  // Remove ze-snippet script element
  const zeSnippet = document.getElementById(ZENDESK_SCRIPT_TAG_ID);
  if (zeSnippet) {
    zeSnippet.remove();
  }

  // Remove any other Zendesk script tags
  const zendeskScripts = document.querySelectorAll(
    'script[src*="zdassets.com"], script[src*="zendesk"]',
  );
  zendeskScripts.forEach((script) => script.remove());

  // Clean up Zendesk global objects
  if (typeof window !== 'undefined') {
    ZENDESK_GLOBALS.forEach((globalName) => {
      try {
        const win = window as unknown as Record<string, unknown>;
        if (globalName in win) {
          delete win[globalName];
        }
      } catch {
        // Ignore errors if property is not configurable
      }
    });

    // Recreate zEMessenger with fresh config (layout.tsx will also set this,
    // but we need it here before state resets to ensure clean state)
    (window as unknown as { zEMessenger?: unknown }).zEMessenger = {
      autorender: false,
    };
  }
}
