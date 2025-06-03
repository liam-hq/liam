'use client'

import { TabsContent, TabsRoot } from '@/components'
import { Chat } from '@/components/Chat'
import { ERDRenderer } from '@/features'
import { useTableGroups } from '@/hooks'
import { VersionProvider } from '@/providers'
import { versionSchema } from '@/schemas'
import type { Schema } from '@liam-hq/db-structure'
import { initSchemaStore } from '@liam-hq/erd-core'
import type { FC } from 'react'
import { useEffect } from 'react'
import * as v from 'valibot'
import styles from './SessionDetailPage.module.css'
type Props = {
  projectId?: string
  schema: Schema
  designSessionId: string
}

export const SessionDetailPage: FC<Props> = ({
  projectId,
  schema,
  designSessionId,
}) => {
  // Update the schema store with the fetched schema
  useEffect(() => {
    if (schema) {
      initSchemaStore({
        current: schema,
      })
    }
  }, [schema])

  const { tableGroups, addTableGroup } = useTableGroups({})

  const versionData = {
    version: '0.1.0',
    gitHash: process.env.NEXT_PUBLIC_GIT_HASH,
    envName: process.env.NEXT_PUBLIC_ENV_NAME,
    date: process.env.NEXT_PUBLIC_RELEASE_DATE,
    displayedOn: 'web',
  }
  const version = v.parse(versionSchema, versionData)

  return (
    <div className={styles.container}>
      <div className={styles.columns}>
        <div className={styles.chatSection}>
          <Chat
            schemaData={schema}
            projectId={projectId}
            designSessionId={designSessionId}
          />
        </div>
        <TabsRoot defaultValue="erd" className={styles.tabsRoot}>
          <TabsContent value="erd" className={styles.tabsContent}>
            <div className={styles.erdSection}>
              <VersionProvider version={version}>
                <ERDRenderer
                  defaultSidebarOpen={false}
                  defaultPanelSizes={[20, 80]}
                  errorObjects={[]}
                  tableGroups={tableGroups}
                  onAddTableGroup={addTableGroup}
                />
              </VersionProvider>
            </div>
          </TabsContent>
        </TabsRoot>
      </div>
    </div>
  )
}
