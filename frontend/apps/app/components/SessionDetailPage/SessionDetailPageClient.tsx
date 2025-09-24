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
import { OUTPUT_TABS } from './components/Output/constants'
import { useRealtimeVersionsWithSchema } from './hooks/useRealtimeVersionsWithSchema'
import { useStream } from './hooks/useStream'
import { SQL_REVIEW_COMMENTS } from './mock'
import styles from './SessionDetailPage.module.css'
import type { DesignSessionWithTimelineItems, Version } from './types'

type Props = {
  buildingSchemaId: string
  designSessionWithTimelineItems: DesignSessionWithTimelineItems
  initialMessages: StoredMessage[]
  initialDisplayedSchema: Schema
  initialPrevSchema: Schema
  initialVersions: Version[]
  isDeepModelingEnabled: boolean
  initialIsPublic: boolean
  initialWorkflowError?: string | null
}

export const SessionDetailPageClient: FC<Props> = ({
  buildingSchemaId,
  designSessionWithTimelineItems,
  initialMessages,
  initialDisplayedSchema,
  initialPrevSchema,
  initialVersions,
  isDeepModelingEnabled,
  initialIsPublic,
  initialWorkflowError,
}) => {
  const designSessionId = designSessionWithTimelineItems.id

  const [activeTab, setActiveTab] = useState<string | undefined>(undefined)

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
    onChangeSelectedVersion: (version: Version) => {
      setSelectedVersion(version)
      if (activeTab === undefined) {
        setActiveTab(OUTPUT_TABS.ERD)
      }
    },
  })

  const handleVersionChange = useCallback(
    (version: Version) => {
      setSelectedVersion(version)
      setActiveTab(OUTPUT_TABS.ERD)
    },
    [setSelectedVersion],
  )

  const handleArtifactChange = useCallback((newArtifact: unknown) => {
    if (newArtifact !== null) {
      setActiveTab(OUTPUT_TABS.ARTIFACT)
    }
  }, [])

  const handleNavigateToTab = useCallback((tab: 'erd' | 'artifact') => {
    if (tab === 'erd') {
      setActiveTab(OUTPUT_TABS.ERD)
    } else if (tab === 'artifact') {
      setActiveTab(OUTPUT_TABS.ARTIFACT)
    }
  }, [])

  const { artifact } = useRealtimeArtifact(
    designSessionId,
    handleArtifactChange,
  )
  const shouldShowOutputSection = artifact !== null || selectedVersion !== null

  const chatMessages = mapStoredMessagesToChatMessages(initialMessages)
  const { isStreaming, messages, start, error } = useStream({
    initialMessages: chatMessages,
    designSessionId,
  })

  // Combine streaming error with workflow errors
  const combinedError = error || initialWorkflowError
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

      // Mark as triggered before the async call
      hasTriggeredInitialWorkflow.current = true

      // Trigger the workflow for the initial user message
      await start({
        designSessionId,
        userInput: firstItem.text,
        isDeepModelingEnabled,
      })
    }

    triggerInitialWorkflow()
  }, [messages, designSessionId, isDeepModelingEnabled, start])

  return (
    <div className={styles.container}>
      <div
        className={clsx(
          styles.columns,
          shouldShowOutputSection ? styles.twoColumns : styles.oneColumn,
        )}
      >
        <div className={styles.chatSection}>
          <Chat
            schemaData={displayedSchema}
            messages={messages}
            isWorkflowRunning={isStreaming}
            onSendMessage={(content: string) =>
              start({
                userInput: content,
                designSessionId,
                isDeepModelingEnabled,
              })
            }
            onNavigate={handleNavigateToTab}
            error={combinedError}
          />
        </div>
        {shouldShowOutputSection && (
          <div className={styles.outputSection}>
            {activeTab !== undefined ? (
              <Output
                designSessionId={designSessionId}
                schema={displayedSchema}
                prevSchema={prevSchema}
                sqlReviewComments={SQL_REVIEW_COMMENTS}
                versions={versions}
                selectedVersion={selectedVersion}
                onSelectedVersionChange={handleVersionChange}
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
                onSelectedVersionChange={handleVersionChange}
                initialIsPublic={initialIsPublic}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
