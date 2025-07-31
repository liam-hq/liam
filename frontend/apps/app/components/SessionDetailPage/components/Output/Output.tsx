import type { Schema } from '@liam-hq/db-structure'
import type { ComponentProps, FC } from 'react'
import { TabsContent, TabsRoot } from '@/components'
import type { ReviewComment } from '../../types'
import { ArtifactContainer } from './components/Artifact/ArtifactContainer'
import { ERD } from './components/ERD'
import { Header } from './components/Header'
import { SQL } from './components/SQL'
import { DEFAULT_OUTPUT_TAB, OUTPUT_TABS } from './constants'
import styles from './Output.module.css'

type Props = ComponentProps<typeof Header> & {
  designSessionId: string
  schema: Schema
  prevSchema: Schema
  sqlReviewComments: ReviewComment[]
}

export const Output: FC<Props> = ({
  designSessionId,
  schema,
  prevSchema,
  sqlReviewComments,
  ...propsForHeader
}) => {
  return (
    <TabsRoot defaultValue={DEFAULT_OUTPUT_TAB} className={styles.tabsRoot}>
      <Header {...propsForHeader} />
      <TabsContent value={OUTPUT_TABS.ERD} className={styles.tabsContent}>
        <ERD schema={schema} prevSchema={prevSchema} />
      </TabsContent>
      <TabsContent value={OUTPUT_TABS.SQL} className={styles.tabsContent}>
        <SQL
          currentSchema={schema}
          prevSchema={prevSchema}
          comments={sqlReviewComments}
        />
      </TabsContent>
      <TabsContent value={OUTPUT_TABS.ARTIFACT} className={styles.tabsContent}>
        <ArtifactContainer designSessionId={designSessionId} />
      </TabsContent>
    </TabsRoot>
  )
}
