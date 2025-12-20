/**
 * Internationalization utilities.
 * Following patterns from static-pages repository.
 *
 * This module provides:
 * - Plural noun formatting utilities
 * - Locale validation and constants
 * - Helper functions for locale manipulation
 *
 * All utilities are designed to work with the locale format used in static-pages:
 * - Format: 'en-US', 'fr-FR', etc. (language-REGION)
 * - Default locale: 'en-US'
 */

/**
 * Supported locales in the application.
 * Following the locale format from static-pages (e.g., 'en-US', 'fr-FR').
 */
export const SUPPORTED_LOCALES = ['en-US', 'pl-PL', 'ru-RU', 'es-ES'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Default locale used as fallback.
 */
export const DEFAULT_LOCALE: SupportedLocale = 'en-US';

/**
 * Validates if a locale string is supported.
 *
 * @param locale - Locale string to validate
 * @returns True if locale is supported, false otherwise
 */
export const isSupportedLocale = (
  locale: string,
): locale is SupportedLocale => {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
};
