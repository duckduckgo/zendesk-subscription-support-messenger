import { detectLocaleFromHeaders } from './detect-locale';
import { loadTranslations } from './load-translations';

/**
 * Gets translations for the current locale detected from server headers.
 * This is a convenience function for server components that need translations.
 *
 * IMPORTANT: This does NOT make components client components.
 * Server components can call async functions and access headers.
 * Only components using React hooks (like useIntl) need 'use client'.
 *
 * Usage in server components:
 * ```tsx
 * // Server component - no 'use client' needed
 * import { getTranslations } from '@/utils';
 *
 * export default async function MyServerComponent() {
 *   const translations = await getTranslations();
 *   return <div>{translations.messages.myKey}</div>;
 * }
 * ```
 *
 * Usage in client components (for translations):
 * ```tsx
 * 'use client';
 * import { useIntl } from 'react-intl';
 *
 * export function MyClientComponent() {
 *   const intl = useIntl();
 *   return <div>{intl.formatMessage({ id: 'myKey' })}</div>;
 * }
 * ```
 *
 * @returns Promise resolving to translations object with locale and messages
 *
 * @example
 * ```ts
 * const { locale, messages } = await getTranslations();
 * // locale: 'en-US'
 * // messages: { 'homepage': 'AI Support Ticket Deflection', ... }
 * ```
 */
export async function getTranslations() {
  const locale = await detectLocaleFromHeaders();

  return loadTranslations(locale);
}

/**
 * Gets a specific translation message by key.
 * Convenience function for server components that need a single translation.
 *
 * @param key - Translation key to retrieve
 * @param defaultValue - Optional default value if translation is missing
 * @returns Promise resolving to the translated string
 *
 * @example
 * ```tsx
 * export default async function MyComponent() {
 *   const title = await getTranslation('homepage');
 *   return <h1>{title}</h1>;
 * }
 * ```
 */
export async function getTranslation(
  key: string,
  defaultValue?: string,
): Promise<string> {
  const { messages } = await getTranslations();
  return messages[key] ?? defaultValue ?? key;
}
