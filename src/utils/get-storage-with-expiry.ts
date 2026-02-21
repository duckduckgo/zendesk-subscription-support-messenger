import { isBrowser } from './is-browser';
import { formatDateString } from './set-storage-with-expiry';

/**
 * Retrieves a boolean value from localStorage, checking if it has expired.
 * Expired and invalid items are automatically removed from storage.
 *
 * Expiry is compared as date strings (YYYY-MM-DD format), so items expire at
 * the start of the expiry date (midnight).
 *
 * @function getStorageWithExpiry
 * @param {string} key - The localStorage key to retrieve
 *
 * @returns {boolean | null | undefined} Returns `undefined` when called
 * server-side, `null` if expired/missing/invalid, or the stored boolean value
 * if valid and not expired
 */
export function getStorageWithExpiry(key: string): boolean | null | undefined {
  if (!isBrowser()) {
    return undefined;
  }

  const itemStr = localStorage.getItem(key);

  if (!itemStr) {
    return null;
  }

  try {
    const item = JSON.parse(itemStr);

    // Validate item structure
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof item.expiry !== 'string' ||
      typeof item.value !== 'boolean'
    ) {
      // Invalid structure
      localStorage.removeItem(key);

      return null;
    }

    const today = formatDateString(new Date());
    const isExpired = today > item.expiry;

    if (isExpired) {
      localStorage.removeItem(key);

      return null;
    }

    return item.value;
  } catch {
    // Invalid JSON
    localStorage.removeItem(key);

    return null;
  }
}
