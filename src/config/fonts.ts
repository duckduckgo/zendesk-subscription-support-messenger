import localFont from 'next/font/local';

/**
 * DuckSans Display font family
 * Used for headings and display text
 */
export const duckSansDisplay = localFont({
  src: [
    {
      path: '../../public/static-assets/fonts/DuckSansDisplay-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/static-assets/fonts/DuckSansDisplay-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/static-assets/fonts/DuckSansDisplay-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-display',
  display: 'swap',
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
});

/**
 * DuckSans Product font family
 * Used for body text and UI elements
 */
export const duckSansProduct = localFont({
  src: [
    {
      path: '../../public/static-assets/fonts/DuckSansProduct-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/static-assets/fonts/DuckSansProduct-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/static-assets/fonts/DuckSansProduct-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-product',
  display: 'swap',
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
});

/**
 * Proxima Nova font family
 * Used for various UI elements
 */
export const proximaNova = localFont({
  src: [
    {
      path: '../../public/static-assets/fonts/ProximaNova-Light-webfont.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/static-assets/fonts/ProximaNova-Reg-webfont.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/static-assets/fonts/ProximaNova-RegIt-webfont.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../public/static-assets/fonts/ProximaNova-Sbold-webfont.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/static-assets/fonts/ProximaNova-Bold-webfont.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/static-assets/fonts/ProximaNova-ExtraBold-webfont.woff2',
      weight: '800',
      style: 'normal',
    },
  ],
  variable: '--font-proxima-nova',
  display: 'swap',
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
});
