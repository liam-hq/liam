'use client'

import type { BaseMessage } from '@langchain/core/messages'
import type { Schema } from '@liam-hq/schema'
import type { FC } from 'react'
import type { ChatRequest } from '../../hooks/useStream/useStream'
import styles from './Chat.module.css'
import { ChatInput } from './components/ChatInput'
import { Messages } from './components/Messages'
import { WorkflowRunningIndicator } from './components/WorkflowRunningIndicator'
import { useScrollToBottom } from './useScrollToBottom'

type Props = {
  schemaData: Schema
  designSessionId: string
  messages: BaseMessage[]
  onSendMessage: (params: ChatRequest) => void
  // onVersionView: (versionId: string) => void
  // onRetry?: () => void
  isWorkflowRunning?: boolean
  // onArtifactLinkClick: () => void
  isDeepModelingEnabled: boolean
}

export const Chat: FC<Props> = ({
  schemaData,
  designSessionId,
  messages,
  onSendMessage,
  isWorkflowRunning = false,
  isDeepModelingEnabled,
}) => {
  const { containerRef } = useScrollToBottom<HTMLDivElement>(messages.length)

  const handleSendMessage = (content: string) => {
    onSendMessage({
      userInput: content,
      designSessionId,
      isDeepModelingEnabled,
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
