/**
 * Stores a boolean value in localStorage with an expiration time.
 *
 * @function setStorageWithExpiry
 * @param {string} key - The localStorage key to store the value under
 * @param {boolean} value - The boolean value to store
 * @param {number} ttl - Time to live in milliseconds
 *
 * @returns {void}
 */
export function setStorageWithExpiry(
  key: string,
  value: boolean,
  ttl: number,
): void {
  const item = {
    value,
    expiry: Date.now() + ttl,
  };

  localStorage.setItem(key, JSON.stringify(item));
}
