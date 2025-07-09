import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createAccessibleHeightTransition,
  createAccessibleOpacityTransition,
  createAccessibleTransition,
} from './accessibleTransitions'

// Mock window.matchMedia
const mockMatchMedia = (matches: boolean) => {
  // @ts-expect-error - Mocking window for tests
  global.window = {
    matchMedia: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  }
}

// Clean up after each test
beforeEach(() => {
  vi.clearAllMocks()
})

describe('accessibleTransitions', () => {
  describe('createAccessibleTransition', () => {
    it('should return normal transition when motion is not reduced', () => {
      mockMatchMedia(false)
      const result = createAccessibleTransition('opacity', 200)
      expect(result).toEqual({
        transition: 'opacity 200ms ease-out',
      })
    })

    it('should return instant transition when motion is reduced', () => {
      mockMatchMedia(true)
      const result = createAccessibleTransition('opacity', 200)
      expect(result).toEqual({
        transition: 'opacity 0.01ms linear',
      })
    })

    it('should accept custom easing function', () => {
      mockMatchMedia(false)
      const result = createAccessibleTransition('transform', 300, 'ease-in-out')
      expect(result).toEqual({
        transition: 'transform 300ms ease-in-out',
      })
    })
  })

  describe('createAccessibleOpacityTransition', () => {
    it('should return visible state with transition', () => {
      mockMatchMedia(false)
      const result = createAccessibleOpacityTransition(true)
      expect(result).toEqual({
        opacity: 1,
        transition: 'opacity 150ms ease-out',
      })
    })

    it('should return hidden state with transition', () => {
      mockMatchMedia(false)
      const result = createAccessibleOpacityTransition(false)
      expect(result).toEqual({
        opacity: 0,
        transition: 'opacity 150ms ease-out',
      })
    })

    it('should use custom duration', () => {
      mockMatchMedia(false)
      const result = createAccessibleOpacityTransition(true, 300)
      expect(result).toEqual({
        opacity: 1,
        transition: 'opacity 300ms ease-out',
      })
    })

    it('should return instant transition when motion is reduced', () => {
      mockMatchMedia(true)
      const result = createAccessibleOpacityTransition(true)
      expect(result).toEqual({
        opacity: 1,
        transition: 'opacity 0.01ms linear',
      })
    })
  })

  describe('createAccessibleHeightTransition', () => {
    it('should return height transition when motion is not reduced', () => {
      mockMatchMedia(false)
      const result = createAccessibleHeightTransition()
      expect(result).toEqual({
        transition: 'height 300ms ease-out',
      })
    })

    it('should return instant transition when motion is reduced', () => {
      mockMatchMedia(true)
      const result = createAccessibleHeightTransition()
      expect(result).toEqual({
        transition: 'height 0.01ms linear',
      })
    })

    it('should accept custom duration', () => {
      mockMatchMedia(false)
      const result = createAccessibleHeightTransition(500)
      expect(result).toEqual({
        transition: 'height 500ms ease-out',
      })
    })
  })
})
