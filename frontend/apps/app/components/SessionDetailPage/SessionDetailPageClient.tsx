'use client'

import {
  mapStoredMessagesToChatMessages,
  type StoredMessage,
} from '@langchain/core/messages'
import type { AnalyzedRequirements } from '@liam-hq/agent/client'
import type { Schema } from '@liam-hq/schema'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@liam-hq/ui'
import { type FC, useCallback, useEffect, useRef, useState } from 'react'
import { setCookieJson } from '../../libs/utils/cookie'
import { Chat } from './components/Chat'
import { Output } from './components/Output'
import { OUTPUT_TABS, type OutputTabValue } from './components/Output/constants'
import { PANEL_LAYOUT_COOKIE_NAME } from './constants'
import { useRealtimeVersionsWithSchema } from './hooks/useRealtimeVersionsWithSchema'
import { useStream } from './hooks/useStream'
import { SQL_REVIEW_COMMENTS } from './mock'
import styles from './SessionDetailPageClient.module.css'
import type { Version } from './types'
import { determineWorkflowAction } from './utils/determineWorkflowAction'
import { isEmptySchema } from './utils/isEmptySchema'
import { getWorkflowInProgress } from './utils/workflowStorage'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7

type Props = {
  buildingSchemaId: string
  designSessionId: string
  initialMessages: StoredMessage[]
  initialAnalyzedRequirements: AnalyzedRequirements | null
  initialDisplayedSchema: Schema
  initialPrevSchema: Schema
  initialVersions: Version[]
  initialIsPublic: boolean
  initialWorkflowError?: string | null
  panelSizes: number[]
}

// Determine the initial active tab based on available data
const determineInitialTab = (
  versions: Version[],
  analyzedRequirements: AnalyzedRequirements | null,
  initialDisplayedSchema: Schema,
): OutputTabValue | undefined => {
  const hasVersions = versions.length > 0
  const hasAnalyzedRequirements = analyzedRequirements !== null
  const hasInitialSchema = !isEmptySchema(initialDisplayedSchema)

  if (hasVersions || hasInitialSchema) return OUTPUT_TABS.ERD
  if (hasAnalyzedRequirements) return OUTPUT_TABS.ARTIFACT
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
  initialIsPublic,
  initialWorkflowError,
  panelSizes,
}) => {
  const [activeTab, setActiveTab] = useState<OutputTabValue | undefined>(
    determineInitialTab(
      initialVersions,
      initialAnalyzedRequirements,
      initialDisplayedSchema,
    ),
  )
  const [isResizing, setIsResizing] = useState(false)
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

  const chatMessages = mapStoredMessagesToChatMessages(initialMessages)
  const { isStreaming, messages, analyzedRequirements, start, replay, error } =
    useStream({
      initialMessages: chatMessages,
      initialAnalyzedRequirements,
      designSessionId,
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
    (selectedVersion !== null ||
      analyzedRequirements !== null ||
      !isEmptySchema(initialDisplayedSchema)) &&
    activeTab

  const handleLayoutChange = useCallback((sizes: number[]) => {
    setCookieJson(PANEL_LAYOUT_COOKIE_NAME, sizes, {
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })
  }, [])

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
        })
      } else if (action.type === 'start') {
        // Trigger the workflow for the initial user message
        await start({
          designSessionId,
          userInput: action.userInput,
        })
      }
    }

    triggerInitialWorkflow()
  }, [messages, designSessionId, start, replay])

  return (
    <div className={styles.container}>
      <ResizablePanelGroup
        direction="horizontal"
        className={styles.columns}
        data-layout={shouldShowOutputSection ? 'two-columns' : 'one-column'}
        onLayout={handleLayoutChange}
      >
        <ResizablePanel
          defaultSize={panelSizes[0]}
          minSize={22}
          maxSize={70}
          isResizing={isResizing}
        >
          <div className={styles.chatSection}>
            <div className={styles.chatWrapper}>
              <Chat
                messages={messages}
                isWorkflowRunning={isStreaming}
                onNavigate={setActiveTab}
                error={combinedError}
                hasOutput={!!shouldShowOutputSection}
              />
            </div>
          </div>
        </ResizablePanel>
        {shouldShowOutputSection && (
          <>
            <ResizableHandle onDragging={(e) => setIsResizing(e)} />
            <ResizablePanel
              defaultSize={panelSizes[1]}
              minSize={30}
              maxSize={78}
              isResizing={isResizing}
            >
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
                  analyzedRequirements={analyzedRequirements}
                />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
