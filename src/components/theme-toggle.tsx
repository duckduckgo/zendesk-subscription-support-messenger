'use client';

import { useMemo, useCallback } from 'react';
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
   *
   * @returns String label describing the current theme
   */
  const themeLabel = useMemo(() => {
    if (theme === Theme.System) {
      const resolvedLabel =
        resolvedTheme === ResolvedTheme.Dark ? 'dark' : 'light';
      return `System (${resolvedLabel})`;
    }
    return theme === Theme.Dark ? 'Dark' : 'Light';
  }, [theme, resolvedTheme]);

  /**
   * Generates ARIA label for the theme toggle button.
   *
   * @returns Accessible label string for screen readers
   */
  const ariaLabel = useMemo(() => {
    return `Switch theme. Current: ${themeLabel}`;
  }, [themeLabel]);

  return (
    <Button
      text={`${themeIcon} ${themeLabel}`}
      onClick={toggleTheme}
      aria-label={ariaLabel}
      type="button"
    />
  );
}
