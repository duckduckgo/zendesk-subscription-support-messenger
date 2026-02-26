import {
  DOM_READY_DELAY_MS,
  DEFAULT_MAX_RETRIES,
} from '@/constants/zendesk-timing';
import type { RefObject } from 'react';

/**
 * Retry operation types that can be coordinated
 */
export type RetryOperationType =
  | 'iframe-access'
  | 'style-injection'
  | 'link-swapping'
  | 'observer-setup';

/**
 * Options for retry operations
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Delay between retries in milliseconds */
  delay?: number;
  /** Operation type for coordination */
  operationType: RetryOperationType;
  /** Callback to execute on retry */
  retryCallback: () => void | boolean;
  /** Optional callback to check if operation should continue */
  shouldRetry?: () => boolean;
}

/**
 * Active retry operation tracking
 */
interface ActiveRetry {
  timeoutId: ReturnType<typeof setTimeout>;
  operationType: RetryOperationType;
  retriesRemaining: number;
  delay: number;
  callback: () => void | boolean;
  shouldRetry?: () => boolean;
}

/**
 * Shared retry manager to coordinate retry operations across hooks.
 *
 * Prevents race conditions by:
 * - Debouncing retries for the same operation type
 * - Tracking active retries to prevent conflicts
 * - Coordinating retries across different hooks
 *
 * @example
 * ```ts
 * const retryManager = createRetryManager();
 *
 * retryManager.scheduleRetry({
 *   operationType: 'iframe-access',
 *   retryCallback: () => {
 *     const iframe = getMessagingIframe(null);
 *     return !!iframe; // Return true if successful
 *   },
 * });
 * ```
 */
class RetryManager {
  private activeRetries = new Map<RetryOperationType, ActiveRetry>();
  private isMounted = true;

  /**
   * Marks the manager as unmounted to prevent new retries
   */
  setUnmounted(): void {
    this.isMounted = false;
    this.cancelAllRetries();
  }

  /**
   * Marks the manager as mounted to allow retries
   */
  setMounted(): void {
    this.isMounted = true;
  }

  /**
   * Schedules a retry operation with coordination to prevent race conditions.
   *
   * If a retry for the same operation type is already active, it will be
   * cancelled and replaced with the new retry.
   *
   * @param options - Retry configuration options
   * @returns Cleanup function to cancel the retry, or null if not scheduled
   */
  scheduleRetry(options: RetryOptions): (() => void) | null {
    if (!this.isMounted) {
      return null;
    }

    const {
      operationType,
      retryCallback,
      shouldRetry,
      maxRetries = DEFAULT_MAX_RETRIES,
      delay = DOM_READY_DELAY_MS,
    } = options;

    // Cancel existing retry for this operation type to prevent conflicts
    this.cancelRetry(operationType);

    // Check if we should retry (e.g., component still mounted, conditions met)
    if (shouldRetry && !shouldRetry()) {
      return null;
    }

    // If no retries remaining, don't schedule
    if (maxRetries <= 0) {
      return null;
    }

    // Schedule retry - callback will be executed on retry, not immediately
    const timeoutId = setTimeout(() => {
      // Remove from active retries
      this.activeRetries.delete(operationType);

      // Check if still mounted before proceeding
      if (!this.isMounted) {
        return;
      }

      // Check if we should still retry
      if (shouldRetry && !shouldRetry()) {
        return;
      }

      // Execute callback to attempt the operation.
      retryCallback();
    }, delay);

    // Track active retry
    this.activeRetries.set(operationType, {
      timeoutId,
      operationType,
      retriesRemaining: maxRetries - 1,
      delay,
      callback: retryCallback,
      shouldRetry,
    });

    // Return cleanup function
    return () => {
      this.cancelRetry(operationType);
    };
  }

  /**
   * Cancels a specific retry operation
   *
   * @param operationType - Type of operation to cancel
   */
  cancelRetry(operationType: RetryOperationType): void {
    const activeRetry = this.activeRetries.get(operationType);

    if (activeRetry) {
      clearTimeout(activeRetry.timeoutId);
      this.activeRetries.delete(operationType);
    }
  }

  /**
   * Cancels all active retries
   */
  cancelAllRetries(): void {
    this.activeRetries.forEach((retry) => {
      clearTimeout(retry.timeoutId);
    });
    this.activeRetries.clear();
  }

  /**
   * Checks if a retry is currently active for the given operation type
   *
   * @param operationType - Type of operation to check
   * @returns True if a retry is active
   */
  isRetryActive(operationType: RetryOperationType): boolean {
    return this.activeRetries.has(operationType);
  }
}

/**
 * Creates a new retry manager instance.
 * Each component/hook should create its own instance to track its retries.
 *
 * @returns New RetryManager instance
 */
export function createRetryManager(): RetryManager {
  return new RetryManager();
}

/**
 * Creates a standard shouldRetry callback that checks if component is mounted
 * and retries are remaining.
 *
 * @param isMountedRef - Ref to track if component is mounted
 * @param retries - Number of retries remaining
 * @returns shouldRetry callback function
 */
export function createShouldRetryCallback(
  isMountedRef: RefObject<boolean>,
  retries: number,
): () => boolean {
  return () => isMountedRef.current && retries > 0;
}

/**
 * Helper function to schedule a coordinated retry with common patterns.
 * Consolidates the repeated pattern of checking retries and scheduling.
 *
 * @param retryManager - Retry manager instance
 * @param operationType - Type of operation for coordination
 * @param retryCallback - Callback to execute on retry
 * @param isMountedRef - Ref to track if component is mounted
 * @param retries - Number of retries remaining
 * @param delay - Delay between retries (defaults to DOM_READY_DELAY_MS)
 * @returns Cleanup function to cancel the retry, or null if not scheduled
 */
export function scheduleCoordinatedRetry(
  retryManager: RetryManager,
  operationType: RetryOperationType,
  retryCallback: () => void | boolean,
  isMountedRef: RefObject<boolean>,
  retries: number,
  delay: number = DOM_READY_DELAY_MS,
): (() => void) | null {
  if (retries <= 0) {
    return null;
  }

  return retryManager.scheduleRetry({
    operationType,
    maxRetries: retries,
    delay,
    retryCallback,
    shouldRetry: createShouldRetryCallback(isMountedRef, retries),
  });
}

/**
 * Helper function to mark component as mounted and notify retry manager.
 * Consolidates the common pattern of setting mount state.
 *
 * @param isMountedRef - Ref to track if component is mounted
 * @param retryManager - Retry manager instance
 */
export function markComponentMounted(
  isMountedRef: RefObject<boolean>,
  retryManager: RetryManager,
): void {
  isMountedRef.current = true;
  retryManager.setMounted();
}

/**
 * Helper function to mark component as unmounted and notify retry manager.
 * Consolidates the common pattern of setting unmount state.
 *
 * @param isMountedRef - Ref to track if component is mounted
 * @param retryManager - Retry manager instance
 */
export function markComponentUnmounted(
  isMountedRef: RefObject<boolean>,
  retryManager: RetryManager,
): void {
  isMountedRef.current = false;
  retryManager.setUnmounted();
}
