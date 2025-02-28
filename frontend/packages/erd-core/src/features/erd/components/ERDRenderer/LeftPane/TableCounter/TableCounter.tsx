import { Table2 } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './TableCounter.module.css'

type Props = {
  allCount: number
  visibleCount: number
}

export const TableCounter: FC<Props> = ({ allCount, visibleCount }) => {
  return (
    <div className={styles.wrapper}>
      <Table2 width="12px" />
      <span className={styles.text}>
        {visibleCount} / {allCount}
      </span>
    </div>
  )
}
