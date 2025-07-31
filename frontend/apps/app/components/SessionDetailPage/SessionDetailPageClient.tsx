'use client'

import type { Schema } from '@liam-hq/db-structure'
import clsx from 'clsx'
import { type FC, useCallback } from 'react'
import { Chat } from './components/Chat'
import { Output } from './components/Output'
import { useRealtimeArtifact } from './components/Output/components/Artifact/hooks/useRealtimeArtifact'
import { OutputPlaceholder } from './components/OutputPlaceholder'
import { useRealtimeTimelineItems } from './hooks/useRealtimeTimelineItems'
import { useRealtimeVersionsWithSchema } from './hooks/useRealtimeVersionsWithSchema'
import { useRealtimeWorkflowRuns } from './hooks/useRealtimeWorkflowRuns'
import { SQL_REVIEW_COMMENTS } from './mock'
import styles from './SessionDetailPage.module.css'
import { convertTimelineItemToTimelineItemEntry } from './services/convertTimelineItemToTimelineItemEntry'
import type {
  DesignSessionWithTimelineItems,
  Version,
  WorkflowRunStatus,
} from './types'

type Props = {
  buildingSchemaId: string
  designSessionWithTimelineItems: DesignSessionWithTimelineItems
  initialDisplayedSchema: Schema
  initialPrevSchema: Schema
  initialVersions: Version[]
  initialWorkflowRunStatus: WorkflowRunStatus | null
}

export const SessionDetailPageClient: FC<Props> = ({
  buildingSchemaId,
  designSessionWithTimelineItems,
  initialDisplayedSchema,
  initialPrevSchema,
  initialVersions,
  initialWorkflowRunStatus,
}) => {
  const designSessionId = designSessionWithTimelineItems.id

  const {
    versions,
    selectedVersion,
    setSelectedVersion,
    displayedSchema,
    prevSchema,
  } = useRealtimeVersionsWithSchema({
    buildingSchemaId,
    initialVersions,
    initialDisplayedSchema,
    initialPrevSchema,
  })

  const handleChangeSelectedVersion = useCallback(
    (version: Version) => {
      setSelectedVersion(version)
    },
    [setSelectedVersion],
  )

  const handleViewVersion = useCallback((versionId: string) => {
    const version = versions.find((version) => version.id === versionId)
    if (!version) return

    setSelectedVersion(version)
  }, [])

  const { timelineItems, addOrUpdateTimelineItem } = useRealtimeTimelineItems(
    designSessionId,
    designSessionWithTimelineItems.timeline_items.map((timelineItem) =>
      convertTimelineItemToTimelineItemEntry(timelineItem),
    ),
  )

  const hasSelectedVersion = selectedVersion !== null

  // Use realtime artifact hook to monitor artifact changes
  const { artifact } = useRealtimeArtifact(designSessionId)
  const hasRealtimeArtifact = !!artifact

  // Use realtime workflow status
  const { status } = useRealtimeWorkflowRuns(
    designSessionId,
    initialWorkflowRunStatus,
  )

  // Show Output if artifact exists OR workflow is not pending
  const shouldShowOutput = hasRealtimeArtifact || status !== 'pending'

  return (
    <div className={styles.container}>
      <div
        className={clsx(
          styles.columns,
          hasSelectedVersion ? styles.twoColumns : styles.oneColumn,
        )}
      >
        <div className={styles.chatSection}>
          <Chat
            schemaData={displayedSchema}
            designSessionId={designSessionId}
            timelineItems={timelineItems}
            onMessageSend={addOrUpdateTimelineItem}
            onVersionView={handleViewVersion}
          />
        </div>
        {hasSelectedVersion && (
          <div className={styles.outputSection}>
            {shouldShowOutput ? (
              <Output
                designSessionId={designSessionId}
                schema={displayedSchema}
                prevSchema={prevSchema}
                sqlReviewComments={SQL_REVIEW_COMMENTS}
                versions={versions}
                selectedVersion={selectedVersion}
                onSelectedVersionChange={handleChangeSelectedVersion}
              />
            ) : (
              <OutputPlaceholder />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
