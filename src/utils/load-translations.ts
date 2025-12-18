import type { LocaleMessages } from '@/providers/translations-provider';
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type SupportedLocale,
} from './i18n';

// Static imports enable Next.js to optimize and bundle translations at build time
// This provides better performance, code splitting, and tree shaking
import enUS from '@/translations/en-US.json';
import plPL from '@/translations/pl-PL.json';
import ruRU from '@/translations/ru-RU.json';
import esES from '@/translations/es-ES.json';

/**
 * Translation registry mapping locale codes to their translation data.
 * Using static imports allows Next.js to:
 * - Optimize bundles at build time
 * - Enable code splitting per locale
 * - Tree shake unused translations
 * - Work in all environments (edge, serverless, etc.)
 */
const translations: Record<SupportedLocale, LocaleMessages> = {
  'en-US': enUS,
  'pl-PL': plPL,
  'ru-RU': ruRU,
  'es-ES': esES,
} as const;

/**
 * Loads translation messages for a given locale.
 * Follows the pattern from static-pages repository, adapted for Next.js 16 App Router.
 *
 * This function:
 * - Validates the locale and falls back to default if unsupported
 * - Uses statically imported translations (optimized by Next.js at build time)
 * - Converts the translation object format to react-intl's expected format
 * - Handles errors gracefully with fallback to default locale
 *
 * Translation file format (from static-pages):
 * ```json
 * {
 *   "smartling": { ... },
 *   "key": {
 *     "message": "Translated text",
 *     "description": "Context for translators",
 *     "namespace": "common"
 *   }
 * }
 * ```
 *
 * Converted to react-intl format:
 * ```json
 * {
 *   "key": "Translated text"
 * }
 * ```
 *
 * @param locale - Locale string (e.g., 'en-US')
 * @returns Promise resolving to locale messages object with locale and messages
 *
 * @example
 * ```ts
 * const { locale, messages } = await loadTranslations('en-US');
 * // locale: 'en-US'
 * // messages: { 'homepage': 'AI Support Ticket Deflection', ... }
 * ```
 */
export async function loadTranslations(
  locale: string,
): Promise<{ locale: string; messages: Record<string, string> }> {
  // Validate locale and fallback to default if not supported
  // This ensures we always have a valid locale, preventing runtime errors
  const validLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;

  try {
    // Get translations from static registry
    // This is fast and optimized by Next.js at build time
    // Next.js will create separate chunks for each locale, enabling code splitting
    const rawTranslations =
      translations[validLocale] || translations[DEFAULT_LOCALE];

    // Convert the translation object format to react-intl's expected format
    // static-pages format: { key: { message: "text", description: "...", namespace: "..." } }
    // react-intl format: { key: "text" }
    const messages: Record<string, string> = {};

    for (const [key, value] of Object.entries(rawTranslations)) {
      // Skip smartling metadata - this is used for translation management tools
      if (key === 'smartling') {
        continue;
      }

      // Extract the message from the translation object
      // Defensive check: ensure value is an object with a message property
      if (
        value &&
        typeof value === 'object' &&
        'message' in value &&
        typeof value.message === 'string'
      ) {
        messages[key] = value.message;
      } else {
        // Log warning for malformed translation entries
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `Skipping malformed translation entry for key "${key}" in locale "${validLocale}"`,
          );
        }
      }
    }

    return {
      locale: validLocale,
      messages,
    };
  } catch (error) {
    // Log error for debugging
    console.error(
      `Failed to load translations for locale: ${validLocale}`,
      error instanceof Error ? error.message : error,
    );

    // Fallback to default locale if loading fails and we're not already using default
    // This ensures the app always has translations, even if a specific locale fails
    if (validLocale !== DEFAULT_LOCALE) {
      console.warn(`Falling back to default locale: ${DEFAULT_LOCALE}`);
      return loadTranslations(DEFAULT_LOCALE);
    }

    // If even default locale fails, return empty messages
    // This is a last resort - the app will still function but without translations
    console.error(
      `Critical: Failed to load default locale translations (${DEFAULT_LOCALE}). App will run without translations.`,
    );
    return {
      locale: DEFAULT_LOCALE,
      messages: {},
    };
  }
}
