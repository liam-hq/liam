'use client'

import type { Schema } from '@liam-hq/schema'
import { type FC, useTransition } from 'react'
import type { TimelineItemEntry } from '../../types'
import styles from './Chat.module.css'
import { ChatInput } from './components/ChatInput'
import { TimelineItem } from './components/TimelineItem'
import { WorkflowRunningIndicator } from './components/WorkflowRunningIndicator'
import { sendChatMessage } from './services'
import { generateTimelineItemId } from './services/timelineItemHelpers'
import { useScrollToBottom } from './useScrollToBottom'

type Props = {
  schemaData: Schema
  designSessionId: string
  timelineItems: TimelineItemEntry[]
  onMessageSend: (message: TimelineItemEntry) => void
  onVersionView: (versionId: string) => void
  // eslint-disable-next-line no-restricted-syntax
  onRetry?: () => void
  // eslint-disable-next-line no-restricted-syntax
  isWorkflowRunning?: boolean
  onArtifactLinkClick: () => void
  isDeepModelingEnabled: boolean
}

export const Chat: FC<Props> = ({
  schemaData,
  designSessionId,
  timelineItems,
  onMessageSend,
  onVersionView,
  onRetry,
  isWorkflowRunning = false,
  onArtifactLinkClick,
  isDeepModelingEnabled,
}) => {
  const { containerRef } = useScrollToBottom<HTMLDivElement>(
    timelineItems.length,
  )
  const [, startTransition] = useTransition()

  const startAIResponse = async (content: string) => {
    const optimisticMessage: TimelineItemEntry = {
      id: generateTimelineItemId('user'),
      type: 'user',
      content,
      timestamp: new Date(),
    }
    onMessageSend(optimisticMessage)

    await sendChatMessage({
      designSessionId,
      userInput: content,
      isDeepModelingEnabled,
    })
  }

  const handleSendMessage = (content: string) => {
    const userMessage: TimelineItemEntry = {
      id: generateTimelineItemId('user'),
      type: 'user',
      content,
      timestamp: new Date(),
    }
    onMessageSend(userMessage)

    startTransition(() => {
      startAIResponse(content)
    })
  }

  // Determines the role for grouping purposes
  // Messages with 'role' property use their role, others default to 'db'
  const getEffectiveRole = (entry: TimelineItemEntry): string => {
    return 'role' in entry ? entry.role : 'db'
  }

  // Helper to check if an item can be grouped with the previous item
  const canGroupWithPrevious = (
    lastItem: TimelineItemEntry | TimelineItemEntry[] | undefined,
    currentItem: TimelineItemEntry,
    agentTypes: string[],
  ): { canGroup: boolean; isArray: boolean } => {
    if (!lastItem) return { canGroup: false, isArray: false }

    const currentRole = getEffectiveRole(currentItem)

    if (Array.isArray(lastItem) && lastItem.length > 0) {
      const firstItem = lastItem[0]
      return {
        canGroup: !!firstItem && getEffectiveRole(firstItem) === currentRole,
        isArray: true,
      }
    }

    if (!Array.isArray(lastItem) && agentTypes.includes(lastItem.type)) {
      return {
        canGroup: getEffectiveRole(lastItem) === currentRole,
        isArray: false,
      }
    }

    return { canGroup: false, isArray: false }
  }

  // Group consecutive messages from the same agent to reduce visual clutter
  const groupedTimelineItems = timelineItems.reduce<
    Array<TimelineItemEntry | TimelineItemEntry[]>
  >((acc, item) => {
    const agentTypes = [
      'assistant',
      'assistant_log',
      'schema_version',
      'query_result',
      'error',
    ]

    // Non-agent messages (like user messages) are never grouped
    if (!agentTypes.includes(item.type)) {
      acc.push(item)
      return acc
    }

    const lastItem = acc[acc.length - 1]
    const groupingCheck = canGroupWithPrevious(lastItem, item, agentTypes)

    if (groupingCheck.canGroup) {
      if (groupingCheck.isArray && Array.isArray(lastItem)) {
        // Add to existing group
        lastItem.push(item)
      } else if (
        !groupingCheck.isArray &&
        lastItem &&
        !Array.isArray(lastItem)
      ) {
        // Create new group from two single items
        acc[acc.length - 1] = [lastItem, item]
      }
      return acc
    }

    // No grouping possible - add as standalone item
    acc.push(item)
    return acc
  }, [])

  return (
    <div className={styles.wrapper}>
      <div className={styles.messagesContainer} ref={containerRef}>
        {/* Display grouped timeline items */}
        {groupedTimelineItems.map((item) => {
          if (Array.isArray(item)) {
            // Render grouped agent messages using modified TimelineItem
            return item.map((message, messageIndex) => (
              <TimelineItem
                key={message.id}
                {...message}
                showHeader={messageIndex === 0}
                {...(message.type === 'schema_version' && {
                  onView: onVersionView,
                })}
                onArtifactLinkClick={onArtifactLinkClick}
              />
            ))
          }

          return (
            <TimelineItem
              key={item.id}
              {...item}
              {...(item.type === 'error' && { onRetry })}
              {...(item.type === 'schema_version' && { onView: onVersionView })}
              onArtifactLinkClick={onArtifactLinkClick}
            />
          )
        })}
        {isWorkflowRunning && <WorkflowRunningIndicator />}
      </div>
      <ChatInput
        onSendMessage={handleSendMessage}
        isWorkflowRunning={isWorkflowRunning}
        error={false}
        initialMessage=""
        schema={schemaData}
      />
    </div>
  )
}
