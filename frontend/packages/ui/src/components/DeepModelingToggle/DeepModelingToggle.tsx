'use client'

import clsx from 'clsx'
import {
  type ComponentProps,
  type MouseEvent,
  forwardRef,
  useState,
} from 'react'
import { Minus, Sparkle } from '../../icons'
import styles from './DeepModelingToggle.module.css'

type Props = Omit<ComponentProps<'button'>, 'children'> & {
  isActive?: boolean
  children: string
}

export const DeepModelingToggle = forwardRef<HTMLButtonElement, Props>(
  ({ className, isActive = false, children, onClick, ...props }, ref) => {
    const [isTransitioning, setIsTransitioning] = useState(false)

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      setIsTransitioning(true)
      setTimeout(() => setIsTransitioning(false), 300)
      onClick?.(e)
    }

    return (
      <button
        ref={ref}
        type="button"
        className={clsx(
          styles.wrapper,
          isActive ? styles.active : styles.inactive,
          isTransitioning && styles.transitioning,
          className,
        )}
        onClick={handleClick}
        {...props}
      >
        <span
          className={clsx(
            styles.thumb,
            isActive ? styles.thumbActive : styles.thumbInactive,
          )}
        >
          {isActive ? (
            <Sparkle className={styles.icon} />
          ) : (
            <Minus className={styles.icon} />
          )}
        </span>
        <span className={styles.label}>{children}</span>
      </button>
    )
  },
)

DeepModelingToggle.displayName = 'DeepModelingToggle'
