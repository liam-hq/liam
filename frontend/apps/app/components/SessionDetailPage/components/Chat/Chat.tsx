'use client'

import type { Schema } from '@liam-hq/db-structure'
import { type FC, useState, useTransition } from 'react'
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
  onRetry?: () => void
  isWorkflowRunning?: boolean
  onArtifactLinkClick: () => void
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
}) => {
  const { containerRef } = useScrollToBottom<HTMLDivElement>(
    timelineItems.length,
  )
  const [, startTransition] = useTransition()
  const [isDeepModelingEnabled, setIsDeepModelingEnabled] = useState(true)

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

  // Group consecutive messages from the same agent
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

    if (!agentTypes.includes(item.type)) {
      // Non-agent messages are added as-is
      acc.push(item)
      return acc
    }

    // Check if the previous item in the accumulator is a group of the same type
    const lastItem = acc[acc.length - 1]

    // Helper function to get effective role
    const getEffectiveRole = (entry: TimelineItemEntry): string => {
      if ('role' in entry) {
        return entry.role
      }
      // schema_version, query_result, error all render as 'db' agent
      return 'db'
    }

    const currentRole = getEffectiveRole(item)

    if (Array.isArray(lastItem) && lastItem.length > 0) {
      const firstItem = lastItem[0]
      if (!firstItem) return acc
      const lastRole = getEffectiveRole(firstItem)
      if (lastRole === currentRole) {
        lastItem.push(item)
        return acc
      }
    } else if (
      lastItem &&
      !Array.isArray(lastItem) &&
      agentTypes.includes(lastItem.type)
    ) {
      const lastRole = getEffectiveRole(lastItem)
      if (lastRole === currentRole) {
        acc[acc.length - 1] = [lastItem, item]
        return acc
      }
    }

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
        schema={schemaData}
        isDeepModelingEnabled={isDeepModelingEnabled}
        onDeepModelingToggle={setIsDeepModelingEnabled}
      />
    </div>
  )
}
