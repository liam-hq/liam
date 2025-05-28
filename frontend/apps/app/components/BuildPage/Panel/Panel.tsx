'use client'

import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/components'
import { Chat } from '@/components/Chat'
import type { Schema } from '@liam-hq/db-structure'
import type { FC } from 'react'
import { ERD, type ErrorObject } from './ERD'
import styles from './Panel.module.css'
import { SchemaEditor } from './SchemaEditor'
import { TablesList } from './TablesList'
import { AFTER } from './after'
import { BEFORE } from './before'

type Props = {
  schema: Schema
  errors: ErrorObject[]
  projectId: string
}

export const Panel: FC<Props> = ({ schema, errors, projectId }) => {
  return (
    <div className={styles.container}>
      <div className={styles.columns}>
        <div className={styles.chatSection}>
          <Chat schemaData={schema} projectId={projectId} />
        </div>
        <TabsRoot defaultValue="erd" className={styles.tabsRoot}>
          <TabsList className={styles.tabsList}>
            <TabsTrigger value="schema" className={styles.tabsTrigger}>
              Schema
            </TabsTrigger>
            <TabsTrigger value="tables" className={styles.tabsTrigger}>
              Tables
            </TabsTrigger>
            <TabsTrigger value="erd" className={styles.tabsTrigger}>
              ERD
            </TabsTrigger>
          </TabsList>
          <TabsContent value="schema" className={styles.tabsContent}>
            <div className={styles.editorSection}>
              <SchemaEditor initialDoc={JSON.stringify(AFTER, null, 2)} />
            </div>
          </TabsContent>
          <TabsContent value="tables" className={styles.tabsContent}>
            <div className={styles.tablesSection}>
              <TablesList
                before={BEFORE as unknown as Schema}
                after={AFTER as unknown as Schema}
              />
            </div>
          </TabsContent>
          <TabsContent value="erd" className={styles.tabsContent}>
            <ERD
              currentSchema={AFTER as unknown as Schema}
              previousSchema={BEFORE as unknown as Schema}
              errors={errors}
            />
          </TabsContent>
        </TabsRoot>
      </div>
    </div>
  )
}
