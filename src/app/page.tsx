import type { Metadata } from 'next';
import styles from './page.module.css';
import { getTranslation } from '@/utils';
import LoadScriptButton from '@/components/load-script-button';

/**
 * Generate metadata for the homepage.
 * This is a server component function, so metadata is included in the initial HTML response.
 *
 * Note: Locale is detected here for metadata, but translations are also loaded
 * in the layout. This ensures metadata has the correct locale-specific content.
 *
 * Benefits:
 * - Improves SEO (search engines can index translated content)
 * - Provides locale-specific metadata based on Accept-Language header
 * - Server-rendered for optimal performance
 *
 * @returns Metadata object with translated title and description
 */
export async function generateMetadata(): Promise<Metadata> {
  // Get translations for metadata generation
  // Layout also loads translations, but this ensures metadata is correct
  const title = await getTranslation('pageTitle');
  const description = await getTranslation('pageDescription');

  return {
    title,
    description,
  };
}

/**
 * Homepage component - Server Rendered.
 *
 * This is a Server Component by default in Next.js 16 App Router.
 * It is rendered on the server during the initial request, providing:
 * - Faster initial page load (HTML is sent directly)
 * - Better SEO (content is in the initial HTML)
 * - Reduced client-side JavaScript bundle size
 * - Improved Core Web Vitals scores
 * - Privacy-preserving (no client-side tracking or data collection)
 *
 * Server Rendering Verification:
 * - ✅ No 'use client' directive (confirms server component)
 * - ✅ Async function (server-side data fetching)
 * - ✅ Translations loaded server-side via layout
 * - ✅ Locale detected server-side from headers
 * - ✅ Build output shows: `ƒ /` (function route = server-rendered)
 *
 * Locale & Translations:
 * - Locale is detected server-side in layout from Accept-Language header
 * - Translations are loaded server-side in layout
 * - TranslationsProvider wraps this component (in layout)
 * - Client components can use `useIntl()` hook to access translations
 * - Server components remain server components - no need to pass locale as prop
 * - No redirects needed - locale determined on server
 *
 * Privacy:
 * - No user tracking
 * - No cookies set
 * - No analytics or data collection
 * - Locale determined from Accept-Language header only (not stored)
 *
 * Note: This component remains a server component.
 * - Client components can be used within this page (marked with 'use client')
 * - Client components can access translations via `useIntl()` hook
 * - Server components can receive locale as prop if needed (not required here)
 *
 * @returns Server-rendered homepage component
 */
export default async function Home() {
  // You can get translations here using getTranslations() or getTranslation()

  // Option 1: Get all translations
  // const translations = await getTranslations();

  // Option 2: Get a specific translation (more convenient)
  const mainHeadingText = await getTranslation('pageTitle');

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* Example: Using translations in server component */}
        <h1>{mainHeadingText}</h1>
        <LoadScriptButton />
        <div
          style={{
            width: '100%',
            height: '500px',
            minHeight: '400px',
            border: 'none',
            borderRadius: '8px',
            marginTop: '20px',
          }}
          id="messaging-container"
        ></div>
      </main>
    </div>
  );
}
