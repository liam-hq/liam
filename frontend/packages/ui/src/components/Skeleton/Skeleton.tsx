import clsx from 'clsx'
import { type FC, useId, useMemo } from 'react'
import { match } from 'ts-pattern'
import styles from './Skeleton.module.css'

type Variant = 'box' | 'circle' | 'text'

type CommonProps = {
  variant: Variant
  startColor?: string
  endColor?: string
}

type BoxProps = CommonProps & {
  variant: 'box'
  width: string
  height: string
}

type CircleProps = CommonProps & {
  variant: 'circle'
  size: string
}

type TextProps = CommonProps & {
  variant: 'text'
  noOfLines: number
  gap?: number
}

const Text: FC<TextProps> = ({ noOfLines, gap, startColor, endColor }) => {
  const id = useId()
  const keys = useMemo(
    () => Array.from({ length: noOfLines }, (_, idx) => `${id}-${idx}`),
    [id, noOfLines],
  )

  const vars: Record<string, string> = {
    ...(startColor ? { ['--skeleton-start']: startColor } : {}),
    ...(endColor ? { ['--skeleton-end']: endColor } : {}),
  }

  return (
    <div
      aria-hidden
      className={styles.text}
      style={{ display: 'grid', gap: `${typeof gap === 'number' ? gap : 8}px` }}
    >
      {keys.map((key) => (
        <div
          key={key}
          className={clsx(styles.wrapper, styles.box)}
          style={vars}
        >
          <div className={styles.overlay} />
        </div>
      ))}
    </div>
  )
}

type Props = BoxProps | CircleProps | TextProps

export const Skeleton: FC<Props> = (props) => {
  return match(props)
    .with({ variant: 'box' }, ({ width, height, startColor, endColor }) => {
      const vars: Record<string, string> = {
        ...(startColor ? { ['--skeleton-start']: startColor } : {}),
        ...(endColor ? { ['--skeleton-end']: endColor } : {}),
      }
      return (
        <div
          aria-hidden
          className={clsx(styles.wrapper, styles.box)}
          style={{ width, height, ...vars }}
        >
          <div className={styles.overlay} />
        </div>
      )
    })
    .with({ variant: 'circle' }, ({ size, startColor, endColor }) => {
      const vars: Record<string, string> = {
        ...(startColor ? { ['--skeleton-start']: startColor } : {}),
        ...(endColor ? { ['--skeleton-end']: endColor } : {}),
      }
      return (
        <div
          aria-hidden
          className={clsx(styles.wrapper, styles.circle)}
          style={{ width: size, height: size, ...vars }}
        >
          <div className={styles.overlay} />
        </div>
      )
    })
    .with({ variant: 'text' }, (props) => {
      return <Text {...props} />
    })
    .exhaustive()
}
