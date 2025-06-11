import type { FC } from 'react'
import { BRDItem } from './BRDItem'
import styles from './BRDList.module.css'
import type { BusinessRequirement } from './types'

type Props = {
  items: BusinessRequirement[]
}

export const BRDList: FC<Props> = ({ items }) => {
  return (
    <div className={styles.wrapper}>
      {items.map((item) => (
        <BRDItem key={item.id} item={item} />
      ))}
    </div>
  )
}
