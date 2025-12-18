'use client';

import { IntlProvider } from 'react-intl';
import { type ReactNode } from 'react';

/**
 * Type definition for locale messages following the static-pages pattern.
 * Includes Smartling metadata and message structure with description and namespace.
 */
export type LocaleMessages = {
  smartling: {
    translate_paths: Array<{
      path: string;
      key: string;
      instruction: string;
    }>;
    variants_enabled: boolean;
    string_format: string;
    entity_escaping: boolean;
  };
} & Record<
  string,
  {
    message?: string;
    description?: string;
    namespace?: string;
    file?: string;
  }
>;

/**
 * TranslationsProvider component that wraps the application with react-intl's IntlProvider.
 * Follows the pattern from static-pages repository.
 *
 * This provider:
 * - Wraps the app with react-intl's IntlProvider
 * - Makes translations available to all child components via useIntl() hook
 * - Handles locale-specific formatting (dates, numbers, plurals)
 * - Provides fallback behavior for missing translations
 *
 * Usage in components:
 * ```tsx
 * import { useIntl } from 'react-intl';
 *
 * function MyComponent() {
 *   const intl = useIntl();
 *   return <div>{intl.formatMessage({ id: 'myKey' })}</div>;
 * }
 * ```
 *
 * @param translations - Object containing locale and messages
 *   - locale: Locale string (e.g., 'en-US')
 *   - messages: Record of translation keys to translated strings
 * @param children - React children that will have access to translations
 *
 * @example
 * ```tsx
 * <TranslationsProvider translations={{ locale: 'en-US', messages: { ... } }}>
 *   <App />
 * </TranslationsProvider>
 * ```
 */
export default function TranslationsProvider({
  translations: { locale, messages },
  children,
}: {
  translations: { locale: string; messages: Record<string, string> };
  children?: ReactNode;
}) {
  return (
    <IntlProvider locale={locale} messages={messages}>
      {children}
    </IntlProvider>
  );
}
