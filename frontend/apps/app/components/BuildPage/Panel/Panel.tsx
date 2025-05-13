'use client'

import type { SchemaData } from '@/app/api/chat/route'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/components'
import { Chat } from '@/components/Chat'
import { ERDRenderer } from '@/features'
import { useTableGroups } from '@/hooks'
import { VersionProvider } from '@/providers'
import { versionSchema } from '@/schemas'
import { initSchemaStore } from '@/stores'
import type { Schema, TableGroup } from '@liam-hq/db-structure'
import { type FC, useEffect } from 'react'
import * as v from 'valibot'
import styles from './Panel.module.css'
import { SchemaEditor } from './SchemaEditor'
import { TablesList } from './TablesList'

type ErrorObject = {
  name: string
  message: string
  instruction?: string
}

type Props = {
  schema: Schema
  errors: ErrorObject[]
  tableGroups: Record<string, TableGroup>
  adaptedSchema: SchemaData
}

export const Panel: FC<Props> = ({
  schema,
  errors,
  tableGroups: initialTableGroups = {},
  adaptedSchema,
}) => {
  const { tableGroups, addTableGroup } = useTableGroups(initialTableGroups)

  useEffect(() => {
    initSchemaStore(schema)
  }, [schema])

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
          <Chat schemaData={adaptedSchema} />
        </div>
        <TabsRoot defaultValue="schema" className={styles.tabsRoot}>
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
              <SchemaEditor initialDoc={JSON.stringify(schema, null, 2)} />
            </div>
          </TabsContent>
          <TabsContent value="tables" className={styles.tabsContent}>
            <div className={styles.tablesSection}>
              <TablesList schema={schema} tableGroups={tableGroups} />
            </div>
          </TabsContent>
          <TabsContent value="erd" className={styles.tabsContent}>
            <div className={styles.erdSection}>
              <VersionProvider version={version}>
                <ERDRenderer
                  defaultSidebarOpen={false}
                  defaultPanelSizes={[20, 80]}
                  errorObjects={errors}
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
