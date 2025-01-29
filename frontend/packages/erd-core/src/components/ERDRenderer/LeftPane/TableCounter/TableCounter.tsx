import { Table2 } from '@liam-hq/ui'
import { useNodes } from '@xyflow/react'
import type { FC } from 'react'
import styles from './TableCounter.module.css'

export const TableCounter: FC = () => {
  const nodes = useNodes()
  const allCount = nodes.length
  const visibleCount = nodes.filter((node) => !node.hidden).length

  return (
    <div className={styles.wrapper}>
      <Table2 width="12px" />
      <span className={styles.text}>
        {visibleCount} / {allCount}
      </span>
    </div>
  )
}
