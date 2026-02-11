/**
 * Lottie animation data structure.
 *
 * Represents the JSON format used by Lottie animations.
 * This is a subset of the full Lottie specification, including
 * only the most commonly used properties.
 */
export interface LottieAnimationData {
  /** Lottie version */
  v?: string;
  /** Frame rate (frames per second) */
  fr?: number;
  /** In point - animation start frame */
  ip?: number;
  /** Out point - animation end frame */
  op?: number;
  /** Animation width in pixels */
  w?: number;
  /** Animation height in pixels */
  h?: number;
  /** Animation name */
  nm?: string;
  /** 3D layers flag (0 = 2D, 1 = 3D) */
  ddd?: number;
  /** Animation assets (images, precomps, etc.) */
  assets?: unknown[];
  /** Animation layers */
  layers?: unknown[];
  /** Additional Lottie properties */
  [key: string]: unknown;
}
