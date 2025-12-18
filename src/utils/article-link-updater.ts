/**
 * Utilities for updating article links in the Zendesk widget iframe.
 */

import { buildArticleUrl } from './build-article-url';

/**
 * Updates article links in a document based on the provided mapping.
 *
 * @param doc - The document containing article links
 * @param articleLinkMap - Map of article IDs to their new paths
 * @param baseUrl - Base URL to prepend to article paths
 */
export function updateArticleLinks(
  doc: Document,
  articleLinkMap: Record<string, string>,
  baseUrl: string,
): void {
  // Find all links with aria-label="View article:" or containing article IDs
  const articleIds = Object.keys(articleLinkMap);
  const links = doc.querySelectorAll<HTMLAnchorElement>(
    'a[aria-label^="View article:"]',
  );

  links.forEach((anchor) => {
    const href = anchor.getAttribute('href');
    if (!href) {
      return;
    }

    // Find matching article ID in href
    const matchedId = articleIds.find((id) => href.includes(id));

    if (matchedId && articleLinkMap[matchedId]) {
      const newHref = buildArticleUrl(baseUrl, articleLinkMap[matchedId]);
      anchor.setAttribute('href', newHref);
    }
  });
}
