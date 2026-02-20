import { isBrowser } from './is-browser';

/**
 * Deletes all localStorage items whose keys end with the specified suffix.
 *
 * No-op when called in a server-side environment where localStorage is not available.
 *
 * @function deleteStorageKeysBySuffix
 * @param {string} suffix - The suffix to match against localStorage keys
 *
 * @returns {void}
 *
 * @example
 * ```ts
 * // Delete all keys ending with '.clientId'
 * deleteStorageKeysBySuffix('.clientId');
 * ```
 */
export function deleteStorageKeysBySuffix(suffix: string): void {
  if (!isBrowser()) {
    return;
  }

  Object.keys(localStorage)
    .filter((key) => key.endsWith(suffix))
    .forEach((key) => {
      localStorage.removeItem(key);
    });
}
