import clsx from 'clsx'
import type { ComponentProps, ReactNode, Ref } from 'react'
import { match } from 'ts-pattern'
import { Spinner } from '../Spinner'
import styles from './Button.module.css'

type Props = ComponentProps<'button'> & {
  variant?:
    | 'solid-primary'
    | 'solid-danger'
    | 'solid-inverse'
    | 'outline-secondary'
    | 'outline-overlay'
    | 'ghost-secondary'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  isLoading?: boolean | undefined
  loadingIndicatorType?: 'leftIcon' | 'content'
  ref?: Ref<HTMLButtonElement>
}

export const Button = ({
  className,
  variant = 'solid-primary',
  size = 'sm',
  isLoading = false,
  loadingIndicatorType = 'leftIcon',
  leftIcon: propsLeftIcon,
  rightIcon,
  disabled: propsDisabled,
  children,
  ref,
  ...props
}: Props) => {
  const disabled = propsDisabled || isLoading
  const leftIcon =
    isLoading && loadingIndicatorType === 'leftIcon' ? (
      <Spinner />
    ) : (
      propsLeftIcon
    )
  const displayedChildren =
    isLoading && loadingIndicatorType === 'content' ? <Spinner /> : children

  const variantClassName = match(variant)
    .with('solid-primary', () => styles.solidPrimary)
    .with('solid-danger', () => styles.solidDanger)
    .with('solid-inverse', () => styles.solidInverse)
    .with('outline-secondary', () => styles.outlineSecondary)
    .with('outline-overlay', () => styles.outlineOverlay)
    .with('ghost-secondary', () => styles.ghostSecondary)
    .exhaustive()

  const sizeClassName = match(size)
    .with('xs', () => styles.xs)
    .with('sm', () => styles.sm)
    .with('md', () => styles.md)
    .with('lg', () => styles.lg)
    .exhaustive()

  return (
    <button
      ref={ref}
      type="button"
      className={clsx(
        styles.wrapper,
        sizeClassName,
        className,
        !disabled && variantClassName,
        disabled && styles.disabled,
        disabled && variant === 'outline-overlay' && styles.outlineOverlay,
      )}
      disabled={disabled}
      {...props}
    >
      {leftIcon && <div className={styles.icon}>{leftIcon}</div>}
      {displayedChildren}
      {rightIcon && <div className={styles.icon}>{rightIcon}</div>}
    </button>
  )
}

Button.displayName = 'Button'
