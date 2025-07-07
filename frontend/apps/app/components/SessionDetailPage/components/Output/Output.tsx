import type { Schema } from '@liam-hq/db-structure'
import type { FC } from 'react'
import { TabsContent, TabsRoot } from '@/components'
import type { ReviewComment, Version } from '../../types'
import { ArtifactContainer } from './components/Artifact/ArtifactContainer'
import { ERD } from './components/ERD'
import { Header } from './components/Header'
import { SchemaUpdates } from './components/SchemaUpdates'
import { DEFAULT_OUTPUT_TAB, OUTPUT_TABS } from './constants'
import styles from './Output.module.css'

type Props = {
  schema: Schema
  prevSchema: Schema | null
  schemaUpdatesDoc: string
  schemaUpdatesReviewComments: ReviewComment[]
  onQuickFix?: (comment: string) => void
  designSessionId: string
  currentVersion: Version | null
  onCurrentVersionChange: (version: Version) => void
}

export const Output: FC<Props> = ({
  schema,
  prevSchema,
  schemaUpdatesDoc,
  schemaUpdatesReviewComments,
  onQuickFix,
  designSessionId,
  currentVersion,
  onCurrentVersionChange,
}) => {
  return (
    <TabsRoot defaultValue={DEFAULT_OUTPUT_TAB} className={styles.tabsRoot}>
      <Header
        designSessionId={designSessionId}
        currentVersion={currentVersion}
        onCurrentVersionChange={onCurrentVersionChange}
      />
      <TabsContent value={OUTPUT_TABS.ERD} className={styles.tabsContent}>
        <ERD schema={schema} prevSchema={prevSchema ?? undefined} />
      </TabsContent>
      <TabsContent
        value={OUTPUT_TABS.SCHEMA_UPDATES}
        className={styles.tabsContent}
      >
        <SchemaUpdates
          doc={schemaUpdatesDoc}
          comments={schemaUpdatesReviewComments}
          onQuickFix={onQuickFix}
        />
      </TabsContent>
      <TabsContent value={OUTPUT_TABS.ARTIFACT} className={styles.tabsContent}>
        <ArtifactContainer designSessionId={designSessionId} />
      </TabsContent>
    </TabsRoot>
  )
}
