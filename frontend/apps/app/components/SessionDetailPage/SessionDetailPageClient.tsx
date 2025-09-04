'use client'

import {
  mapStoredMessagesToChatMessages,
  type StoredMessage,
} from '@langchain/core/messages'
import type { Schema } from '@liam-hq/schema'
import clsx from 'clsx'
import { type FC, useCallback, useState } from 'react'
import { Chat } from './components/Chat'
import { Output } from './components/Output'
import { useRealtimeArtifact } from './components/Output/components/Artifact/hooks/useRealtimeArtifact'
import { OutputPlaceholder } from './components/OutputPlaceholder'
import { useRealtimeTimelineItems } from './hooks/useRealtimeTimelineItems'
import { useRealtimeVersionsWithSchema } from './hooks/useRealtimeVersionsWithSchema'
import { useRealtimeWorkflowRuns } from './hooks/useRealtimeWorkflowRuns'
import { useStream } from './hooks/useStream'
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
  initialMessages: StoredMessage[]
  initialDisplayedSchema: Schema
  initialPrevSchema: Schema
  initialVersions: Version[]
  initialWorkflowRunStatus: WorkflowRunStatus | null
  isDeepModelingEnabled: boolean
  initialIsPublic: boolean
}

export const SessionDetailPageClient: FC<Props> = ({
  buildingSchemaId,
  designSessionWithTimelineItems,
  initialMessages,
  initialDisplayedSchema,
  initialPrevSchema,
  initialVersions,
  initialWorkflowRunStatus,
  isDeepModelingEnabled,
  initialIsPublic,
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

  // TODO: Connect to Messages component once migration path from TimelineItems to Messages is established
  // const handleViewVersion = useCallback((versionId: string) => {
  //   const version = versions.find((version) => version.id === versionId)
  //   if (!version) return

  //   setSelectedVersion(version)
  // }, [])

  const { addOrUpdateTimelineItem } = useRealtimeTimelineItems(
    designSessionId,
    designSessionWithTimelineItems.timeline_items.map((timelineItem) =>
      convertTimelineItemToTimelineItemEntry(timelineItem),
    ),
  )

  const [activeTab, setActiveTab] = useState<string | undefined>(undefined)

  // TODO: Connect to Messages component once migration path from TimelineItems to Messages is established
  // const handleArtifactLinkClick = useCallback(() => {
  //   setActiveTab(OUTPUT_TABS.ARTIFACT)
  // }, [])

  const hasSelectedVersion = selectedVersion !== null

  // Use realtime artifact hook to monitor artifact changes
  const { artifact } = useRealtimeArtifact(designSessionId)
  const hasRealtimeArtifact = !!artifact

  // Use realtime workflow status
  const { status } = useRealtimeWorkflowRuns(
    designSessionId,
    initialWorkflowRunStatus,
  )

  const chatMessages = mapStoredMessagesToChatMessages(initialMessages)

  const { isStreaming, messages, start } = useStream({
    initialMessages: chatMessages,
  })

  const handleWorkflowStart = useCallback(
    async (params: {
      userInput: string
      designSessionId: string
      isDeepModelingEnabled: boolean
    }) => {
      await start(params)
    },
    [start],
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
            messages={messages}
            onMessageSend={addOrUpdateTimelineItem}
            onWorkflowStart={handleWorkflowStart}
            isWorkflowRunning={status === 'pending' || isStreaming}
            isDeepModelingEnabled={isDeepModelingEnabled}
          />
        </div>
        {hasSelectedVersion && (
          <div className={styles.outputSection}>
            {shouldShowOutput ? (
              activeTab !== undefined ? (
                <Output
                  designSessionId={designSessionId}
                  schema={displayedSchema}
                  prevSchema={prevSchema}
                  sqlReviewComments={SQL_REVIEW_COMMENTS}
                  versions={versions}
                  selectedVersion={selectedVersion}
                  onSelectedVersionChange={handleChangeSelectedVersion}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  initialIsPublic={initialIsPublic}
                />
              ) : (
                <Output
                  designSessionId={designSessionId}
                  schema={displayedSchema}
                  prevSchema={prevSchema}
                  sqlReviewComments={SQL_REVIEW_COMMENTS}
                  versions={versions}
                  selectedVersion={selectedVersion}
                  onSelectedVersionChange={handleChangeSelectedVersion}
                  initialIsPublic={initialIsPublic}
                />
              )
            ) : (
              <OutputPlaceholder />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
