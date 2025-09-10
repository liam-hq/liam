import type { ComponentProps } from 'react'

export type ImageProps = {
  /**
   * The URL of the image to display
   */
  src: string
  /**
   * Alternative text for the image
   */
  alt: string
} & ComponentProps<'img'>

/**
 * Optimized Image component that provides basic performance optimizations
 * while remaining framework-agnostic for use in a UI library.
 */
export const Image = ({ loading = 'lazy', ...props }: ImageProps) => {
  // biome-ignore lint/performance/noImgElement: This is the base Image component that wraps img element with optimizations
  // biome-ignore lint/a11y/useAltText: Alt text is provided through props
  return <img loading={loading} {...props} />
}
