'use client'

import type { Schema } from '@liam-hq/db-structure'
import clsx from 'clsx'
import { type FC, useCallback, useState } from 'react'
import { Chat } from './components/Chat'
import { Output } from './components/Output'
import { OutputPlaceholder } from './components/OutputPlaceholder'
import { useRealtimeTimelineItems } from './hooks/useRealtimeTimelineItems'
import { useRealtimeVersionsWithSchema } from './hooks/useRealtimeVersionsWithSchema'
import { useRealtimeWorkflowRuns } from './hooks/useRealtimeWorkflowRuns'
import { SCHEMA_UPDATES_REVIEW_COMMENTS } from './mock'
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

  const { timelineItems, addOrUpdateTimelineItem } = useRealtimeTimelineItems(
    designSessionId,
    designSessionWithTimelineItems.timeline_items.map((timelineItem) =>
      convertTimelineItemToTimelineItemEntry(timelineItem),
    ),
  )

  const [, setQuickFixMessage] = useState<string>('')

  const handleQuickFix = useCallback((comment: string) => {
    const fixMessage = `Please fix the following issue pointed out by the QA Agent:

"${comment}"

Please suggest a specific solution to resolve this problem.`
    setQuickFixMessage(fixMessage)
  }, [])

  const { status } = useRealtimeWorkflowRuns(
    designSessionId,
    initialWorkflowRunStatus,
  )

  const hasSelectedVersion = selectedVersion !== null

  const isVersionReady =
    status !== 'pending' ||
    (selectedVersion?.patch !== null && selectedVersion?.reverse_patch !== null)

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
          />
        </div>
        {hasSelectedVersion && (
          <div className={styles.outputSection}>
            {isVersionReady ? (
              <Output
                designSessionId={designSessionId}
                schema={displayedSchema}
                prevSchema={prevSchema}
                schemaUpdatesReviewComments={SCHEMA_UPDATES_REVIEW_COMMENTS}
                onQuickFix={handleQuickFix}
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
