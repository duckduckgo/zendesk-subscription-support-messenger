/**
 * Type definitions for legal notice content structure.
 *
 * Supports structured content with sections, headings, paragraphs, links,
 * bold text, and italic text.
 */

/**
 * Link object for structured links in content.
 */
export interface LegalNoticeLink {
  text: string;
  href: string;
  openInNewTab?: boolean;
}

/**
 * Union type for text nodes within a paragraph.
 * Supports plain text, bold text, italic text, and links.
 */
export type LegalNoticeTextNode =
  | string
  | { bold: string }
  | { italic: string }
  | { link: LegalNoticeLink };

/**
 * A paragraph is an array of text nodes, allowing mixed content.
 */
export type LegalNoticeParagraph = LegalNoticeTextNode[];

/**
 * A section contains an optional heading and one or more paragraphs.
 */
export interface LegalNoticeSection {
  heading?: string;
  paragraphs: LegalNoticeParagraph[];
}

/**
 * Main content structure for the legal notice.
 */
export interface LegalNoticeContent {
  /** Header paragraph(s) shown before main content */
  header: LegalNoticeParagraph[];
  /** Main content sections */
  sections: LegalNoticeSection[];
  /** Last updated date string in "Month DD, YYYY" format */
  lastUpdated: string;
}
