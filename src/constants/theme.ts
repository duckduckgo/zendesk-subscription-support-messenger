/**
 * Theme constants for the application.
 * The application respects system theme preference only (no user preference storage).
 */

/**
 * Resolved theme values (actual theme being applied).
 * The application automatically follows the user's OS/browser theme preference.
 */
export const ResolvedTheme = {
  Light: 'light',
  Dark: 'dark',
} as const;

/**
 * Type representing a resolved theme (the actual theme being applied).
 * This is always either 'light' or 'dark', based on system preference.
 */
export type ResolvedThemeType =
  (typeof ResolvedTheme)[keyof typeof ResolvedTheme];

/**
 * CSS media query string for detecting dark mode preference.
 * Used consistently across the codebase to avoid typos and ensure maintainability.
 */
export const PREFERS_COLOR_SCHEME_DARK = '(prefers-color-scheme: dark)';
