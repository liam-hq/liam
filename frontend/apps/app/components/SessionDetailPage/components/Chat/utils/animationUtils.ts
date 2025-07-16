import {
  ANIMATION_DELAYS,
  REDUCED_MOTION_DELAYS,
} from '../constants/animationConstants'

export const getAnimationDelays = () => {
  if (typeof window === 'undefined') {
    return ANIMATION_DELAYS
  }

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
  return prefersReducedMotion ? REDUCED_MOTION_DELAYS : ANIMATION_DELAYS
}
