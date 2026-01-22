/**
 * Gets a CSS variable value from the document root.
 *
 * @function getCSSVariable
 * @param {string} name - The CSS variable name
 *
 * @returns {string} The CSS variable value, or empty string if not found
 *
 * @example
 * ```ts
 * const blue60 = getCSSVariable('--sds-color-palette-blue-60');
 * ```
 */
export function getCSSVariable(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}
