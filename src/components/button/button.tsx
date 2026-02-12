'use client';

import { memo, type Ref, type ButtonHTMLAttributes } from 'react';
import styles from './button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  // Skips applying the base button styles from button.module.css
  skipBaseStyles?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export const Button = memo<ButtonProps>(
  ({ text, className, skipBaseStyles = false, ref, ...props }) => {
    const baseClassName = skipBaseStyles ? '' : styles.button;
    const finalClassName = className
      ? `${baseClassName} ${className}`.trim()
      : baseClassName;

    return (
      <button ref={ref} className={finalClassName || undefined} {...props}>
        {text}
      </button>
    );
  },
);

Button.displayName = 'Button';
