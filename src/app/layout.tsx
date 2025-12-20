import type { Metadata } from 'next';
// eslint-disable-next-line camelcase
import { Geist, Geist_Mono } from 'next/font/google';
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
 * - Wraps the app with ThemeProvider
 * - Sets up fonts and global styles
 * - Includes FOUC prevention script for theme
 *
 * Privacy-preserving:
 * - No user tracking or data collection
 *
 * @param children - React children to render within the layout
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              window.zEMessenger = {
                autorender: false
              };
            `,
          }}
        />
        {/* Wrap app in providers */}
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

/**
 * Generate metadata for the root layout.
 */
export function generateMetadata(): Metadata {
  return {
    title: 'DuckDuckGo Automated Support Assistant',
    description: 'DuckDuckGo automated support assistant powered by Zendesk',
  };
}
