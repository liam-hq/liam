'use client'

import { TabsContent, TabsRoot } from '@/components'
import { Chat } from '@/components/Chat'
import { ERDRenderer } from '@/features'
import { useTableGroups } from '@/hooks'
import { VersionProvider } from '@/providers'
import { versionSchema } from '@/schemas'
import type { Schema } from '@liam-hq/db-structure'
import { schemaSchema } from '@liam-hq/db-structure'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import * as v from 'valibot'
import { SessionBreadcrumb } from './SessionBreadcrumb/SessionBreadcrumb'
import styles from './SessionDetailPage.module.css'
import {
  fetchSchemaDataClient,
  setupBuildingSchemaRealtimeSubscription,
} from './services/buildingSchemaServiceClient'

type Props = {
  designSession: {
    id: string
    organizationId: string
    buildingSchemaId: string
    latestVersionNumber: number
    name: string
  }
}

export const SessionDetailPage: FC<Props> = ({ designSession }) => {
  const [schema, setSchema] = useState<Schema | null>(null)
  const [isLoadingSchema, setIsLoadingSchema] = useState(true)
  const [latestVersionNumber, setLatestVersionNumber] = useState(
    designSession.latestVersionNumber,
  )
  const designSessionId = designSession.id

  // Load initial schema data
  useEffect(() => {
    const loadInitialSchema = async () => {
      try {
        setIsLoadingSchema(true)
        const { data: schemaData, error } =
          await fetchSchemaDataClient(designSessionId)

        if (error) {
          console.error('Failed to fetch initial schema:', error)
          return
        }

        if (schemaData.schema) {
          const schema = v.parse(schemaSchema, schemaData.schema)
          setSchema(schema)
          setLatestVersionNumber(schemaData.latestVersionNumber)
        }
      } catch (error) {
        console.error('Error loading initial schema:', error)
      } finally {
        setIsLoadingSchema(false)
      }
    }

    if (designSessionId) {
      loadInitialSchema()
    }
  }, [designSessionId])

  // Handle schema updates from realtime subscription
  const handleSchemaUpdate = useCallback(
    async (triggeredDesignSessionId: string) => {
      try {
        const { data: schemaData, error } = await fetchSchemaDataClient(
          triggeredDesignSessionId,
        )

        if (error) {
          console.error('Failed to fetch updated schema:', error)
          return
        }

        if (schemaData.schema) {
          const schema = v.parse(schemaSchema, schemaData.schema)
          setSchema(schema)
          setLatestVersionNumber(schemaData.latestVersionNumber)
        }
      } catch (error) {
        console.error('Error handling schema update:', error)
      }
    },
    [],
  )

  // Handle realtime subscription errors
  const handleRealtimeError = useCallback((_error: Error) => {
    // TODO: Add user notification system
    // console.error('Schema realtime subscription error:', error)
  }, [])

  // Set up realtime subscription for schema updates
  useEffect(() => {
    if (!designSessionId) {
      return
    }

    const subscription = setupBuildingSchemaRealtimeSubscription(
      designSessionId,
      handleSchemaUpdate,
      handleRealtimeError,
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [designSessionId, handleSchemaUpdate, handleRealtimeError])

  const { tableGroups, addTableGroup } = useTableGroups({})

  const versionData = {
    version: '0.1.0',
    gitHash: process.env.NEXT_PUBLIC_GIT_HASH,
    envName: process.env.NEXT_PUBLIC_ENV_NAME,
    date: process.env.NEXT_PUBLIC_RELEASE_DATE,
    displayedOn: 'web',
  }
  const version = v.parse(versionSchema, versionData)

  // Show loading state while schema is being fetched
  if (isLoadingSchema) {
    return <div>Loading schema...</div>
  }

  // Show error state if no schema is available
  if (!schema) {
    return <div>Failed to load schema</div>
  }

  return (
    <div className={styles.container}>
      <SessionBreadcrumb sessionName={designSession.name} />
      <div className={styles.columns}>
        <div className={styles.chatSection}>
          <Chat
            schemaData={schema}
            designSessionId={designSession.id}
            organizationId={designSession.organizationId}
            buildingSchemaId={designSession.buildingSchemaId}
            latestVersionNumber={latestVersionNumber}
          />
        </div>
        <TabsRoot defaultValue="erd" className={styles.tabsRoot}>
          <TabsContent value="erd" className={styles.tabsContent}>
            <div className={styles.erdSection}>
              <VersionProvider version={version}>
                <ERDRenderer
                  schema={{ current: schema }}
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
