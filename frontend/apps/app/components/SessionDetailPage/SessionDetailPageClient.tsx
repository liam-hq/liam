'use client'

import { type Schema, schemaSchema } from '@liam-hq/db-structure'
import clsx from 'clsx'
import { type FC, useCallback, useMemo, useState, useTransition } from 'react'
import { safeParse } from 'valibot'
import { Chat } from './components/Chat'
import { Output } from './components/Output'
import { OutputPlaceholder } from './components/OutputPlaceholder'
import { useRealtimeBuildlingSchema } from './hooks/useRealtimeBuildlingSchema'
import { useRealtimeTimelineItems } from './hooks/useRealtimeTimelineItems'
import { useRealtimeWorkflowRuns } from './hooks/useRealtimeWorkflowRuns'
import { SCHEMA_UPDATES_REVIEW_COMMENTS } from './mock'
import styles from './SessionDetailPage.module.css'
import { buildCurrentSchema } from './services/buildCurrentSchema'
import { getBuildingSchema } from './services/buildingSchema/client/getBuldingSchema'
import { buildPrevSchema } from './services/buildPrevSchema/client/buildPrevSchema'
import { convertTimelineItemToTimelineItemEntry } from './services/convertTimelineItemToTimelineItemEntry'
import { getLatestVersion } from './services/latestVersion/client/getLatestVersion'
import type {
  DesignSessionWithTimelineItems,
  Version,
  WorkflowRunStatus,
} from './types'

type Props = {
  designSessionWithTimelineItems: DesignSessionWithTimelineItems
  initialSchema: Schema | null
  initialPrevSchema: Schema | null
  initialCurrentVersion: Version | null
  initialWorkflowRunStatus: WorkflowRunStatus | null
}

export const SessionDetailPageClient: FC<Props> = ({
  designSessionWithTimelineItems,
  initialSchema,
  initialPrevSchema,
  initialCurrentVersion,
  initialWorkflowRunStatus,
}) => {
  const designSessionId = designSessionWithTimelineItems.id

  const [prevSchema, setPrevSchema] = useState<Schema | null>(initialPrevSchema)
  const [currentSchema, setCurrentSchema] = useState<Schema | null>(
    initialSchema,
  )
  const [currentVersion, setCurrentVersion] = useState<Version | null>(
    initialCurrentVersion,
  )
  const [, setQuickFixMessage] = useState<string>('')

  const handleQuickFix = useCallback((comment: string) => {
    const fixMessage = `Please fix the following issue pointed out by the QA Agent:

"${comment}"

Please suggest a specific solution to resolve this problem.`
    setQuickFixMessage(fixMessage)
  }, [])

  const handleChangeCurrentVersion = useCallback(async (version: Version) => {
    const schema = await buildCurrentSchema({
      designSessionId,
      latestVersionNumber: version.number,
    })
    setCurrentSchema(schema)

    const prevSchema = await buildPrevSchema({
      currentSchema: schema,
      currentVersionId: version.id,
    })
    setPrevSchema(prevSchema)

    setCurrentVersion(version)
  }, [])

  const [isRefetching, startTransition] = useTransition()
  const refetchSchemaAndVersion = useCallback(async () => {
    startTransition(async () => {
      const buildingSchema = await getBuildingSchema(designSessionId)
      const parsedSchema = safeParse(schemaSchema, buildingSchema?.schema)
      const currentSchema = parsedSchema.success ? parsedSchema.output : null
      setCurrentSchema(currentSchema)

      const latestVersion = await getLatestVersion(buildingSchema?.id ?? '')
      setCurrentVersion(latestVersion)

      if (currentSchema === null || latestVersion === null) return
      const prevSchema = await buildPrevSchema({
        currentSchema,
        currentVersionId: latestVersion.id,
      })
      setPrevSchema(prevSchema)
    })
  }, [designSessionId])

  useRealtimeBuildlingSchema(designSessionId, refetchSchemaAndVersion)

  const hasCurrentVersion = currentVersion !== null

  const { timelineItems, addOrUpdateTimelineItem } = useRealtimeTimelineItems(
    designSessionId,
    designSessionWithTimelineItems.timeline_items.map((timelineItem) =>
      convertTimelineItemToTimelineItemEntry(timelineItem),
    ),
  )

  const { status } = useRealtimeWorkflowRuns(
    designSessionId,
    initialWorkflowRunStatus,
  )
  // TODO: Include logic to check if the latest version of Schema/DDL exists
  const isGenerating = useMemo(() => {
    return status === 'pending'
  }, [status, timelineItems])

  // Show loading state while schema is being fetched
  if (isRefetching) {
    return <div>Updating schema...</div>
  }

  // Show error state if no schema is available
  if (currentSchema === null) {
    return <div>Failed to load schema</div>
  }

  return (
    <div className={styles.container}>
      <div
        className={clsx(
          styles.columns,
          hasCurrentVersion ? styles.twoColumns : styles.oneColumn,
        )}
      >
        <div className={styles.chatSection}>
          <Chat
            schemaData={currentSchema}
            designSessionId={designSessionId}
            timelineItems={timelineItems}
            onMessageSend={addOrUpdateTimelineItem}
          />
        </div>
        {hasCurrentVersion && (
          <div className={styles.outputSection}>
            {isGenerating ? (
              <OutputPlaceholder />
            ) : (
              <Output
                schema={currentSchema}
                prevSchema={prevSchema}
                schemaUpdatesReviewComments={SCHEMA_UPDATES_REVIEW_COMMENTS}
                onQuickFix={handleQuickFix}
                designSessionId={designSessionId}
                currentVersion={currentVersion}
                onCurrentVersionChange={handleChangeCurrentVersion}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
