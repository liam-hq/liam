import { ArrowUpRight } from '@liam-hq/ui'
import type { FC } from 'react'
import { FormatIcon, type FormatType } from '@/components/FormatIcon'
import styles from './SchemaLink.module.css'

interface SchemaLinkProps {
  schemaName: string
  format?: FormatType
}

export const SchemaLink: FC<SchemaLinkProps> = ({
  schemaName,
  format = 'postgres',
}) => {
  return (
    <button
      className={styles.schemaLink}
      type="button"
      aria-label={`Open schema ${schemaName}`}
    >
      <div className={styles.formatIcon}>
        <FormatIcon format={format} />
      </div>
      <span className={styles.schemaName}>{schemaName}</span>
      <div className={styles.iconContainer}>
        <ArrowUpRight size={12} />
      </div>
    </button>
  )
}
