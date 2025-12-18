'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Theme,
  ResolvedTheme,
  THEME_STORAGE_KEY,
  VALID_THEMES,
  PREFERS_COLOR_SCHEME_DARK,
  type ThemeType,
  type ResolvedThemeType,
} from '@/constants/theme';

/**
 * Context value type for the theme context.
 * Provides the current theme preference, resolved theme, and a function to update it.
 */
interface ThemeContextType {
  /** The user's theme preference (light, dark, or system) */
  theme: ThemeType;
  /** The actual theme being applied (light or dark) - resolves 'system' to light/dark */
  resolvedTheme: ResolvedThemeType;
  /** Function to update the theme preference */
  setTheme: (theme: ThemeType) => void;
}

/**
 * React context for theme management.
 * Undefined when accessed outside of ThemeProvider.
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Gets the system theme preference by checking the user's OS/browser preference.
 * Uses the prefers-color-scheme media query to detect if the user prefers dark mode.
 *
 * @returns The system theme preference ('light' or 'dark')
 */
/**
 * Gets the system theme preference by checking the user's OS/browser preference.
 * Uses the prefers-color-scheme media query to detect if the user prefers dark mode.
 *
 * @returns The system theme preference ('light' or 'dark')
 */
function getSystemTheme(): ResolvedThemeType {
  // During SSR, window is undefined, so default to light
  if (typeof window === 'undefined') {
    return ResolvedTheme.Light;
  }
  // Check if the user's system prefers dark mode
  return window.matchMedia(PREFERS_COLOR_SCHEME_DARK).matches
    ? ResolvedTheme.Dark
    : ResolvedTheme.Light;
}

/**
 * Retrieves the stored theme preference from localStorage.
 * Returns null if localStorage is unavailable or no preference is stored.
 *
 * Privacy Note:
 * - Theme preference is stored locally in the user's browser only
 * - No server-side storage or tracking
 * - No cookies or cross-site tracking
 * - User's theme choice never leaves their device
 * - This is a client-side preference only, similar to browser settings
 *
 * @returns The stored theme preference or null if not available
 */
function getStoredTheme(): ThemeType | null {
  // During SSR, window and localStorage are undefined
  // This is expected and handled gracefully
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    // Validate that the stored value is a valid theme
    // This prevents XSS or injection attacks from malicious localStorage values
    if (stored && VALID_THEMES.includes(stored as ThemeType)) {
      return stored as ThemeType;
    }
  } catch (error) {
    // localStorage might be unavailable (private browsing mode, storage disabled, etc.)
    // Fail gracefully and return null - app will use default theme
    console.warn('Failed to access localStorage for theme:', error);
  }

  return null;
}

/**
 * ThemeProvider component that manages theme state and provides it to child components.
 * Handles theme persistence, system preference detection, and applies the theme to the document.
 *
 * @param children - React children that will have access to the theme context
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize theme from localStorage if available, otherwise default to system preference
  // Using a function initializer ensures this only runs once during component initialization
  // Cache the initial stored theme to avoid calling getStoredTheme() multiple times
  const [theme, setThemeState] = useState<ThemeType>(() => {
    return getStoredTheme() ?? Theme.System;
  });

  // Track if component has mounted to avoid hydration mismatches
  // This prevents applying theme during SSR where window/document don't exist
  const mountedRef = useRef(false);

  // Track system theme changes when theme is 'system'
  // This state is updated when system preference changes
  const [systemTheme, setSystemTheme] = useState<ResolvedThemeType>(() => {
    return getSystemTheme();
  });

  // Compute resolved theme from theme preference and system theme
  // This is derived state, computed synchronously to avoid setState in effects
  const resolvedTheme = useMemo<ResolvedThemeType>(() => {
    return theme === Theme.System ? systemTheme : (theme as ResolvedThemeType);
  }, [theme, systemTheme]);

  // Initialize component on mount and listen for storage changes
  // This effect runs once when the component mounts in the browser
  useEffect(() => {
    mountedRef.current = true;

    // Listen for storage changes (e.g., if localStorage was updated in another tab)
    // This allows syncing theme across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const newTheme = e.newValue as ThemeType;
        if (VALID_THEMES.includes(newTheme) && newTheme !== theme) {
          setThemeState(newTheme);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [theme]);

  // Apply theme to document and listen for system theme changes
  // This effect runs whenever the theme preference or system theme changes
  useEffect(() => {
    // Don't apply theme during SSR or before mount
    if (!mountedRef.current) return;

    // Apply theme to document root element
    // CSS uses [data-theme] selectors to apply theme-specific styles
    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme);

    // If theme is 'system', listen for system theme changes
    // This allows the app to automatically update when user changes OS theme
    if (theme === Theme.System) {
      const mediaQuery = window.matchMedia(PREFERS_COLOR_SCHEME_DARK);
      const handleChange = (e: MediaQueryListEvent) => {
        // Update system theme state when system preference changes
        const newResolved = e.matches
          ? ResolvedTheme.Dark
          : ResolvedTheme.Light;
        setSystemTheme(newResolved);
        // Apply immediately to document
        document.documentElement.setAttribute('data-theme', newResolved);
      };

      // Subscribe to system theme changes
      // Note: Some older browsers may not support addEventListener on MediaQueryList
      // In that case, the theme will still work but won't update automatically
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleChange);
        // Cleanup: unsubscribe when theme changes away from 'system' or component unmounts
        return () => {
          mediaQuery.removeEventListener('change', handleChange);
        };
      }
    }
    // Explicitly return undefined when not listening to system changes
    // This ensures cleanup function is consistent
    return undefined;
  }, [theme, resolvedTheme]);

  /**
   * Updates the theme preference and persists it to localStorage.
   * Validates the theme before setting it and handles localStorage errors gracefully.
   *
   * @param newTheme - The new theme preference to set
   */
  const setTheme = useCallback((newTheme: ThemeType) => {
    // Validate theme before setting
    if (!VALID_THEMES.includes(newTheme)) {
      console.warn(
        `Invalid theme: ${newTheme}. Using ${Theme.System} instead.`,
      );
      return;
    }

    // Update state immediately for instant UI update
    setThemeState(newTheme);

    // Persist to localStorage for future sessions
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      // If localStorage fails (private browsing, quota exceeded, etc.),
      // continue anyway - theme will still work for this session
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  // Only recreates when theme, resolvedTheme, or setTheme actually change
  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Hook to access the theme context.
 * Must be used within a ThemeProvider component.
 *
 * @returns The theme context value containing theme, resolvedTheme, and setTheme
 * @throws Error if used outside of ThemeProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, resolvedTheme, setTheme } = useTheme();
 *   return <button onClick={() => setTheme(Theme.Dark)}>Dark Mode</button>;
 * }
 * ```
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
