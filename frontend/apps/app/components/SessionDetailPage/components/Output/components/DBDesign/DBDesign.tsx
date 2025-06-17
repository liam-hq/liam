import type { Schema } from '@liam-hq/db-structure'
import type { FC } from 'react'
import styles from './DBDesign.module.css'
import { ERD } from './components/ERD'
import { SchemaUpdates } from './components/SchemaUpdates'
import type { ReviewComment } from './components/SchemaUpdates/MigrationsViewer/useMigrationsViewer'

type Props = {
  schema: Schema
  prevSchema?: Schema
  schemaUpdatesDoc: string
  prevSchemaUpdatesDoc?: string
  comments: ReviewComment[]
  onQuickFix?: (comment: string) => void
}

export const DBDesign: FC<Props> = ({
  schema,
  prevSchema,
  schemaUpdatesDoc,
  prevSchemaUpdatesDoc,
  comments,
  onQuickFix,
}) => {
  return (
    <div className={styles.wrapper}>
      <ERD schema={schema} prevSchema={prevSchema} />
      <SchemaUpdates
        schemaUpdatesDoc={schemaUpdatesDoc}
        prevSchemaUpdatesDoc={prevSchemaUpdatesDoc}
        comments={comments}
        onQuickFix={onQuickFix}
      />
    </div>
  )
}
