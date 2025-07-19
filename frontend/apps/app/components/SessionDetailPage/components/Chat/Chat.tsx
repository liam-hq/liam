'use client'

import type { Schema } from '@liam-hq/db-structure'
import { type FC, useTransition } from 'react'
import type { TimelineItemEntry } from '../../types'
import styles from './Chat.module.css'
import { ChatInput } from './components/ChatInput'
import { TimelineItem } from './components/TimelineItem'
import { AgentMessage } from './components/TimelineItem/components/AgentMessage'
import { LogMessage } from './components/TimelineItem/components/LogMessage'
import { sendChatMessage } from './services'
import { generateTimelineItemId } from './services/timelineItemHelpers'
import { useScrollToBottom } from './useScrollToBottom'

type Props = {
  schemaData: Schema
  designSessionId: string
  timelineItems: TimelineItemEntry[]
  onMessageSend: (message: TimelineItemEntry) => void
  onRetry?: () => void
  isLoading?: boolean
  isStreaming?: boolean
  onCancelStream?: () => void
}

export const Chat: FC<Props> = ({
  schemaData,
  designSessionId,
  timelineItems,
  onMessageSend,
  onRetry,
  isLoading = false,
  isStreaming = false,
  onCancelStream,
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
    const agentTypes = ['assistant_log']

    if (!agentTypes.includes(item.type)) {
      // Non-agent messages are added as-is
      acc.push(item)
      return acc
    }

    // Check if the previous item in the accumulator is a group of the same type
    const lastItem = acc[acc.length - 1]
    if (
      Array.isArray(lastItem) &&
      lastItem.length > 0 &&
      lastItem[0].type === item.type &&
      'role' in lastItem[0] &&
      'role' in item &&
      lastItem[0].role === item.role
    ) {
      lastItem.push(item)
    } else if (
      !Array.isArray(lastItem) &&
      lastItem &&
      lastItem.type === item.type &&
      agentTypes.includes(lastItem.type) &&
      'role' in lastItem &&
      'role' in item &&
      lastItem.role === item.role
    ) {
      acc[acc.length - 1] = [lastItem, item]
    } else {
      acc.push(item)
    }

    return acc
  }, [])

  return (
    <div className={styles.wrapper}>
      <div className={styles.messagesContainer} ref={containerRef}>
        {/* Display grouped timeline items */}
        {groupedTimelineItems.map((item, groupIndex) => {
          if (Array.isArray(item)) {
            // Render grouped agent messages
            const agentType = item[0].type
            const agentRole = 'role' in item[0] ? item[0].role : 'db'

            return (
              <AgentMessage
                key={`group-${item[0].id}`}
                state="default"
                assistantRole={agentRole}
              >
                {item.map((message, messageIndex) => {
                  // Check if this is the last message in the last group
                  const isLastMessage =
                    groupIndex === groupedTimelineItems.length - 1 &&
                    messageIndex === item.length - 1

                  return (
                    <LogMessage
                      key={message.id}
                      content={message.content}
                      isLast={isLastMessage}
                    />
                  )
                })}
              </AgentMessage>
            )
          }

          // Render single timeline item
          // Check if this is the last item overall
          const isLastMessage = groupIndex === groupedTimelineItems.length - 1

          return (
            <TimelineItem
              key={item.id}
              {...item}
              {...(item.type === 'error' && { onRetry })}
              isLastOfType={isLastMessage}
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
        onCancel={isStreaming ? onCancelStream : undefined}
      />
    </div>
  )
}
