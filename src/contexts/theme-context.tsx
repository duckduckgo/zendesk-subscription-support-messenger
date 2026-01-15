'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ResolvedTheme,
  PREFERS_COLOR_SCHEME_DARK,
  type ResolvedThemeType,
} from '@/constants/theme';

/**
 * Context value type for the theme context.
 * Provides the resolved theme (light or dark) based on system preference.
 */
interface ThemeContextType {
  /** The actual theme being applied (light or dark) - based on system preference */
  resolvedTheme: ResolvedThemeType;
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
 * ThemeProvider component that manages theme state based on system preference.
 * Automatically updates when the user changes their OS/browser theme preference.
 *
 * @param children - React children that will have access to the theme context
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Track if component has mounted to avoid hydration mismatches
  // This prevents applying theme during SSR where window/document don't exist
  const mountedRef = useRef(false);

  // Track system theme - initialized from system preference
  const [systemTheme, setSystemTheme] = useState<ResolvedThemeType>(() => {
    return getSystemTheme();
  });

  // Initialize component on mount
  useEffect(() => {
    mountedRef.current = true;
  }, []);

  // Apply theme to document and listen for system theme changes
  useEffect(() => {
    // Don't apply theme during SSR or before mount
    if (!mountedRef.current) return;

    // Apply theme to document root element
    // CSS uses [data-theme] selectors to apply theme-specific styles
    const root = document.documentElement;
    root.setAttribute('data-theme', systemTheme);

    // Notify Zendesk widget of theme change if available
    // This prevents console warnings about missing 'onThemeUpdate'
    if (
      typeof window !== 'undefined' &&
      typeof window.onThemeUpdate === 'function'
    ) {
      window.onThemeUpdate(systemTheme);
    }

    // Listen for system theme changes
    // This allows the app to automatically update when user changes OS theme
    const mediaQuery = window.matchMedia(PREFERS_COLOR_SCHEME_DARK);
    const handleChange = (e: MediaQueryListEvent) => {
      // Update system theme state when system preference changes
      const newResolved = e.matches ? ResolvedTheme.Dark : ResolvedTheme.Light;
      setSystemTheme(newResolved);
      // Apply immediately to document
      document.documentElement.setAttribute('data-theme', newResolved);

      // Notify Zendesk widget of theme change
      if (typeof window.onThemeUpdate === 'function') {
        window.onThemeUpdate(newResolved);
      }
    };

    // Subscribe to system theme changes
    // Note: Some older browsers may not support addEventListener on MediaQueryList
    // In that case, the theme will still work but won't update automatically
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      // Cleanup: unsubscribe when component unmounts
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [systemTheme]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      resolvedTheme: systemTheme,
    }),
    [systemTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Hook to access the theme context.
 * Must be used within a ThemeProvider component.
 *
 * @returns The theme context value containing resolvedTheme
 * @throws Error if used outside of ThemeProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { resolvedTheme } = useTheme();
 *   return <div>Current theme: {resolvedTheme}</div>;
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
