import { headers } from 'next/headers';
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type SupportedLocale,
} from './i18n';

/**
 * Detects the user's preferred locale from the Accept-Language header.
 * This function runs server-side and does not require cookies or client-side code.
 *
 * Privacy-preserving:
 * - Uses standard HTTP Accept-Language header
 * - No cookies set
 * - No tracking or logging
 * - Header is ephemeral and not persisted
 *
 * @returns The detected locale or default locale if no match found
 */
export async function detectLocaleFromHeaders(): Promise<SupportedLocale> {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');

  if (!acceptLanguage) {
    return DEFAULT_LOCALE;
  }

  // Parse Accept-Language header according to RFC 7231
  // Format: "en-US,en;q=0.9,fr;q=0.8"
  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const trimmed = lang.trim();
      const [code, qParam] = trimmed.split(';q=');
      // Default quality is 1.0 if not specified
      const quality = qParam ? parseFloat(qParam) : 1.0;
      return { code: code.trim(), quality };
    })
    .sort((a, b) => b.quality - a.quality); // Sort by quality descending

  // Find first supported locale
  for (const { code } of languages) {
    // Try exact match first (e.g., "en-US", "pl-PL")
    if (isSupportedLocale(code)) {
      return code;
    }

    // Try language code match (e.g., "en" -> "en-US", "pl" -> "pl-PL")
    // This handles cases where browser sends "en" but we support "en-US"
    const languageCode = code.split('-')[0]?.toLowerCase();
    if (languageCode) {
      // Map common language codes to their supported locale variants
      const languageToLocaleMap: Record<string, string> = {
        en: 'en-US',
        pl: 'pl-PL',
        ru: 'ru-RU',
        es: 'es-ES',
      };

      // Try mapped locale first (e.g., "pl" -> "pl-PL")
      const mappedLocale = languageToLocaleMap[languageCode];
      if (mappedLocale && isSupportedLocale(mappedLocale)) {
        return mappedLocale;
      }

      // Fallback: Try to match with region code from Accept-Language header
      // (e.g., "en-GB" -> "en-US" if exact match not found)
      const regionCode = code.split('-')[1]?.toUpperCase();
      if (regionCode) {
        const matchedLocale = `${languageCode}-${regionCode}`;
        if (isSupportedLocale(matchedLocale)) {
          return matchedLocale;
        }
      }
    }
  }

  // Fallback to default locale if no match found
  return DEFAULT_LOCALE;
}
