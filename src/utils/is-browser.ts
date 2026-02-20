/**
 * Checks if the code is running in a browser environment.
 *
 * @function isBrowser
 * @returns {boolean} True if running in a browser, false if server-side
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}
