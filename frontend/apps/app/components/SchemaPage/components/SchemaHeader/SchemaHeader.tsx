import type { FC } from 'react'
import type { FormatType } from '../../../FormatIcon'
import { SchemaLink } from '../../../SchemaLink'
import styles from './SchemaHeader.module.css'

type SchemaHeaderProps = {
  schemaName: string
  format: FormatType
}

export const SchemaHeader: FC<SchemaHeaderProps> = ({ schemaName, format }) => {
  return (
    <div className={styles.wrapper}>
      <span className={styles.schemaNameLabel}>Schema:</span>
      <SchemaLink schemaName={schemaName} format={format} />
    </div>
  )
}
