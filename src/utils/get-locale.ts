import { detectLocaleFromHeaders } from './detect-locale';

/**
 * Gets the current locale from server-side headers.
 * This is a convenience function for server components that need locale.
 *
 * IMPORTANT: This does NOT make components client components.
 * Server components can call async functions and access headers.
 * Only components using React hooks (like useIntl) need 'use client'.
 *
 * Usage in server components:
 * ```tsx
 * // Server component - no 'use client' needed
 * export default async function MyServerComponent() {
 *   const locale = await getLocale();
 *   // Use locale for server-side logic
 *   return <div>Locale: {locale}</div>;
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
 * @returns Promise resolving to the detected locale
 */
export async function getLocale() {
  return detectLocaleFromHeaders();
}
