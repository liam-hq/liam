import type { Schema } from '@liam-hq/db-structure'
import type { FC } from 'react'
import styles from './DBDesign.module.css'
import { ERD } from './components/ERD'
import { SchemaUpdates } from './components/SchemaUpdates'
import {} from './components/SchemaUpdates/mock'

type Props = {
  schema: Schema
  onQuickFix?: (comment: string) => void
}

export const DBDesign: FC<Props> = ({ schema, onQuickFix }) => {
  return (
    <div className={styles.wrapper}>
      <ERD schema={schema} />
      <SchemaUpdates onQuickFix={onQuickFix} />
    </div>
  )
}
