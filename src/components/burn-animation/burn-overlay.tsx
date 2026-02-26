'use client';

import { useEffect, useState } from 'react';
import BurnAnimation from './burn-animation';
import styles from './burn-overlay.module.css';
import { LottieAnimationData } from '@/types/lottie';
import { BURN_ANIMATION_FALLBACK_DELAY_MS } from '@/constants/zendesk-timing';

interface BurnOverlayProps {
  /** Callback invoked when animation completes or fails to load */
  onComplete?: () => void;
}

/**
 * BurnOverlay component displays a fullscreen overlay with a burn animation.
 *
 * Lifecycle:
 * 1. Fetches the Lottie animation data from /burn.json
 * 2. Renders the animation fullscreen with transparent background
 * 3. Calls onComplete when animation finishes (or after
 * BURN_ANIMATION_FALLBACK_DELAY_MS if fetch fails)
 *
 * The overlay covers the entire viewport and prevents user interaction
 * while the animation plays. Typically used before page reload to create
 * a visual transition effect.
 *
 * @param props - Component props
 *
 * @returns Fullscreen overlay with burn animation
 */
export default function BurnOverlay({ onComplete }: BurnOverlayProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [animationData, setAnimationData] =
    useState<LottieAnimationData | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Fetches the Lottie animation data from the public directory. Falls back
    // to completing after BURN_ANIMATION_FALLBACK_DELAY_MS if the fetch fails.
    async function loadAnimation() {
      try {
        const resp = await fetch('/burn.json');

        if (!resp.ok) {
          setIsLoading(false);
          // Fallback: complete after delay if animation fails to load
          setTimeout(() => onComplete?.(), BURN_ANIMATION_FALLBACK_DELAY_MS);

          return;
        }

        const json = (await resp.json()) as LottieAnimationData;

        if (!cancelled) {
          setAnimationData(json);
          setIsLoading(false);
        }
      } catch (error) {
        setIsLoading(false);
        // Fallback: complete after delay if fetch throws
        setTimeout(() => onComplete?.(), BURN_ANIMATION_FALLBACK_DELAY_MS);

        window.fireJse?.(error);
      }
    }

    loadAnimation();

    return () => {
      cancelled = true;
    };
  }, [onComplete]);

  return (
    <div className={styles.overlay} role="presentation" aria-hidden="true">
      {!isLoading && animationData && (
        <BurnAnimation onComplete={onComplete} animationData={animationData} />
      )}
    </div>
  );
}
