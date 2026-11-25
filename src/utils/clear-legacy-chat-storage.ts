/**
 * localStorage keys left behind by the retired support chat.
 */
const LEGACY_STORAGE_KEYS = ['ddg_consent'];

/**
 * Suffixes of localStorage keys written by the Zendesk widget. Zendesk sets
 * the prefix, so match on the end of the key.
 */
const LEGACY_STORAGE_KEY_SUFFIXES = [
  '.clientId',
  '.appUserId',
  '.sessionToken',
  '.conversationStartedAt',
];

/**
 * Removes data the retired support chat stored in the browser.
 *
 * Safe to call when none of the keys exist. Never throws, because storage
 * access can fail (blocked cookies, some private browsing modes) and the
 * sunset notice must still render.
 */
export function clearLegacyChatStorage(): void {
  try {
    const storage = window.localStorage;
    const keysToRemove: string[] = [];

    // Collect first, then remove, so indexes don't shift while looping
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);

      if (key === null) {
        continue;
      }

      const isLegacyKey =
        LEGACY_STORAGE_KEYS.includes(key) ||
        LEGACY_STORAGE_KEY_SUFFIXES.some((suffix) => key.endsWith(suffix));

      if (isLegacyKey) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => storage.removeItem(key));
  } catch {
    // Storage is unavailable, so there is nothing to clear
  }
}
