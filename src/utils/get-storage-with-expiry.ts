/**
 * Retrieves a boolean value from localStorage, checking if it has expired.
 *
 * If the item has expired or doesn't exist, returns null and removes expired
 * items from storage. Handles invalid JSON by returning null.
 *
 * @function getStorageWithExpiry
 * @param {string} key - The localStorage key to retrieve
 *
 * @returns {boolean | null} The stored boolean value, or null if expired,
 * missing, or invalid
 */
export function getStorageWithExpiry(key: string): boolean | null {
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
      typeof item.expiry !== 'number' ||
      typeof item.value !== 'boolean'
    ) {
      // Invalid structure
      localStorage.removeItem(key);

      return null;
    }

    // Expired
    if (Date.now() > item.expiry) {
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
