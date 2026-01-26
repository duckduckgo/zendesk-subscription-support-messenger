import { ReactNode } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Script from 'next/script';
import { ThemeProvider } from '@/contexts/theme-context';
import { ResolvedTheme, PREFERS_COLOR_SCHEME_DARK } from '@/constants/theme';
import LogoHorizontalLight from '@/icons/logo-horizontal-light.svg';
import BackgroundImage from '../../public/static-assets/images/background.svg';
import Footer from '@/components/footer/footer';
import { duckSansDisplay, duckSansProduct, proximaNova } from '@/config/fonts';
import { SITE_TITLE, basePath } from '@/config/common';
import './globals.css';
import styles from './layout.module.css';

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: 'DuckDuckGo automated support assistant powered by Zendesk',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${duckSansDisplay.variable} ${duckSansProduct.variable} ${proximaNova.variable}`}
    >
      <head>
        <link
          rel="preload"
          href={`${basePath}/static-assets/images/background.svg`}
          as="image"
        />
      </head>
      <body>
        {/* 
          Blocking script to prevent FOUC (Flash of Unstyled Content).
          This runs synchronously before React hydrates to apply the theme immediately.
          Respects system theme preference only - no user preference storage.
        */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const resolvedTheme = window.matchMedia('${PREFERS_COLOR_SCHEME_DARK}').matches 
                    ? '${ResolvedTheme.Dark}' 
                    : '${ResolvedTheme.Light}';
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
              // Provide onThemeUpdate callback for Zendesk widget to prevent
              // console warnings when theme changes
              window.onThemeUpdate = function(theme) {
                // Zendesk widget will call this when it detects theme changes
                // We can use this to sync theme if needed, but currently
                // we only respect system preference, so this is a no-op
              };
            `,
          }}
        />
        <Script src="/scripts/pixels.js" strategy="afterInteractive" />
        {/* Wrap app in providers */}
        <ThemeProvider>
          <div
            className={styles.container}
            style={{
              backgroundImage: `url(${BackgroundImage.src})`,
            }}
          >
            <header className={styles.header}>
              <Image
                src={LogoHorizontalLight}
                alt="DuckDuckGo"
                className={styles.logo}
                priority
              />
            </header>
            {children}
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
