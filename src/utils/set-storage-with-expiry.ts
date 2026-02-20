import { isBrowser } from './is-browser';

/**
 * Stores a boolean value in localStorage with an expiration time.
 *
 * The value is stored as a JSON object containing the value and expiry timestamp.
 * When retrieved using {@link getStorageWithExpiry}, expired items are automatically
 * removed from storage. No-op when called in a server-side environment where
 * localStorage is not available.
 *
 * @function setStorageWithExpiry
 * @param {string} key - The localStorage key to store the value under
 * @param {boolean} value - The boolean value to store
 * @param {number} ttl - Time to live in milliseconds (e.g., 86400000 for 24 hours)
 *
 * @returns {void}
 *
 * @example
 * ```ts
 * // Store consent for 24 hours
 * setStorageWithExpiry('ddg_consent', true, 86400000);
 * ```
 */
export function setStorageWithExpiry(
  key: string,
  value: boolean,
  ttl: number,
): void {
  if (!isBrowser()) {
    return;
  }

  const item = {
    value,
    expiry: Date.now() + ttl,
  };

  localStorage.setItem(key, JSON.stringify(item));
}
