import { test, expect } from '@playwright/test';
import { getStorageWithExpiry } from '@/utils/get-storage-with-expiry';
import { formatDateString } from '@/utils/set-storage-with-expiry';

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

// localStorage mock
function createLocalStorageMock() {
  const storage: Record<string, string> = {};

  return {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    },
  };
}

test.describe('getStorageWithExpiry', () => {
  let originalLocalStorage: Storage | undefined;
  let originalWindow: Window | undefined;

  test.beforeEach(() => {
    // Store original localStorage and window if they exist
    if (typeof global.localStorage !== 'undefined') {
      originalLocalStorage = global.localStorage;
    }
    if (typeof global.window !== 'undefined') {
      originalWindow = global.window;
    }

    // Create mock localStorage
    global.localStorage = createLocalStorageMock() as unknown as Storage;
    // Ensure window exists for isBrowser() check
    if (typeof global.window === 'undefined') {
      global.window = global as unknown as Window;
    }
  });

  test.afterEach(() => {
    // Restore original localStorage if it existed
    if (originalLocalStorage) {
      global.localStorage = originalLocalStorage;
    } else {
      global.localStorage = undefined as unknown as Storage;
    }
    // Restore original window if it existed
    if (originalWindow) {
      global.window = originalWindow;
    } else {
      global.window = undefined as unknown as Window;
    }
  });

  test('should return null when key does not exist', () => {
    const result = getStorageWithExpiry('non-existent-key');

    expect(result).toBeNull();
  });

  test('should return stored boolean value when item has not expired', () => {
    const item = {
      value: true,
      expiry: calculateExpiryDate(1), // 1 day from now
    };

    localStorage.setItem('test-key', JSON.stringify(item));

    const result = getStorageWithExpiry('test-key');

    expect(result).toBe(true);
  });

  test('should return false when stored value is false', () => {
    const item = {
      value: false,
      expiry: calculateExpiryDate(1),
    };

    localStorage.setItem('test-key', JSON.stringify(item));

    const result = getStorageWithExpiry('test-key');

    expect(result).toBe(false);
  });

  test('should return null when expired', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const item = {
      value: true,
      expiry: formatDateString(yesterday), // Expired yesterday
    };

    localStorage.setItem('expired-key', JSON.stringify(item));

    const result = getStorageWithExpiry('expired-key');

    expect(result).toBeNull();
  });

  test('should return null when JSON is invalid', () => {
    localStorage.setItem('invalid-json-key', 'not valid json{');

    const result = getStorageWithExpiry('invalid-json-key');

    expect(result).toBeNull();
  });

  test('should return null when structure is invalid - missing expiry', () => {
    const item = {
      value: true,
      // expiry is missing
    };

    localStorage.setItem('missing-expiry-key', JSON.stringify(item));

    const result = getStorageWithExpiry('missing-expiry-key');

    expect(result).toBeNull();
  });

  test('should return null when structure is invalid - missing value', () => {
    const item = {
      expiry: calculateExpiryDate(1),
      // value is missing
    };

    localStorage.setItem('missing-value-key', JSON.stringify(item));

    const result = getStorageWithExpiry('missing-value-key');

    expect(result).toBeNull();
  });

  test('should return null when expiry is not a string', () => {
    const item = {
      value: true,
      expiry: 1234567890, // Number instead of date string
    };

    localStorage.setItem('invalid-expiry-type-key', JSON.stringify(item));

    const result = getStorageWithExpiry('invalid-expiry-type-key');

    expect(result).toBeNull();
  });

  test('should return null when value is not a boolean', () => {
    const item = {
      value: 'not-a-boolean',
      expiry: calculateExpiryDate(1),
    };

    localStorage.setItem('invalid-value-type-key', JSON.stringify(item));

    const result = getStorageWithExpiry('invalid-value-type-key');

    expect(result).toBeNull();
  });

  test('should return null when parsed value is null', () => {
    localStorage.setItem('null-item-key', JSON.stringify(null));

    const result = getStorageWithExpiry('null-item-key');

    expect(result).toBeNull();
  });

  test('should return null when parsed value is not an object', () => {
    localStorage.setItem('string-item-key', JSON.stringify('just-a-string'));

    const result = getStorageWithExpiry('string-item-key');

    expect(result).toBeNull();
  });

  test('should return value when expiry date is today', () => {
    const today = formatDateString(new Date());

    const item = {
      value: true,
      expiry: today,
    };

    localStorage.setItem('today-expiry-key', JSON.stringify(item));

    const result = getStorageWithExpiry('today-expiry-key');

    // Should not be expired since expiry is at start of day (midnight)
    expect(result).toBe(true);
  });

  test('should return null when expiry date is before today', () => {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    const item = {
      value: true,
      expiry: formatDateString(twoDaysAgo),
    };

    localStorage.setItem('past-expiry-key', JSON.stringify(item));

    const result = getStorageWithExpiry('past-expiry-key');

    expect(result).toBeNull();
  });
});
