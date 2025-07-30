'use client'

import { Minus, Sparkle } from '@liam-hq/ui'
import clsx from 'clsx'
import {
  type ComponentProps,
  type FC,
  type MouseEvent,
  type Ref,
  useState,
} from 'react'
import styles from './DeepModelingToggle.module.css'

type Props = Omit<ComponentProps<'button'>, 'children'> & {
  name: string
  children: string
  defaultChecked?: boolean
  ref?: Ref<HTMLButtonElement>
}

export const DeepModelingToggle: FC<Props> = ({
  className,
  children,
  name,
  defaultChecked = false,
  onClick,
  ref,
  ...props
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isActive, setIsActive] = useState(defaultChecked)

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (props.disabled) return
    setIsTransitioning(true)
    setTimeout(() => setIsTransitioning(false), 300)
    setIsActive(!isActive)
    onClick?.(e)
  }

  return (
    <>
      <input
        type="checkbox"
        name={name}
        checked={isActive}
        // Empty onChange handler required to suppress React warning about controlled component
        // The actual state change is handled by the button's onClick handler
        onChange={() => {}}
        className={styles.hiddenInput}
      />
      <button
        ref={ref}
        type="button"
        className={clsx(
          styles.wrapper,
          isActive ? styles.active : styles.inactive,
          isTransitioning && styles.transitioning,
          props.disabled && styles.disabled,
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
    </>
  )
}
