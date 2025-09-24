'use client'

import type { BaseMessage } from '@langchain/core/messages'
import type { Schema } from '@liam-hq/schema'
import type { FC } from 'react'
import styles from './Chat.module.css'
import { ChatInput } from './components/ChatInput'
import { ErrorDisplay } from './components/ErrorDisplay'
import { Messages } from './components/Messages'
import { WorkflowRunningIndicator } from './components/WorkflowRunningIndicator'
import { useScrollToBottom } from './useScrollToBottom'

type Props = {
  schemaData: Schema
  messages: BaseMessage[]
  onSendMessage: (content: string) => void
  isWorkflowRunning?: boolean
  error?: string | null
  onNavigate: (tab: 'erd' | 'artifact') => void
}

export const Chat: FC<Props> = ({
  schemaData,
  messages,
  onSendMessage,
  isWorkflowRunning = false,
  onNavigate,
  error,
}) => {
  const { containerRef } = useScrollToBottom<HTMLDivElement>(messages.length)

  const handleSendMessage = (content: string) => {
    onSendMessage(content)
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.messagesContainer} ref={containerRef}>
        <Messages
          messages={messages}
          onNavigate={onNavigate}
          isWorkflowRunning={isWorkflowRunning}
        />
        {error && <ErrorDisplay error={error} />}
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
