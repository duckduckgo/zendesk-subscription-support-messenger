// Lifted from static-pages

export const BREAKPOINTS = {
  device2xs: 375,
  deviceXs: 425,
  deviceSm: 640,
  deviceMd: 800,
  deviceLg: 1024,
  deviceXl: 1200,
  device2xl: 1500,
} as const;

// Helper functions for creating media queries
export const createMaxWidthQuery = (breakpoint: number) =>
  `screen and (max-width: ${breakpoint}px)`;

export const createMinWidthQuery = (breakpoint: number) =>
  `screen and (min-width: ${breakpoint}px)`;

// Semantic media query constants - no magic numbers!
export const MEDIA_QUERIES = {
  // Mobile-first queries (max-width)
  mobile: createMaxWidthQuery(BREAKPOINTS.deviceXs), // <= 425px
  tablet: createMaxWidthQuery(BREAKPOINTS.deviceMd), // <= 800px

  // Desktop-first queries (min-width)
  desktop: createMinWidthQuery(BREAKPOINTS.deviceMd + 1), // >= 801px
} as const;
