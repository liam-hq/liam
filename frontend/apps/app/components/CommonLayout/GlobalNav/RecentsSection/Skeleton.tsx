import type { FC } from 'react'
import styles from './Skeleton.module.css'

type Props = {
  width?: string
  height?: string
}

export const Skeleton: FC<Props> = ({ width, height }) => {
  return (
    <div
      className={styles.skeleton}
      style={{
        width,
        height,
      }}
    />
  )
}
