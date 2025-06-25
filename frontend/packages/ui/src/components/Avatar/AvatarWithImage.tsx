'use client'

import type { ComponentProps } from 'react'
import { match } from 'ts-pattern'
import styles from './Avatar.module.css'

type AvatarSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

type AvatarWithImageProps = {
  /**
   * The URL of the image to display
   */
  src: string
  /**
   * Alternative text for the image
   */
  alt: string
  /**
   * Size of the avatar
   */
  size?: AvatarSize
  /**
   * Optional click handler
   */
  onClick?: (() => void) | undefined
} & Omit<ComponentProps<'button'>, 'color'>

/**
 * AvatarWithImage component displays a circular avatar with an image
 */
export const AvatarWithImage = ({
  src,
  alt,
  size = 'md',
  onClick,
  className,
  ...props
}: AvatarWithImageProps) => {
  // Map size to CSS class
  const sizeClass = match(size)
    .with('xxs', () => styles.sizeXxs)
    .with('xs', () => styles.sizeXs)
    .with('sm', () => styles.sizeSm)
    .with('md', () => styles.sizeMd)
    .with('lg', () => styles.sizeLg)
    .with('xl', () => styles.sizeXl)
    .with('2xl', () => styles.size2xl)
    .otherwise(() => styles.sizeMd)

  return (
    <button
      className={`${styles.avatar} ${sizeClass} ${className || ''}`}
      onClick={onClick}
      aria-label={alt}
      type="button"
      {...props}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </button>
  )
}
