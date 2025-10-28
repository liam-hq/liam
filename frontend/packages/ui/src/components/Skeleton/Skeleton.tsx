import clsx from 'clsx'
import type { ComponentProps, ReactNode } from 'react'
import styles from './Skeleton.module.css'

type Props = ComponentProps<'span'> & {
  loading?: boolean
  width?: string
  height?: string
  minWidth?: string
  maxWidth?: string
  minHeight?: string
  maxHeight?: string
  children?: ReactNode
}

export const Skeleton = ({
  loading = true,
  width,
  height,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
  className,
  children,
  style,
  ...props
}: Props) => {
  const skeletonStyle = {
    ...style,
    ...(width && { width }),
    ...(height && { height }),
    ...(minWidth && { minWidth }),
    ...(maxWidth && { maxWidth }),
    ...(minHeight && { minHeight }),
    ...(maxHeight && { maxHeight }),
  }

  if (!loading && children) {
    return <>{children}</>
  }

  return (
    <span
      className={clsx(styles.skeleton, className)}
      style={skeletonStyle}
      aria-hidden={loading}
      {...props}
    >
      {loading ? children : null}
    </span>
  )
}

Skeleton.displayName = 'Skeleton'
