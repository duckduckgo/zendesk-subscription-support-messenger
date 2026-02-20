'use client';

import { useEffect, useRef, type MouseEvent } from 'react';
import Image from 'next/image';
import FireBurnIcon from '../../../public/static-assets/images/Fire-Burn-96.svg';
import { Button } from '@/components/button/button';
import styles from './confirm-dialog.module.css';
import {
  CANCEL_DELETE_DATA_BUTTON_TEST_ID,
  CONFIRM_DELETE_DATA_BUTTON_TEST_ID,
} from '@/constants/test-ids';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmDialog component displays a modal confirmation dialog.
 *
 * Features:
 * - Accessible dialog with focus trap
 * - Dark overlay background
 * - Close on Cancel, X button, or clicking outside
 * - Confirm with Delete Chat button
 * - Mobile responsive
 *
 * @param props - Component props
 * @param props.isOpen - Whether the dialog is open
 * @param props.onConfirm - Handler for confirm action
 * @param props.onCancel - Handler for cancel action
 * @returns Confirmation dialog element
 */
export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Capture the trigger element, move focus into dialog on open,
  // and restore focus to the trigger on close.
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      confirmButtonRef.current?.focus();
    } else {
      triggerRef.current?.focus();
      triggerRef.current = null;
    }
  }, [isOpen]);

  // Focus trap + Escape key (only active while open)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }

      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <button
          className={styles.closeButton}
          onClick={onCancel}
          aria-label="Close dialog"
          type="button"
        >
          <svg
            aria-hidden="true"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className={styles.iconContainer}>
          <Image src={FireBurnIcon} alt="" width={128} height={128} />
        </div>

        <h2 id="dialog-title" className={styles.title}>
          Clear Conversation Data?
        </h2>

        <p id="dialog-description" className={styles.description}>
          Are you sure you want to clear the conversation data? This cannot be
          undone.
        </p>

        <div className={styles.actions}>
          <Button
            text="Cancel"
            className={styles.cancelButton}
            onClick={onCancel}
            type="button"
            skipBaseStyles
            data-testid={CANCEL_DELETE_DATA_BUTTON_TEST_ID}
          />
          <Button
            ref={confirmButtonRef}
            text="Clear Data"
            className={styles.confirmButton}
            onClick={onConfirm}
            type="button"
            skipBaseStyles
            data-testid={CONFIRM_DELETE_DATA_BUTTON_TEST_ID}
          />
        </div>
      </div>
    </div>
  );
}
