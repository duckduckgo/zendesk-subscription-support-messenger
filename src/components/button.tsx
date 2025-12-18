'use client';

import { memo, type ButtonHTMLAttributes } from 'react';
import styles from './button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
}

export const Button = memo<ButtonProps>(({ text, className, ...props }) => {
  return (
    <button
      className={className ? `${styles.button} ${className}` : styles.button}
      {...props}
    >
      {text}
    </button>
  );
});

Button.displayName = 'Button';
