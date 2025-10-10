'use client'

import {
  mapStoredMessagesToChatMessages,
  type StoredMessage,
} from '@langchain/core/messages'
import type { AnalyzedRequirements, Artifact } from '@liam-hq/artifact'
import type { Schema } from '@liam-hq/schema'
import clsx from 'clsx'
import { type FC, useCallback, useEffect, useRef, useState } from 'react'
import { Chat } from './components/Chat'
import { Output } from './components/Output'
import { useRealtimeArtifact } from './components/Output/components/Artifact/hooks/useRealtimeArtifact'
import { OUTPUT_TABS, type OutputTabValue } from './components/Output/constants'
import { useRealtimeVersionsWithSchema } from './hooks/useRealtimeVersionsWithSchema'
import { useStream } from './hooks/useStream'
import { SQL_REVIEW_COMMENTS } from './mock'
import styles from './SessionDetailPage.module.css'
import type { Version } from './types'
import { determineWorkflowAction } from './utils/determineWorkflowAction'
import { getWorkflowInProgress } from './utils/workflowStorage'

type Props = {
  buildingSchemaId: string
  designSessionId: string
  initialMessages: StoredMessage[]
  initialAnalyzedRequirements: AnalyzedRequirements | null
  initialDisplayedSchema: Schema
  initialPrevSchema: Schema
  initialVersions: Version[]
  isDeepModelingEnabled: boolean
  initialIsPublic: boolean
  initialWorkflowError?: string | null
  initialArtifact: Artifact | null
  senderName: string
}

// Determine the initial active tab based on available data
const determineInitialTab = (
  artifact: Artifact | null,
  versions: Version[],
): OutputTabValue | undefined => {
  const hasArtifact = artifact !== null
  const hasVersions = versions.length > 0

  if (!hasArtifact && !hasVersions) {
    return undefined
  }

  // Prioritize ERD tab when versions exist
  if (hasVersions) {
    return OUTPUT_TABS.ERD
  }

  // Show artifact tab when only artifact exists
  if (hasArtifact) {
    return OUTPUT_TABS.ARTIFACT
  }

  return undefined
}

export const SessionDetailPageClient: FC<Props> = ({
  buildingSchemaId,
  designSessionId,
  initialMessages,
  initialAnalyzedRequirements,
  initialDisplayedSchema,
  initialPrevSchema,
  initialVersions,
  isDeepModelingEnabled,
  initialIsPublic,
  initialWorkflowError,
  initialArtifact,
  senderName,
}) => {
  const [activeTab, setActiveTab] = useState<OutputTabValue | undefined>(
    determineInitialTab(initialArtifact, initialVersions),
  )
  const [hasReceivedAnalyzedRequirements, setHasReceivedAnalyzedRequirements] =
    useState(false)
  const initialAnalyzedRequirementsRef = useRef(initialAnalyzedRequirements)

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
      setActiveTab(OUTPUT_TABS.ERD)
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

  const { artifact, error: artifactError } = useRealtimeArtifact({
    designSessionId,
    initialArtifact,
    onChangeArtifact: handleArtifactChange,
  })

  const chatMessages = mapStoredMessagesToChatMessages(initialMessages)
  const { isStreaming, messages, analyzedRequirements, start, replay, error } =
    useStream({
      initialMessages: chatMessages,
      initialAnalyzedRequirements,
      designSessionId,
      senderName,
    })

  useEffect(() => {
    if (
      analyzedRequirements !== null &&
      analyzedRequirements !== initialAnalyzedRequirementsRef.current &&
      !hasReceivedAnalyzedRequirements
    ) {
      setActiveTab(OUTPUT_TABS.ARTIFACT)
      setHasReceivedAnalyzedRequirements(true)
    }
  }, [analyzedRequirements, hasReceivedAnalyzedRequirements])

  const shouldShowOutputSection =
    (artifact !== null ||
      selectedVersion !== null ||
      analyzedRequirements !== null) &&
    activeTab

  // Combine streaming error with workflow errors
  const combinedError = error || initialWorkflowError
  // Track if initial workflow has been triggered to prevent multiple executions
  const hasTriggeredInitialWorkflow = useRef(false)

  // Auto-trigger workflow on page load if there's an unanswered user message
  useEffect(() => {
    const triggerInitialWorkflow = async () => {
      const isWorkflowInProgress = getWorkflowInProgress(designSessionId)

      const action = determineWorkflowAction(
        messages,
        isWorkflowInProgress,
        hasTriggeredInitialWorkflow.current,
      )

      if (action.type === 'none') return

      // Mark as triggered before the async call
      hasTriggeredInitialWorkflow.current = true

      if (action.type === 'replay') {
        // Trigger replay for interrupted workflow
        await replay({
          designSessionId,
          isDeepModelingEnabled,
        })
      } else if (action.type === 'start') {
        // Trigger the workflow for the initial user message
        await start({
          designSessionId,
          userInput: action.userInput,
          isDeepModelingEnabled,
        })
      }
    }

    triggerInitialWorkflow()
  }, [messages, designSessionId, isDeepModelingEnabled, start, replay])

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
            onNavigate={setActiveTab}
            error={combinedError}
          />
        </div>
        {shouldShowOutputSection && (
          <div className={styles.outputSection}>
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
              artifact={artifact}
              artifactError={artifactError}
              analyzedRequirements={analyzedRequirements}
            />
          </div>
        )}
      </div>
    </div>
  )
}
