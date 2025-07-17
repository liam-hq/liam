'use client'

import type { Schema } from '@liam-hq/db-structure'
import { type FC, useMemo, useTransition } from 'react'
import type { TimelineItemEntry } from '../../types'
import styles from './Chat.module.css'
import { ChatInput } from './components/ChatInput'
import { TimelineItem } from './components/TimelineItem'
import type { BuildingSchemaVersion } from './components/TimelineItem/components/VersionMessage/VersionMessage'
import { useProgressiveMessage } from './hooks/useProgressiveMessage'
import { sendChatMessage } from './services'
import { generateTimelineItemId } from './services/timelineItemHelpers'
import { useScrollToBottom } from './useScrollToBottom'
import {
  groupConsecutiveMessages,
  isMessageGroup,
} from './utils/messageGrouping'
import {
  extractTasks,
  getTaskStatusKey,
  parseTaskLine,
  TASK_STATUS,
  type TaskStatus,
} from './utils/taskProgress'

type Props = {
  schemaData: Schema
  designSessionId: string
  timelineItems: TimelineItemEntry[]
  onMessageSend: (entry: TimelineItemEntry) => void
  onRetry?: () => void
  mockVersionData?: BuildingSchemaVersion
}

export const Chat: FC<Props> = ({
  schemaData,
  designSessionId,
  timelineItems,
  onMessageSend,
  onRetry,
  mockVersionData,
}) => {
  const [isLoading, startTransition] = useTransition()
  const { containerRef, scrollToBottom } = useScrollToBottom<HTMLDivElement>(
    timelineItems.length,
  )

  // Hook for progressive message updates
  const { simulateTaskCompletion, failTasksInMessage } = useProgressiveMessage({
    onUpdateMessage: onMessageSend,
  })

  // Task status priority for sorting (lower number = higher priority)
  const taskStatusPriority: Record<TaskStatus, number> = {
    FAILED: 0,
    IN_PROGRESS: 1,
    PENDING: 2,
    COMPLETED: 3,
  }

  // Start AI response without saving user message (for auto-start scenarios)
  const startAIResponse = async (content: string) => {
    // Send chat message to API
    const result = await sendChatMessage({
      userInput: content,
      designSessionId,
    })

    if (result.success) {
      scrollToBottom()
    }
  }

  // TODO: Add rate limiting - Implement rate limiting for message sending to prevent spam
  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: TimelineItemEntry = {
      id: generateTimelineItemId('user'),
      content,
      type: 'user',
      timestamp: new Date(),
    }
    onMessageSend(userMessage)

    startTransition(() => {
      startAIResponse(content)
    })
  }

  // Group consecutive messages from the same agent
  const groupedItems = useMemo(
    () => groupConsecutiveMessages(timelineItems),
    [timelineItems],
  )

  return (
    <div className={styles.wrapper}>
      <div className={styles.messagesContainer} ref={containerRef}>
        {/* Display all timeline items */}
        {groupedItems.map((item) => {
          if (isMessageGroup(item)) {
            // Display each message in the group individually
            return (
              <div key={item.id}>
                {item.messages.map((message) => {
                  // Analyze tasks in the content
                  const tasks = extractTasks(message.content)
                  const parsedTasks = tasks
                    .map(parseTaskLine)
                    .filter(
                      (task): task is NonNullable<typeof task> => task !== null,
                    )

                  // Check if there are in-progress tasks that need to be updated
                  const inProgressTaskCount = parsedTasks.filter((task) => {
                    const statusKey = getTaskStatusKey(task.status)
                    return statusKey === 'IN_PROGRESS'
                  }).length

                  if (inProgressTaskCount > 0) {
                    // In production, this would be triggered by server events
                    // simulateTaskCompletion(message)
                  }

                  return (
                    <TimelineItem
                      key={message.id}
                      {...message}
                      onRetry={() => {
                        // When retrying, mark in-progress tasks as failed before retry
                        if (
                          parsedTasks.some(
                            (task) => task.status === TASK_STATUS.IN_PROGRESS,
                          )
                        ) {
                          failTasksInMessage(message)
                        }
                        onRetry?.()
                      }}
                      mockVersionData={mockVersionData}
                    />
                  )
                })}
              </div>
            )
          }

          // Single message
          return (
            <TimelineItem
              key={item.id}
              {...item}
              onRetry={onRetry}
              mockVersionData={mockVersionData}
            />
          )
        })}
        {isLoading && (
          <div className={styles.loadingIndicator}>
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
          </div>
        )}
      </div>
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        schema={schemaData}
      />
    </div>
  )
}
