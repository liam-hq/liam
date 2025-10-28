'use client'

import type { BaseMessage } from '@langchain/core/messages'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import type { OutputTabValue } from '../Output/constants'
import styles from './Chat.module.css'
import { ErrorDisplay } from './components/ErrorDisplay'
import { FixedWorkflowStatusIndicator } from './components/FixedWorkflowStatusIndicator'
import { Messages } from './components/Messages'
import { ScrollToBottomButton } from './components/ScrollToBottomButton'
import { WorkflowRunningIndicator } from './components/WorkflowRunningIndicator'
import { useWorkflowStatus } from './hooks/useWorkflowStatus'
import { useScrollToBottom } from './useScrollToBottom'

type Props = {
  messages: BaseMessage[]
  isWorkflowRunning?: boolean
  error?: string | null
  onNavigate: (tab: OutputTabValue) => void
  hasOutput?: boolean
}

export const Chat: FC<Props> = ({
  messages,
  isWorkflowRunning = false,
  onNavigate,
  error,
  hasOutput = false,
}) => {
  const { containerRef, scrollToBottom } = useScrollToBottom<HTMLDivElement>(
    messages.length,
  )
  const [showScrollButton, setShowScrollButton] = useState(false)
  const workflowStatus = useWorkflowStatus(messages, isWorkflowRunning)

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
      <div className={styles.messageListWrapper}>
        <div
          className={styles.messageList}
          ref={containerRef}
          style={{
            maxHeight: isWorkflowRunning ? 'calc(100% - 80px)' : '100%',
          }}
        >
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
        {isWorkflowRunning && workflowStatus && (
          <FixedWorkflowStatusIndicator
            statusText={workflowStatus}
            hasOutput={hasOutput}
          />
        )}
      </div>
    </div>
  )
}
