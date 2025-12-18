import type { Metadata } from 'next';
// eslint-disable-next-line camelcase
import { Geist, Geist_Mono } from 'next/font/google';
import { detectLocaleFromHeaders } from '@/utils/detect-locale';
import { loadTranslations } from '@/utils/load-translations';
import TranslationsProvider from '@/providers/translations-provider';
import { ThemeProvider } from '@/contexts/theme-context';
import {
  Theme,
  ResolvedTheme,
  THEME_STORAGE_KEY,
  PREFERS_COLOR_SCHEME_DARK,
} from '@/constants/theme';
import './globals.css';
import { ReactNode } from 'react';

// Configure Geist Sans font with CSS variable for use throughout the app
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

// Configure Geist Mono font with CSS variable for use throughout the app
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/**
 * Root layout component for the Next.js application.
 *
 * This layout:
 * - Detects locale server-side from Accept-Language header (no redirects)
 * - Loads translations server-side for optimal performance
 * - Wraps the app with TranslationsProvider and ThemeProvider
 * - Sets up fonts and global styles
 * - Includes FOUC prevention script for theme
 *
 * Privacy-preserving:
 * - No cookies set for locale
 * - Accept-Language header used only for detection, not stored
 * - No user tracking or data collection
 *
 * Server Component Benefits:
 * - Translations loaded server-side (no client-side loading)
 * - Reduced client bundle size
 * - Better SEO (translations in initial HTML)
 * - Faster initial page load
 * - All child components remain server components
 *
 * Passing Locale to Child Components:
 * - Server components can receive locale as props (does NOT make them client components)
 * - Client components can use `useIntl()` hook from react-intl (requires 'use client')
 * - Server components can call `getLocale()` utility function
 * - TranslationsProvider wraps children, making translations available via context
 *
 * Example - Server component with locale prop:
 * ```tsx
 * // Server component - receives locale as prop
 * export default async function MyComponent({ locale }: { locale: string }) {
 *   return <div>Current locale: {locale}</div>;
 * }
 * ```
 *
 * Example - Server component using getLocale():
 * ```tsx
 * import { getLocale } from '@/utils';
 *
 * // Server component - gets locale directly
 * export default async function MyComponent() {
 *   const locale = await getLocale();
 *   return <div>Current locale: {locale}</div>;
 * }
 * ```
 *
 * @param children - React children to render within the layout
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // Detect locale server-side from Accept-Language header
  // This happens on every request, ensuring locale matches user's preference
  // No redirects needed - locale is determined server-side
  const locale = await detectLocaleFromHeaders();

  // Load translations for the detected locale
  // This happens server-side, so translations are available immediately
  const translations = await loadTranslations(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* 
          Blocking script to prevent FOUC (Flash of Unstyled Content).
          This runs synchronously before React hydrates to apply the theme immediately.
        */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('${THEME_STORAGE_KEY}') || '${Theme.System}';
                  const resolvedTheme = theme === '${Theme.System}' 
                    ? (window.matchMedia('${PREFERS_COLOR_SCHEME_DARK}').matches ? '${ResolvedTheme.Dark}' : '${ResolvedTheme.Light}')
                    : theme;
                  document.documentElement.setAttribute('data-theme', resolvedTheme);
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Wrap app in providers */}
        <TranslationsProvider translations={translations}>
          <ThemeProvider>{children}</ThemeProvider>
        </TranslationsProvider>
      </body>
    </html>
  );
}

/**
 * Generate metadata for the root layout.
 * Uses detected locale to provide locale-specific metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocaleFromHeaders();
  const translations = await loadTranslations(locale);

  return {
    title: translations.messages.homepage || 'AI Support Ticket Deflection',
    description:
      translations.messages.homepage ||
      'AI-powered support ticket deflection system',
  };
}
