import { buildArticleUrl } from './build-article-url';
import { ARTICLE_LINK_MAP } from '@/config/zendesk';
import { ZENDESK_ARTICLE_LINK_SELECTOR } from '@/constants/zendesk-selectors';

/**
 * Updates article links in a document based on the provided mapping.
 *
 * @function updateArticleLinks
 * @param {Document} doc - The document containing article links
 *
 * @returns {number} The number of links that were found and updated for retry
 * logic
 */
export function updateArticleLinks(doc: Document): number {
  // Create an array of article IDs
  const articleIds = Object.keys(ARTICLE_LINK_MAP);

  // Find all links with aria-label="View article:"
  const anchorElements = doc.querySelectorAll<HTMLAnchorElement>(
    ZENDESK_ARTICLE_LINK_SELECTOR,
  );

  let updatedCount = 0;

  anchorElements.forEach((anchorEl) => {
    const href = anchorEl.getAttribute('href');

    if (!href) {
      return;
    }

    // Find matching article ID in href
    const matchedId = articleIds.find((id) => href.includes(id));

    if (matchedId && ARTICLE_LINK_MAP[matchedId]) {
      const newHref = buildArticleUrl(ARTICLE_LINK_MAP[matchedId]);

      anchorEl.setAttribute('href', newHref);
      updatedCount++;
    }
  });

  return updatedCount;
}
