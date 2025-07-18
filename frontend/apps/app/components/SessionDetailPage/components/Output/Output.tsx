import type { Schema } from '@liam-hq/db-structure'
import type { ComponentProps, FC } from 'react'
import { TabsContent, TabsRoot } from '@/components'
import type { ReviewComment } from '../../types'
import { ArtifactContainer } from './components/Artifact/ArtifactContainer'
import { ERD } from './components/ERD'
import { Header } from './components/Header'
import { SchemaUpdates } from './components/SchemaUpdates'
import { DEFAULT_OUTPUT_TAB, OUTPUT_TABS } from './constants'
import styles from './Output.module.css'

type Props = ComponentProps<typeof Header> & {
  designSessionId: string
  schema: Schema
  prevSchema: Schema
  schemaUpdatesReviewComments: ReviewComment[]
  onQuickFix?: (comment: string) => void
}

export const Output: FC<Props> = ({
  designSessionId,
  schema,
  prevSchema,
  schemaUpdatesReviewComments,
  onQuickFix,
  ...propsForHeader
}) => {
  return (
    <TabsRoot defaultValue={DEFAULT_OUTPUT_TAB} className={styles.tabsRoot}>
      <Header {...propsForHeader} />
      <TabsContent value={OUTPUT_TABS.ERD} className={styles.tabsContent}>
        <ERD schema={schema} prevSchema={prevSchema} />
      </TabsContent>
      <TabsContent
        value={OUTPUT_TABS.SCHEMA_UPDATES}
        className={styles.tabsContent}
      >
        <SchemaUpdates
          currentSchema={schema}
          prevSchema={prevSchema}
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
