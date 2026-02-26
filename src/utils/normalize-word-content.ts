/**
 * Normalizes smart quotes to straight quotes.
 *
 * @function normalizeQuotes
 * @param {string} text - Text to normalize
 *
 * @returns {string} Text with normalized quotes
 */
export function normalizeQuotes(text: string): string {
  return text.replace(/[""]/g, '"').replace(/['']/g, "'").replace(/['']/g, "'");
}

/**
 * Normalizes whitespace in text.
 * - Converts multiple spaces to single space
 * - Trims leading/trailing whitespace
 * - Preserves single line breaks
 *
 * @function normalizeWhitespace
 * @param {string} text - Text to normalize
 *
 * @returns {string} Text with normalized whitespace
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

/**
 * Normalizes a full text string from Word document.
 * Applies quote normalization and whitespace normalization.
 *
 * @function normalizeWordText
 * @param {string} text - Raw text from Word document
 *
 * @returns {string} Normalized text
 */
export function normalizeWordText(text: string): string {
  let normalized = text;

  // Normalize quotes
  normalized = normalizeQuotes(normalized);

  // Normalize whitespace
  normalized = normalizeWhitespace(normalized);

  return normalized;
}

/**
 * Detects if a paragraph should be treated as a heading.
 * Headings are typically:
 * - Short paragraphs (less than 100 characters)
 * - Entirely bold text
 * - Not ending with punctuation
 *
 * @function isHeading
 * @param {string} text - Text to check
 * @param {boolean} isBold - Whether the text is bold
 *
 * @returns {boolean} True if text should be treated as a heading
 */
export function isHeading(text: string, isBold: boolean): boolean {
  if (!isBold) {
    return false;
  }

  const normalized = normalizeWordText(text);

  // Short bold text without ending punctuation is likely a heading
  return (
    normalized.length < 100 &&
    !normalized.match(/[.!?]$/) &&
    normalized.length > 0
  );
}

/**
 * Extracts URLs from text and returns them as link objects.
 *
 * @function extractUrls
 * @param {string} text - Text that may contain URLs
 *
 * @returns {Array<{text: string, url: string, startIndex: number, endIndex:
 * number}>} Array of found URLs
 */
export function extractUrls(
  text: string,
): Array<{ text: string; url: string; startIndex: number; endIndex: number }> {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
  const urls: Array<{
    text: string;
    url: string;
    startIndex: number;
    endIndex: number;
  }> = [];

  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    urls.push({
      text: match[1],
      url: match[1],
      startIndex: match.index,
      endIndex: match.index + match[1].length,
    });
  }

  return urls;
}
