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
 * Configuration for plural noun formatting.
 */
export interface GetPluralNounConfig {
  count: number;
  singular: string;
  plural: string;
  includeCount?: boolean;
  capitalize?: boolean;
  treatZeroAsPlural?: boolean;
}

/**
 * Helper function to format plural nouns.
 * Returns formatted string based on count (singular vs plural).
 *
 * @param config - Configuration object for plural formatting
 * @returns Formatted plural noun string
 *
 * @example
 * ```ts
 * getPluralNoun({ count: 1, singular: 'item', plural: 'items' })
 * // Returns: "1 item"
 *
 * getPluralNoun({ count: 5, singular: 'item', plural: 'items' })
 * // Returns: "5 items"
 * ```
 */
export const getPluralNoun = (config: GetPluralNounConfig): string => {
  const {
    count,
    singular,
    plural,
    includeCount = true,
    treatZeroAsPlural = false,
    capitalize,
  } = config ?? {};

  if (typeof count !== 'number' || count < 0) {
    return '';
  }

  if (count === 0 && !treatZeroAsPlural) {
    return '';
  }

  const capitalizeFirstLetter = (noun: string) => {
    if (!capitalize || !noun || noun.length === 0) {
      return noun;
    }
    return noun.charAt(0).toUpperCase() + noun.slice(1);
  };

  const includeCountFn = (noun: string) => {
    if (!includeCount) {
      return noun;
    }
    return `${count} ${noun}`;
  };

  const selectedNoun = count === 1 ? singular : plural;
  const capitalized = capitalizeFirstLetter(selectedNoun);
  return includeCountFn(capitalized);
};

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
 * Extracts locale from a locale string (e.g., 'en-US' -> 'en').
 *
 * @param locale - Full locale string (e.g., 'en-US')
 * @returns Language code (e.g., 'en')
 */
export const getLanguageFromLocale = (locale: string): string => {
  return locale.split('-')[0] || DEFAULT_LOCALE.split('-')[0];
};

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
