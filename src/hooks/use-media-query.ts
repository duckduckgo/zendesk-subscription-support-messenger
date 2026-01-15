import { useEffect, useState } from 'react';
import { MEDIA_QUERIES } from '@/constants/breakpoints';

export default function useMediaQuery(query: string): boolean {
  // Initialize state with actual media query value
  // This avoids needing to set it synchronously in the effect
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;

    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(query);

    const listener = () => {
      setMatches(media.matches);
    };

    if (media.addListener) {
      media.addListener(listener);
    } else {
      media.addEventListener('change', listener);
    }

    return () => {
      if (media.removeListener) {
        media.removeListener(listener);
      } else {
        media.removeEventListener('change', listener);
      }
    };
  }, [query]);

  return matches;
}

// Semantic breakpoint hooks - no magic numbers!
export const useIsMobile = () => {
  return useMediaQuery(MEDIA_QUERIES.mobile);
};

export const useIsTablet = () => {
  return useMediaQuery(MEDIA_QUERIES.tablet);
};

export const useIsDesktop = () => {
  return useMediaQuery(MEDIA_QUERIES.desktop);
};

// Object hook for multiple breakpoints at once
export const useBreakpoints = () => {
  return {
    isMobile: useIsMobile(),
    isTablet: useIsTablet(),
    isDesktop: useIsDesktop(),
  };
};
