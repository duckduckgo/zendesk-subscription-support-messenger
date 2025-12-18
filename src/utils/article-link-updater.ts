/**
 * Utilities for updating article links in the Zendesk widget iframe.
 */

import { buildArticleUrl } from './build-article-url';

const ARTICLE_LINK_SELECTOR = 'a[aria-label^="View article:"]' as const;

/**
 * Updates article links in a document based on the provided mapping.
 * Uses WeakSet to track processed links and prevent duplicate processing.
 *
 * @param doc - The document containing article links
 * @param articleLinkMap - Map of article IDs to their new paths
 * @param baseUrl - Base URL to prepend to article paths
 * @param processedLinks - WeakSet tracking already processed links
 * @param articleIds - Set of article IDs to match against
 */
export function updateArticleLinks(
  doc: Document,
  articleLinkMap: Record<string, string>,
  baseUrl: string,
  processedLinks: WeakSet<HTMLAnchorElement>,
  articleIds: Set<string>,
): void {
  const articleLinks = doc.querySelectorAll<HTMLAnchorElement>(
    ARTICLE_LINK_SELECTOR,
  );

  articleLinks.forEach((anchor) => {
    // Skip if already processed
    if (processedLinks.has(anchor)) {
      return;
    }

    const href = anchor.getAttribute('href');
    if (!href) {
      return;
    }

    // Find matching article ID in href
    const matchedKey = Array.from(articleIds).find((key) => href.includes(key));

    if (matchedKey && articleLinkMap[matchedKey]) {
      const newPath = articleLinkMap[matchedKey];
      const newHref = buildArticleUrl(baseUrl, newPath);
      anchor.setAttribute('href', newHref);
      processedLinks.add(anchor);
    }
  });
}

/**
 * Creates a MutationObserver that watches for new article links
 * and updates them automatically.
 *
 * @param doc - The document to observe
 * @param articleLinkMap - Map of article IDs to their new paths
 * @param baseUrl - Base URL to prepend to article paths
 * @param processedLinks - WeakSet tracking already processed links
 * @param articleIds - Set of article IDs to match against
 * @returns MutationObserver instance or null if setup fails
 */
export function createArticleLinkObserver(
  doc: Document,
  articleLinkMap: Record<string, string>,
  baseUrl: string,
  processedLinks: WeakSet<HTMLAnchorElement>,
  articleIds: Set<string>,
): MutationObserver | null {
  try {
    const observer = new MutationObserver(() => {
      updateArticleLinks(
        doc,
        articleLinkMap,
        baseUrl,
        processedLinks,
        articleIds,
      );
    });

    observer.observe(doc.body, {
      childList: true,
      subtree: true,
    });

    return observer;
  } catch {
    return null;
  }
}
