/**
 * Deletes all localStorage items whose keys end with the specified suffix.
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
  Object.keys(localStorage)
    .filter((key) => key.endsWith(suffix))
    .forEach((key) => {
      localStorage.removeItem(key);
    });
}
