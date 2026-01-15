'use client';

import { useEffect, useState } from 'react';
import styles from './footer.module.css';
import { learnMoreLinks, otherResourcesLinks } from '@/constants/footerLinks';
import { MAIN_SITE_URL } from '@/config/common';
import { useIsTablet } from '@/hooks/use-media-query';

export default function Footer() {
  const [mounted, setMounted] = useState(false);
  const isTablet = useIsTablet();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const buildHref = (href: string): string => {
    if (href.includes('https://')) {
      return href;
    }

    return `${MAIN_SITE_URL}${href}`;
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerLinksWrapper}>
          <div className={styles.footerSection}>
            <h4 className={styles.footerTitle}>LEARN MORE</h4>
            {learnMoreLinks.map((link) => (
              <a
                key={link.href}
                href={buildHref(link.href)}
                className={styles.footerLink}
                target="_blank"
                rel={link.rel ?? undefined}
              >
                {link.text}
                {link.badge && (
                  <span className={styles.badge}>{link.badge}</span>
                )}
              </a>
            ))}
          </div>

          <div className={styles.footerSection}>
            <h4 className={styles.footerTitle}>OTHER RESOURCES</h4>
            {otherResourcesLinks.map((link) => (
              <a
                key={link.href}
                href={buildHref(link.href)}
                className={styles.footerLink}
                target="_blank"
                rel={link.rel ?? undefined}
              >
                {link.text}
              </a>
            ))}
          </div>
        </div>

        <div className={styles.footerSection}>
          <h4 className={styles.footerTitle}>ABOUT DUCKDUCKGO</h4>
          <p className={styles.footerText}>
            At DuckDuckGo, we believe the best way to protect your personal
            information from hackers, scammers, and privacy-invasive companies
            is to stop it from being collected at all. That&apos;s why millions
            of people{' '}
            <a
              target="_blank"
              rel="noopener"
              className={styles.footerTextLink}
              href={`${MAIN_SITE_URL}/compare-privacy`}
            >
              choose DuckDuckGo over Chrome and other browsers
            </a>{' '}
            to search and browse online. Our built-in search engine is like
            Google but never tracks your searches. And our browsing protections,
            such as ad tracker blocking and cookie blocking, help stop other
            companies from collecting your data. Oh, and our browser is free —
            we make money from{' '}
            <a
              target="_blank"
              rel="noopener"
              className={styles.footerTextLink}
              href={`${MAIN_SITE_URL}/duckduckgo-help-pages/company/how-duckduckgo-makes-money`}
            >
              privacy-respecting search ads
            </a>
            , not by exploiting your data. Take back control of your personal
            information with the browser designed for data protection, not data
            collection. Available to download on{' '}
            <a
              target="_blank"
              rel="noopener"
              className={styles.footerTextLink}
              href={`${MAIN_SITE_URL}/mac`}
            >
              Mac
            </a>
            ,{' '}
            <a
              target="_blank"
              rel="noopener"
              className={styles.footerTextLink}
              href={`${MAIN_SITE_URL}/windows`}
            >
              Windows
            </a>
            ,{' '}
            <a
              target="_blank"
              rel="noopener"
              className={styles.footerTextLink}
              href="https://apps.apple.com/app/duckduckgo-privacy-browser/id663592361?platform=iphone"
            >
              iOS
            </a>
            , and{' '}
            <a
              target="_blank"
              rel="noopener"
              className={styles.footerTextLink}
              href="https://play.google.com/store/apps/details?id=com.duckduckgo.mobile.android"
            >
              Android
            </a>
            .
          </p>
        </div>
      </div>

      <div
        className={`${styles.copyright} ${
          mounted && isTablet ? styles.copyrightMobile : ''
        }`}
      >
        <span>&copy; {new Date().getFullYear()} DuckDuckGo</span>
        {mounted && !isTablet && <span aria-hidden="true"></span>}
        <span>Protection. Privacy. Peace of mind.</span>
      </div>
    </footer>
  );
}
