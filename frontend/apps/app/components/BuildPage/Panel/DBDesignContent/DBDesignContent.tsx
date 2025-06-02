'use client'

import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/components'
import { ERDRenderer } from '@/features'
import { VersionProvider } from '@/providers'
import { versionSchema } from '@/schemas'
import { initSchemaStore } from '@/stores'
import type { Schema } from '@liam-hq/db-structure'
import { type FC, useEffect } from 'react'
import { parse } from 'valibot'
import { SchemaEditor } from '../SchemaEditor'
import { TablesList } from '../TablesList'
import { AFTER } from '../after'
import { BEFORE } from '../before'
import styles from './DBDesignContent.module.css'

type ErrorObject = {
  name: string
  message: string
  instruction?: string
}

type Props = {
  schema: Schema
  errors: ErrorObject[]
}

export const DBDesignContent: FC<Props> = ({ errors }) => {
  const versionData = {
    version: '0.1.0',
    gitHash: process.env.NEXT_PUBLIC_GIT_HASH,
    envName: process.env.NEXT_PUBLIC_ENV_NAME,
    date: process.env.NEXT_PUBLIC_RELEASE_DATE,
    displayedOn: 'web',
  }
  const version = parse(versionSchema, versionData)

  useEffect(() => {
    initSchemaStore({
      current: AFTER as unknown as Schema,
      previous: BEFORE as unknown as Schema,
    })
  }, [])

  return (
    <TabsRoot defaultValue="tables" className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.title}>DB Design</div>
        <TabsList className={styles.tabsList}>
          <TabsTrigger value="tables" className={styles.tabsTrigger}>
            Tables
          </TabsTrigger>
          <TabsTrigger value="erd" className={styles.tabsTrigger}>
            ERD
          </TabsTrigger>
          <TabsTrigger value="schema" className={styles.tabsTrigger}>
            Schema
          </TabsTrigger>
          <TabsTrigger value="ddl" className={styles.tabsTrigger}>
            DDL
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="tables" className={styles.tablesSection}>
        <TablesList
          before={BEFORE as unknown as Schema}
          after={AFTER as unknown as Schema}
        />
      </TabsContent>
      <TabsContent value="erd" className={styles.erdSection}>
        <VersionProvider version={version}>
          <ERDRenderer
            defaultSidebarOpen={false}
            defaultPanelSizes={[20, 80]}
            errorObjects={errors}
          />
        </VersionProvider>
      </TabsContent>
      <TabsContent value="schema" className={styles.schemaSection}>
        <SchemaEditor initialDoc={JSON.stringify(AFTER, null, 2)} />
      </TabsContent>
      <TabsContent value="ddl">
        <div>TODO: DDL Section</div>
      </TabsContent>
    </TabsRoot>
  )
}
