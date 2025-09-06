'use client'

import type { BaseMessage } from '@langchain/core/messages'
import type { Schema } from '@liam-hq/schema'
import { type FC, useTransition } from 'react'
import type { TimelineItemEntry } from '../../types'
import styles from './Chat.module.css'
import { ChatInput } from './components/ChatInput'
import { Messages } from './components/Messages'
import { WorkflowRunningIndicator } from './components/WorkflowRunningIndicator'
import { generateTimelineItemId } from './services/timelineItemHelpers'
import { useScrollToBottom } from './useScrollToBottom'

type Props = {
  schemaData: Schema
  // designSessionId: string
  messages: BaseMessage[]
  onMessageSend: (message: TimelineItemEntry) => void
  // onVersionView: (versionId: string) => void
  // onRetry?: () => void
  isWorkflowRunning?: boolean
  // onArtifactLinkClick: () => void
  // isDeepModelingEnabled: boolean
}

export const Chat: FC<Props> = ({
  schemaData,
  messages,
  onMessageSend,
  isWorkflowRunning = false,
}) => {
  const { containerRef } = useScrollToBottom<HTMLDivElement>(messages.length)
  const [, startTransition] = useTransition()

  const startAIResponse = async (content: string) => {
    const optimisticMessage: TimelineItemEntry = {
      id: generateTimelineItemId('user'),
      type: 'user',
      content,
      timestamp: new Date(),
    }
    onMessageSend(optimisticMessage)
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

  return (
    <div className={styles.wrapper}>
      <div className={styles.messagesContainer} ref={containerRef}>
        <Messages messages={messages} />
        {isWorkflowRunning && <WorkflowRunningIndicator />}
      </div>
      <ChatInput
        onSendMessage={handleSendMessage}
        isWorkflowRunning={isWorkflowRunning}
        schema={schemaData}
      />
    </div>
  )
}
