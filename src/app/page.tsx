import type { Metadata } from 'next';
import styles from './page.module.css';
import LoadScriptButton from '@/components/load-script-button';

/**
 * Generate metadata for the homepage.
 * This is a server component function, so metadata is included in the initial HTML response.
 *
 * @returns Metadata object with title and description
 */
export function generateMetadata(): Metadata {
  return {
    title: 'DuckDuckGo Automated Support Assistant',
    description: 'DuckDuckGo automated support assistant powered by Zendesk',
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
 * Privacy:
 * - No user tracking
 * - No cookies set
 * - No analytics or data collection
 *
 * @returns Server-rendered homepage component
 */
export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>DuckDuckGo Automated Support Assistant</h1>
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
