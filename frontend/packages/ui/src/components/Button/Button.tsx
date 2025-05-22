import clsx from 'clsx'
import { type ComponentProps, type ReactNode, forwardRef } from 'react'
import { match } from 'ts-pattern'
import { Spinner } from '../Spinner'
import styles from './Button.module.css'

type Props = ComponentProps<'button'> & {
  variant?:
    | 'solid-primary'
    | 'solid-danger'
    | 'outline-secondary'
    | 'ghost-secondary'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  isLoading?: boolean | undefined
  loadingIndicatorType?: 'leftIcon' | 'content'
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  (
    {
      className,
      variant = 'solid-primary',
      size = 'sm',
      isLoading = false,
      loadingIndicatorType = 'leftIcon',
      leftIcon: propsLeftIcon,
      rightIcon,
      disabled: propsDisabled,
      children,
      ...props
    },
    ref,
  ) => {
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
      .with('outline-secondary', () => styles.outlineSecondary)
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
        )}
        disabled={disabled}
        {...props}
      >
        {leftIcon && <div className={styles.icon}>{leftIcon}</div>}
        {displayedChildren}
        {rightIcon && <div className={styles.icon}>{rightIcon}</div>}
      </button>
    )
  },
)

Button.displayName = 'Button'
