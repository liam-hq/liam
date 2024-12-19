import type { Node } from '@xyflow/react'
import type { FC } from 'react'
import styles from './NonRelatedTableGroupNode.module.css'

export type NonRelatedTableGroupNodeType = Node<
  Record<string, unknown>,
  'nonRelatedTableGroup'
>

export const NonRelatedTableGroupNode: FC = () => {
  return <div className={styles.wrapper} />
}
