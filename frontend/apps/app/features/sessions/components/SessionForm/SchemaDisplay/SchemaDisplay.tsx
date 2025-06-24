import { CodeXml } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './SchemaDisplay.module.css'

type Props = {
  schemaName: string
}

export const SchemaDisplay: FC<Props> = ({ schemaName }) => {
  return (
    <div className={styles.container}>
      <CodeXml className={styles.icon} />
      <span className={styles.schemaName}>{schemaName}</span>
    </div>
  )
}
