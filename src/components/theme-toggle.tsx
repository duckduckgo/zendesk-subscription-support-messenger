'use client';

import { useMemo, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { useTheme } from '@/contexts/theme-context';
import { Theme, ResolvedTheme } from '@/constants/theme';
import { Button } from './button';

/**
 * ThemeToggle component that allows users to cycle through theme options.
 * Cycles through: Light → Dark → System → Light
 *
 * Displays the current theme with an appropriate icon and label.
 * Includes proper ARIA labels for accessibility.
 *
 * Performance optimizations:
 * - Memoizes icon and label calculations to prevent unnecessary recalculations
 * - Uses useCallback for toggle handler to maintain referential equality
 */
export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const intl = useIntl();

  /**
   * Cycles through theme options when the button is clicked.
   * Order: Light → Dark → System → Light (repeat)
   *
   * Using useCallback to maintain referential equality and prevent unnecessary re-renders
   * of child components that might depend on this function.
   */
  const toggleTheme = useCallback(() => {
    switch (theme) {
      case Theme.Light:
        setTheme(Theme.Dark);
        break;
      case Theme.Dark:
        setTheme(Theme.System);
        break;
      case Theme.System:
      default:
        setTheme(Theme.Light);
        break;
    }
  }, [theme, setTheme]);

  /**
   * Returns the appropriate icon for the current theme.
   * - System theme: 🌓 (half-moon, indicating it follows system)
   * - Dark theme: 🌙 (moon)
   * - Light theme: ☀️ (sun)
   *
   * Memoized to prevent recalculation on every render.
   *
   * @returns Emoji icon representing the current theme
   */
  const themeIcon = useMemo(() => {
    if (theme === Theme.System) {
      return '🌓';
    }
    // For light/dark themes, show icon based on resolved theme
    return resolvedTheme === ResolvedTheme.Dark ? '🌙' : '☀️';
  }, [theme, resolvedTheme]);

  /**
   * Returns a human-readable label for the current theme.
   * Uses translations from react-intl following the static-pages pattern.
   *
   * Translation keys used:
   * - themeSystem: "System ({resolvedTheme})" - Shows system theme with resolved value
   * - themeDark: "Dark" - Dark theme label
   * - themeLight: "Light" - Light theme label
   *
   * Following static-pages pattern:
   * - Uses `intl.formatMessage()` for all translations
   * - Supports parameter interpolation (e.g., {resolvedTheme})
   * - Memoized to prevent recalculation on every render
   *
   * @returns String label describing the current theme
   */
  const themeLabel = useMemo(() => {
    if (theme === Theme.System) {
      // Use translation with resolved theme parameter
      // Format: "System (light)" or "System (dark)"
      return intl.formatMessage({ id: 'themeSystem' }, { resolvedTheme });
    }
    // Use simple translation key for light/dark themes
    const translationKey = theme === Theme.Dark ? 'themeDark' : 'themeLight';
    return intl.formatMessage({ id: translationKey });
  }, [theme, resolvedTheme, intl]);

  /**
   * Generates ARIA label for the theme toggle button.
   * Uses translation with parameter interpolation for accessibility.
   *
   * Translation key: themeToggle
   * Format: "Switch theme. Current: {currentTheme}"
   *
   * Memoized to prevent recalculation on every render.
   *
   * @returns Accessible label string for screen readers
   */
  const ariaLabel = useMemo(() => {
    return intl.formatMessage(
      { id: 'themeToggle' },
      { currentTheme: themeLabel },
    );
  }, [themeLabel, intl]);

  return (
    <Button
      text={`${themeIcon} ${themeLabel}`}
      onClick={toggleTheme}
      aria-label={ariaLabel}
      type="button"
    />
  );
}
