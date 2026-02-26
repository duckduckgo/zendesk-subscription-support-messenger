import { test, expect } from '@playwright/test';
import { parseHtmlToLegalNotice } from '../../../scripts/parse-legal-notice';
import { MOCK_DOCUMENT_HTML } from '../fixtures/mock-document-html';
import { MOCK_LEGAL_NOTICE_CONTENT } from '../fixtures/mock-legal-notice-content';

test.describe('parseHtmlToLegalNotice', () => {
  test('should parse HTML from docx and match legalNoticeContent structure', () => {
    // Use static mock HTML (actual mammoth/JSDOM output docx). Parse the HTML
    // (this is what we're testing)
    const parsed = parseHtmlToLegalNotice(MOCK_DOCUMENT_HTML);

    // Compare structure (excluding lastUpdated as it's date-dependent). This
    // validates parsing of bold headings, links, italic text, and all content
    expect(parsed.header).toEqual(MOCK_LEGAL_NOTICE_CONTENT.header);
    expect(parsed.sections).toEqual(MOCK_LEGAL_NOTICE_CONTENT.sections);
    expect(parsed.lastUpdated).toBeTruthy();
    expect(typeof parsed.lastUpdated).toBe('string');
    expect(parsed.lastUpdated).toMatch(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/);
  });

  test('should skip button text patterns', () => {
    const htmlWithButtons = `
      <body>
        <p>Some content here.</p>
        <p>[Continue to Chat] [Cancel]</p>
        <p>More content.</p>
      </body>
    `;

    const parsed = parseHtmlToLegalNotice(htmlWithButtons);

    // Should not contain button text
    const allText = JSON.stringify(parsed);

    expect(allText).not.toContain('Continue to Chat');
    expect(allText).not.toContain('Cancel');
  });

  test('should skip "Last updated" lines', () => {
    const htmlWithLastUpdated = `
      <body>
        <p>Some content here.</p>
        <p>Last updated: February 25, 2026</p>
        <p>More content.</p>
      </body>
    `;

    const parsed = parseHtmlToLegalNotice(htmlWithLastUpdated);

    // Should not contain "Last updated" from the document
    const allText = JSON.stringify(parsed);

    expect(allText).not.toContain('Last updated: February 25, 2026');

    // But should have lastUpdated set automatically
    expect(parsed.lastUpdated).toBeTruthy();
  });
});
