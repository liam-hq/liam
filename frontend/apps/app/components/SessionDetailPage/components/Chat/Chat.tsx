'use client'

import type { BaseMessage } from '@langchain/core/messages'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import type { OutputTabValue } from '../Output/constants'
import styles from './Chat.module.css'
import { ChatHeader } from './components/ChatHeader'
import { ErrorDisplay } from './components/ErrorDisplay'
import { Messages } from './components/Messages'
import { ScrollToBottomButton } from './components/ScrollToBottomButton'
import { WorkflowRunningIndicator } from './components/WorkflowRunningIndicator'
import { useScrollToBottom } from './useScrollToBottom'

type Props = {
  sessionTitle?: string
  messages: BaseMessage[]
  isWorkflowRunning?: boolean
  error?: string | null
  onNavigate: (tab: OutputTabValue) => void
}

export const Chat: FC<Props> = ({
  sessionTitle,
  messages,
  isWorkflowRunning = false,
  onNavigate,
  error,
}) => {
  const { containerRef, scrollToBottom } = useScrollToBottom<HTMLDivElement>(
    messages.length,
  )
  const [showScrollButton, setShowScrollButton] = useState(false)

  const recomputeScrollButton = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    // 48px (= --spacing-12): button 32px + spacing 16px; prevent flicker.
    setShowScrollButton(distance > 48)
  }, [containerRef])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    recomputeScrollButton()
    el.addEventListener('scroll', recomputeScrollButton)
    return () => el.removeEventListener('scroll', recomputeScrollButton)
  }, [containerRef, recomputeScrollButton])

  // biome-ignore lint/correctness/useExhaustiveDependencies: recompute visibility on messages updates (streaming)
  useEffect(() => {
    recomputeScrollButton()
  }, [messages, recomputeScrollButton])

  return (
    <div className={styles.wrapper}>
      <ChatHeader
        sessionTitle={sessionTitle}
        messages={messages}
        isWorkflowRunning={isWorkflowRunning}
      />
      <div className={styles.messageListWrapper}>
        <div className={styles.messageList} ref={containerRef}>
          <Messages
            messages={messages}
            onNavigate={onNavigate}
            isWorkflowRunning={isWorkflowRunning}
          />
          {error && <ErrorDisplay error={error} />}
          {isWorkflowRunning && <WorkflowRunningIndicator />}
        </div>
        <ScrollToBottomButton
          visible={showScrollButton}
          onClick={scrollToBottom}
        />
      </div>
    </div>
  )
}
