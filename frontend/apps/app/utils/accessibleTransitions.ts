import type { CSSProperties } from 'react'

/**
 * Creates accessible transition styles that respect user's motion preferences
 * @param property - The CSS property to transition (e.g., 'opacity', 'transform')
 * @param duration - The transition duration in milliseconds
 * @param easing - The CSS easing function (default: 'ease-out')
 * @returns CSS properties object with the appropriate transition
 */
const checkReducedMotion = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export const createAccessibleTransition = (
  property: string,
  duration: number,
  easing = 'ease-out',
): CSSProperties => {
  const prefersReducedMotion = checkReducedMotion()

  if (prefersReducedMotion) {
    // For reduced motion, we still want state changes to be visible
    // but without the animation effect
    return {
      transition: `${property} 0.01ms linear`,
    }
  }

  return {
    transition: `${property} ${duration}ms ${easing}`,
  }
}

/**
 * Creates accessible opacity transition styles
 * @param isVisible - Whether the element should be visible
 * @param duration - The transition duration in milliseconds (default: 150)
 * @returns CSS properties object with opacity and transition
 */
export const createAccessibleOpacityTransition = (
  isVisible: boolean,
  duration = 150,
): CSSProperties => {
  return {
    opacity: isVisible ? 1 : 0,
    ...createAccessibleTransition('opacity', duration),
  }
}

/**
 * Creates accessible height transition styles for dynamic content
 * @param duration - The transition duration in milliseconds (default: 300)
 * @returns CSS properties object with the appropriate transition
 */
export const createAccessibleHeightTransition = (
  duration = 300,
): CSSProperties => {
  return createAccessibleTransition('height', duration, 'ease-out')
}
