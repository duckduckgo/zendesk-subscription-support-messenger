'use client';

import { useEffect, useRef } from 'react';
import lottie, { AnimationItem } from 'lottie-web';
import { LottieAnimationData } from '@/types/lottie';

interface BurnAnimationProps {
  /** Callback invoked when animation completes */
  onComplete?: () => void;
  /** Lottie animation data object */
  animationData?: LottieAnimationData;
}

/**
 * BurnAnimation component renders a Lottie animation using lottie-web.
 *
 * The animation is configured to:
 * - Play once (no loop)
 * - Autoplay on mount
 * - Fill the container using 'xMidYMid slice' (similar to object-fit: cover)
 * - Complete after animation finishes or 2500ms timeout
 *
 * Handles React Strict Mode by preventing premature completion during
 * the initial mount/unmount cycle. Only triggers completion after the
 * animation has actually started (DOMLoaded event).
 *
 * @param props - Component props
 *
 * @returns Lottie animation container element
 */
export default function BurnAnimation({
  onComplete,
  animationData,
}: BurnAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let finished = false;
    let started = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    // Handles animation completion. Only triggers if the animation has actually
    // started playing (to avoid React Strict Mode double-mount issues).
    const handleComplete = () => {
      if (finished) return;
      if (!started) return;

      finished = true;

      if (timer) clearTimeout(timer);

      onComplete?.();
    };

    // Timeout fallback (2500ms - animation is 24 frames at 12fps = ~2 seconds)
    // Ensures completion even if animation events don't fire
    timer = setTimeout(() => {
      handleComplete();
    }, 2500);

    try {
      // Load the Lottie animation
      animationRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: false,
        autoplay: true,
        animationData,
        path: !animationData ? '/burn.json' : undefined,
        rendererSettings: {
          // Scale to fill viewport while maintaining aspect ratio (like
          // object-fit: cover)
          preserveAspectRatio: 'xMidYMid slice',
        },
      });

      // Mark as started once animation DOM is loaded and ready to play
      // This prevents premature completion during React Strict Mode remounting
      animationRef.current.addEventListener('DOMLoaded', () => {
        started = true;
      });

      animationRef.current.addEventListener('complete', handleComplete);
    } catch (error) {
      handleComplete();

      window.fireJse?.(error);
    }

    return () => {
      if (timer) clearTimeout(timer);

      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }

      // Only trigger completion on unmount if animation had actually started.
      // This prevents React Strict Mode's initial unmount from triggering
      // completion
      if (!finished && started) {
        handleComplete();
      }
    };
  }, [onComplete, animationData]);

  return (
    <div
      ref={containerRef}
      data-lottie-player
      style={{ width: '100%', height: '100%' }}
    />
  );
}
