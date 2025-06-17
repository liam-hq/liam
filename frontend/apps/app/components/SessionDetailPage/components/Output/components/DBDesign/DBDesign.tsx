import type { Schema } from '@liam-hq/db-structure'
import type { FC } from 'react'
import styles from './DBDesign.module.css'
import { ERD } from './components/ERD'
import { SchemaUpdates } from './components/SchemaUpdates'
import type { ReviewComment } from './components/SchemaUpdates/MigrationsViewer/useMigrationsViewer'

type Props = {
  schema: Schema
  schemaUpdatesDoc: string
  comments: ReviewComment[]
  onQuickFix?: (comment: string) => void
}

export const DBDesign: FC<Props> = ({
  schema,
  schemaUpdatesDoc,
  comments,
  onQuickFix,
}) => {
  return (
    <div className={styles.wrapper}>
      <ERD schema={schema} />
      <SchemaUpdates
        schemaUpdatesDoc={schemaUpdatesDoc}
        comments={comments}
        onQuickFix={onQuickFix}
      />
    </div>
  )
}
