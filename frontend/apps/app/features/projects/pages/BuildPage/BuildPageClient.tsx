'use client'

import { ChatbotButton } from '@/components/ChatbotButton'
import { ERDRenderer } from '@/features'
import { useTableGroups } from '@/hooks'
import { VersionProvider } from '@/providers'
import { versionSchema } from '@/schemas'
import { initSchemaStore } from '@/stores'
import type { Schema } from '@liam-hq/db-structure'
import { type FC, useEffect, useState } from 'react'
import * as v from 'valibot'
import styles from './BuildPage.module.css'

type ErrorObject = {
  name: string
  message: string
  instruction?: string
}

type ClientProps = {
  schema: Schema
  errors: ErrorObject[]
  tableGroups: Record<
    string,
    { name: string; tables: string[]; comment: string | null }
  >
}

const BuildPageClient: FC<ClientProps> = ({
  schema,
  errors,
  tableGroups: initialTableGroups = {},
}) => {
  const [isSchemaDataReady, setSchemaDataReady] = useState(false)
  const { tableGroups, addTableGroup } = useTableGroups(initialTableGroups)

  useEffect(() => {
    initSchemaStore(schema)
    setSchemaDataReady(true)
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
      <div className={styles.content}>
        <div className={styles.columns}>
          <div className={styles.chatSection}>
            {isSchemaDataReady && (
              <ChatbotButton schemaData={schema} tableGroups={tableGroups} />
            )}
          </div>

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
        </div>
      </div>
    </div>
  )
}

export { BuildPageClient }
