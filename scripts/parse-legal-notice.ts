#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import mammoth from 'mammoth';
import { JSDOM } from 'jsdom';
import {
  LegalNoticeContent,
  LegalNoticeSection,
  LegalNoticeTextNode,
} from '../src/types/legal-notice-content';
import {
  normalizeWordText,
  extractUrls,
} from '../src/utils/normalize-word-content';

const DEFAULT_FILE_PATH = '/tmp/notice.docx';
const OUTPUT_FILE = './src/config/legal-notice-content.ts';

// Compiled regex patterns for better performance
const BUTTON_PATTERNS = [
  /^\[.*\]\s*\[.*\]$/, // [Button1] [Button2]
  /^\[Continue to Chat\]/i, // [Continue to Chat]
  /^\[Cancel\]/i, // [Cancel]
];

const LAST_UPDATED_PATTERN = /^Last updated:/i;

/**
 * Formats a date as "Month DD, YYYY" (e.g., "February 25, 2026").
 *
 * @function formatLastUpdatedDate
 * @param {Date} date - The date to format
 *
 * @returns {string} Formatted date string in "Month DD, YYYY" format
 */
function formatLastUpdatedDate(date: Date): string {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const monthIndex = date.getMonth();
  if (monthIndex < 0 || monthIndex >= months.length) {
    throw new Error(`Invalid month index: ${monthIndex}`);
  }

  const month = months[monthIndex];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
}

/**
 * Parses an HTML element (p, strong, em, a) and converts to structured text nodes.
 *
 * Processes HTML elements from Word document conversion, extracting text,
 * bold formatting, italic formatting, links, and URLs. Recursively processes
 * child elements to handle nested structures.
 *
 * @function parseHtmlElement
 * @param {Element} element - The HTML element to parse
 *
 * @returns {LegalNoticeTextNode[]} Array of structured text nodes
 */
function parseHtmlElement(element: {
  tagName: string;
  textContent: string | null;
  getAttribute: (name: string) => string | null;
  childNodes: ArrayLike<Node>;
}): LegalNoticeTextNode[] {
  const nodes: LegalNoticeTextNode[] = [];
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'strong' || tagName === 'b') {
    // Bold text
    const text = normalizeWordText(element.textContent || '');

    if (text.trim()) {
      nodes.push({ bold: text });
    }
  } else if (tagName === 'em' || tagName === 'i') {
    // Italic text
    const text = normalizeWordText(element.textContent || '');

    if (text.trim()) {
      nodes.push({ italic: text });
    }
  } else if (tagName === 'a') {
    // Link
    const href = element.getAttribute('href') || '';
    const text = normalizeWordText(element.textContent || '');

    if (href && text.trim()) {
      nodes.push({
        link: {
          text,
          href,
          openInNewTab: true,
        },
      });
    } else if (text.trim()) {
      nodes.push(text);
    }
  } else {
    // Regular text or container - process children
    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === 3) {
        // Text node
        const text = normalizeWordText(child.textContent || '');

        if (text.trim()) {
          // Check for URLs in plain text
          const urls = extractUrls(text);

          if (urls.length > 0) {
            let lastIndex = 0;

            for (const url of urls) {
              if (url.startIndex > lastIndex) {
                const beforeText = text.substring(lastIndex, url.startIndex);

                if (beforeText.trim()) {
                  nodes.push(beforeText.trim());
                }
              }
              nodes.push({
                link: {
                  text: url.text,
                  href: url.url,
                  openInNewTab: true,
                },
              });

              lastIndex = url.endIndex;
            }
            if (lastIndex < text.length) {
              const afterText = text.substring(lastIndex);

              if (afterText.trim()) {
                nodes.push(afterText.trim());
              }
            }
          } else {
            nodes.push(text);
          }
        }
      } else if (child.nodeType === 1) {
        // Element node - recurse
        // Type assertion: nodeType 1 is Element node
        // Convert to unknown first to safely cast to Element-like type
        const elementLike = child as unknown as {
          tagName: string;
          textContent: string | null;
          getAttribute: (name: string) => string | null;
          childNodes: ArrayLike<Node>;
        };

        const childNodes = parseHtmlElement(elementLike);

        nodes.push(...childNodes);
      }
    }
  }

  return nodes;
}

/**
 * Parses HTML content and converts to LegalNoticeContent structure.
 *
 * Parses HTML content (typically from Word document conversion) into a
 * structured format with sections, headings, paragraphs, links, and bold text.
 * Automatically sets the lastUpdated date to today's date.
 * Skips button text patterns and "Last updated" lines from the document.
 *
 * @function parseHtmlToLegalNotice
 * @param {string} html - HTML content to parse
 *
 * @returns {LegalNoticeContent} Parsed legal notice content structure
 */
export function parseHtmlToLegalNotice(html: string): LegalNoticeContent {
  // Parse HTML with jsdom
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Initialize content with lastUpdated set to today's date
  // This ensures lastUpdated is always present, even if the document
  // doesn't contain a "Last updated:" line
  const content: LegalNoticeContent = {
    header: [],
    sections: [],
    lastUpdated: formatLastUpdatedDate(new Date()),
  };

  let currentSection: LegalNoticeSection | null = null;
  let isHeader = true;

  // Process all paragraphs
  const paragraphs = document.querySelectorAll('p');

  for (const para of Array.from(paragraphs)) {
    const text = normalizeWordText(para.textContent || '');

    if (!text.trim()) {
      continue;
    }

    // Skip button text patterns like [Continue to Chat] [Cancel]. Also handle
    // cases where buttons might be on separate lines or have variations
    if (BUTTON_PATTERNS.some((pattern) => pattern.test(text))) {
      continue;
    }

    // Skip lines that look like "Last updated: ..." - we'll set this
    // automatically
    if (LAST_UPDATED_PATTERN.test(text)) {
      continue;
    }

    // Parse paragraph content
    const paragraphNodes = parseHtmlElement(para);

    if (paragraphNodes.length === 0) {
      continue;
    }

    // Check if this should be a heading (short, entirely bold text)
    const firstNode = paragraphNodes[0];
    const isEntirelyBold =
      paragraphNodes.length === 1 &&
      typeof firstNode === 'object' &&
      firstNode !== null &&
      'bold' in firstNode &&
      (firstNode as { bold: string }).bold.length < 150 &&
      !(firstNode as { bold: string }).bold.match(/[.!?]$/);

    if (isEntirelyBold) {
      // This is a heading
      if (currentSection) {
        content.sections.push(currentSection);
      }

      currentSection = {
        heading: (firstNode as { bold: string }).bold,
        paragraphs: [],
      };

      isHeader = false;
    } else {
      // Regular paragraph
      if (isHeader) {
        content.header.push(paragraphNodes);

        isHeader = false;
      } else {
        if (!currentSection) {
          currentSection = { paragraphs: [] };
        }

        currentSection.paragraphs.push(paragraphNodes);
      }
    }
  }

  // Add last section
  if (currentSection) {
    content.sections.push(currentSection);
  }

  // Validate that we have at least some content
  if (content.header.length === 0 && content.sections.length === 0) {
    throw new Error(
      'No content found in document. Document may be empty or contain only excluded patterns.',
    );
  }

  return content;
}

/**
 * Parses Word document and converts to LegalNoticeContent structure.
 *
 * Reads a Word document (.docx), converts it to HTML, and parses the content
 * into a structured format with sections, headings, paragraphs, links, and
 * bold text. Automatically sets the lastUpdated date to today's date.
 * Skips button text patterns and "Last updated" lines from the document.
 *
 * @function parseWordDocument
 * @param {string} filePath - Path to the Word document file
 *
 * @returns {Promise<LegalNoticeContent>} Parsed legal notice content structure
 */
async function parseWordDocument(
  filePath: string,
): Promise<LegalNoticeContent> {
  const buffer = fs.readFileSync(filePath);

  // Convert Word document to HTML
  const htmlResult = await mammoth.convertToHtml({ buffer });

  // Check for conversion warnings/errors
  if (htmlResult.messages.length > 0) {
    console.warn('Word document conversion warnings:');

    htmlResult.messages.forEach((message) => {
      console.warn(`  - ${message.type}: ${message.message}`);
    });
  }

  const html = htmlResult.value;

  return parseHtmlToLegalNotice(html);
}

/**
 * Serializes a LegalNoticeTextNode to TypeScript code string.
 *
 * Converts a structured text node (string, bold, italic, or link)
 * into its TypeScript representation for code generation.
 *
 * @function serializeTextNode
 * @param {LegalNoticeTextNode} node - The text node to serialize
 *
 * @returns {string} TypeScript code string representation
 */
function serializeTextNode(node: LegalNoticeTextNode): string {
  if (typeof node === 'string') {
    return JSON.stringify(node);
  }

  if ('bold' in node) {
    return `{ bold: ${JSON.stringify(node.bold)} }`;
  }

  if ('italic' in node) {
    return `{ italic: ${JSON.stringify(node.italic)} }`;
  }

  if ('link' in node) {
    return `{ link: { text: ${JSON.stringify(node.link.text)}, href: ${JSON.stringify(node.link.href)}, openInNewTab: ${node.link.openInNewTab ?? true} } }`;
  }

  return JSON.stringify(node);
}

/**
 * Generates TypeScript code for the legal notice content config.
 *
 * Converts the LegalNoticeContent structure into formatted TypeScript code
 * that can be written to the config file. Handles proper indentation,
 * JSON stringification, and code formatting.
 *
 * @function generateConfigCode
 * @param {LegalNoticeContent} content - The legal notice content structure to convert
 *
 * @returns {string} Formatted TypeScript code for the config file
 */
function generateConfigCode(content: LegalNoticeContent): string {
  const sectionsCode = content.sections
    .map((section) => {
      const headingCode = section.heading
        ? `heading: ${JSON.stringify(section.heading)},`
        : '';
      const paragraphsCode = section.paragraphs
        .map((para) => {
          const paraCode = para.map(serializeTextNode).join(', ');
          return `[${paraCode}]`;
        })
        .join(',');

      return `{${headingCode ? ` ${headingCode}` : ''} paragraphs: [${paragraphsCode}]}`;
    })
    .join(',');

  const headerCode = content.header
    .map((para) => {
      const paraCode = para.map(serializeTextNode).join(', ');
      return `[${paraCode}]`;
    })
    .join(',');

  // Generate code without manual formatting - Prettier will handle it
  return `import { LegalNoticeContent } from '@/types/legal-notice-content';

/**
 * Legal notice content configuration.
 *
 * This content can be updated by running:
 * npm run parse-legal-notice [path-to-word-doc.docx]
 *
 * Structure:
 * - header: Array of paragraphs shown at the top
 * - sections: Array of sections, each with optional heading and paragraphs
 * - lastUpdated: Date string for "Last updated" display
 */
export const legalNoticeContent: LegalNoticeContent = {
  header: [${headerCode}],
  sections: [${sectionsCode}],
  lastUpdated: ${JSON.stringify(content.lastUpdated)},
};
`;
}

/**
 * Main execution function.
 *
 * Parses command line arguments, reads the Word document, converts it to
 * structured content, generates TypeScript config code, and writes it to
 * the output file. Handles errors and provides console output.
 *
 * @function main
 *
 * @returns {Promise<void>}
 */
async function main() {
  const filePath = process.argv[2] || DEFAULT_FILE_PATH;

  // Validate file path is a string
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    console.error('Error: Invalid file path provided');

    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);

  console.log(`Parsing Word document: ${absolutePath}`);

  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File not found: ${absolutePath}`);

    process.exit(1);
  }

  // Check if it's actually a file (not a directory)
  const stats = fs.statSync(absolutePath);
  if (!stats.isFile()) {
    console.error(`Error: Path is not a file: ${absolutePath}`);

    process.exit(1);
  }

  try {
    const content = await parseWordDocument(absolutePath);
    const configCode = generateConfigCode(content);

    // Ensure output directory exists
    const outputPath = path.resolve(OUTPUT_FILE);
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write to config file
    fs.writeFileSync(outputPath, configCode, 'utf-8');

    // Format the generated file with Prettier
    try {
      execSync(`npx prettier --write "${outputPath}"`, {
        stdio: 'inherit',
      });
    } catch (prettierError) {
      console.warn(
        'Warning: Failed to format generated file with Prettier. File was still written.',
      );

      console.warn(prettierError);
    }

    console.log(`✓ Successfully parsed and updated: ${outputPath}`);
    console.log(`  - Header paragraphs: ${content.header.length}`);
    console.log(`  - Sections: ${content.sections.length}`);
    console.log(`  - Last updated: ${content.lastUpdated}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error('Error parsing Word document:', errorMessage);

    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }

    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);

    process.exit(1);
  });
}
