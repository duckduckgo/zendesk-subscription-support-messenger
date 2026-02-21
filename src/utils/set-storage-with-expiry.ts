import { isBrowser } from './is-browser';

/**
 * Formats a date as YYYY-MM-DD string.
 *
 * @function formatDateString
 * @param {Date} date - The date to format
 *
 * @returns {string} Formatted date string in YYYY-MM-DD format
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Calculates an expiry date by adding days to today's date.
 *
 * @function calculateExpiryDate
 * @param {number} days - Number of days to add to today's date
 *
 * @returns {string} Expiry date string in YYYY-MM-DD format
 */
function calculateExpiryDate(days: number): string {
  const today = new Date();
  const expiryDate = new Date(today);

  expiryDate.setDate(today.getDate() + days);

  return formatDateString(expiryDate);
}

/**
 * Stores a boolean value in localStorage with an expiration date.
 *
 * The item is stored as a JSON object containing the value and expiry date
 * string in YYYY-MM-DD format. When retrieved using {@link
 * getStorageWithExpiry}, expired items are automatically removed from storage.
 * No-op when called in a server-side environment where localStorage is not
 * available.
 *
 * @function setStorageWithExpiry
 * @param {string} key - The localStorage key to store the value under
 * @param {boolean} value - The boolean value to store
 * @param {number} days - Number of days from today until expiration
 *
 * @returns {void}
 */
export function setStorageWithExpiry(
  key: string,
  value: boolean,
  days: number,
): void {
  if (!isBrowser()) {
    return;
  }

  const item = {
    value,
    expiry: calculateExpiryDate(days),
  };

  localStorage.setItem(key, JSON.stringify(item));
}
