'use client';

import { memo, type ButtonHTMLAttributes } from 'react';
import styles from './button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  /**
   * If true, skips applying the base button styles from button.module.css
   * Useful when you want to apply completely custom styles via className
   */
  skipBaseStyles?: boolean;
}

export const Button = memo<ButtonProps>(
  ({ text, className, skipBaseStyles = false, ...props }) => {
    const baseClassName = skipBaseStyles ? '' : styles.button;
    const finalClassName = className
      ? `${baseClassName} ${className}`.trim()
      : baseClassName;

    return (
      <button className={finalClassName || undefined} {...props}>
        {text}
      </button>
    );
  },
);

Button.displayName = 'Button';
