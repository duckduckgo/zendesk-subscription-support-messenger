import type { RefObject } from 'react';
import {
  getMessagingIframe,
  getMessagingIframeDocument,
} from './zendesk-iframe';
import { DOM_READY_DELAY_MS } from '@/constants/zendesk-timing';

export interface SetupZendeskObserverOptions {
  /** Callback to execute when DOM mutations occur */
  onMutation: (iframeDoc: Document) => void;
  /** Optional callback to execute immediately when observer is set up */
  onSetup?: (iframeDoc: Document) => void;
  /** Target element to observe (defaults to 'body') */
  target?: 'body' | 'head';
  /** Whether to retry if iframe is not ready (defaults to false) */
  retryOnNotReady?: boolean;
  /** Ref to track if component is mounted */
  isMountedRef: RefObject<boolean>;
  /** Ref to store the observer instance */
  observerRef: RefObject<MutationObserver | null>;
}

// Track active retry timeouts per observer ref to prevent stacking
const activeRetryTimeouts = new WeakMap<
  RefObject<MutationObserver | null>,
  ReturnType<typeof setTimeout>
>();

/**
 * Sets up a MutationObserver on the Zendesk iframe.
 *
 * @function setupZendeskObserver
 * @param {SetupZendeskObserverOptions} options - Configuration options
 *
 * @returns {(function(): void) | null} Cleanup function to disconnect observer
 * and clear timeouts, or null if setup failed. The cleanup function should be
 * called in the useEffect cleanup to prevent memory leaks.
 *
 * @example
 * ```ts
 * const observerCleanup = setupZendeskObserver({
 *   onMutation: (iframeDoc) => {
 *     // Handle DOM mutations
 *   },
 *   target: 'body',
 *   retryOnNotReady: true,
 *   isMountedRef,
 *   observerRef,
 * });
 *
 * return () => {
 *   if (observerCleanup) {
 *     observerCleanup();
 *   }
 * };
 * ```
 */
export function setupZendeskObserver(
  options: SetupZendeskObserverOptions,
): (() => void) | null {
  const {
    onMutation,
    onSetup,
    target = 'body',
    retryOnNotReady = false,
    isMountedRef,
    observerRef,
  } = options;

  const handleRetry = (): (() => void) | null => {
    if (retryOnNotReady && isMountedRef.current) {
      // Clear any existing retry timeout to prevent stacking
      const existingTimeout = activeRetryTimeouts.get(observerRef);

      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const retryTimeout = setTimeout(() => {
        // Clear the tracked timeout before attempting retry
        activeRetryTimeouts.delete(observerRef);

        // Double-check mounted state before recursive call
        if (isMountedRef.current) {
          setupZendeskObserver(options);
        }
      }, DOM_READY_DELAY_MS);

      // Track this retry timeout
      activeRetryTimeouts.set(observerRef, retryTimeout);

      // Return cleanup function to clear retry timeout if component unmounts
      return () => {
        const timeout = activeRetryTimeouts.get(observerRef);

        if (timeout) {
          clearTimeout(timeout);
          activeRetryTimeouts.delete(observerRef);
        }
      };
    }

    return null;
  };

  // Get iframe reference - may be null if widget hasn't loaded yet
  const iframe = getMessagingIframe(null);

  if (!iframe) {
    return handleRetry();
  }

  // Get iframe document
  const iframeDoc = getMessagingIframeDocument(iframe);

  if (!iframeDoc) {
    return handleRetry();
  }

  // Check mounted status before proceeding
  if (!isMountedRef.current) {
    return null;
  }

  // Clean up existing observer if present
  if (observerRef.current) {
    observerRef.current.disconnect();

    observerRef.current = null;
  }

  // Double-check mounted status before creating observer
  if (!isMountedRef.current) {
    return null;
  }

  try {
    // Execute onSetup callback if provided (e.g., to process existing elements)
    if (onSetup && isMountedRef.current) {
      onSetup(iframeDoc);
    }

    const observer = new MutationObserver(() => {
      // Guard: Check if component is still mounted before executing callback
      // This prevents memory leaks and errors from stale closures
      if (!isMountedRef.current) {
        return;
      }

      onMutation(iframeDoc);
    });

    // Determine target element based on configuration 'head' is used for style
    // injection, 'body' for content mutations
    const targetElement = target === 'head' ? iframeDoc.head : iframeDoc.body;

    observer.observe(targetElement, {
      // watch for added/removed child nodes
      childList: true,
      // watch all descendants, not just direct children
      subtree: true,
    });

    // Store observer reference for cleanup
    observerRef.current = observer;

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();

        observerRef.current = null;
      }
    };
  } catch (error) {
    window.fireJse?.(error);

    return null;
  }
}
