import React from 'react';
import {
  LegalNoticeContent,
  LegalNoticeTextNode,
} from '@/types/legal-notice-content';
import NewTabLabel from '@/components/new-tab-label/new-tab-label';
import styles from '@/components/consent-form/consent-form.module.css';

/**
 * Renders a single text node (string, bold, italic, or link).
 *
 * Converts a LegalNoticeTextNode into React elements.
 * Supports plain text, bold text, italic text, and links.
 *
 * @function renderTextNode
 * @param {LegalNoticeTextNode} node - The text node to render
 *
 * @returns {React.ReactNode} React element representing the text node
 */
function renderTextNode(node: LegalNoticeTextNode): React.ReactNode {
  if (typeof node === 'string') {
    return node;
  }

  if ('bold' in node) {
    const boldNode = node as { bold: string };

    return <strong>{boldNode.bold}</strong>;
  }

  if ('italic' in node) {
    const italicNode = node as { italic: string };

    return <em>{italicNode.italic}</em>;
  }

  if ('link' in node) {
    const link = node.link;

    return (
      <a
        href={link.href}
        target={link.openInNewTab ? '_blank' : undefined}
        rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
        className={styles.link}
      >
        {link.text}
        {link.openInNewTab && <NewTabLabel />}
      </a>
    );
  }

  return null;
}

/**
 * Renders a paragraph (array of text nodes).
 *
 * Converts an array of LegalNoticeTextNodes into React elements, handling
 * proper spacing around links. Automatically adds spaces before links
 * if the previous text doesn't end with whitespace or punctuation, and
 * adds spaces after links if the next character is a letter or opening
 * parenthesis.
 *
 * @function renderParagraph
 * @param {LegalNoticeTextNode[]} paragraph - Array of text nodes to render
 *
 * @returns {React.ReactNode} React element representing the paragraph
 */
function renderParagraph(paragraph: LegalNoticeTextNode[]): React.ReactNode {
  return paragraph.map((node, index) => {
    const renderedNode = renderTextNode(node);
    const isLink = typeof node === 'object' && node !== null && 'link' in node;

    // Check if we need space before link
    const needsSpaceBefore =
      index > 0 &&
      isLink &&
      (() => {
        const prevNode = paragraph[index - 1];

        if (typeof prevNode === 'string') {
          const prevText = prevNode.trim();
          // If previous text doesn't end with space or punctuation that typically
          // doesn't need space
          return prevText && !prevText.match(/[\s,;:!?.]$/);
        }

        return false;
      })();

    // Check if we need space after link - only if next character is a letter
    // (a-zA-Z) or opening parenthesis
    const needsSpaceAfter =
      isLink &&
      index < paragraph.length - 1 &&
      (() => {
        const nextNode = paragraph[index + 1];

        if (typeof nextNode === 'string') {
          const nextText = nextNode.trim();
          // Only add space if next text starts with a letter (a-zA-Z) or opening
          // parenthesis
          return nextText && /^[a-zA-Z(]/.test(nextText);
        }

        return false;
      })();

    if (isLink && (needsSpaceBefore || needsSpaceAfter)) {
      return (
        <React.Fragment key={index}>
          {needsSpaceBefore && ' '}
          {renderedNode}
          {needsSpaceAfter && ' '}
        </React.Fragment>
      );
    }

    return <React.Fragment key={index}>{renderedNode}</React.Fragment>;
  });
}

/**
 * Renders legal notice content structure as React elements.
 *
 * Converts a LegalNoticeContent structure into React JSX elements with proper
 * formatting. Processes header paragraphs, sections with headings and
 * paragraphs, and the last updated date.
 *
 * @function renderLegalNoticeContent
 * @param {LegalNoticeContent} content - The legal notice content structure to render
 *
 * @returns {Object} Object containing rendered React elements
 * @returns {React.ReactNode[]} returns.header - Array of header paragraph elements
 * @returns {Array<{heading?: React.ReactNode, paragraphs: React.ReactNode[]}>}
 * returns.sections - Array of section objects with optional heading and
 * paragraph elements
 * @returns {React.ReactNode} returns.lastUpdated - Last updated date element
 */
export function renderLegalNoticeContent(content: LegalNoticeContent): {
  header: React.ReactNode[];
  sections: Array<{
    heading?: React.ReactNode;
    paragraphs: React.ReactNode[];
  }>;
  lastUpdated: React.ReactNode;
} {
  const header = content.header.map((para, index) => (
    <p key={index}>{renderParagraph(para)}</p>
  ));

  const sections = content.sections.map((section, sectionIndex) => ({
    heading: section.heading ? (
      <strong key={`heading-${sectionIndex}`}>{section.heading}</strong>
    ) : undefined,
    paragraphs: section.paragraphs.map((para, paraIndex) => (
      <p key={`section-${sectionIndex}-para-${paraIndex}`}>
        {renderParagraph(para)}
      </p>
    )),
  }));

  // lastUpdated is always required, so always render it
  const lastUpdated = (
    <p key="last-updated">Last updated: {content.lastUpdated}</p>
  );

  return {
    header,
    sections,
    lastUpdated,
  };
}
