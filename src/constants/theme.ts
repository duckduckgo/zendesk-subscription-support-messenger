/**
 * Theme constants for the application.
 * These values are used throughout the codebase to ensure consistency and type safety.
 */

/**
 * Available theme options for the application.
 * - Light: Force light mode regardless of system preference
 * - Dark: Force dark mode regardless of system preference
 * - System: Follow the user's operating system theme preference
 */
export const Theme = {
  Light: 'light',
  Dark: 'dark',
  System: 'system',
} as const;

/**
 * Type representing a theme option.
 * Derived from the Theme constant to ensure type safety.
 */
export type ThemeType = (typeof Theme)[keyof typeof Theme];

/**
 * Resolved theme values (actual theme being applied).
 * Unlike Theme, this only includes Light and Dark because System resolves to one of these.
 * Used when we need to know the actual theme being displayed, not just the user's preference.
 */
export const ResolvedTheme = {
  Light: 'light',
  Dark: 'dark',
} as const;

/**
 * Type representing a resolved theme (the actual theme being applied).
 * This is always either 'light' or 'dark', never 'system'.
 */
export type ResolvedThemeType =
  (typeof ResolvedTheme)[keyof typeof ResolvedTheme];

/**
 * LocalStorage key used to persist the user's theme preference.
 * This allows the theme to persist across page reloads and browser sessions.
 */
export const THEME_STORAGE_KEY = 'theme';

/**
 * Array of all valid theme values.
 * Used for validation to ensure only valid themes can be set.
 */
export const VALID_THEMES: readonly ThemeType[] = [
  Theme.Light,
  Theme.Dark,
  Theme.System,
] as const;

/**
 * CSS media query string for detecting dark mode preference.
 * Used consistently across the codebase to avoid typos and ensure maintainability.
 */
export const PREFERS_COLOR_SCHEME_DARK = '(prefers-color-scheme: dark)';
