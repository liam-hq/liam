'use client'

import type { Schema } from '@liam-hq/db-structure'
import { type FC, useTransition } from 'react'
import type { TimelineItemEntry } from '../../types'
import styles from './Chat.module.css'
import { ChatInput } from './components/ChatInput'
import { TimelineItem } from './components/TimelineItem'
import { AgentMessage } from './components/TimelineItem/components/AgentMessage'
import {
  DBAgent,
  PMAgent,
  QAAgent,
} from './components/TimelineItem/components/AgentMessage/components/AgentAvatar'
import { LogMessage } from './components/TimelineItem/components/LogMessage'
import type { BuildingSchemaVersion } from './components/TimelineItem/components/VersionMessage/VersionMessage'
import { sendChatMessage } from './services'
import { generateTimelineItemId } from './services/timelineItemHelpers'
import { useScrollToBottom } from './useScrollToBottom'

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
  const groupedTimelineItems = timelineItems.reduce<
    Array<TimelineItemEntry | TimelineItemEntry[]>
  >((acc, item) => {
    const agentTypes = [
      'assistant_log',
      'assistant_pm',
      'assistant_db',
      'assistant_qa',
    ]

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
      lastItem[0].type === item.type
    ) {
      lastItem.push(item)
    } else if (
      !Array.isArray(lastItem) &&
      lastItem &&
      lastItem.type === item.type &&
      agentTypes.includes(lastItem.type)
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
            const agentProps = (() => {
              switch (agentType) {
                case 'assistant_pm':
                  return { avatar: <PMAgent />, agentName: 'PM Agent' }
                case 'assistant_db':
                  return { avatar: <DBAgent />, agentName: 'DB Agent' }
                case 'assistant_qa':
                  return { avatar: <QAAgent />, agentName: 'QA Agent' }
                case 'assistant_log':
                  return { avatar: <DBAgent />, agentName: 'DB Agent' }
                default:
                  return { avatar: <DBAgent />, agentName: 'Agent' }
              }
            })()

            return (
              <AgentMessage
                key={`group-${item[0].id}`}
                state="default"
                avatar={agentProps.avatar}
                agentName={agentProps.agentName}
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
              onRetry={onRetry}
              mockVersionData={mockVersionData}
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
      />
    </div>
  )
}
