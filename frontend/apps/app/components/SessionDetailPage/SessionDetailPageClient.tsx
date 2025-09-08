'use client'

import {
  isHumanMessage,
  mapStoredMessagesToChatMessages,
  type StoredMessage,
} from '@langchain/core/messages'
import type { Schema } from '@liam-hq/schema'
import clsx from 'clsx'
import { type FC, useCallback, useEffect, useRef, useState } from 'react'
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
import { extractResponseFromMessage } from './utils'

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

  useRealtimeTimelineItems(
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
    designSessionId,
  })
  // Track if initial workflow has been triggered to prevent multiple executions
  const hasTriggeredInitialWorkflow = useRef(false)

  // Auto-trigger workflow on page load if there's an unanswered user message
  useEffect(() => {
    const triggerInitialWorkflow = async () => {
      // Skip if already triggered
      if (hasTriggeredInitialWorkflow.current) return

      // Check if there's exactly one timeline item and it's a user message
      if (messages.length !== 1) return

      const firstItem = messages[0]
      if (!firstItem || !isHumanMessage(firstItem)) return

      // Check if there's already a workflow running
      if (status === 'pending') return

      // Mark as triggered before the async call
      hasTriggeredInitialWorkflow.current = true

      // Trigger the workflow for the initial user message
      await start({
        designSessionId,
        userInput: extractResponseFromMessage(firstItem),
        isDeepModelingEnabled,
      })
    }

    triggerInitialWorkflow()
  }, [messages, designSessionId, isDeepModelingEnabled])

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
            isWorkflowRunning={status === 'pending' || isStreaming}
            onSendMessage={start}
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
