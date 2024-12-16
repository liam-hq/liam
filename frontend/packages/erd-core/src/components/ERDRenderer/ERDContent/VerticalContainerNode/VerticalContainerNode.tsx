import type { Node } from '@xyflow/react'
import type { FC } from 'react'
import styles from './VerticalContainerNode.module.css'

export type VerticalContainerNodeType = Node<
  Record<string, unknown>,
  'container'
>

export const VerticalContainerNode: FC = () => {
  return <div className={styles.wrapper} />
}
