import type { NextConfig } from 'next';

/**
 * Next.js configuration.
 * Optimized for server-side rendering and performance.
 */
const nextConfig: NextConfig = {
  // Enable React Compiler for automatic optimizations
  reactCompiler: true,

  // Ensure pages are server-rendered by default
  // In App Router, components are server components by default unless marked with 'use client'
  // This configuration ensures optimal SSR performance
};

export default nextConfig;
